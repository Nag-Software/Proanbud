#!/bin/bash

# Quick test to verify Stripe webhook integration
# This simulates a checkout.session.completed event

echo "🧪 Testing Stripe webhook..."
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null
then
    echo "❌ Stripe CLI is not installed!"
    echo "Run: brew install stripe/stripe-cli/stripe"
    exit 1
fi

# Check if user is logged in
if ! stripe config --list &> /dev/null
then
    echo "❌ Not logged in to Stripe!"
    echo "Run: stripe login"
    exit 1
fi

echo "✅ Stripe CLI is ready"
echo ""
echo "Make sure:"
echo "  1. Next.js dev server is running (pnpm dev)"
echo "  2. Stripe webhook listener is running (./start-stripe-webhooks.sh)"
echo "  3. STRIPE_WEBHOOK_SECRET is set in .env.local"
echo ""
read -p "Press Enter when ready to test..."
echo ""
echo "📤 Sending test checkout.session.completed event..."
echo ""

# Trigger a test event
stripe trigger checkout.session.completed

echo ""
echo "✅ Test event sent!"
echo ""
echo "Check your terminals:"
echo "  - stripe listen terminal: Should show the event"
echo "  - Next.js terminal: Should show 'Subscription created for user...'"
echo "  - Firebase console: Should have data in users/{userId}/subscription"
