'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { saveUserSettings, UserSettingsData } from '@/lib/services/userSettingsService';
import * as Icons from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const UserSettings = ({ userSettings: initialUserSettings }: { userSettings: UserSettingsData | null}) => {
  const { user } = useAuth();
  const [userSettings, setUserSettings] = useState<UserSettingsData>({
    name: '',
    email: '',
    telefon: '',
    notifications: true,
    emailNotifications: true,
    language: 'no',
    timezone: 'Europe/Oslo'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialUserSettings) {
      setUserSettings(initialUserSettings);
      setLoading(false);
    } else {
      // If no settings provided, try to load defaults or keep current state
      setLoading(false);
    }
  }, [initialUserSettings]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setUserSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Save all user settings to the realtime database
      // This includes auth information (name, email, telefon) plus additional preferences
      const allSettingsData = {
        name: userSettings.name,
        email: userSettings.email,
        telefon: userSettings.telefon,
        notifications: userSettings.notifications,
        emailNotifications: userSettings.emailNotifications,
        language: userSettings.language,
        timezone: userSettings.timezone
      };

      await saveUserSettings(allSettingsData);

      console.log('All user settings saved to database successfully');
    } catch (error) {
      console.error('Failed to save user settings:', error);
      // Show error message (you could add a toast notification here)
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icons.User className="h-5 w-5 text-primary" />
            <CardTitle>Brukerinnstillinger</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-gray-200 animate-pulse rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icons.User className="h-5 w-5 text-primary" />
          <CardTitle>Brukerinnstillinger</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Personlig informasjon</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Navn
              </label>
              <input
                type="text"
                value={userSettings.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-post
              </label>
              <input
                type="email"
                value={userSettings.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefon
              </label>
              <input
                type="tel"
                value={userSettings.telefon}
                onChange={(e) => handleInputChange('telefon', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Språk
              </label>
              <select
                value={userSettings.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="no">Norsk</option>
                <option value="en">English</option>
                <option value="da">Dansk</option>
                <option value="sv">Svenska</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tidssone
              </label>
              <select
                value={userSettings.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="Europe/Oslo">Europe/Oslo (CET/CEST)</option>
                <option value="Europe/Stockholm">Europe/Stockholm (CET/CEST)</option>
                <option value="Europe/Copenhagen">Europe/Copenhagen (CET/CEST)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        </div>


        {/* Notifications */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Varsler</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icons.Bell className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">Push-varsler</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={userSettings.notifications}
                  onChange={(e) => handleInputChange('notifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icons.Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">E-post varsler</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={userSettings.emailNotifications}
                  onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Icons.Loader2 className="h-4 w-4 animate-spin" />
                Lagrer...
              </>
            ) : (
              <>
                <Icons.Save className="h-4 w-4" />
                Lagre endringer
              </>
            )}
          </button>
        </div>
      </CardContent>
    </Card>
  );
};