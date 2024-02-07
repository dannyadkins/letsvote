#!/bin/bash

# Ensure the full path is used for schema generation
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
SCHEMA_PATH="$SCRIPT_DIR/prisma/schema.prisma"

npx prisma@5.8.1 db push --schema=$SCHEMA_PATH
