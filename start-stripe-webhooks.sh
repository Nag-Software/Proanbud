#!/bin/bash

# Script to start Stripe webhook listener for local development
# This forwards Stripe webhooks to your local Next.js server

echo "🚀 Starting Stripe webhook listener..."
echo ""
echo "Make sure your Next.js dev server is running on http://localhost:3000"
echo ""
echo "This will forward webhooks to: http://localhost:3000/api/stripe/webhook"
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null
then
    echo "❌ Stripe CLI is not installed!"
    echo ""
    echo "Install it using Homebrew:"
    echo "  brew install stripe/stripe-cli/stripe"
    echo ""
    echo "Then login:"
    echo "  stripe login"
    echo ""
    exit 1
fi

# Start listening for webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook

# The webhook secret will be displayed in the output
# Copy it and add to your .env.local file as STRIPE_WEBHOOK_SECRET
