'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { ref, get, query, orderByChild, limitToLast } from 'firebase/database';

interface WebhookEvent {
  id: string;
  type: string;
  created: number;
  data: any;
  processed?: boolean;
  error?: string;
}

export const WebhookDebugger: React.FC = () => {
  const { user } = useAuth();
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);
  const [filter, setFilter] = useState('all');

  const fetchWebhookEvents = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      
      // Try to get webhook events from different possible locations
      const locations = [
        `stripe_webhook_events`,
        `stripe_customers/${user.uid}/webhook_events`,
        `webhook_events`,
        `users/${user.uid}/webhook_events`
      ];

      const events: WebhookEvent[] = [];

      for (const location of locations) {
        try {
          const webhookRef = ref(db, location);
          const webhookQuery = query(webhookRef, orderByChild('created'), limitToLast(50));
          const snapshot = await get(webhookQuery);
          
          if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).forEach(key => {
              const event = data[key];
              events.push({
                id: key,
                type: event.type || 'unknown',
                created: event.created || Date.now() / 1000,
                data: event.data || event,
                processed: event.processed,
                error: event.error
              });
            });
          }
        } catch (error) {
          console.log(`No webhook events found at ${location}:`, error);
        }
      }

      // Sort by creation time (newest first)
      events.sort((a, b) => b.created - a.created);
      setWebhookEvents(events);

    } catch (error) {
      console.error('Error fetching webhook events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhookEvents();
  }, [user?.uid]);

  const filteredEvents = webhookEvents.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'subscription') return event.type.includes('customer.subscription');
    if (filter === 'payment') return event.type.includes('payment') || event.type.includes('invoice');
    if (filter === 'customer') return event.type.includes('customer');
    if (filter === 'error') return event.error;
    return true;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getEventTypeColor = (type: string) => {
    if (type.includes('succeeded')) return 'text-green-600';
    if (type.includes('failed')) return 'text-red-600';
    if (type.includes('created')) return 'text-blue-600';
    if (type.includes('updated')) return 'text-yellow-600';
    if (type.includes('deleted')) return 'text-gray-600';
    return 'text-gray-800';
  };

  const simulateWebhookEvent = async (eventType: string) => {
    try {
      const response = await fetch('/api/debug/simulate-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: eventType,
          userId: user?.uid
        })
      });
      
      if (response.ok) {
        alert(`Simulated ${eventType} webhook event`);
        fetchWebhookEvents();
      } else {
        alert('Failed to simulate webhook event');
      }
    } catch (error) {
      console.error('Error simulating webhook:', error);
      alert('Error simulating webhook event');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Webhook Events</h2>
        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="all">All Events</option>
            <option value="subscription">Subscription</option>
            <option value="payment">Payment</option>
            <option value="customer">Customer</option>
            <option value="error">Errors Only</option>
          </select>
          <button
            onClick={fetchWebhookEvents}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Webhook Event Simulator */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-medium mb-3">Webhook Event Simulator</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            'customer.subscription.created',
            'customer.subscription.updated',
            'customer.subscription.deleted',
            'invoice.payment_succeeded',
            'invoice.payment_failed',
            'customer.created',
            'customer.updated',
            'payment_method.attached'
          ].map((eventType) => (
            <button
              key={eventType}
              onClick={() => simulateWebhookEvent(eventType)}
              className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700 transition-colors"
            >
              {eventType}
            </button>
          ))}
        </div>
      </div>

      {/* Events List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium">Recent Events ({filteredEvents.length})</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    selectedEvent?.id === event.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`font-medium text-sm ${getEventTypeColor(event.type)}`}>
                        {event.type}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(event.created)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      {event.processed !== undefined && (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          event.processed 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {event.processed ? 'Processed' : 'Pending'}
                        </span>
                      )}
                      {event.error && (
                        <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          Error
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                {loading ? 'Loading events...' : 'No webhook events found'}
              </div>
            )}
          </div>
        </div>

        {/* Event Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium">Event Details</h3>
          </div>
          <div className="p-4">
            {selectedEvent ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Event Type
                  </label>
                  <p className={`font-medium ${getEventTypeColor(selectedEvent.type)}`}>
                    {selectedEvent.type}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Created
                  </label>
                  <p className="text-sm">{formatDate(selectedEvent.created)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Event ID
                  </label>
                  <p className="text-sm font-mono">{selectedEvent.id}</p>
                </div>

                {selectedEvent.error && (
                  <div>
                    <label className="block text-sm font-medium text-red-700 dark:text-red-400 mb-1">
                      Error
                    </label>
                    <p className="text-sm text-red-600 dark:text-red-400">{selectedEvent.error}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Event Data
                  </label>
                  <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto max-h-64">
                    <pre className="text-xs">
                      {JSON.stringify(selectedEvent.data, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center">Select an event to view details</p>
            )}
          </div>
        </div>
      </div>

      {/* Webhook Status */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-medium mb-3">Webhook Configuration Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {filteredEvents.filter(e => e.type.includes('succeeded')).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Successful Events</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {filteredEvents.filter(e => e.type.includes('failed') || e.error).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Failed Events</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {filteredEvents.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Events</div>
          </div>
        </div>
      </div>
    </div>
  );
};