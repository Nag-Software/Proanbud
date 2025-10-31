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
import { X, Check, FolderPlus, Plus } from 'lucide-react';
import { 
  createCategory,
  createSubcategory,
  getCategories
} from '@/lib/services/catalogService';
import { Category, CategoryFormData, SubcategoryFormData } from '@/lib/types';
import { ErrorDialog } from '@/components/shared/ErrorDialog';

interface NewCategoryDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const NewCategoryDrawer: React.FC<NewCategoryDrawerProps> = ({ 
  open, 
  onClose, 
  onSuccess 
}) => {
  const [mode, setMode] = useState<'category' | 'subcategory'>('category');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryFormData>({
    navn: '',
    beskrivelse: '',
  });
  const [subcategoryData, setSubcategoryData] = useState<SubcategoryFormData>({
    navn: '',
    kategoriId: '',
    beskrivelse: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleClose = () => {
    setMode('category');
    setCategoryData({ navn: '', beskrivelse: '' });
    setSubcategoryData({ navn: '', kategoriId: '', beskrivelse: '' });
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  const validateCategoryForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!categoryData.navn.trim()) {
      newErrors.navn = 'Navn er påkrevd';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSubcategoryForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!subcategoryData.navn.trim()) {
      newErrors.navn = 'Navn er påkrevd';
    }

    if (!subcategoryData.kategoriId) {
      newErrors.kategoriId = 'Kategori er påkrevd';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCategoryForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createCategory(categoryData);
      handleClose();
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating category:', error);
      setErrorDialog({
        isOpen: true,
        message: `Feil ved opprettelse av kategori: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSubcategoryForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createSubcategory(subcategoryData);
      handleClose();
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating subcategory:', error);
      setErrorDialog({
        isOpen: true,
        message: `Feil ved opprettelse av underkategori: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[90vh] z-[400]">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FolderPlus className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <DrawerTitle>Ny kategori/underkategori</DrawerTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Opprett en ny kategori eller underkategori
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

        <div className="flex-1 overflow-y-auto">
          {/* Mode selector */}
          <div className="p-6 border-b">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('category')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  mode === 'category'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Kategori
              </button>
              <button
                type="button"
                onClick={() => setMode('subcategory')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  mode === 'subcategory'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Underkategori
              </button>
            </div>
          </div>

          {/* Category form */}
          {mode === 'category' && (
            <form onSubmit={handleSubmitCategory}>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategorinavn *
                  </label>
                  <input
                    type="text"
                    value={categoryData.navn}
                    onChange={(e) => {
                      setCategoryData({ ...categoryData, navn: e.target.value });
                      if (errors.navn) setErrors({ ...errors, navn: '' });
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.navn ? 'border-red-500' : ''
                    }`}
                    placeholder="F.eks. Trevirke"
                  />
                  {errors.navn && (
                    <p className="mt-1 text-sm text-red-600">{errors.navn}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beskrivelse
                  </label>
                  <textarea
                    value={categoryData.beskrivelse}
                    onChange={(e) => setCategoryData({ ...categoryData, beskrivelse: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="Valgfri beskrivelse av kategorien"
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
                    {isSubmitting ? 'Lagrer...' : 'Lagre kategori'}
                  </Button>
                </div>
              </DrawerFooter>
            </form>
          )}

          {/* Subcategory form */}
          {mode === 'subcategory' && (
            <form onSubmit={handleSubmitSubcategory}>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overordnet kategori *
                  </label>
                  <select
                    value={subcategoryData.kategoriId}
                    onChange={(e) => {
                      setSubcategoryData({ ...subcategoryData, kategoriId: e.target.value });
                      if (errors.kategoriId) setErrors({ ...errors, kategoriId: '' });
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.kategoriId ? 'border-red-500' : ''
                    }`}
                  >
                    <option value="">Velg kategori</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.navn}</option>
                    ))}
                  </select>
                  {errors.kategoriId && (
                    <p className="mt-1 text-sm text-red-600">{errors.kategoriId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Underkategorinavn *
                  </label>
                  <input
                    type="text"
                    value={subcategoryData.navn}
                    onChange={(e) => {
                      setSubcategoryData({ ...subcategoryData, navn: e.target.value });
                      if (errors.navn) setErrors({ ...errors, navn: '' });
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.navn ? 'border-red-500' : ''
                    }`}
                    placeholder="F.eks. Imp-virke"
                  />
                  {errors.navn && (
                    <p className="mt-1 text-sm text-red-600">{errors.navn}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beskrivelse
                  </label>
                  <textarea
                    value={subcategoryData.beskrivelse}
                    onChange={(e) => setSubcategoryData({ ...subcategoryData, beskrivelse: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="Valgfri beskrivelse av underkategorien"
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
                    {isSubmitting ? 'Lagrer...' : 'Lagre underkategori'}
                  </Button>
                </div>
              </DrawerFooter>
            </form>
          )}
        </div>
      </DrawerContent>

      <ErrorDialog
        isOpen={errorDialog.isOpen}
        message={errorDialog.message}
        onClose={() => setErrorDialog({ isOpen: false, message: '' })}
      />
    </Drawer>
  );
};
