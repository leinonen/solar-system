#!/bin/bash

# CloudFront + Route 53 + SSL Certificate Setup Script
# Sets up HTTPS distribution for solarsystem.leinonen.ninja

set -e  # Exit on any error

DOMAIN_NAME="solarsystem.leinonen.ninja"
BUCKET_NAME="solarsystem.leinonen.ninja"
HOSTED_ZONE_NAME="leinonen.ninja"

echo "🚀 Setting up CloudFront distribution for: $DOMAIN_NAME"

# Check if AWS CLI is installed and configured
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

# Get AWS region and account ID
AWS_REGION=$(aws configure get region)
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "📍 Using region: $AWS_REGION"
echo "🔑 Account ID: $AWS_ACCOUNT_ID"

# Step 1: Request SSL Certificate (must be in us-east-1 for CloudFront)
echo "🔒 Requesting SSL certificate in us-east-1..."

CERT_ARN=$(aws acm request-certificate \
    --domain-name $DOMAIN_NAME \
    --validation-method DNS \
    --region us-east-1 \
    --query CertificateArn --output text)

echo "📜 Certificate requested: $CERT_ARN"
echo "⏳ Waiting for certificate validation records..."

# Wait for validation record to be available
sleep 10

# Get DNS validation records
VALIDATION_RECORD=$(aws acm describe-certificate \
    --certificate-arn $CERT_ARN \
    --region us-east-1 \
    --query 'Certificate.DomainValidationOptions[0]' --output json)

VALIDATION_NAME=$(echo $VALIDATION_RECORD | jq -r '.ResourceRecord.Name')
VALIDATION_VALUE=$(echo $VALIDATION_RECORD | jq -r '.ResourceRecord.Value')

echo "📋 DNS Validation Record:"
echo "   Name: $VALIDATION_NAME"
echo "   Value: $VALIDATION_VALUE"

# Step 2: Get Route 53 Hosted Zone ID
echo "🌐 Finding Route 53 hosted zone for $HOSTED_ZONE_NAME..."

HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
    --query "HostedZones[?Name=='$HOSTED_ZONE_NAME.'].Id" --output text | sed 's|/hostedzone/||')

if [ -z "$HOSTED_ZONE_ID" ]; then
    echo "❌ Hosted zone not found for $HOSTED_ZONE_NAME"
    echo "   Please create a hosted zone first: aws route53 create-hosted-zone --name $HOSTED_ZONE_NAME --caller-reference $(date +%s)"
    exit 1
fi

echo "✅ Found hosted zone: $HOSTED_ZONE_ID"

# Step 3: Add DNS validation record
echo "📝 Adding DNS validation record to Route 53..."

cat > dns-validation.json << EOF
{
    "Changes": [
        {
            "Action": "CREATE",
            "ResourceRecordSet": {
                "Name": "$VALIDATION_NAME",
                "Type": "CNAME",
                "TTL": 300,
                "ResourceRecords": [
                    {
                        "Value": "$VALIDATION_VALUE"
                    }
                ]
            }
        }
    ]
}
EOF

aws route53 change-resource-record-sets \
    --hosted-zone-id $HOSTED_ZONE_ID \
    --change-batch file://dns-validation.json

rm dns-validation.json
echo "✅ DNS validation record added"

# Step 4: Wait for certificate validation
echo "⏳ Waiting for SSL certificate validation (this may take several minutes)..."

aws acm wait certificate-validated \
    --certificate-arn $CERT_ARN \
    --region us-east-1

echo "✅ SSL certificate validated!"

# Step 5: Create CloudFront distribution
echo "☁️  Creating CloudFront distribution..."

# Get S3 website endpoint
S3_WEBSITE_ENDPOINT="$BUCKET_NAME.s3-website-$AWS_REGION.amazonaws.com"

cat > cloudfront-config.json << EOF
{
    "CallerReference": "solar-system-$(date +%s)",
    "Aliases": {
        "Quantity": 1,
        "Items": [
            "$DOMAIN_NAME"
        ]
    },
    "DefaultRootObject": "index.html",
    "Comment": "Solar System Application CloudFront Distribution",
    "Enabled": true,
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-$BUCKET_NAME",
                "DomainName": "$S3_WEBSITE_ENDPOINT",
                "CustomOriginConfig": {
                    "HTTPPort": 80,
                    "HTTPSPort": 443,
                    "OriginProtocolPolicy": "http-only"
                }
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-$BUCKET_NAME",
        "ViewerProtocolPolicy": "redirect-to-https",
        "TrustedSigners": {
            "Enabled": false,
            "Quantity": 0
        },
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {
                "Forward": "none"
            }
        },
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000,
        "Compress": true
    },
    "ViewerCertificate": {
        "ACMCertificateArn": "$CERT_ARN",
        "SSLSupportMethod": "sni-only",
        "MinimumProtocolVersion": "TLSv1.2_2021"
    },
    "PriceClass": "PriceClass_100",
    "CustomErrorResponses": {
        "Quantity": 1,
        "Items": [
            {
                "ErrorCode": 404,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 300
            }
        ]
    }
}
EOF

DISTRIBUTION_RESULT=$(aws cloudfront create-distribution \
    --distribution-config file://cloudfront-config.json)

DISTRIBUTION_ID=$(echo $DISTRIBUTION_RESULT | jq -r '.Distribution.Id')
DISTRIBUTION_DOMAIN=$(echo $DISTRIBUTION_RESULT | jq -r '.Distribution.DomainName')

rm cloudfront-config.json
echo "✅ CloudFront distribution created:"
echo "   Distribution ID: $DISTRIBUTION_ID"
echo "   Domain: $DISTRIBUTION_DOMAIN"

# Step 6: Create Route 53 record pointing to CloudFront
echo "🔗 Creating Route 53 A record pointing to CloudFront..."

cat > route53-record.json << EOF
{
    "Changes": [
        {
            "Action": "CREATE",
            "ResourceRecordSet": {
                "Name": "$DOMAIN_NAME",
                "Type": "A",
                "AliasTarget": {
                    "DNSName": "$DISTRIBUTION_DOMAIN",
                    "EvaluateTargetHealth": false,
                    "HostedZoneId": "Z2FDTNDATAQYW2"
                }
            }
        }
    ]
}
EOF

aws route53 change-resource-record-sets \
    --hosted-zone-id $HOSTED_ZONE_ID \
    --change-batch file://route53-record.json

rm route53-record.json
echo "✅ Route 53 A record created"

# Step 7: Wait for CloudFront deployment
echo "⏳ Waiting for CloudFront distribution deployment (this can take 10-15 minutes)..."

aws cloudfront wait distribution-deployed --id $DISTRIBUTION_ID

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📊 Summary:"
echo "   ✅ SSL Certificate: $CERT_ARN"
echo "   ✅ CloudFront Distribution: $DISTRIBUTION_ID"
echo "   ✅ Domain: https://$DOMAIN_NAME"
echo "   ✅ Route 53 DNS configured"
echo ""
echo "🌍 Your application is now available at: https://$DOMAIN_NAME"
echo ""
echo "📝 Next steps:"
echo "   1. Test your HTTPS site: https://$DOMAIN_NAME"
echo "   2. Update your deploy.sh to invalidate CloudFront cache"
echo "   3. Consider adding additional security headers"