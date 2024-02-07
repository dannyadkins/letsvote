#!/bin/bash

LANGUAGE="$1"
if [ -z "$LANGUAGE" ]; then
  echo "You must pass the target language as the first argument to the script"
  exit 1
fi

# Ensure the full path is used for schema generation
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
SCHEMA_PATH="$SCRIPT_DIR/prisma/schema.prisma"

cat "$SCRIPT_DIR/prisma/$LANGUAGE.prisma" "$SCRIPT_DIR/prisma/models.prisma" > $SCHEMA_PATH

npx prisma@5.8.1 generate --schema=$SCHEMA_PATH
