#!/bin/bash
set -x

echo "=== Sym4JS Test Script ==="
echo

echo "1. Installing dependencies..."
npm install

echo
echo "2. Running typecheck..."
npm run build

echo
echo "3. Running lint..."
npm run lint

echo
echo "4. Running tests..."
npm run test:run

echo
echo "=== All checks completed ==="