'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import * as Icons from 'lucide-react';

export const SubscriptionSettings = () => {
  const [aiSettings, setAiSettings] = useState({
    enabled: true,
    autoQuoteGeneration: false,
    smartPricing: true,
    customerInsights: true,
    analysisLevel: 'standard',
    autoFollowUp: false,
    suggestOptimizations: true,
    dataPrivacy: 'strict',
    aiProvider: 'openai',
    customPrompts: {
      quoteGeneration: 'Generer et profesjonelt tilbud basert på følgende informasjon...',
      customerAnalysis: 'Analyser kundens behov og foreslå relevante løsninger...',
      followUp: 'Skriv en høflig oppfølgings-e-post til kunden...'
    }
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setAiSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePromptChange = (promptType: string, value: string) => {
    setAiSettings(prev => ({
      ...prev,
      customPrompts: {
        ...prev.customPrompts,
        [promptType]: value
      }
    }));
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Saving AI settings:', aiSettings);
  };

  const resetToDefaults = () => {
    setAiSettings({
      enabled: true,
      autoQuoteGeneration: false,
      smartPricing: true,
      customerInsights: true,
      analysisLevel: 'standard',
      autoFollowUp: false,
      suggestOptimizations: true,
      dataPrivacy: 'strict',
      aiProvider: 'openai',
      customPrompts: {
        quoteGeneration: 'Generer et profesjonelt tilbud basert på følgende informasjon...',
        customerAnalysis: 'Analyser kundens behov og foreslå relevante løsninger...',
        followUp: 'Skriv en høflig oppfølgings-e-post til kunden...'
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icons.Brain className="h-5 w-5 text-primary" />
          <CardTitle>AI-innstillinger</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Status */}
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${aiSettings.enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div>
              <p className="font-medium text-gray-900">AI-assistanse</p>
              <p className="text-sm text-gray-600">
                {aiSettings.enabled ? 'Aktivert og klar til bruk' : 'Deaktivert'}
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={aiSettings.enabled}
              onChange={(e) => handleInputChange('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {/* AI Features */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">AI-funksjoner</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Automatisk tilbudsgenerering</p>
                <p className="text-sm text-gray-600">La AI generere tilbud basert på kundeinfo</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiSettings.autoQuoteGeneration}
                  onChange={(e) => handleInputChange('autoQuoteGeneration', e.target.checked)}
                  disabled={!aiSettings.enabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Smart prissetting</p>
                <p className="text-sm text-gray-600">AI foreslår optimale priser basert på historikk</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiSettings.smartPricing}
                  onChange={(e) => handleInputChange('smartPricing', e.target.checked)}
                  disabled={!aiSettings.enabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Kundeinnsikt</p>
                <p className="text-sm text-gray-600">Analyser kundemønstre og preferanser</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiSettings.customerInsights}
                  onChange={(e) => handleInputChange('customerInsights', e.target.checked)}
                  disabled={!aiSettings.enabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Automatisk oppfølging</p>
                <p className="text-sm text-gray-600">Send AI-genererte oppfølgings-e-poster</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiSettings.autoFollowUp}
                  onChange={(e) => handleInputChange('autoFollowUp', e.target.checked)}
                  disabled={!aiSettings.enabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Optimaliseringsforslag</p>
                <p className="text-sm text-gray-600">Få forslag til forbedringer av prosesser</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiSettings.suggestOptimizations}
                  onChange={(e) => handleInputChange('suggestOptimizations', e.target.checked)}
                  disabled={!aiSettings.enabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50"></div>
              </label>
            </div>
          </div>
        </div>

        {/* AI Configuration */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">AI-konfigurasjon</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Analysenivå
              </label>
              <select
                value={aiSettings.analysisLevel}
                onChange={(e) => handleInputChange('analysisLevel', e.target.value)}
                disabled={!aiSettings.enabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
              >
                <option value="basic">Grunnleggende</option>
                <option value="standard">Standard</option>
                <option value="advanced">Avansert</option>
                <option value="expert">Ekspert</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Personvern
              </label>
              <select
                value={aiSettings.dataPrivacy}
                onChange={(e) => handleInputChange('dataPrivacy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="strict">Strikt (GDPR-kompatibel)</option>
                <option value="balanced">Balansert</option>
                <option value="permissive">Tillatendeå</option>
              </select>
            </div>
          </div>
        </div>

        {/* Custom Prompts */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Tilpassede AI-instruksjoner</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tilbudsgenerering
              </label>
              <textarea
                value={aiSettings.customPrompts.quoteGeneration}
                onChange={(e) => handlePromptChange('quoteGeneration', e.target.value)}
                disabled={!aiSettings.enabled}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                placeholder="Skriv instruksjoner for hvordan AI skal generere tilbud..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kundeanalyse
              </label>
              <textarea
                value={aiSettings.customPrompts.customerAnalysis}
                onChange={(e) => handlePromptChange('customerAnalysis', e.target.value)}
                disabled={!aiSettings.enabled}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                placeholder="Skriv instruksjoner for kundeanalyse..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Oppfølging
              </label>
              <textarea
                value={aiSettings.customPrompts.followUp}
                onChange={(e) => handlePromptChange('followUp', e.target.value)}
                disabled={!aiSettings.enabled}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                placeholder="Skriv instruksjoner for oppfølgings-e-poster..."
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t border-gray-200">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Icons.RotateCcw className="h-4 w-4" />
            Tilbakestill
          </button>
          
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Icons.Save className="h-4 w-4" />
            Lagre
          </button>
        </div>
      </CardContent>
    </Card>
  );
};