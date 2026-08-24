#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Shared configuration and helper functions.
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

wait_for_dynamodb

echo 'Creating api key seed data.'
aws_dynamodb put-item \
  --table-name "$API_KEY_TABLE" \
  --item "{\"value\":{\"S\":\"$API_KEY_VALUE\"},\"hashedApiSecret\":{\"S\":\"$API_SECRET_HASH\"},\"email\":{\"S\":\"example-user@example.com\"},\"activatedAt\":{\"N\":\"1590518080000\"},\"createdAt\":{\"N\":\"1590518080000\"}}" >/dev/null

echo 'Creating WebAuthn seed data.'
aws_dynamodb put-item \
  --table-name "$WEBAUTHN_TABLE" \
  --item "{\"uuid\":{\"S\":\"097791bf-2385-4ab4-8b06-14561a338d8e\"},\"apiKey\":{\"S\":\"$API_KEY_VALUE\"},\"encryptedAppId\":{\"S\":\"SomeEncryptedAppId\"},\"encryptedKeyHandle\":{\"S\":\"SomeEncryptedKeyHandle\"},\"encryptedCredentials\":{\"B\":\"$WEBAUTHN_CREDENTIALS_B64\"}}" >/dev/null

echo 'Verifying api key seed data.'
api_key_value="$(aws_dynamodb get-item --consistent-read --table-name "$API_KEY_TABLE" --key "{\"value\":{\"S\":\"$API_KEY_VALUE\"}}" --query 'Item.value.S' --output text)"

if [[ "$api_key_value" != "$API_KEY_VALUE" ]]; then
  echo 'API key data appears not to have been created.' >&2
  exit 1
fi

echo 'Data is present in API key table.'
