"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { UserSettings, SubscriptionSettings } from "@/components/settings";
import { useState, useEffect } from 'react';
import { getUserSettings, UserSettingsData } from '@/lib/services/userSettingsService';
import { getBusinessSettings } from '@/lib/services/businessService';
import { BusinessSettings } from '@/lib/types';
import { ref, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';



export default function SettingsPage() {
    const { user } = useAuth();
    const [userSettings, setUserSettings] = useState<UserSettingsData | null>(null);
    const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid) return;

        // Set up real-time listener for user settings from database
        const userSettingsRef = ref(db, `users/${user.uid}/userSettings`);
        const userUnsubscribe = onValue(userSettingsRef, (snapshot) => {
            if (snapshot.exists()) {
                const dbSettings = snapshot.val();
                // Use database settings as the source of truth
                setUserSettings(dbSettings as UserSettingsData);
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
                saveUserSettings(initialSettings).catch(console.error);
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

    if (loading) {
        return (
            <div className="space-y-6">
                <PageHeader title="Innstillinger" />
                <div className="space-y-8">
                    <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
                    <div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader title="Innstillinger" />
            
            <div className="space-y-8">
                {/* User Settings */}
                <UserSettings userSettings={userSettings} />
                
                {/* Subscription Settings */}
                <SubscriptionSettings businessSettings={businessSettings} />
            </div>
        </div>
    );
}