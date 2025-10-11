'use client';

import React, { useState, useEffect } from 'react';
import { firestore } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const StripeExtensionDebugger: React.FC = () => {
  const { user } = useAuth();
  const [extensionStatus, setExtensionStatus] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [customerData, setCustomerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkExtensionStatus = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      // Check if products collection exists and has data
      const productsRef = collection(firestore, 'products');
      const productsSnapshot = await getDocs(productsRef);
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);

      // Check customer document
      const customerRef = doc(firestore, `customers/${user.uid}`);
      const customerDoc = await getDoc(customerRef);
      setCustomerData(customerDoc.exists() ? customerDoc.data() : null);

      // Check configuration
      const configRef = collection(firestore, 'configuration');
      const configSnapshot = await getDocs(configRef);
      const configData = configSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setExtensionStatus({
        products: productsData,
        customer: customerDoc.exists() ? customerDoc.data() : null,
        configuration: configData,
        productsCount: productsData.length,
        hasCustomer: customerDoc.exists()
      });

    } catch (error) {
      console.error('Error checking extension status:', error);
      setExtensionStatus({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user?.uid) {
      checkExtensionStatus();
    }
  }, [user?.uid]);

  const testCheckoutSession = async () => {
    if (!user?.uid || products.length === 0) return;
    
    try {
      const testPriceId = products[0]?.prices?.[0]?.id || process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID;
      console.log('Testing with price ID:', testPriceId);
      
      // Use the same logic as in SubscriptionContextNew
      const { addDoc, collection: firestoreCollection, onSnapshot } = await import('firebase/firestore');
      const checkoutSessionsRef = firestoreCollection(firestore, `customers/${user.uid}/checkout_sessions`);
      
      const sessionData = {
        price: testPriceId,
        success_url: `${window.location.origin}/debug-success`,
        cancel_url: `${window.location.origin}/debug-cancel`,
        allow_promotion_codes: true,
        mode: 'subscription'
      };

      console.log('Creating test checkout session:', sessionData);
      const docRef = await addDoc(checkoutSessionsRef, sessionData);
      console.log('Test checkout session created:', docRef.id);

      // Monitor the document for changes
      const unsubscribe = onSnapshot(docRef, (doc) => {
        const data = doc.data();
        console.log('Test checkout session update:', data);
        if (data?.url) {
          console.log('✅ Test checkout session successful! URL:', data.url);
          unsubscribe();
        } else if (data?.error) {
          console.error('❌ Test checkout session failed:', data.error);
          unsubscribe();
        }
      });

      setTimeout(() => {
        unsubscribe();
        console.log('⏰ Test checkout session timeout');
      }, 15000);

    } catch (error) {
      console.error('Error testing checkout session:', error);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Stripe Extension Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={checkExtensionStatus} disabled={loading}>
            {loading ? 'Checking...' : 'Refresh Status'}
          </Button>
          
          <Button onClick={testCheckoutSession} disabled={!user?.uid || products.length === 0}>
            Test Checkout Session
          </Button>

          {extensionStatus && (
            <div className="space-y-2">
              <h3 className="font-semibold">Extension Status:</h3>
              <div className="bg-gray-100 p-4 rounded text-sm">
                <p><strong>Products Count:</strong> {extensionStatus.productsCount}</p>
                <p><strong>Has Customer:</strong> {extensionStatus.hasCustomer ? 'Yes' : 'No'}</p>
                <p><strong>Configuration:</strong> {extensionStatus.configuration?.length || 0} items</p>
                
                {extensionStatus.error && (
                  <p className="text-red-600"><strong>Error:</strong> {extensionStatus.error}</p>
                )}
              </div>
            </div>
          )}

          {products.length > 0 && (
            <div>
              <h3 className="font-semibold">Products:</h3>
              <div className="bg-gray-100 p-4 rounded text-sm max-h-40 overflow-y-auto">
                <pre>{JSON.stringify(products, null, 2)}</pre>
              </div>
            </div>
          )}

          {customerData && (
            <div>
              <h3 className="font-semibold">Customer Data:</h3>
              <div className="bg-gray-100 p-4 rounded text-sm max-h-40 overflow-y-auto">
                <pre>{JSON.stringify(customerData, null, 2)}</pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};