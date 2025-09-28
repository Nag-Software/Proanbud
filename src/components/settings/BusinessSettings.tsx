'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import * as Icons from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { storage, db } from '@/lib/firebase';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, set } from 'firebase/database';

export const BusinessSettings = () => {
  const [businessSettings, setBusinessSettings] = useState({
    companyName: 'Nag Software AS',
    organizationNumber: '123 456 789',
    address: 'Storgata 1',
    postalCode: '0001',
    city: 'Oslo',
    phone: '+47 22 00 00 00',
    email: 'post@nagsoftware.no',
    website: 'https://nagsoftware.no',
    logo: null as File | null,
    primaryColor: '#1A4314',
    secondaryColor: '#A2E4B8',
    currency: 'NOK',
    vatRate: 25,
    invoiceTemplate: 'standard',
    quoteValidityDays: 30
  });

  const handleInputChange = (field: string, value: string | number | File | null) => {
    setBusinessSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    handleInputChange('logo', file);
  };

  const handleSave = () => {
    // Save other business settings here (not implemented)
    console.log('Saving business settings (local):', businessSettings);

    // If a logo file is selected, upload it to Firebase Storage and save URL to Realtime DB
    if (businessSettings.logo && user?.uid) {
      uploadLogoAndSaveUrl(businessSettings.logo, user.uid);
    }
  };

  const { user } = useAuth();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  React.useEffect(() => {
    if (!businessSettings.logo) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(businessSettings.logo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [businessSettings.logo]);

  const uploadLogoAndSaveUrl = async (file: File, uid: string) => {
    try {
      const path = `users/${uid}/business/logo_${Date.now()}_${file.name}`;
      const sRef = storageRef(storage, path);
      const uploadTask = uploadBytesResumable(sRef, file);

      uploadTask.on('state_changed', (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(Math.round(progress));
      });

      await uploadTask;
      const downloadUrl = await getDownloadURL(sRef);

      // Save URL under UID/businessSettings in Realtime Database
      await set(dbRef(db, `${uid}/businessSettings`), {
        imageUrl: downloadUrl,
        updatedAt: Date.now()
      });

      setUploadProgress(null);
      // Optionally update local state to reflect saved URL
      console.log('Logo uploaded and URL saved:', downloadUrl);
    } catch (err) {
      console.error('Failed to upload logo and save URL:', err);
      setUploadProgress(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icons.Building2 className="h-5 w-5 text-primary" />
          <CardTitle>Bedriftsinnstillinger</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Company Information */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Bedriftsinformasjon</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bedriftsnavn
              </label>
              <input
                type="text"
                value={businessSettings.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organisasjonsnummer
              </label>
              <input
                type="text"
                value={businessSettings.organizationNumber}
                onChange={(e) => handleInputChange('organizationNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefon
              </label>
              <input
                type="tel"
                value={businessSettings.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse
              </label>
              <input
                type="text"
                value={businessSettings.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postnummer
              </label>
              <input
                type="text"
                value={businessSettings.postalCode}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poststed
              </label>
              <input
                type="text"
                value={businessSettings.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-post
              </label>
              <input
                type="email"
                value={businessSettings.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nettside
              </label>
              <input
                type="url"
                value={businessSettings.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Merkevarebygging</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo
              </label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  {businessSettings.logo ? (
                    <span className="text-xs text-gray-600">Logo</span>
                  ) : (
                    <Icons.Image className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Icons.Upload className="h-4 w-4" />
                    Last opp logo
                  </label>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primærfarge
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={businessSettings.primaryColor}
                  onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={businessSettings.primaryColor}
                  onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sekundærfarge
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={businessSettings.secondaryColor}
                  onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={businessSettings.secondaryColor}
                  onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Business Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Forretningsinnstillinger</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valuta
              </label>
              <select
                value={businessSettings.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="NOK">NOK (Norske kroner)</option>
                <option value="SEK">SEK (Svenska kronor)</option>
                <option value="DKK">DKK (Danske kroner)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="USD">USD (US Dollar)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MVA-sats (%)
              </label>
              <input
                type="number"
                value={businessSettings.vatRate}
                onChange={(e) => handleInputChange('vatRate', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tilbud gyldig (dager)
              </label>
              <input
                type="number"
                value={businessSettings.quoteValidityDays}
                onChange={(e) => handleInputChange('quoteValidityDays', parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                min="1"
                max="365"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Icons.Save className="h-4 w-4" />
            Lagre endringer
          </button>
        </div>
      </CardContent>
    </Card>
  );
};