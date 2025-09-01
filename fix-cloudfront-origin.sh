#!/bin/bash

# Fix CloudFront Origin Configuration
# Updates the origin to use the correct S3 website endpoint format

set -e

DISTRIBUTION_ID="EGMVFZL2C29LD"
BUCKET_NAME="solarsystem.leinonen.ninja"
AWS_REGION="eu-north-1"

echo "🔧 Fixing CloudFront origin configuration..."

# Get current distribution config
aws cloudfront get-distribution-config --id $DISTRIBUTION_ID > current-config.json

# Extract the current config and ETag
ETAG=$(jq -r '.ETag' current-config.json)
CONFIG=$(jq '.DistributionConfig' current-config.json)

# Update the origin domain name to correct format
UPDATED_CONFIG=$(echo $CONFIG | jq --arg domain "$BUCKET_NAME.s3-website.$AWS_REGION.amazonaws.com" '
    .Origins.Items[0].DomainName = $domain
')

# Save updated config
echo $UPDATED_CONFIG > updated-config.json

echo "📝 Updating CloudFront distribution..."
echo "   Current origin: $(echo $CONFIG | jq -r '.Origins.Items[0].DomainName')"
echo "   New origin: $BUCKET_NAME.s3-website.$AWS_REGION.amazonaws.com"

# Update the distribution
aws cloudfront update-distribution \
    --id $DISTRIBUTION_ID \
    --distribution-config file://updated-config.json \
    --if-match $ETAG > /dev/null

echo "✅ CloudFront distribution updated"
echo "⏳ Waiting for deployment (this may take 10-15 minutes)..."

# Wait for deployment to complete
aws cloudfront wait distribution-deployed --id $DISTRIBUTION_ID

echo "🎉 CloudFront origin fixed and deployed!"
echo "🌍 Test your site: https://solarsystem.leinonen.ninja"

# Clean up temp files
rm -f current-config.json updated-config.json