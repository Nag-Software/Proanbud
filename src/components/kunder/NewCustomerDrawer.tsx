'use client';

import React, { useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin,
  X,
  Check
} from 'lucide-react';
import { createCustomer, CustomerFormData } from '@/lib/services/customerService';

interface NewCustomerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerCreated?: () => void;
}

interface LocalCustomerFormData {
  navn: string;
  epost: string;
  telefon: string;
  adresse: string;
  postnummer: string;
  poststed: string;
  notater: string;
}

export const NewCustomerDrawer: React.FC<NewCustomerDrawerProps> = ({ 
  open, 
  onOpenChange, 
  onCustomerCreated 
}) => {
  const [formData, setFormData] = useState<LocalCustomerFormData>({
    navn: '',
    epost: '',
    telefon: '',
    adresse: '',
    postnummer: '',
    poststed: '',
    notater: '',
  });
  const [errors, setErrors] = useState<Partial<LocalCustomerFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setFormData({
      navn: '',
      epost: '',
      telefon: '',
      adresse: '',
      postnummer: '',
      poststed: '',
      notater: '',
    });
    setErrors({});
    setIsSubmitting(false);
    onOpenChange(false);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LocalCustomerFormData> = {};

    if (!formData.navn.trim()) {
      newErrors.navn = 'Navn er påkrevd';
    }

    if (!formData.epost.trim()) {
      newErrors.epost = 'E-post er påkrevd';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.epost)) {
      newErrors.epost = 'Ugyldig e-postadresse';
    }

    if (!formData.telefon.trim()) {
      newErrors.telefon = 'Telefon er påkrevd';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert form data to match service interface
      const customerData: CustomerFormData = {
        navn: formData.navn,
        epost: formData.epost,
        telefon: formData.telefon,
        adresse: formData.adresse || undefined,
        postnummer: formData.postnummer || undefined,
        poststed: formData.poststed || undefined,
        notater: formData.notater || undefined,
      };

      await createCustomer(customerData);
      onCustomerCreated?.();
      handleClose();
    } catch (error) {
      console.error('Error creating customer:', error);
      // TODO: Show error toast or notification
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof LocalCustomerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="mx-auto w-full max-w-2xl">
          <DrawerHeader className="text-center pb-4">
            <DrawerTitle className="flex items-center justify-center gap-2 text-xl">
              <User className="h-6 w-6" />
              Ny kunde
            </DrawerTitle>
            <DrawerDescription>
              Fyll ut informasjonen nedenfor for å legge til en ny kunde
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-4 max-h-[calc(90vh-200px)] overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Kundeinformasjon</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Navn */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Navn *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.navn}
                        onChange={(e) => handleInputChange('navn', e.target.value)}
                        placeholder="Fornavn Etternavn / Bedriftsnavn"
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                          errors.navn ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.navn && (
                      <p className="text-red-500 text-sm mt-1">{errors.navn}</p>
                    )}
                  </div>

                  {/* E-post */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-post *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        value={formData.epost}
                        onChange={(e) => handleInputChange('epost', e.target.value)}
                        placeholder="kunde@eksempel.no"
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                          errors.epost ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.epost && (
                      <p className="text-red-500 text-sm mt-1">{errors.epost}</p>
                    )}
                  </div>

                  {/* Telefon */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefon *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.telefon}
                        onChange={(e) => handleInputChange('telefon', e.target.value)}
                        placeholder="123 45 678"
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                          errors.telefon ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.telefon && (
                      <p className="text-red-500 text-sm mt-1">{errors.telefon}</p>
                    )}
                  </div>

                  {/* Adresse */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adresse
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.adresse}
                        onChange={(e) => handleInputChange('adresse', e.target.value)}
                        placeholder="Gateadresse"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Postnummer og poststed */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Postnummer
                      </label>
                      <input
                        type="text"
                        value={formData.postnummer}
                        onChange={(e) => handleInputChange('postnummer', e.target.value)}
                        placeholder="0000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Poststed
                      </label>
                      <input
                        type="text"
                        value={formData.poststed}
                        onChange={(e) => handleInputChange('poststed', e.target.value)}
                        placeholder="By/sted"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Notater */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notater
                    </label>
                    <textarea
                      value={formData.notater}
                      onChange={(e) => handleInputChange('notater', e.target.value)}
                      placeholder="Eventuelle notater om kunden..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                      rows={3}
                    />
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <DrawerFooter className="flex-row gap-2 pt-4">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1">
                <X className="w-4 h-4 mr-2" />
                Avbryt
              </Button>
            </DrawerClose>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Lagrer...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Legg til kunde
                </>
              )}
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};