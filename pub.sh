#!/bin/bash

if [ $# -lt 2 ]; then
    echo "Usage: $0 <version> <commit message>"
    echo "Example: $0 0.16.0 \"Add numerical evaluation\""
    exit 1
fi

VERSION=$1
COMMIT_MSG=$2

CURRENT_VERSION=$(node -e "const pkg = require('./package.json'); console.log(pkg.version)")

version_gt() {
    local v1=$1
    local v2=$2

    local v1_major=$(echo $v1 | cut -d. -f1)
    local v1_minor=$(echo $v1 | cut -d. -f2)
    local v1_patch=$(echo $v1 | cut -d. -f3)

    local v2_major=$(echo $v2 | cut -d. -f1)
    local v2_minor=$(echo $v2 | cut -d. -f2)
    local v2_patch=$(echo $v2 | cut -d. -f3)

    if [ "$v1_major" -gt "$v2_major" ]; then
        return 0
    elif [ "$v1_major" -lt "$v2_major" ]; then
        return 1
    fi

    if [ "$v1_minor" -gt "$v2_minor" ]; then
        return 0
    elif [ "$v1_minor" -lt "$v2_minor" ]; then
        return 1
    fi

    if [ "$v1_patch" -gt "$v2_patch" ]; then
        return 0
    elif [ "$v1_patch" -lt "$v2_patch" ]; then
        return 1
    fi

    return 1
}

echo "Current version: $CURRENT_VERSION"
echo "Target version: $VERSION"
echo ""

if version_gt "$VERSION" "$CURRENT_VERSION"; then
    echo "Version check passed: $VERSION > $CURRENT_VERSION"
else
    echo "Error: Version $VERSION must be greater than current version $CURRENT_VERSION"
    echo "Cannot downgrade or keep the same version!"
    exit 1
fi

echo ""

node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '$VERSION';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('Updated package.json to v$VERSION');
"

echo ""
echo "Building..."
npm run build

echo ""
echo "Committing..."
git add -A
git commit -m "$COMMIT_MSG"
git tag -a "v$VERSION" -m "Release v$VERSION"

echo ""
echo "=========================================="
echo "Version upgrade: $CURRENT_VERSION -> $VERSION"
echo "=========================================="
echo ""
echo "Git commit and tag created."
echo ""
echo "To complete the release:"
echo "  git push"
echo "  git push origin v$VERSION"
echo ""
echo "To publish to npm (after testing):"
echo "  npm publish --access public"
echo ""
echo "NOTE: This script does NOT publish to npm automatically."