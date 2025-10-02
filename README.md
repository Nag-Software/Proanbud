## Proanbud
#### A Nag Software product

Modern quotation and customer management system for Norwegian businesses.

## 🚀 Features

- **Quote Management**: Create, track, and manage business quotes
- **Customer Management**: Comprehensive customer database with activity tracking
- **Product Catalog**: Shared catalog with categories, subcategories, and products
- **Analytics Dashboard**: Real-time insights into business performance
- **AI-Powered Pricing**: Intelligent pricing suggestions based on project details
- **Inbox System**: Centralized message management for quote communications
- **Business Settings**: Customizable company profiles and branding
- **💳 Subscription Management**: Complete Stripe integration for Basic and Pro plans

## 📁 Project Structure

```
proanbud/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── (dashboard)/        # Dashboard pages
│   │   ├── api/                # API routes
│   │   ├── login/              # Authentication pages
│   │   └── signup/
│   ├── components/             # React components
│   │   ├── dashboard/          # Dashboard components
│   │   ├── katalog/            # Catalog components
│   │   ├── kunder/             # Customer components
│   │   ├── tilbud/             # Quote components
│   │   └── shared/             # Shared UI components
│   ├── lib/                    # Core utilities
│   │   ├── services/           # Firebase service layer
│   │   ├── firebase.ts         # Firebase configuration
│   │   └── types.ts            # TypeScript definitions
│   └── hooks/                  # Custom React hooks
├── public/                     # Static assets
├── database.rules.json         # Firebase database security rules
├── firebase.json               # Firebase configuration
└── .firebaserc                 # Firebase project settings
```

## 🔧 Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Firebase Realtime Database
- **Authentication**: Firebase Authentication
- **Storage**: Firebase Storage
- **Payments**: Stripe (Subscriptions & Checkout)
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Package Manager**: pnpm

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Firebase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Nag-Software/Proanbud.git
   cd proanbud
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file from the template:
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your credentials:
   ```env
   # Firebase (already configured in src/lib/firebase.ts)
   
   # Stripe TEST MODE (for development)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID=price_...
   NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...
   
   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
   
   **Quick Stripe Setup** (Test Mode):
   ```bash
   # Automatisk oppsett med Stripe CLI
   ./setup-stripe-test.sh
   
   # Eller følg manuell guide
   # See: STRIPE_TEST_MODE_SETUP.md
   ```
   
   See [STRIPE_QUICKSTART.md](./STRIPE_QUICKSTART.md) for full Stripe setup.

4. **Deploy database rules** (Important!)
   ```bash
   # Install Firebase CLI if not already installed
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Deploy database rules
   firebase deploy --only database
   ```
   
   See [DEPLOY_DATABASE_RULES.md](./DEPLOY_DATABASE_RULES.md) for detailed instructions.

5. **Run development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔒 Database Security

The project uses comprehensive Firebase Realtime Database security rules to ensure:

- User data isolation (users can only access their own data)
- Authentication requirement for all operations
- Data validation for all write operations
- Shared product catalog accessible to all authenticated users

**Important Files**:
- `database.rules.json` - Firebase security rules
- `DATABASE_RULES.md` - Detailed rules documentation
- `DEPLOY_DATABASE_RULES.md` - Deployment guide

**Deploy Rules**:
```bash
firebase deploy --only database
```

See [DATABASE_RULES.md](./DATABASE_RULES.md) for complete documentation.

## 📦 Database Structure

```
/
├── users/
│   └── {userId}/
│       ├── profile/                      # User profile
│       ├── userSettings/                 # User preferences
│       ├── businessSettings/             # Company information
│       ├── tilbud/                       # Quotes
│       ├── kunder/                       # Customers
│       ├── inbox/                        # Messages
│       ├── analytics/                    # Analytics data
│       ├── stripeCustomerId              # 💳 Stripe customer ID
│       ├── stripeSubscriptionId          # 💳 Active subscription
│       ├── subscriptionStatus            # 💳 Subscription status
│       ├── subscriptionPriceId           # 💳 Current price/plan
│       ├── subscriptionCurrentPeriodEnd  # 💳 Billing period end
│       └── invoices/                     # 💳 Payment history
└── katalog/                              # Shared product catalog
    └── {categoryId}/
        └── {itemId}/                     # Subcategories or Products
```

## 🚢 Deployment

### Firebase App Hosting

The project is configured for Firebase App Hosting with standalone Next.js output.

```bash
# Deploy to Firebase
firebase deploy
```

### Important Configuration

**next.config.ts**:
```typescript
const nextConfig: NextConfig = {
  output: "standalone",  // Required for Firebase App Hosting
  // ... other config
};
```

## 📚 Documentation

### Database & Security
- [Database Rules Documentation](./DATABASE_RULES.md)
- [Deployment Guide](./DEPLOY_DATABASE_RULES.md)

### Stripe Integration
- [🚀 Stripe Quick Start](./STRIPE_QUICKSTART.md) - Get started in 5 minutes
- [🧪 Test Mode Setup](./STRIPE_TEST_MODE_SETUP.md) - **START HERE** for development
- [📖 Complete Setup Guide](./STRIPE_SETUP.md) - Detailed Stripe configuration
- [🧪 Testing Guide](./STRIPE_TESTING.md) - All test scenarios
- [🔒 Security Guide](./STRIPE_SECURITY.md) - Firebase security rules
- [🔴 Live Mode Guide](./STRIPE_LIVE_MODE_SETUP.md) - Production setup

## 🤝 Contributing

This is a private Nag Software product. For internal development:

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📝 License

Proprietary - Nag Software © 2025

## 🐛 Known Issues

- Authentication requires Firebase configuration in console
- Phone authentication must be enabled in Firebase Console
- Database rules must be deployed before first use

## 📞 Support

For issues or questions:
- Internal: Contact Nag Software development team
- Firebase Issues: Check [Firebase Console](https://console.firebase.google.com/project/proanbudas)

