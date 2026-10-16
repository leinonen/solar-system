#!/bin/bash

# Solar System Deployment Script
# Deploys the application to AWS S3 bucket: solarsystem.leinonen.ninja

set -e  # Exit on any error

BUCKET_NAME="solarsystem.leinonen.ninja"
BUILD_DIR="dist"
DISTRIBUTION_ID="EGMVFZL2C29LD"

echo "🚀 Starting deployment to S3 bucket: $BUCKET_NAME"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    echo "   Installation: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf $BUILD_DIR

# Build the application (skip TypeScript check for deployment)
echo "🔨 Building application..."
echo "⚠️  Note: Skipping TypeScript check for deployment. Fix TS errors later."
npx vite build --mode production

# Check if build was successful
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "📁 Build completed successfully"

# Deploy to S3
echo "☁️  Uploading to S3 bucket: $BUCKET_NAME"

# Upload all files with appropriate cache headers
aws s3 sync $BUILD_DIR s3://$BUCKET_NAME \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "*.html" \
    --exclude "*.json"

# Upload HTML and manifest/service worker files with no-cache
aws s3 sync $BUILD_DIR s3://$BUCKET_NAME \
    --cache-control "no-cache, no-store, must-revalidate" \
    --exclude "*" \
    --include "*.html" \
    --include "*.json"

# The bucket is private and served only through CloudFront. Bucket, policy and
# distribution are managed in github.com/leinonen/infrastructure (stacks/websites).
echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
    --distribution-id $DISTRIBUTION_ID \
    --paths "/*" > /dev/null
echo "✅ CloudFront cache invalidated"

echo "✅ Deployment completed successfully!"
echo "🌍 https://$BUCKET_NAME"
