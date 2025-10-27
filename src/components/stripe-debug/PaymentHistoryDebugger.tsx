'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { ref, get, query, orderByChild, limitToLast } from 'firebase/database';

interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  description?: string;
  customer_id?: string;
  subscription_id?: string;
  invoice_id?: string;
  payment_method?: string;
}

export const PaymentHistoryDebugger: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('payments');

  const fetchPaymentData = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);

      // Try to fetch payments from various possible locations
      const paymentLocations = [
        `stripe_customers/${user.uid}/payments`,
        `stripe_customers/${user.uid}/charges`,
        `payments/${user.uid}`,
        `charges/${user.uid}`
      ];

      const invoiceLocations = [
        `stripe_customers/${user.uid}/invoices`,
        `invoices/${user.uid}`,
        `users/${user.uid}/invoices`
      ];

      const allPayments: PaymentRecord[] = [];
      const allInvoices: any[] = [];

      // Fetch payments
      for (const location of paymentLocations) {
        try {
          const paymentsRef = ref(db, location);
          const paymentsQuery = query(paymentsRef, orderByChild('created'), limitToLast(50));
          const snapshot = await get(paymentsQuery);
          
          if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).forEach(key => {
              const payment = data[key];
              allPayments.push({
                id: key,
                amount: payment.amount || payment.amount_received || 0,
                currency: payment.currency || 'nok',
                status: payment.status || 'unknown',
                created: payment.created || Date.now() / 1000,
                description: payment.description,
                customer_id: payment.customer,
                subscription_id: payment.subscription,
                invoice_id: payment.invoice,
                payment_method: payment.payment_method
              });
            });
          }
        } catch (error) {
          console.log(`No payments found at ${location}`);
        }
      }

      // Fetch invoices
      for (const location of invoiceLocations) {
        try {
          const invoicesRef = ref(db, location);
          const invoicesQuery = query(invoicesRef, orderByChild('created'), limitToLast(50));
          const snapshot = await get(invoicesQuery);
          
          if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).forEach(key => {
              const invoice = data[key];
              allInvoices.push({
                id: key,
                ...invoice
              });
            });
          }
        } catch (error) {
          console.log(`No invoices found at ${location}`);
        }
      }

      // Sort by creation time (newest first)
      allPayments.sort((a, b) => b.created - a.created);
      allInvoices.sort((a, b) => (b.created || 0) - (a.created || 0));

      setPayments(allPayments);
      setInvoices(allInvoices);

    } catch (error) {
      console.error('Error fetching payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentData();
  }, [user?.uid]);

  const formatAmount = (amount: number, currency: string = 'nok') => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2
    }).format(amount / 100); // Stripe amounts are in cents
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'succeeded':
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed':
      case 'canceled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'requires_action':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const createTestPayment = async (amount: number, status: 'succeeded' | 'failed') => {
    try {
      const response = await fetch('/api/debug/create-test-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.uid,
          amount: amount * 100, // Convert to cents
          currency: 'nok',
          status: status
        })
      });
      
      if (response.ok) {
        alert(`Created test payment: ${formatAmount(amount * 100, 'nok')} - ${status}`);
        fetchPaymentData();
      } else {
        alert('Failed to create test payment');
      }
    } catch (error) {
      console.error('Error creating test payment:', error);
      alert('Error creating test payment');
    }
  };

  const calculateStats = () => {
    const stats = {
      totalPayments: payments.length,
      successfulPayments: payments.filter(p => p.status === 'succeeded').length,
      failedPayments: payments.filter(p => p.status === 'failed').length,
      totalAmount: payments
        .filter(p => p.status === 'succeeded')
        .reduce((sum, p) => sum + p.amount, 0),
      averageAmount: 0,
      recentPayments: payments.filter(p => 
        p.created > (Date.now() / 1000) - (30 * 24 * 60 * 60) // Last 30 days
      ).length
    };

    stats.averageAmount = stats.successfulPayments > 0 ? stats.totalAmount / stats.successfulPayments : 0;

    return stats;
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Payment History</h2>
        <div className="flex space-x-2">
          <button
            onClick={fetchPaymentData}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">{stats.totalPayments}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Payments</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{stats.successfulPayments}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Successful</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="text-2xl font-bold text-red-600">{stats.failedPayments}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="text-2xl font-bold text-purple-600">
            {formatAmount(stats.totalAmount, 'nok')}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</div>
        </div>
      </div>

      {/* Test Payment Tools */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-medium mb-3">Test Payment Tools</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => createTestPayment(299, 'succeeded')}
            className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-sm"
          >
            Create Successful Payment (299 NOK)
          </button>
          <button
            onClick={() => createTestPayment(799, 'succeeded')}
            className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-sm"
          >
            Create Successful Payment (799 NOK)
          </button>
          <button
            onClick={() => createTestPayment(299, 'failed')}
            className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 text-sm"
          >
            Create Failed Payment (299 NOK)
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'payments'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Payments ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'invoices'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Invoices ({invoices.length})
          </button>
        </nav>
      </div>

      {/* Payments List */}
      {activeTab === 'payments' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium">Payment Records</h3>
          </div>
          <div className="overflow-x-auto">
            {payments.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 text-sm">
                        {formatDate(payment.created)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {formatAmount(payment.amount, payment.currency)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {payment.description || 'No description'}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-500">
                        {payment.id.substring(0, 12)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-500">
                {loading ? 'Loading payments...' : 'No payment records found'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invoices List */}
      {activeTab === 'invoices' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium">Invoice Records</h3>
          </div>
          <div className="p-4">
            {invoices.length > 0 ? (
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="border dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">Invoice {invoice.number || invoice.id}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {invoice.created ? formatDate(invoice.created) : 'Unknown date'}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status || 'unknown')}`}>
                        {invoice.status || 'unknown'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <p><strong>Amount:</strong> {formatAmount(invoice.amount_paid || invoice.total || 0, invoice.currency || 'nok')}</p>
                      {invoice.subscription && (
                        <p><strong>Subscription:</strong> {invoice.subscription}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">
                {loading ? 'Loading invoices...' : 'No invoice records found'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};