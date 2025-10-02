'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import * as Icons from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { storage, db } from '@/lib/firebase';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, set } from 'firebase/database';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

  const handleSave = async () => {
    if (!user?.uid) {
      console.error('Cannot save: User not authenticated');
      setShowAuthDialog(true);
      return;
    }

    setSaving(true);
    try {
      // Save business settings to Firebase Realtime Database
      const settingsToSave = {
        companyName: businessSettings.companyName || '',
        organizationNumber: businessSettings.organizationNumber || '',
        address: businessSettings.address || '',
        postalCode: businessSettings.postalCode || '',
        city: businessSettings.city || '',
        phone: businessSettings.phone || '',
        email: businessSettings.email || '',
        website: businessSettings.website || '',
        primaryColor: businessSettings.primaryColor || '#1A4314',
        secondaryColor: businessSettings.secondaryColor || '#A2E4B8',
        currency: businessSettings.currency || 'NOK',
        vatRate: businessSettings.vatRate || 25,
        invoiceTemplate: businessSettings.invoiceTemplate || 'standard',
        quoteValidityDays: businessSettings.quoteValidityDays || 30,
        updatedAt: Date.now()
      };

      await set(dbRef(db, `users/${user.uid}/businessSettings`), settingsToSave);
      console.log('Business settings saved successfully');

      // If a logo file is selected, upload it to Firebase Storage
      if (businessSettings.logo) {
        await uploadLogoAndSaveUrl(businessSettings.logo, user.uid);
      }

      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Failed to save business settings:', error);
      setErrorMessage(error instanceof Error ? error.message : 'En ukjent feil oppstod');
      setShowErrorDialog(true);
    } finally {
      setSaving(false);
    }
  };

  const { user } = useAuth();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Dialog states
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

      // Update the logoUrl in businessSettings
      await set(dbRef(db, `users/${uid}/businessSettings/logoUrl`), downloadUrl);

      setUploadProgress(null);
      console.log('Logo uploaded and URL saved:', downloadUrl);
    } catch (err) {
      console.error('Failed to upload logo and save URL:', err);
      setUploadProgress(null);
      throw err; // Re-throw to be caught by handleSave
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
                <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Logo preview" className="w-full h-full object-cover" />
                  ) : (
                    <Icons.Image className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
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
                  {businessSettings.logo && (
                    <span className="text-xs text-gray-500">
                      {businessSettings.logo.name}
                    </span>
                  )}
                  {uploadProgress !== null && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
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
            type="button"
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

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Icons.Check className="h-6 w-6 text-green-600" />
              </div>
              <DialogTitle>Bedriftsinnstillinger lagret!</DialogTitle>
            </div>
            <DialogDescription>
              Bedriftsinnstillingene dine er lagret og vil bli brukt i tilbud og fakturaer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setShowSuccessDialog(false)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              OK
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <Icons.AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <DialogTitle>Kunne ikke lagre</DialogTitle>
            </div>
            <DialogDescription>
              Det oppstod en feil under lagring av bedriftsinnstillingene: {errorMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setShowErrorDialog(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Lukk
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auth Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Icons.Lock className="h-6 w-6 text-yellow-600" />
              </div>
              <DialogTitle>Ikke innlogget</DialogTitle>
            </div>
            <DialogDescription>
              Du må være logget inn for å lagre bedriftsinnstillinger. Vennligst logg inn og prøv igjen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setShowAuthDialog(false)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              OK
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};