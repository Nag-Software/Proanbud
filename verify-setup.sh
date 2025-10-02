#!/bin/bash

# Quick Fix Verification Script
echo "🔧 Verifiserer Firebase Admin SDK setup..."
echo ""

# Sjekk at alle nødvendige environment variabler er satt
echo "1️⃣ Sjekker environment variabler..."

if grep -q "NEXT_PUBLIC_FIREBASE_DATABASE_URL" .env.local; then
    DATABASE_URL=$(grep "NEXT_PUBLIC_FIREBASE_DATABASE_URL" .env.local | cut -d'=' -f2)
    if [ "$DATABASE_URL" = "https://your_project.firebaseio.com" ] || [ -z "$DATABASE_URL" ]; then
        echo "   ❌ NEXT_PUBLIC_FIREBASE_DATABASE_URL er ikke satt eller er placeholder"
    else
        echo "   ✅ NEXT_PUBLIC_FIREBASE_DATABASE_URL er satt"
    fi
else
    echo "   ❌ NEXT_PUBLIC_FIREBASE_DATABASE_URL mangler i .env.local"
fi

if grep -q "FIREBASE_SERVICE_ACCOUNT_KEY" .env.local; then
    SERVICE_KEY=$(grep "FIREBASE_SERVICE_ACCOUNT_KEY" .env.local | cut -d'=' -f2)
    if [ -f "$SERVICE_KEY" ]; then
        echo "   ✅ FIREBASE_SERVICE_ACCOUNT_KEY peker til eksisterende fil"
    else
        echo "   ❌ FIREBASE_SERVICE_ACCOUNT_KEY fil ikke funnet: $SERVICE_KEY"
    fi
else
    echo "   ❌ FIREBASE_SERVICE_ACCOUNT_KEY mangler i .env.local"
fi

if grep -q "STRIPE_WEBHOOK_SECRET" .env.local; then
    WEBHOOK_SECRET=$(grep "STRIPE_WEBHOOK_SECRET" .env.local | cut -d'=' -f2)
    if [ "$WEBHOOK_SECRET" = "whsec_test_placeholder" ] || [ -z "$WEBHOOK_SECRET" ]; then
        echo "   ⚠️  STRIPE_WEBHOOK_SECRET er placeholder (OK hvis stripe listen kjører)"
    else
        echo "   ✅ STRIPE_WEBHOOK_SECRET er satt"
    fi
else
    echo "   ❌ STRIPE_WEBHOOK_SECRET mangler i .env.local"
fi

echo ""
echo "2️⃣ Sjekker om serveren kjører..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "   ✅ Server kjører på http://localhost:3000"
else
    echo "   ❌ Server kjører IKKE!"
    echo "      Start serveren med: pnpm dev"
    exit 1
fi

echo ""
echo "3️⃣ Tester webhook endpoint..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/stripe/webhook -H "Content-Type: application/json" -d '{"test": "data"}' 2>&1)

if [ "$RESPONSE" = "400" ] || [ "$RESPONSE" = "200" ]; then
    echo "   ✅ Webhook endpoint svarer (HTTP $RESPONSE)"
    echo "      400 = Normal (ingen gyldig Stripe signatur)"
    echo "      200 = OK"
elif [ "$RESPONSE" = "500" ]; then
    echo "   ❌ Webhook endpoint feiler (HTTP 500)"
    echo "      Sjekk server logs for feilmeldinger"
    echo "      Mest sannlig: Firebase config mangler eller er feil"
else
    echo "   ⚠️  Uventet respons: HTTP $RESPONSE"
fi

echo ""
echo "4️⃣ Sjekker Stripe CLI..."
if pgrep -f "stripe listen" > /dev/null; then
    echo "   ✅ Stripe listen kjører"
else
    echo "   ❌ Stripe listen kjører IKKE!"
    echo "      Start med: stripe listen --forward-to localhost:3000/api/stripe/webhook"
fi

echo ""
echo "============================================"
echo ""
echo "📋 Neste steg:"
echo ""
echo "1. Hvis du ser ❌ eller 500 error over:"
echo "   → Restart serveren: Ctrl+C, deretter pnpm dev"
echo ""
echo "2. Start Stripe webhook listener (hvis ikke kjører):"
echo "   → stripe listen --forward-to localhost:3000/api/stripe/webhook"
echo ""
echo "3. Test betaling:"
echo "   → Gå til http://localhost:3000/innstillinger"
echo "   → Velg plan og betal med 4242 4242 4242 4242"
echo ""
echo "4. Sjekk logs:"
echo "   → Server terminal: Se etter '✅ Subscription created...'"
echo "   → Stripe CLI terminal: Se etter 'checkout.session.completed [200]'"
echo ""

