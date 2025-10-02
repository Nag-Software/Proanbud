#!/bin/bash

# Quick Webhook Test Script
# Dette scriptet tester webhook-funksjonaliteten

echo "🔍 Webhook Diagnostikk"
echo "====================="
echo ""

# Sjekk om serveren kjører
echo "📡 Sjekker om server kjører..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Server kjører på http://localhost:3000"
else
    echo "❌ Server kjører IKKE!"
    echo "   Start serveren med: pnpm dev"
    exit 1
fi

echo ""

# Sjekk om Stripe CLI er installert
echo "🔧 Sjekker Stripe CLI..."
if command -v stripe &> /dev/null; then
    echo "✅ Stripe CLI er installert"
    
    # Sjekk om bruker er logget inn
    if stripe config --list &> /dev/null 2>&1; then
        echo "✅ Logget inn på Stripe"
    else
        echo "❌ Ikke logget inn på Stripe"
        echo "   Kjør: stripe login"
        exit 1
    fi
else
    echo "❌ Stripe CLI er IKKE installert"
    echo "   Installer med: brew install stripe/stripe-cli/stripe"
    exit 1
fi

echo ""
echo "🧪 Trigger test webhooks..."
echo ""

# Test checkout.session.completed
echo "1️⃣ Testing checkout.session.completed..."
stripe trigger checkout.session.completed 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ checkout.session.completed sendt"
else
    echo "   ⚠️  Kunne ikke sende webhook (dette er OK hvis webhook listener ikke kjører)"
fi

sleep 1

# Test customer.subscription.updated
echo "2️⃣ Testing customer.subscription.updated..."
stripe trigger customer.subscription.updated 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ customer.subscription.updated sendt"
else
    echo "   ⚠️  Kunne ikke sende webhook"
fi

sleep 1

# Test invoice.payment_succeeded
echo "3️⃣ Testing invoice.payment_succeeded..."
stripe trigger invoice.payment_succeeded 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ invoice.payment_succeeded sendt"
else
    echo "   ⚠️  Kunne ikke sende webhook"
fi

echo ""
echo "====================="
echo ""
echo "⚠️  VIKTIG:"
echo "Disse test-webhooks vil IKKE oppdatere Firebase fordi de mangler firebaseUserId i metadata!"
echo ""
echo "For å teste med ekte data:"
echo "1. Start webhook listener: stripe listen --forward-to localhost:3000/api/stripe/webhook"
echo "2. Kopier webhook secret og oppdater .env.local"
echo "3. Restart server: pnpm dev"
echo "4. Gjør en ekte betaling i UI"
echo ""
echo "Sjekk server logs for å se om webhooks mottas!"
echo ""

