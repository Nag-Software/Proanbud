'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

interface ExtensionConfig {
  products?: any;
  customers?: any;
  subscriptions?: any;
  checkouts?: any;
}

export const FirebaseExtensionDebugger: React.FC = () => {
  const { user } = useAuth();
  const [extensionData, setExtensionData] = useState<ExtensionConfig>({});
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('products');

  const fetchExtensionData = async () => {
    try {
      setLoading(true);

      // Fetch products
      const productsRef = ref(db, 'products');
      const productsSnapshot = await get(productsRef);
      const products = productsSnapshot.exists() ? productsSnapshot.val() : {};

      // Fetch customer data if user exists
      let customerData = {};
      let subscriptions = {};
      let checkouts = {};

      if (user?.uid) {
        // Customer data
        const customerRef = ref(db, `stripe_customers/${user.uid}`);
        const customerSnapshot = await get(customerRef);
        customerData = customerSnapshot.exists() ? customerSnapshot.val() : {};

        // Subscriptions
        const subscriptionsRef = ref(db, `stripe_customers/${user.uid}/subscriptions`);
        const subscriptionsSnapshot = await get(subscriptionsRef);
        subscriptions = subscriptionsSnapshot.exists() ? subscriptionsSnapshot.val() : {};

        // Checkout sessions
        const checkoutsRef = ref(db, `stripe_customers/${user.uid}/checkout_sessions`);
        const checkoutsSnapshot = await get(checkoutsRef);
        checkouts = checkoutsSnapshot.exists() ? checkoutsSnapshot.val() : {};
      }

      setExtensionData({
        products,
        customers: customerData,
        subscriptions,
        checkouts
      });

    } catch (error) {
      console.error('Error fetching extension data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExtensionData();
  }, [user?.uid]);

  const sections = [
    { id: 'products', label: 'Products', icon: '🛍️', data: extensionData.products },
    { id: 'customers', label: 'Customer Data', icon: '👤', data: extensionData.customers },
    { id: 'subscriptions', label: 'Subscriptions', icon: '📋', data: extensionData.subscriptions },
    { id: 'checkouts', label: 'Checkout Sessions', icon: '🛒', data: extensionData.checkouts },
  ];

  const testConnection = async () => {
    try {
      const response = await fetch('/api/debug/test-stripe-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      alert(JSON.stringify(result, null, 2));
    } catch (error) {
      alert('Connection test failed: ' + error);
    }
  };

  const syncStripeData = async () => {
    try {
      const response = await fetch('/api/debug/sync-stripe-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user?.uid })
      });

      const result = await response.json();
      alert('Sync completed: ' + JSON.stringify(result, null, 2));
      fetchExtensionData();
    } catch (error) {
      alert('Sync failed: ' + error);
    }
  };

  const validateProducts = () => {
    const products = extensionData.products || {};
    const issues: string[] = [];

    Object.keys(products).forEach(productId => {
      const product = products[productId];
      
      if (!product.name) issues.push(`Product ${productId}: Missing name`);
      if (!product.prices || Object.keys(product.prices).length === 0) {
        issues.push(`Product ${productId}: No prices found`);
      } else {
        Object.keys(product.prices).forEach(priceId => {
          const price = product.prices[priceId];
          if (!price.unit_amount && price.unit_amount !== 0) {
            issues.push(`Price ${priceId}: Missing unit_amount`);
          }
          if (!price.currency) {
            issues.push(`Price ${priceId}: Missing currency`);
          }
        });
      }
    });

    return issues;
  };

  const productIssues = validateProducts();

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Firebase Stripe Extension</h2>
        <div className="flex space-x-2">
          <button
            onClick={testConnection}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            Test Connection
          </button>
          <button
            onClick={syncStripeData}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Sync Data
          </button>
          <button
            onClick={fetchExtensionData}
            disabled={loading}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Validation Issues */}
      {productIssues.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 p-4 rounded-lg">
          <h3 className="font-medium text-red-800 dark:text-red-200 mb-2">⚠️ Configuration Issues</h3>
          <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
            {productIssues.map((issue, index) => (
              <li key={index}>• {issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Section Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeSection === section.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <span className="mr-2">{section.icon}</span>
              {section.label}
              {section.data && Object.keys(section.data).length > 0 && (
                <span className="ml-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                  {Object.keys(section.data).length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Section Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border">
        <div className="p-4">
          {activeSection === 'products' && (
            <div>
              <h3 className="font-medium mb-4">Stripe Products</h3>
              {extensionData.products && Object.keys(extensionData.products).length > 0 ? (
                <div className="space-y-4">
                  {Object.keys(extensionData.products).map(productId => {
                    const product = extensionData.products![productId];
                    return (
                      <div key={productId} className="border dark:border-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{product.name || 'Unnamed Product'}</h4>
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {productId}
                          </span>
                        </div>
                        {product.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {product.description}
                          </p>
                        )}
                        {product.prices && (
                          <div className="mt-3">
                            <h5 className="text-sm font-medium mb-2">Prices:</h5>
                            <div className="space-y-2">
                              {Object.keys(product.prices).map(priceId => {
                                const price = product.prices[priceId];
                                return (
                                  <div key={priceId} className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-sm">
                                    <div className="flex justify-between">
                                      <span>{priceId}</span>
                                      <span>
                                        {price.unit_amount ? 
                                          `${price.unit_amount / 100} ${price.currency?.toUpperCase()}` : 
                                          'Free'
                                        }
                                        {price.recurring && ` / ${price.recurring.interval}`}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500">No products found</p>
              )}
            </div>
          )}

          {activeSection === 'customers' && (
            <div>
              <h3 className="font-medium mb-4">Customer Data</h3>
              <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto max-h-96">
                <pre className="text-xs">
                  {JSON.stringify(extensionData.customers, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {activeSection === 'subscriptions' && (
            <div>
              <h3 className="font-medium mb-4">Subscriptions</h3>
              <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto max-h-96">
                <pre className="text-xs">
                  {JSON.stringify(extensionData.subscriptions, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {activeSection === 'checkouts' && (
            <div>
              <h3 className="font-medium mb-4">Checkout Sessions</h3>
              <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto max-h-96">
                <pre className="text-xs">
                  {JSON.stringify(extensionData.checkouts, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Extension Configuration Status */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-medium mb-3">Extension Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {extensionData.products ? Object.keys(extensionData.products).length : 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Products</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {extensionData.customers && Object.keys(extensionData.customers).length > 0 ? '✓' : '✗'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Customer Data</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {extensionData.subscriptions ? Object.keys(extensionData.subscriptions).length : 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Subscriptions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {extensionData.checkouts ? Object.keys(extensionData.checkouts).length : 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Checkouts</div>
          </div>
        </div>
      </div>
    </div>
  );
};