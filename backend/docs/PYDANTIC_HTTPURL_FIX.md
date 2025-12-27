# Pydantic HttpUrl Serialization Fix

## Problem

When creating or updating projects and certifications with URL fields, the API was returning 500 Internal Server Error with the following traceback:

```
TypeError: Unsupported type "<class 'pydantic.networks.HttpUrl'>" for value "https://..."
```

## Root Cause

### Issue 1: Pydantic HttpUrl Objects
Pydantic's `HttpUrl` type creates special URL objects instead of strings. When calling `model_dump()` on a Pydantic model with `HttpUrl` fields, it returns `HttpUrl` objects, not strings.

boto3's DynamoDB serializer cannot handle Pydantic types - it only knows how to serialize Python native types (str, int, float, bool, list, dict, etc.).

### Issue 2: Empty String URL Validation
The test data in `data/projects.json` and `data/certifications.json` had empty strings `""` for optional URL fields. Pydantic's `HttpUrl` validator rejects empty strings as invalid URLs, causing 422 validation errors.

### Issue 3: None Value Serialization
When URL fields are `None`, they were being included in the DynamoDB item dict. DynamoDB's boto3 serializer has issues with Python `None` values in nested dicts - they need to be omitted or explicitly handled.

## Solution

### Fix 1: Use `model_dump(mode='json')`
Changed all API endpoints that pass Pydantic models to repositories to use `mode='json'`:

```python
# Before
project_data = project.model_dump()

# After - converts HttpUrl objects to str
project_data = project.model_dump(mode='json')
```

This converts Pydantic-specific types (like `HttpUrl`) to JSON-serializable Python types (like `str`).

**Important**: `mode='python'` does NOT convert `HttpUrl` to `str` - it keeps it as an `HttpUrl` object. Only `mode='json'` converts it to a string.

**Files Modified:**
- [src/api/projects.py](../src/api/projects.py) - Lines 95, 116
- [src/api/certifications.py](../src/api/certifications.py) - Lines 109, 130

### Fix 2: Replace Empty Strings with null in Test Data
Changed all empty string URL fields to `null` in test data files:

```json
// Before
"githubUrl": "",
"liveUrl": "",
"imageUrl": ""

// After
"githubUrl": null,
"liveUrl": null,
"imageUrl": null
```

**Files Modified:**
- [data/projects.json](../data/projects.json) - All URL fields
- [data/certifications.json](../data/certifications.json) - All credentialUrl fields

### Fix 3: Handle None URL Values in Repositories
Modified repositories to handle `None` URL values properly:

**Part A: Exclude None from DynamoDB items (to_item)**
Only include URL fields if they have values to avoid DynamoDB serialization issues:

```python
# Build Data dict, excluding None values
data_dict = {
    "id": project_id,
    "name": data.get("name", ""),
    # ... other required fields
}

# Add URL fields only if they have values
if data.get("githubUrl"):
    data_dict["githubUrl"] = data["githubUrl"]
if data.get("liveUrl"):
    data_dict["liveUrl"] = data["liveUrl"]
if data.get("imageUrl"):
    data_dict["imageUrl"] = data["imageUrl"]
```

**Part B: Add None defaults when reading (from_item)**
Ensure optional fields are present (even if `None`) for Pydantic response validation:

```python
def from_item(self, item: dict[str, Any]) -> dict[str, Any]:
    result = {**item["Data"]}

    # Ensure optional URL fields are present for Pydantic validation
    result.setdefault("githubUrl", None)
    result.setdefault("liveUrl", None)
    result.setdefault("imageUrl", None)

    return result
```

**Why Both Parts Are Needed:**
- `to_item`: Excludes `None` to avoid boto3 serialization errors
- `from_item`: Adds `None` defaults so Pydantic response models don't fail validation

**Files Modified:**
- [src/repositories/project.py](../src/repositories/project.py) - Lines 35-54 (to_item), Lines 77-80 (from_item)
- [src/repositories/certification.py](../src/repositories/certification.py) - Lines 25-41 (to_item), Lines 65 (from_item)

## Technical Details

### Pydantic Model Dump Modes

Pydantic v2 supports different serialization modes:

1. **`mode='json'`** (for JSON serialization)
   - Converts to JSON-compatible types
   - HttpUrl → str (URL as string) ✅
   - datetime → str (ISO 8601)
   - **This is what we need for boto3!**

2. **`mode='python'`** (for Python usage)
   - Keeps Pydantic types when useful
   - HttpUrl → HttpUrl object ❌ (still a Pydantic type!)
   - datetime → datetime object
   - **Does NOT convert HttpUrl to str**

3. **Default `model_dump()`** (no mode specified)
   - Returns Pydantic types as-is
   - HttpUrl → HttpUrl object ❌
   - **This is what caused our error**

**Key Insight**: Despite the name, `mode='python'` does NOT convert all Pydantic types to Python native types. For `HttpUrl`, only `mode='json'` converts it to a string.

### Why boto3 Can't Serialize Pydantic Types

boto3's DynamoDB serializer in `boto3/dynamodb/types.py` has a type registry that maps Python types to DynamoDB types:

```python
{
    str: 'S',       # String
    int: 'N',       # Number
    float: 'N',     # Number
    bool: 'BOOL',   # Boolean
    bytes: 'B',     # Binary
    list: 'L',      # List
    dict: 'M',      # Map
    # ... but no pydantic.networks.HttpUrl
}
```

When it encounters an unknown type like `HttpUrl`, it raises:
```
TypeError: Unsupported type "<class 'pydantic.networks.HttpUrl'>" for value
```

## Testing

### Validation Test
Created [scripts/test_project_validation.py](../scripts/test_project_validation.py) to verify:
- ✅ Empty strings fail validation
- ✅ None values pass validation
- ✅ Omitted fields pass validation

### Create Project Test
Created [scripts/test_create_project.py](../scripts/test_create_project.py) to verify:
- ✅ Projects can be created with valid URLs
- ✅ Projects can be created with null URLs
- ✅ No DynamoDB serialization errors

## Related Issues

This fix also applies to:
- Blog posts (if we add URL fields in the future)
- Any new entity types with HttpUrl fields
- Any Pydantic model with custom types being passed to DynamoDB

## Best Practices

When using Pydantic models with DynamoDB:

1. **Always use `mode='json'`** when passing to repositories:
   ```python
   data = model.model_dump(mode='json')  # Converts HttpUrl to str
   ```

2. **Never pass Pydantic objects directly** to boto3:
   ```python
   # Bad
   item = {"url": model.url}  # model.url is HttpUrl object

   # Good - use mode='json'
   data = model.model_dump(mode='json')
   item = {"url": data["url"]}  # Already a string
   ```

3. **Don't use `mode='python'` for HttpUrl fields**:
   ```python
   # Bad - HttpUrl stays as HttpUrl object
   data = model.model_dump(mode='python')

   # Good - HttpUrl converts to str
   data = model.model_dump(mode='json')
   ```

3. **Handle None values** in repository `to_item` methods:
   ```python
   # Only include field if it has a value
   if data.get("url"):
       item["url"] = data["url"]
   ```

4. **Use null, not empty strings** in JSON test data:
   ```json
   {"url": null}  // Good
   {"url": ""}    // Bad - fails HttpUrl validation
   ```

## References

- Pydantic v2 Serialization: https://docs.pydantic.dev/latest/concepts/serialization/
- boto3 DynamoDB Type Serialization: https://boto3.amazonaws.com/v1/documentation/api/latest/reference/customizations/dynamodb.html
- Pydantic HttpUrl: https://docs.pydantic.dev/latest/api/networks/#pydantic.networks.HttpUrl
