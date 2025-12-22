# DynamoDB: Scan vs Query Operations

## Overview

DynamoDB provides two primary methods for reading data: **Query** and **Scan**. Understanding when to use each operation is critical for building efficient, cost-effective applications.

## Query Operation

### What is a Query?

A **Query** operation finds items based on primary key values. You must provide the partition key value, and optionally can provide a sort key condition to refine results.

### Key Characteristics

- **Efficient**: Only reads items with matching partition key
- **Fast**: Uses indexes to locate data quickly
- **Predictable Cost**: Consumes RCUs proportional to data returned (not total table size)
- **Sorted Results**: Returns items in sort key order
- **Limited Scope**: Only works with primary keys or GSI/LSI keys

### Syntax Requirements

```python
from boto3.dynamodb.conditions import Key

# Basic Query - Partition key only
table.query(
    KeyConditionExpression=Key('PK').eq('BLOG#123')
)

# Query with Sort Key condition
table.query(
    KeyConditionExpression=Key('PK').eq('BLOG#123') & Key('SK').begins_with('COMMENT#')
)

# Query on GSI
table.query(
    IndexName='GSI1',
    KeyConditionExpression=Key('GSI1PK').eq('ANALYTICS#blog') & Key('GSI1SK').begins_with('VIEWS#')
)
```

### Valid Key Conditions

**Partition Key** (required):
- `=` (equals) - **ONLY** valid operator for partition keys

**Sort Key** (optional):
- `=` (equals)
- `<` (less than)
- `<=` (less than or equal)
- `>` (greater than)
- `>=` (greater than or equal)
- `BETWEEN`
- `begins_with()`

### Important Limitations

❌ **Cannot use `begins_with()` on partition key**
```python
# This will FAIL
table.query(
    KeyConditionExpression=Key('PK').begins_with('BLOG#')
)
```

✅ **Must use exact match on partition key**
```python
# This works
table.query(
    KeyConditionExpression=Key('PK').eq('BLOG#123')
)
```

✅ **Can use `begins_with()` on sort key only**
```python
# This works
table.query(
    KeyConditionExpression=Key('PK').eq('BLOG#123') & Key('SK').begins_with('COMMENT#')
)
```

### When to Use Query

✅ Use Query when:
- You know the exact partition key value
- You need to retrieve items with a specific partition key
- You want to filter by sort key patterns (begins_with, range, etc.)
- You need predictable, low-cost operations
- You're working with GSI/LSI and know the index keys

### Performance Characteristics

- **Read Capacity**: Consumes RCUs based on data size returned
- **Latency**: Typically single-digit milliseconds
- **Cost**: ~$0.25 per million read requests (on-demand pricing)
- **Throughput**: Can handle thousands of queries per second

## Scan Operation

### What is a Scan?

A **Scan** operation reads **every item** in a table or index, then optionally filters results. It's the DynamoDB equivalent of a full table scan in SQL.

### Key Characteristics

- **Exhaustive**: Reads entire table/index
- **Slow**: Must examine all items
- **Expensive**: Consumes RCUs for entire table, not just returned items
- **Unsorted**: Returns items in no particular order
- **Flexible**: Can filter on any attribute

### Syntax

```python
from boto3.dynamodb.conditions import Key, Attr

# Basic Scan - returns everything
table.scan()

# Scan with filter (still reads entire table!)
table.scan(
    FilterExpression=Key('PK').begins_with('BLOG#') & Key('SK').eq('METADATA')
)

# Scan with attribute filter
table.scan(
    FilterExpression=Attr('category').eq('DevOps')
)
```

### How Scan Works (The Expensive Part)

1. **Read Phase**: DynamoDB reads **ALL items** in the table
   - Consumes RCUs for every item read
   - Even items that don't match the filter

2. **Filter Phase**: Applies FilterExpression to results
   - Happens **after** reading all items
   - No RCU savings from filtering

3. **Return Phase**: Returns matching items to client
   - Limited to 1MB per request
   - May require pagination for large datasets

### Example: Why Scan is Expensive

```python
# Table has 1,000,000 items
# You want 10 items where category='DevOps'

result = table.scan(
    FilterExpression=Attr('category').eq('DevOps')
)

# DynamoDB behavior:
# 1. Reads all 1,000,000 items (charges RCUs for all)
# 2. Filters to 10 matching items
# 3. Returns only 10 items to you
# 4. You pay for reading 1,000,000 items but get 10!
```

### When to Use Scan

✅ Use Scan when:
- Exporting entire table data
- Running analytics on all items
- Table is small (< 100 items)
- One-time administrative operations
- No suitable partition key pattern exists

❌ **Avoid Scan for**:
- Production queries with known keys
- High-frequency operations
- Large tables (> 1000 items)
- User-facing features

### Performance Characteristics

- **Read Capacity**: Consumes RCUs for **entire table**
- **Latency**: Can take seconds to minutes for large tables
- **Cost**: Expensive for large tables (~$0.25 per million items read)
- **Throughput**: Limited by table size and provisioned capacity

## Real-World Examples from Our Codebase

### Example 1: Why We Use Scan for Monthly Trends

**Location**: `src/repositories/visitor.py:172-204`

```python
def get_monthly_trends(self, months: int = 6) -> List[Dict[str, Any]]:
    from boto3.dynamodb.conditions import Key

    for i in range(months):
        date = datetime.now(timezone.utc) - timedelta(days=30 * i)
        year_month = date.strftime('%Y-%m')

        # ❌ Cannot use Query with begins_with on PK
        # result = table.query(
        #     KeyConditionExpression=Key('PK').begins_with(f'VISITOR#DAILY#{year_month}')
        # )

        # ✅ Must use Scan with FilterExpression
        result = self.resource.scan(
            FilterExpression=Key('PK').begins_with(f'VISITOR#DAILY#{year_month}') & Key('SK').eq('COUNT')
        )
```

**Why Scan?**
- Need to find all items where PK starts with `VISITOR#DAILY#2025-01`
- Cannot use `begins_with()` on partition key in Query
- Alternative would be to redesign the data model

**Optimization Ideas**:
1. **Add GSI with month as partition key**:
   - GSI1PK: `VISITOR#MONTHLY#2025-01`
   - GSI1SK: `DATE#2025-01-15`
   - Then use Query: `Key('GSI1PK').eq('VISITOR#MONTHLY#2025-01')`

2. **Maintain monthly aggregates**:
   - Item: `PK=VISITOR#MONTHLY#2025-01, SK=COUNT`
   - Update monthly counter when daily counts update
   - Query single item instead of scanning days

### Example 2: Why We Use Scan for Category Counts

**Location**: `src/repositories/blog.py:400-418`

```python
def get_categories(self) -> List[Dict[str, Any]]:
    from boto3.dynamodb.conditions import Key

    # ❌ Cannot Query with begins_with on PK
    # result = table.query(
    #     KeyConditionExpression=Key('PK').begins_with('BLOG#CATEGORY#')
    # )

    # ✅ Must use Scan
    result = self.resource.scan(
        FilterExpression=Key('PK').begins_with('BLOG#CATEGORY#') & Key('SK').eq('COUNT')
    )
```

**Why Scan?**
- Need all categories: `BLOG#CATEGORY#Backend`, `BLOG#CATEGORY#DevOps`, etc.
- Cannot query with `begins_with` on PK
- Categories are typically small (< 20 items), so scan is acceptable

**Optimization Ideas**:
1. **Use GSI**:
   - GSI1PK: `BLOG#CATEGORIES` (same for all)
   - GSI1SK: `CATEGORY#Backend`, `CATEGORY#DevOps`, etc.
   - Query: `Key('GSI1PK').eq('BLOG#CATEGORIES')`

2. **Single item with list**:
   - One item: `PK=BLOG#METADATA, SK=CATEGORIES`
   - Data: `{categories: [{name: 'Backend', count: 5}, ...]}`
   - Single GetItem instead of Scan

### Example 3: Good Use of Query

**Location**: `src/repositories/blog.py:127-168`

```python
def list_posts(self, status: str = 'PUBLISHED', category: Optional[str] = None, limit: int = 20):
    from boto3.dynamodb.conditions import Key

    if status and category:
        # ✅ Perfect Query usage
        result = self.query(
            key_condition_expression='GSI1PK = :gsi1pk',
            expression_attribute_values={
                ':gsi1pk': f'BLOG#STATUS#{status}#{category}'
            },
            index_name='GSI1',
            scan_index_forward=False,
            limit=limit
        )
```

**Why Query?**
- Exact partition key match: `BLOG#STATUS#PUBLISHED#DevOps`
- Uses GSI efficiently
- Sorted by sort key (date)
- Predictable cost regardless of table size

## Cost Comparison

### Scenario: Find 10 blog posts in "DevOps" category

**Option 1: Scan (Bad)**
```python
# Table has 10,000 blog posts
result = table.scan(
    FilterExpression=Attr('category').eq('DevOps')
)

# Reads: 10,000 items (all posts)
# Returns: 10 items (DevOps posts)
# RCUs consumed: ~1,250 (assuming 4KB items)
# Cost: ~$0.0003 per scan (adds up fast!)
```

**Option 2: Query with GSI (Good)**
```python
result = table.query(
    IndexName='GSI1',
    KeyConditionExpression=Key('GSI1PK').eq('BLOG#CATEGORY#DevOps')
)

# Reads: 10 items (only DevOps posts)
# Returns: 10 items
# RCUs consumed: ~3
# Cost: ~$0.000001 per query (400x cheaper!)
```

## Best Practices

### 1. Design Keys for Query Operations

✅ **Good Design** - Enables Query:
```python
# Blog posts by status
PK: 'BLOG#{blog_id}'
SK: 'METADATA'
GSI1PK: 'BLOG#STATUS#PUBLISHED'
GSI1SK: 'DATE#2025-01-15'

# Query all published posts
query(GSI1, Key('GSI1PK').eq('BLOG#STATUS#PUBLISHED'))
```

❌ **Bad Design** - Forces Scan:
```python
# No status in keys, must scan
PK: 'BLOG#{blog_id}'
SK: 'METADATA'
Attributes: {status: 'PUBLISHED', date: '2025-01-15'}

# Must scan entire table
scan(FilterExpression=Attr('status').eq('PUBLISHED'))
```

### 2. Use Aggregated Counters

Instead of scanning to count items:

❌ **Bad** - Scan every time:
```python
def get_total_views():
    result = table.scan(FilterExpression=Key('SK').eq('VIEWS'))
    return sum(item['viewCount'] for item in result['Items'])
```

✅ **Good** - Maintain counter:
```python
# Update counter when tracking views
table.update_item(
    Key={'PK': 'ANALYTICS#TOTAL', 'SK': 'VIEWS'},
    UpdateExpression='SET #data.totalViews = #data.totalViews + :inc',
    ExpressionAttributeValues={':inc': 1}
)

# O(1) retrieval
def get_total_views():
    item = table.get_item(Key={'PK': 'ANALYTICS#TOTAL', 'SK': 'VIEWS'})
    return item['Item']['Data']['totalViews']
```

### 3. Add GSI for Common Access Patterns

If you find yourself using Scan frequently:

```python
# Current: Must scan for this pattern
scan(FilterExpression=Key('PK').begins_with('ANALYTICS#blog#'))

# Solution: Add GSI
GSI1PK: 'ANALYTICS#blog'  # Same for all blog analytics
GSI1SK: 'VIEWS#{padded_count}'

# Now can query
query(GSI1, Key('GSI1PK').eq('ANALYTICS#blog'), ScanIndexForward=False)
```

### 4. Batch Operations When Possible

If you know the keys, use BatchGetItem instead of Query/Scan:

```python
# Get specific days (known keys)
keys = [
    {'PK': f'VISITOR#DAILY#2025-01-{day:02d}', 'SK': 'COUNT'}
    for day in range(1, 8)
]
response = dynamodb.batch_get_item(RequestItems={'table': {'Keys': keys}})
```

### 5. Limit Scan Impact

If you must use Scan:

```python
# Limit items per scan
result = table.scan(Limit=100)

# Use parallel scans for faster processing
result = table.scan(
    TotalSegments=4,    # Divide table into 4 segments
    Segment=0           # Process segment 0
)

# Add filters to reduce data transfer (still reads everything!)
result = table.scan(
    FilterExpression=Attr('status').eq('active'),
    ProjectionExpression='id, name'  # Only return needed attributes
)
```

## Decision Tree

```
Do you know the exact partition key?
├─ YES → Use Query
│   └─ Need sort key filtering?
│       ├─ YES → Use Query with sort key condition
│       └─ NO → Use Query with PK only
│
└─ NO → Need to find items by pattern?
    ├─ Pattern on sort key? → Use Query with PK + SK condition
    ├─ Pattern on partition key? → Redesign or use Scan
    └─ No pattern? → Use Scan (consider redesigning)
```

## Migration Strategy: From Scan to Query

If you have Scan operations in production:

### Step 1: Identify Scan Hotspots
```bash
# Enable CloudWatch metrics
# Monitor ScanCount vs QueryCount
# Focus on high-frequency scans
```

### Step 2: Analyze Access Patterns
```python
# Document what you're looking for
# "Find all blog posts by category"
# "Get analytics for all content types"
```

### Step 3: Design GSI
```python
# Add index to support the pattern
# GSI1PK: Category or content type
# GSI1SK: Date or ID
```

### Step 4: Backfill Existing Data
```python
# Update existing items with GSI keys
for item in table.scan()['Items']:
    table.update_item(
        Key={'PK': item['PK'], 'SK': item['SK']},
        UpdateExpression='SET GSI1PK = :pk, GSI1SK = :sk',
        ExpressionAttributeValues={
            ':pk': f"CATEGORY#{item['category']}",
            ':sk': item['date']
        }
    )
```

### Step 5: Switch to Query
```python
# Replace scan with query
# Before
result = table.scan(FilterExpression=Attr('category').eq('DevOps'))

# After
result = table.query(
    IndexName='GSI1',
    KeyConditionExpression=Key('GSI1PK').eq('CATEGORY#DevOps')
)
```

## Summary

| Aspect | Query | Scan |
|--------|-------|------|
| **Speed** | Fast (ms) | Slow (seconds+) |
| **Cost** | Low (pays for returned data) | High (pays for entire table) |
| **Use Case** | Known keys | Unknown patterns |
| **Scalability** | Excellent | Poor |
| **When to Use** | 99% of the time | Rarely |
| **RCU Consumption** | Matching items only | All items |
| **Best For** | Production queries | Admin operations |

## Key Takeaways

1. **Always prefer Query over Scan** when possible
2. **Design your keys** to enable Query operations
3. **Use GSI** to support multiple access patterns
4. **Maintain aggregates** instead of scanning to count
5. **Scan is not evil** - it has valid use cases, just use it wisely
6. **Monitor your scans** - they're often signs of suboptimal design
7. **When in doubt**, redesign your data model to use Query

## Further Reading

- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Query vs Scan Performance](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-query-scan.html)
- [GSI Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-indexes.html)
- [Single-Table Design Patterns](https://www.alexdebrie.com/posts/dynamodb-single-table/)
