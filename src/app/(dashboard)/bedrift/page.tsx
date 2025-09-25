
'use client';


import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import * as Icons from 'lucide-react';
import { BusinessSettings } from '@/lib/types';
import { 
  getBusinessSettings, 
  saveBusinessSettings, 
  uploadBusinessLogo,
  deleteBusinessLogo,
  initializeBusinessSettings 
} from '@/lib/services/businessService';

const INDUSTRIES = [
    "Tømrer",
    "Anlegg",
    "Rørlegger",
    "Elektriker",
    "Maler",
];

const BUSINESS_TYPES = [
  { value: 'enkeltpersonforetak', label: 'Enkeltpersonforetak' },
  { value: 'as', label: 'Aksjeselskap (AS)' },
  { value: 'asa', label: 'Allmennaksjeselskap (ASA)' },
  { value: 'da', label: 'Deltakerselskap (DA)' },
  { value: 'ans', label: 'Ansvarlig selskap (ANS)' },
  { value: 'ba', label: 'Boligbyggelag/andelslag (BA)' },
  { value: 'other', label: 'Annet' }
];

export default function BedriftPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    // Company Information
    companyName: '',
    organizationNumber: '',
    address: '',
    postalCode: '',
    city: '',
    phone: '',
    email: '',
    website: '',
    
    // Business Details
    foundedYear: new Date().getFullYear(),
    employeeCount: 1,
    industry: '',
    businessType: 'as',
    annualRevenue: 0,
    serviceAreas: [],
    specializations: [],
    
    // Branding
    primaryColor: '#1A4314',
    secondaryColor: '#A2E4B8',
    brandDescription: '',
    
    // Financial Settings
    currency: 'NOK',
    vatRate: 25,
    defaultPaymentTerms: 30,
    bankAccount: '',
    
    // Quote Settings
    quoteValidityDays: 30,
    quotePrefix: 'TIL',
    invoicePrefix: 'FAK',
    defaultQuoteNotes: '',
    
    // AI Settings
    aiEnabled: true,
    marketSegment: '',
    competitorAnalysis: '',
    pricingStrategy: 'medium'
  });

  useEffect(() => {
    loadBusinessSettings();
  }, []);

  const loadBusinessSettings = async () => {
    try {
      setLoading(true);
      let settings = await getBusinessSettings();
      
      if (!settings) {
        settings = await initializeBusinessSettings({});
      }
      
      // Ensure arrays are properly initialized
      const settingsWithDefaults = {
        ...settings,
        serviceAreas: settings.serviceAreas || [],
        specializations: settings.specializations || []
      };
      
      setBusinessSettings(settingsWithDefaults);
      
      if (settings.logoUrl) {
        setLogoPreview(settings.logoUrl);
      }
    } catch (error) {
      console.error('Failed to load business settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof BusinessSettings, value: any) => {
    setBusinessSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayInputChange = (field: 'serviceAreas' | 'specializations', value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    handleInputChange(field, items);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      // Delete from Firebase Storage if logo exists
      if (businessSettings.logoUrl) {
        await deleteBusinessLogo();
      }
      
      // Clear local state
      setLogoFile(null);
      setLogoPreview(null);
      
      // Update business settings and save
      const updatedSettings = { ...businessSettings };
      delete updatedSettings.logoUrl; // Remove the logoUrl property entirely
      
      await saveBusinessSettings(updatedSettings);
      setBusinessSettings(updatedSettings);
      
      alert('Logo fjernet!');
    } catch (error) {
      console.error('Failed to remove logo:', error);
      alert('Kunne ikke fjerne logo. Prøv igjen.');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      let logoUrl = businessSettings.logoUrl;
      
      // Upload new logo if selected
      if (logoFile) {
        // Delete old logo if exists
        if (businessSettings.logoUrl) {
          await deleteBusinessLogo();
        }
        
        logoUrl = await uploadBusinessLogo(logoFile);
      }
      
      // Prepare settings for saving, excluding undefined logoUrl
      const settingsToSave = {
        ...businessSettings,
        ...(logoUrl && { logoUrl }) // Only include logoUrl if it has a value
      };
      
      // Save business settings
      await saveBusinessSettings(settingsToSave);
      
      // Update local state
      if (logoUrl) {
        setBusinessSettings(prev => ({ ...prev, logoUrl }));
      }
      setLogoFile(null);
      
      alert('Bedriftsinnstillinger lagret!');
    } catch (error) {
      console.error('Failed to save business settings:', error);
      alert('Kunne ikke lagre innstillinger. Prøv igjen.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Min Bedrift" />
        <div className="flex items-center justify-center py-12">
          <Icons.Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Min Bedrift" />
      
      <div className="space-y-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Icons.Building2 className="h-5 w-5 text-primary" />
              <CardTitle>Bedriftsinformasjon</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bedriftsnavn *
                </label>
                <input
                  type="text"
                  value={businessSettings.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="F.eks. Nag Software AS"
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
                  placeholder="123 456 789"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selskapsform
                </label>
                <select
                  value={businessSettings.businessType}
                  onChange={(e) => handleInputChange('businessType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {BUSINESS_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
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
                  placeholder="+47 12 34 56 78"
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
                  placeholder="post@bedrift.no"
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
                  placeholder="Storgata 1"
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
                  placeholder="0001"
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
                  placeholder="Oslo"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nettside
                </label>
                <input
                  type="url"
                  value={businessSettings.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="https://bedrift.no"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Details for AI */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Icons.BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle>Bedriftsdetaljer (for AI-analyse)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Etablert år
                </label>
                <input
                  type="number"
                  value={businessSettings.foundedYear}
                  onChange={(e) => handleInputChange('foundedYear', parseInt(e.target.value) || new Date().getFullYear())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Antall ansatte *
                </label>
                <input
                  type="number"
                  value={businessSettings.employeeCount}
                  onChange={(e) => handleInputChange('employeeCount', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Årlig omsetning (NOK)
                </label>
                <input
                  type="number"
                  value={businessSettings.annualRevenue}
                  onChange={(e) => handleInputChange('annualRevenue', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  min="0"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bransje
                </label>
                <select
                  value={businessSettings.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Velg bransje</option>
                  {INDUSTRIES.map(industry => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prissetting
                </label>
                <select
                  value={businessSettings.pricingStrategy}
                  onChange={(e) => handleInputChange('pricingStrategy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="low">Lav (konkurranse på pris)</option>
                  <option value="medium">Middels (balansert)</option>
                  <option value="premium">Premium (høy kvalitet)</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serviceområder
                </label>
                <input
                  type="text"
                  value={(businessSettings.serviceAreas || []).join(', ')}
                  onChange={(e) => handleArrayInputChange('serviceAreas', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Oslo, Bergen, Trondheim"
                />
                <p className="text-xs text-gray-500 mt-1">Skill med komma</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spesialiseringer
                </label>
                <input
                  type="text"
                  value={(businessSettings.specializations || []).join(', ')}
                  onChange={(e) => handleArrayInputChange('specializations', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Webutvikling, App-utvikling, Rådgivning"
                />
                <p className="text-xs text-gray-500 mt-1">Skill med komma</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Målgruppe/Markedssegment
                </label>
                <input
                  type="text"
                  value={businessSettings.marketSegment}
                  onChange={(e) => handleInputChange('marketSegment', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="SMB, Enterprise, offentlig sektor"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Konkurranse-analyse
                </label>
                <input
                  type="text"
                  value={businessSettings.competitorAnalysis}
                  onChange={(e) => handleInputChange('competitorAnalysis', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Hovedkonkurrenter og deres fordeler"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logo and Branding */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Icons.Palette className="h-5 w-5 text-primary" />
              <CardTitle>Logo og merkevarebygging</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bedriftslogo
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  {logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="max-w-full max-h-full object-contain rounded"
                    />
                  ) : (
                    <Icons.Image className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div className="space-y-2">
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
                  {logoPreview && (
                    <button
                      onClick={handleRemoveLogo}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      <Icons.Trash2 className="h-4 w-4" />
                      Fjern logo
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Merkevare-beskrivelse
              </label>
              <textarea
                value={businessSettings.brandDescription}
                onChange={(e) => handleInputChange('brandDescription', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={3}
                placeholder="Beskriv bedriftens merkevare, verdier og unike selskapsfortrinn..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial and Document Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Icons.FileText className="h-5 w-5 text-primary" />
              <CardTitle>Økonomiske og dokumentinnstillinger</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  Betalingsfrist (dager)
                </label>
                <input
                  type="number"
                  value={businessSettings.defaultPaymentTerms}
                  onChange={(e) => handleInputChange('defaultPaymentTerms', parseInt(e.target.value) || 30)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  min="1"
                  max="365"
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tilbud prefiks
                </label>
                <input
                  type="text"
                  value={businessSettings.quotePrefix}
                  onChange={(e) => handleInputChange('quotePrefix', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="TIL"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Faktura prefiks
                </label>
                <input
                  type="text"
                  value={businessSettings.invoicePrefix}
                  onChange={(e) => handleInputChange('invoicePrefix', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="FAK"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kontonummer
                </label>
                <input
                  type="text"
                  value={businessSettings.bankAccount}
                  onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="1234.56.78901"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Standard tilbudsnotater
              </label>
              <textarea
                value={businessSettings.defaultQuoteNotes}
                onChange={(e) => handleInputChange('defaultQuoteNotes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={3}
                placeholder="Standardtekst som vises på alle tilbud..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Icons.Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Icons.Save className="h-4 w-4" />
            )}
            {saving ? 'Lagrer...' : 'Lagre endringer'}
          </button>
        </div>
      </div>
    </>
  );
}