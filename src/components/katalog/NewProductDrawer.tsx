'use client';

import React, { useState, useEffect } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { X, Check, Package } from 'lucide-react';
import { 
  createProduct,
  getCategories,
  getSubcategoriesByCategory 
} from '@/lib/services/catalogService';
import { Category, Subcategory, ProductFormData } from '@/lib/types';
import { ErrorDialog } from '@/components/shared/ErrorDialog';

interface NewProductDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const NewProductDrawer: React.FC<NewProductDrawerProps> = ({ 
  open, 
  onClose, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    produktnavn: '',
    produsent: '',
    enhet: 'stk',
    enhetspris: 0,
    påslag: 0,
    kategoriId: '',
    underkategoriId: '',
    beskrivelse: '',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [allSubcategories, setAllSubcategories] = useState<Record<string, Subcategory[]>>({});
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: '',
  });

  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open]);

  useEffect(() => {
    if (formData.kategoriId) {
      loadSubcategories(formData.kategoriId);
    } else {
      setSubcategories([]);
      setFormData(prev => ({ ...prev, underkategoriId: '' }));
    }
  }, [formData.kategoriId]);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
      
      // Pre-load all subcategories for better UX
      const subsMap: Record<string, Subcategory[]> = {};
      for (const cat of data) {
        const subs = await getSubcategoriesByCategory(cat.id);
        subsMap[cat.id] = subs;
      }
      setAllSubcategories(subsMap);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadSubcategories = async (categoryId: string) => {
    try {
      const data = await getSubcategoriesByCategory(categoryId);
      setSubcategories(data);
    } catch (error) {
      console.error('Error loading subcategories:', error);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    handleChange('kategoriId', categoryId);
    setExpandedCategory(categoryId);
  };

  const handleSubcategoryClick = (subcategoryId: string) => {
    handleChange('underkategoriId', subcategoryId);
  };

  const handleClose = () => {
    setFormData({
      produktnavn: '',
      produsent: '',
      enhet: 'stk',
      enhetspris: 0,
      påslag: 20,
      kategoriId: '',
      underkategoriId: '',
      beskrivelse: '',
    });
    setErrors({});
    setIsSubmitting(false);
    setExpandedCategory(null);
    onClose();
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {};

    if (!formData.produktnavn.trim()) {
      newErrors.produktnavn = 'Produktnavn er påkrevd';
    }

    if (!formData.produsent.trim()) {
      newErrors.produsent = 'Produsent er påkrevd';
    }

    if (!formData.enhet.trim()) {
      newErrors.enhet = 'Enhet er påkrevd';
    }

    if (formData.enhetspris <= 0) {
      newErrors.enhetspris = 'Enhetspris må være større enn 0';
    }

    if (formData.påslag < 0) {
      newErrors.påslag = 'Påslag kan ikke være negativt';
    }

    if (!formData.kategoriId) {
      newErrors.kategoriId = 'Kategori er påkrevd';
    }

    if (!formData.underkategoriId) {
      newErrors.underkategoriId = 'Underkategori er påkrevd';
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
      await createProduct(formData);
      handleClose();
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating product:', error);
      setErrorDialog({
        isOpen: true,
        message: `Feil ved opprettelse av produkt: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <DrawerTitle>Nytt produkt</DrawerTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Legg til et nytt produkt i katalogen
                </p>
              </div>
            </div>
            <DrawerClose asChild>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Produktnavn *
              </label>
              <input
                type="text"
                value={formData.produktnavn}
                onChange={(e) => handleChange('produktnavn', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.produktnavn ? 'border-red-500' : ''
                }`}
                placeholder="F.eks. Plank 48x148"
              />
              {errors.produktnavn && (
                <p className="mt-1 text-sm text-red-600">{errors.produktnavn}</p>
              )}
            </div>

            {/* Producer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Produsent *
              </label>
              <input
                type="text"
                value={formData.produsent}
                onChange={(e) => handleChange('produsent', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.produsent ? 'border-red-500' : ''
                }`}
                placeholder="F.eks. Moelven"
              />
              {errors.produsent && (
                <p className="mt-1 text-sm text-red-600">{errors.produsent}</p>
              )}
            </div>

            {/* Category & Subcategory Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori og Underkategori *
              </label>
              <div className={`border rounded-lg ${errors.kategoriId || errors.underkategoriId ? 'border-red-500' : 'border-gray-300'}`}>
                {categories.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    Ingen kategorier funnet. Opprett en kategori først.
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto">
                    {categories.map((category) => {
                      const isExpanded = expandedCategory === category.id || formData.kategoriId === category.id;
                      const categorySubcategories = allSubcategories[category.id] || [];
                      const isSelected = formData.kategoriId === category.id;
                      
                      return (
                        <div key={category.id}>
                          {/* Category */}
                          <button
                            type="button"
                            onClick={() => handleCategoryClick(category.id)}
                            className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors border-b ${
                              isSelected ? 'bg-blue-50 font-medium' : ''
                            }`}
                          >
                            <span className="text-sm">{category.navn}</span>
                            <div className="flex items-center gap-2">
                              {categorySubcategories.length > 0 && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {categorySubcategories.length}
                                </span>
                              )}
                              <svg
                                className={`w-4 h-4 transition-transform ${
                                  isExpanded ? 'rotate-90' : ''
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </button>
                          
                          {/* Subcategories */}
                          {isExpanded && (
                            <div className="bg-gray-50">
                              {categorySubcategories.length === 0 ? (
                                <div className="px-8 py-3 text-sm text-yellow-600">
                                  Ingen underkategorier. Opprett en underkategori først.
                                </div>
                              ) : (
                                categorySubcategories.map((subcategory) => (
                                  <button
                                    key={subcategory.id}
                                    type="button"
                                    onClick={() => handleSubcategoryClick(subcategory.id)}
                                    className={`w-full text-left px-8 py-2 text-sm hover:bg-gray-100 transition-colors border-b border-gray-200 ${
                                      formData.underkategoriId === subcategory.id
                                        ? 'bg-blue-100 text-blue-700 font-medium'
                                        : ''
                                    }`}
                                  >
                                    → {subcategory.navn}
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Selected path display */}
              {formData.kategoriId && formData.underkategoriId && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                  ✓ Valgt: {categories.find(c => c.id === formData.kategoriId)?.navn} → {
                    subcategories.find(s => s.id === formData.underkategoriId)?.navn ||
                    allSubcategories[formData.kategoriId]?.find(s => s.id === formData.underkategoriId)?.navn
                  }
                </div>
              )}
              
              {errors.kategoriId && (
                <p className="mt-1 text-sm text-red-600">{errors.kategoriId}</p>
              )}
              {errors.underkategoriId && (
                <p className="mt-1 text-sm text-red-600">{errors.underkategoriId}</p>
              )}
            </div>

            {/* Unit and Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enhet *
                </label>
                <select
                  value={formData.enhet}
                  onChange={(e) => handleChange('enhet', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.enhet ? 'border-red-500' : ''
                  }`}
                >
                  <option value="stk">Stykk (stk)</option>
                  <option value="meter">Meter (m)</option>
                  <option value="m2">Kvadratmeter (m²)</option>
                  <option value="m3">Kubikkmeter (m³)</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="liter">Liter (l)</option>
                  <option value="plate">Plate</option>
                  <option value="time">Time</option>
                </select>
                {errors.enhet && (
                  <p className="mt-1 text-sm text-red-600">{errors.enhet}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enhetspris (kr) *
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.enhetspris}
                  onChange={(e) => handleChange('enhetspris', parseFloat(e.target.value))}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.enhetspris ? 'border-red-500' : ''
                  }`}
                  placeholder="0"
                />
                {errors.enhetspris && (
                  <p className="mt-1 text-sm text-red-600">{errors.enhetspris}</p>
                )}
              </div>
            </div>

            {/* Markup */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Påslag (%) *
              </label>
              <input
                type="number"
                step="any"
                value={formData.påslag}
                onChange={(e) => handleChange('påslag', parseFloat(e.target.value))}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.påslag ? 'border-red-500' : ''
                }`}
                placeholder="0"
              />
              {errors.påslag && (
                <p className="mt-1 text-sm text-red-600">{errors.påslag}</p>
              )}
              {formData.enhetspris > 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  Pris med påslag: {(formData.enhetspris * (1 + formData.påslag / 100)).toLocaleString('no-NO')} kr
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beskrivelse
              </label>
              <textarea
                value={formData.beskrivelse}
                onChange={(e) => handleChange('beskrivelse', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Valgfri beskrivelse av produktet"
              />
            </div>
          </div>

          <DrawerFooter className="border-t bg-gray-50">
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                <X className="w-4 h-4 mr-2" />
                Avbryt
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Check className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Lagrer...' : 'Lagre produkt'}
              </Button>
            </div>
          </DrawerFooter>
        </form>
      </DrawerContent>

      <ErrorDialog
        isOpen={errorDialog.isOpen}
        message={errorDialog.message}
        onClose={() => setErrorDialog({ isOpen: false, message: '' })}
      />
    </Drawer>
  );
};
