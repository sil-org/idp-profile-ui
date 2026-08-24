#!/usr/bin/env bash

set -euo pipefail

: "${AWS_ENDPOINT:=http://dynamo:8000}"
: "${AWS_DEFAULT_REGION:=us-east-1}"
: "${API_KEY_TABLE:=ApiKey}"
: "${TOTP_TABLE:=Totp}"
: "${WEBAUTHN_TABLE:=WebAuthn}"

API_KEY_VALUE='10345678-1234-1234-1234-123456789012'
API_SECRET_HASH='$2a$10$8Bp9PqqfStjLvh1nQJ67JeY3CO/mEXmF1GKfe8Vk0kue1.i7fa2mC'
WEBAUTHN_CREDENTIALS_B64='7WNNLBOEEvDl0PhayLzqySZN8koL9ZfnUDjK+bt8tjY763uOnGYEdbcw+k8pIitIHMdiMdeeqPjopLCy68o8MV6TCdtiwH7w1CZAc/H2dBtgAIavb6LYZX9mCh1BX8ZayQfigohllA/iv8yXdXffGzVGPdBEMtwqdGynEuMm7eBuP6nXLwonTQ=='

aws_dynamodb() {
  aws dynamodb --endpoint-url "$AWS_ENDPOINT" "$@"
}

wait_for_dynamodb() {
  local retries=30
  local i

  echo 'Waiting for DynamoDB to become available...'
  for ((i = 1; i <= retries; i++)); do
    if aws_dynamodb list-tables >/dev/null 2>&1; then
      echo 'DynamoDB is reachable.'
      return 0
    fi
    sleep 1
  done

  echo "Timed out waiting for DynamoDB at $AWS_ENDPOINT" >&2
  return 1
}
