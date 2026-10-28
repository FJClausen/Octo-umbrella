#!/usr/bin/env bash
# Writes the ASC_API_KEY_P8 secret to $1 as a clean PKCS#8 PEM file.
# Repairs common paste damage: lost line breaks, CRLF, missing BEGIN/END
# lines, or a base64-encoded copy of the whole .p8 file.
set -e
KEY="$1"
body() {
  printf '%s' "$1" | tr -d '\r' \
    | sed -e 's/-----BEGIN[^-]*-----//g' -e 's/-----END[^-]*-----//g' \
    | tr -d ' \n\t'
}
B=$(body "$ASC_API_KEY_P8")
# Someone may have stored the whole .p8 file base64-encoded.
if printf '%s' "$B" | base64 -d 2>/dev/null | grep -aq -- '-----BEGIN'; then
  B=$(body "$(printf '%s' "$B" | base64 -d)")
fi
{
  echo "-----BEGIN PRIVATE KEY-----"
  printf '%s\n' "$B" | fold -w 64
  echo "-----END PRIVATE KEY-----"
} > "$KEY"
if ! openssl pkey -in "$KEY" -noout 2>/dev/null; then
  echo "::error::ASC_API_KEY_P8 is not a valid App Store Connect .p8 key. Paste the full contents of AuthKey_XXXX.p8, including the BEGIN/END lines."
  exit 1
fi
