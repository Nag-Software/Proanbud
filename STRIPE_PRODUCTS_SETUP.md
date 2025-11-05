# Stripe Products Setup Guide

## Overview
This guide will help you set up the required Stripe products and prices for Proanbud's subscription system.

## Required Products & Prices

### 1. Standard Plan
**Product Name:** Proanbud Standard
**Description:** For små bedrifter som trenger mer funksjonalitet

**Monthly Price:**
- Amount: 299 NOK
- Recurring: Monthly
- Price ID should match: `NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID`

**Yearly Price:**
- Amount: 2990 NOK (save 2 months)
- Recurring: Yearly
- Price ID should match: `NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID`

### 2. Proff Plan
**Product Name:** Proanbud Proff
**Description:** For voksende bedrifter med profesjonelle behov

**Monthly Price:**
- Amount: 799 NOK
- Recurring: Monthly
- Price ID should match: `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`

**Yearly Price:**
- Amount: 7990 NOK (save 2 months)
- Recurring: Yearly
- Price ID should match: `NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID`

## Setup Steps

### 1. Create Products in Stripe Dashboard

1. Go to [Stripe Dashboard > Products](https://dashboard.stripe.com/products)
2. Click "Add product"
3. Create each product with the details above
4. For each product, create both monthly and yearly price options

### 2. Configure Webhook Events

The Firebase Stripe extension automatically handles webhooks, but ensure these events are enabled:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.created`
- `checkout.session.completed`

### 3. Test Mode Setup

Your current configuration is using test mode:
- Publishable Key: `pk_test_...`
- Secret Key: `sk_test_...`

For testing, use Stripe's test card numbers:
- Success: `4242424242424242`
- Decline: `4000000000000002`

### 4. Production Setup

hero-laud-woo-luck


When ready for production:
1. Update environment variables to use live keys (`pk_live_...`, `sk_live_...`)
2. Update webhook endpoints to production URLs
3. Test thoroughly with real payment methods

## Verification

After setup, verify:
1. Products appear in Firestore `products` collection
2. Prices appear in Firestore `products/{productId}/prices` collection
3. Test checkout sessions create successfully
4. Webhook events are processed correctly

## Firebase Extension Configuration

Your extension is configured with:
- Products Collection: `products`
- Customers Collection: `customers`
- Location: `europe-west1`

This automatically syncs Stripe data to Firestore for real-time subscription management.