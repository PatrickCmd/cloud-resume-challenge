"""
DynamoDB table creation script for Portfolio API.

This script creates the DynamoDB table with the single-table design
as specified in docs/DYNAMODB-DESIGN.md.

Usage:
    # For local DynamoDB
    python scripts/create_dynamodb_table.py --local

    # For AWS DynamoDB
    python scripts/create_dynamodb_table.py --aws --region us-east-1
"""

import argparse
import boto3
from botocore.exceptions import ClientError


def create_table(dynamodb_client, table_name: str, local: bool = False):
    """
    Create the Portfolio API DynamoDB table.

    Args:
        dynamodb_client: Boto3 DynamoDB client
        table_name: Name of the table to create
        local: Whether creating in local DynamoDB or AWS
    """
    try:
        # Table schema based on docs/DYNAMODB-DESIGN.md
        table_params = {
            'TableName': table_name,
            'KeySchema': [
                {'AttributeName': 'PK', 'KeyType': 'HASH'},   # Partition key
                {'AttributeName': 'SK', 'KeyType': 'RANGE'}   # Sort key
            ],
            'AttributeDefinitions': [
                {'AttributeName': 'PK', 'AttributeType': 'S'},
                {'AttributeName': 'SK', 'AttributeType': 'S'},
                {'AttributeName': 'GSI1PK', 'AttributeType': 'S'},
                {'AttributeName': 'GSI1SK', 'AttributeType': 'S'}
            ],
            'GlobalSecondaryIndexes': [
                {
                    'IndexName': 'GSI1',
                    'KeySchema': [
                        {'AttributeName': 'GSI1PK', 'KeyType': 'HASH'},
                        {'AttributeName': 'GSI1SK', 'KeyType': 'RANGE'}
                    ],
                    'Projection': {
                        'ProjectionType': 'ALL'  # Include all attributes
                    }
                }
            ]
        }

        # Add billing mode based on environment
        if local:
            # Local DynamoDB requires provisioned capacity
            table_params['BillingMode'] = 'PROVISIONED'
            table_params['ProvisionedThroughput'] = {
                'ReadCapacityUnits': 5,
                'WriteCapacityUnits': 5
            }
            table_params['GlobalSecondaryIndexes'][0]['ProvisionedThroughput'] = {
                'ReadCapacityUnits': 5,
                'WriteCapacityUnits': 5
            }
        else:
            # AWS DynamoDB - use on-demand billing
            table_params['BillingMode'] = 'PAY_PER_REQUEST'

        # Create the table
        response = dynamodb_client.create_table(**table_params)

        print(f"✅ Creating table '{table_name}'...")
        print(f"   Table ARN: {response['TableDescription'].get('TableArn', 'N/A (local)')}")
        print(f"   Status: {response['TableDescription']['TableStatus']}")

        # Wait for table to be created (only for AWS)
        if not local:
            print("   Waiting for table to be active...")
            waiter = dynamodb_client.get_waiter('table_exists')
            waiter.wait(TableName=table_name)
            print("   ✅ Table is now active!")

        # Enable TTL for automatic cleanup of session data
        if not local:
            try:
                dynamodb_client.update_time_to_live(
                    TableName=table_name,
                    TimeToLiveSpecification={
                        'Enabled': True,
                        'AttributeName': 'ExpiresAt'
                    }
                )
                print("   ✅ TTL enabled on 'ExpiresAt' attribute")
            except ClientError as e:
                print(f"   ⚠️  Warning: Could not enable TTL: {e}")

        print(f"\n✅ Table '{table_name}' created successfully!")
        return True

    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print(f"⚠️  Table '{table_name}' already exists")
            return False
        else:
            print(f"❌ Error creating table: {e}")
            raise


def delete_table(dynamodb_client, table_name: str):
    """
    Delete the DynamoDB table.

    Args:
        dynamodb_client: Boto3 DynamoDB client
        table_name: Name of the table to delete
    """
    try:
        dynamodb_client.delete_table(TableName=table_name)
        print(f"✅ Table '{table_name}' deleted successfully!")
        return True
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            print(f"⚠️  Table '{table_name}' does not exist")
            return False
        else:
            print(f"❌ Error deleting table: {e}")
            raise


def describe_table(dynamodb_client, table_name: str):
    """
    Describe the DynamoDB table.

    Args:
        dynamodb_client: Boto3 DynamoDB client
        table_name: Name of the table to describe
    """
    try:
        response = dynamodb_client.describe_table(TableName=table_name)
        table = response['Table']

        print(f"\n📋 Table Description: {table_name}")
        print(f"   Status: {table['TableStatus']}")
        print(f"   Item Count: {table['ItemCount']}")
        print(f"   Size (bytes): {table['TableSizeBytes']}")
        print(f"   Created: {table['CreationDateTime']}")
        print(f"\n   Keys:")
        for key in table['KeySchema']:
            print(f"     - {key['AttributeName']} ({key['KeyType']})")
        print(f"\n   Global Secondary Indexes:")
        for gsi in table.get('GlobalSecondaryIndexes', []):
            print(f"     - {gsi['IndexName']}:")
            for key in gsi['KeySchema']:
                print(f"       {key['AttributeName']} ({key['KeyType']})")

        return True
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            print(f"⚠️  Table '{table_name}' does not exist")
            return False
        else:
            print(f"❌ Error describing table: {e}")
            raise


def main():
    """Main function to handle command-line arguments."""
    parser = argparse.ArgumentParser(
        description='Manage DynamoDB table for Portfolio API'
    )
    parser.add_argument(
        '--local',
        action='store_true',
        help='Use local DynamoDB (http://localhost:8000)'
    )
    parser.add_argument(
        '--aws',
        action='store_true',
        help='Use AWS DynamoDB'
    )
    parser.add_argument(
        '--region',
        type=str,
        default='us-east-1',
        help='AWS region (default: us-east-1)'
    )
    parser.add_argument(
        '--table-name',
        type=str,
        default='portfolio-api-table',
        help='Table name (default: portfolio-api-table)'
    )
    parser.add_argument(
        '--action',
        type=str,
        choices=['create', 'delete', 'describe'],
        default='create',
        help='Action to perform (default: create)'
    )

    args = parser.parse_args()

    # Validate environment flag
    if not args.local and not args.aws:
        print("❌ Error: Must specify either --local or --aws")
        parser.print_help()
        return

    # Create DynamoDB client
    if args.local:
        print(f"🔧 Using local DynamoDB at http://localhost:8000")
        dynamodb_client = boto3.client(
            'dynamodb',
            endpoint_url='http://localhost:8000',
            region_name='us-east-1',
            aws_access_key_id='dummy',
            aws_secret_access_key='dummy'
        )
    else:
        print(f"☁️  Using AWS DynamoDB in region: {args.region}")
        dynamodb_client = boto3.client('dynamodb', region_name=args.region)

    # Perform action
    if args.action == 'create':
        create_table(dynamodb_client, args.table_name, local=args.local)
    elif args.action == 'delete':
        confirm = input(f"⚠️  Are you sure you want to delete '{args.table_name}'? (yes/no): ")
        if confirm.lower() == 'yes':
            delete_table(dynamodb_client, args.table_name)
        else:
            print("❌ Deletion cancelled")
    elif args.action == 'describe':
        describe_table(dynamodb_client, args.table_name)


if __name__ == '__main__':
    main()
