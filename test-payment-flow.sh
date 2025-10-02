#!/bin/bash

# Quick test script to verify the entire payment flow

echo "🧪 Testing Stripe Payment Flow"
echo "=============================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."
echo ""

# Check if Next.js is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Next.js dev server is NOT running!"
    echo "   Run: pnpm dev"
    exit 1
else
    echo "✅ Next.js dev server is running"
fi

# Check if verify-session endpoint exists
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/stripe/verify-session -H "Content-Type: application/json" -d '{}')
if [ "$HTTP_CODE" != "400" ] && [ "$HTTP_CODE" != "500" ]; then
    echo "❌ verify-session endpoint not responding correctly (got $HTTP_CODE)"
    exit 1
else
    echo "✅ verify-session endpoint is accessible"
fi

# Check if webhook endpoint exists
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/stripe/webhook)
if [ "$HTTP_CODE" != "405" ]; then
    echo "❌ webhook endpoint not responding correctly (got $HTTP_CODE)"
    exit 1
else
    echo "✅ webhook endpoint is accessible"
fi

# Check if Stripe CLI is running
if ps aux | grep "stripe listen" | grep -v grep > /dev/null; then
    echo "✅ Stripe CLI webhook listener is running"
else
    echo "⚠️  Stripe CLI webhook listener is NOT running (optional)"
    echo "   Run: stripe listen --forward-to localhost:3000/api/stripe/webhook"
fi

echo ""
echo "=============================="
echo "🎉 All checks passed!"
echo ""
echo "You can now test the payment flow:"
echo "1. Go to: http://localhost:3000/innstillinger"
echo "2. Click on a plan (Basic or Pro)"
echo "3. Use test card: 4242 4242 4242 4242"
echo "4. Complete payment"
echo "5. Watch the Next.js terminal for:"
echo "   🔍 Verifying checkout session: cs_test_..."
echo "   ✅ Subscription verified and saved for user..."
echo ""
echo "Then check Firebase console for the subscription data!"
