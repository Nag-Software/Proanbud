'use client';

import React, { useState, useEffect } from 'react';

interface StripeConfig {
  publishableKey?: string;
  priceIds: {
    basicMonthly?: string;
    basicYearly?: string;
    proMonthly?: string;
    proYearly?: string;
  };
  webhookEndpoint?: string;
  environment: 'test' | 'live';
}

export const StripeConfigDebugger: React.FC = () => {
  const [config, setConfig] = useState<StripeConfig>({
    priceIds: {},
    environment: 'test'
  });
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    // Load configuration from environment variables
    setConfig({
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      priceIds: {
        basicMonthly: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID,
        basicYearly: process.env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID,
        proMonthly: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
        proYearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID,
      },
      webhookEndpoint: process.env.NEXT_PUBLIC_STRIPE_WEBHOOK_ENDPOINT,
      environment: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.includes('pk_test') ? 'test' : 'live'
    });
  }, []);

  const testStripeConnection = async () => {
    setTesting(true);
    const results: Record<string, any> = {};

    try {
      // Test publishable key
      if (config.publishableKey) {
        results.publishableKey = {
          valid: config.publishableKey.startsWith('pk_'),
          environment: config.environment,
          status: 'success'
        };
      } else {
        results.publishableKey = {
          valid: false,
          error: 'Publishable key not found',
          status: 'error'
        };
      }

      // Test each price ID
      for (const [planType, priceId] of Object.entries(config.priceIds)) {
        if (priceId) {
          try {
            const response = await fetch('/api/debug/validate-price', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ priceId })
            });
            
            const data = await response.json();
            results[planType] = {
              priceId,
              valid: response.ok,
              data: data,
              status: response.ok ? 'success' : 'error'
            };
          } catch (error) {
            results[planType] = {
              priceId,
              valid: false,
              error: error,
              status: 'error'
            };
          }
        } else {
          results[planType] = {
            valid: false,
            error: 'Price ID not configured',
            status: 'warning'
          };
        }
      }

      // Test webhook endpoint
      if (config.webhookEndpoint) {
        try {
          const response = await fetch(config.webhookEndpoint, {
            method: 'GET',
          });
          results.webhook = {
            endpoint: config.webhookEndpoint,
            accessible: response.status !== 404,
            status: response.status !== 404 ? 'success' : 'warning'
          };
        } catch (error) {
          results.webhook = {
            endpoint: config.webhookEndpoint,
            accessible: false,
            error: error,
            status: 'error'
          };
        }
      }

    } catch (error) {
      results.error = error;
    }

    setTestResults(results);
    setTesting(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Stripe Configuration</h2>
        <button
          onClick={testStripeConnection}
          disabled={testing}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {testing ? 'Testing...' : 'Test Configuration'}
        </button>
      </div>

      {/* Environment Status */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-medium mb-3">Environment</h3>
        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            config.environment === 'test' 
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          }`}>
            {config.environment === 'test' ? '🧪 Test Mode' : '🚀 Live Mode'}
          </span>
          {config.environment === 'live' && (
            <span className="text-sm text-red-600 dark:text-red-400">
              ⚠️ Using live Stripe keys
            </span>
          )}
        </div>
      </div>

      {/* Configuration Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-medium">Configuration Details</h3>
        </div>
        <div className="p-4 space-y-4">
          {/* Publishable Key */}
          <div className="flex justify-between items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Publishable Key
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                {config.publishableKey ? 
                  `${config.publishableKey.substring(0, 12)}...${config.publishableKey.slice(-4)}` : 
                  'Not configured'
                }
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {testResults.publishableKey && (
                <span className={getStatusColor(testResults.publishableKey.status)}>
                  {getStatusIcon(testResults.publishableKey.status)}
                </span>
              )}
              {config.publishableKey && (
                <button
                  onClick={() => copyToClipboard(config.publishableKey!)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Copy
                </button>
              )}
            </div>
          </div>

          {/* Price IDs */}
          <div className="space-y-3">
            <h4 className="font-medium">Price IDs</h4>
            {Object.entries(config.priceIds).map(([planType, priceId]) => (
              <div key={planType} className="flex justify-between items-center">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {planType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {priceId || 'Not configured'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {testResults[planType] && (
                    <span className={getStatusColor(testResults[planType].status)}>
                      {getStatusIcon(testResults[planType].status)}
                    </span>
                  )}
                  {priceId && (
                    <button
                      onClick={() => copyToClipboard(priceId)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Copy
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Webhook Endpoint */}
          <div className="flex justify-between items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Webhook Endpoint
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                {config.webhookEndpoint || 'Not configured'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {testResults.webhook && (
                <span className={getStatusColor(testResults.webhook.status)}>
                  {getStatusIcon(testResults.webhook.status)}
                </span>
              )}
              {config.webhookEndpoint && (
                <button
                  onClick={() => copyToClipboard(config.webhookEndpoint!)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Copy
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium">Test Results</h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {Object.entries(testResults).map(([key, result]) => (
                <div key={key} className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={getStatusColor(result.status)}>
                        {getStatusIcon(result.status)}
                      </span>
                      <span className="font-medium">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                    </div>
                    {result.error && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        {result.error.toString()}
                      </p>
                    )}
                    {result.data && (
                      <div className="mt-2 bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs">
                        <pre>{JSON.stringify(result.data, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Environment Variables Template */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-medium mb-3">Environment Variables Template</h3>
        <div className="bg-black text-green-400 p-4 rounded font-mono text-xs overflow-auto">
          <pre>{`# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Price IDs
NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID=price_...

# Webhook
NEXT_PUBLIC_STRIPE_WEBHOOK_ENDPOINT=https://your-domain.com/api/webhooks/stripe
STRIPE_WEBHOOK_SECRET=whsec_...`}</pre>
        </div>
        <button
          onClick={() => copyToClipboard(`# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Price IDs
NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID=price_...

# Webhook
NEXT_PUBLIC_STRIPE_WEBHOOK_ENDPOINT=https://your-domain.com/api/webhooks/stripe
STRIPE_WEBHOOK_SECRET=whsec_...`)}
          className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Copy Template
        </button>
      </div>
    </div>
  );
};