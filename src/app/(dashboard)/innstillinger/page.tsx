"use client";
import { toast } from "@/hooks/use-toast";

import { PageHeader } from "@/components/shared/PageHeader";
import { UserSettings, SubscriptionSettings } from "@/components/settings";
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getUserSettings, UserSettingsData } from '@/lib/services/userSettingsService';
import { getBusinessSettings } from '@/lib/services/businessService';
import { BusinessSettings } from '@/lib/types';
import { ref, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { getAuth } from 'firebase/auth';
import { useSubscription } from '@/contexts/SubscriptionContextNew';



export default function SettingsPage() {
    const { user } = useAuth();
    const { refetch } = useSubscription();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [userSettings, setUserSettings] = useState<UserSettingsData | null>(null);
    const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [verifyingPayment, setVerifyingPayment] = useState(false);

    // Handle Stripe checkout success
    useEffect(() => {
        const handleCheckoutSuccess = async () => {
            const success = searchParams.get('success');
            const sessionId = searchParams.get('session_id');

            if (success === 'true' && sessionId && user?.uid) {
                setVerifyingPayment(true);
                console.log('🔍 Verifying payment for session:', sessionId);

                try {
                    const auth = getAuth();
                    const idToken = await auth.currentUser?.getIdToken();

                    if (!idToken) {
                        throw new Error('No authentication token');
                    }

                    const response = await fetch('/api/stripe/verify-session', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${idToken}`
                        },
                        body: JSON.stringify({ sessionId })
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        toast({
                            title: 'Betalingsverifisering feilet',
                            description: error.error || 'Kunne ikke verifisere betaling.',
                            variant: 'destructive',
                        });
                        throw new Error(error.error || 'Failed to verify payment');
                    }

                    const result = await response.json();
                    console.log('✅ Payment verified:', result);

                    // Refresh subscription data
                    await refetch();
                    // Clean up URL parameters
                    router.replace('/innstillinger', { scroll: false });

                    // Show success message (you could add a toast here)
                    console.log('🎉 Subscription activated:', result.subscription.plan);

                } catch (error) {
                    console.error('❌ Failed to verify payment:', error);
                    // You could show an error toast here
                } finally {
                    setVerifyingPayment(false);
                }
            }
        };

        if (user?.uid) {
            handleCheckoutSuccess();
        }
    }, [searchParams, user?.uid, refetch, router]);

    useEffect(() => {
        if (!user?.uid) return;

        // Set up real-time listener for user settings from database
        const userSettingsRef = ref(db, `users/${user.uid}/userSettings`);
        const userUnsubscribe = onValue(userSettingsRef, (snapshot) => {
            if (snapshot.exists()) {
                const dbSettings = snapshot.val();
                // Use database settings as the source of truth
                // But always override email with Auth email (source of truth for email)
                setUserSettings({
                    ...dbSettings,
                    email: user.email || ''
                } as UserSettingsData);
            } else {
                // No DB settings, initialize with Auth data
                const initialSettings: UserSettingsData = {
                    name: user.displayName || '',
                    email: user.email || '',
                    telefon: user.phoneNumber || '',
                    notifications: true,
                    emailNotifications: true,
                    language: 'no',
                    timezone: 'Europe/Oslo'
                };
                setUserSettings(initialSettings);
                // Save initial settings to database
                const { saveUserSettings } = require('@/lib/services/userSettingsService');
                saveUserSettings(initialSettings, user.uid).catch(console.error);
            }
        });

        // Set up real-time listeners for business settings
        const businessSettingsRef = ref(db, `users/${user.uid}/businessSettings`);
        const businessUnsubscribe = onValue(businessSettingsRef, (snapshot) => {
            if (snapshot.exists()) {
                setBusinessSettings(snapshot.val() as BusinessSettings);
            } else {
                setBusinessSettings(null);
            }
        });

        // Initial load for business settings
        const loadBusinessData = async () => {
            try {
                const businessData = await getBusinessSettings();
                setBusinessSettings(businessData);
            } catch (error) {
                console.error('Failed to load business settings:', error);
            } finally {
                setLoading(false);
            }
        };

        loadBusinessData();

        // Cleanup listeners on unmount
        return () => {
            off(userSettingsRef, 'value', userUnsubscribe);
            off(businessSettingsRef, 'value', businessUnsubscribe);
        };
    }, [user]);

    if (loading || verifyingPayment) {
        return (
            <div className="space-y-6">
                <PageHeader title="Innstillinger" />
                <div className="space-y-8">
                    {verifyingPayment && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                <p className="text-blue-800 font-medium">Verifiserer betaling...</p>
                            </div>
                        </div>
                    )}
                    <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
                    <div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader title="Innstillinger" />
            
            <div className="flex flex-col 2xl:flex-row gap-4">
                {/* User Settings */}
                <UserSettings userSettings={userSettings} />
                
                {/* Subscription Settings */}
                <SubscriptionSettings businessSettings={businessSettings} />
            </div>
        </div>
    );
}