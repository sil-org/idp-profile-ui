#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Shared configuration and helper functions.
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

wait_for_dynamodb

echo 'Deleting old DynamoDB tables if they exist.'
for table in "$WEBAUTHN_TABLE" "$TOTP_TABLE" "$API_KEY_TABLE"; do
  aws_dynamodb delete-table --table-name "$table" >/dev/null 2>&1 || true
done

echo 'Creating DynamoDB tables.'
aws_dynamodb create-table \
  --table-name "$WEBAUTHN_TABLE" \
  --key-schema AttributeName=uuid,KeyType=HASH \
  --attribute-definitions AttributeName=uuid,AttributeType=S \
  --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=10 >/dev/null

aws_dynamodb create-table \
  --table-name "$TOTP_TABLE" \
  --key-schema AttributeName=uuid,KeyType=HASH \
  --attribute-definitions AttributeName=uuid,AttributeType=S \
  --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=10 >/dev/null

aws_dynamodb create-table \
  --table-name "$API_KEY_TABLE" \
  --key-schema AttributeName=value,KeyType=HASH \
  --attribute-definitions AttributeName=value,AttributeType=S \
  --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=10 >/dev/null

echo 'Waiting for table creation to finish.'
for table in "$WEBAUTHN_TABLE" "$TOTP_TABLE" "$API_KEY_TABLE"; do
  aws_dynamodb wait table-exists --table-name "$table"
done

echo 'Finished creating DynamoDB tables.'
