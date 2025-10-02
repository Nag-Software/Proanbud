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
import { X, Check, Package, Edit, Trash2 } from 'lucide-react';
import { 
  updateProduct,
  deleteProduct,
  getCategories,
  getSubcategoriesByCategory,
  getCategory,
  getSubcategory
} from '@/lib/services/catalogService';
import { Product, Category, Subcategory, ProductFormData } from '@/lib/types';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ErrorDialog } from '@/components/shared/ErrorDialog';

interface ProductDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  product: Product;
  onUpdate?: () => void;
}

export const ProductDetailsDrawer: React.FC<ProductDetailsDrawerProps> = ({ 
  open, 
  onClose, 
  product,
  onUpdate 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    produktnavn: product.produktnavn,
    produsent: product.produsent,
    enhet: product.enhet,
    enhetspris: product.enhetspris,
    påslag: product.påslag,
    kategoriId: product.kategoriId,
    underkategoriId: product.underkategoriId,
    beskrivelse: product.beskrivelse || '',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [subcategoryName, setSubcategoryName] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: '',
  });

  const { dialogState, confirm } = useConfirmDialog();

  useEffect(() => {
    if (open) {
      loadData();
      setFormData({
        produktnavn: product.produktnavn,
        produsent: product.produsent,
        enhet: product.enhet,
        enhetspris: product.enhetspris,
        påslag: product.påslag,
        kategoriId: product.kategoriId,
        underkategoriId: product.underkategoriId,
        beskrivelse: product.beskrivelse || '',
      });
      setIsEditing(false);
    }
  }, [open, product]);

  useEffect(() => {
    if (formData.kategoriId) {
      loadSubcategories(formData.kategoriId);
    } else {
      setSubcategories([]);
    }
  }, [formData.kategoriId]);

  const loadData = async () => {
    try {
      const [categoriesData, category, subcategory] = await Promise.all([
        getCategories(),
        getCategory(product.kategoriId),
        getSubcategory(product.underkategoriId),
      ]);
      setCategories(categoriesData);
      setCategoryName(category?.navn || 'Ukjent');
      setSubcategoryName(subcategory?.navn || 'Ukjent');
    } catch (error) {
      console.error('Error loading data:', error);
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

  const handleClose = () => {
    setIsEditing(false);
    setErrors({});
    setIsSubmitting(false);
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
      await updateProduct(product.kategoriId, product.id, formData);
      setIsEditing(false);
      onUpdate?.();
    } catch (error: any) {
      console.error('Error updating product:', error);
      setErrorDialog({
        isOpen: true,
        message: `Feil ved oppdatering av produkt: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Slett produkt',
      description: 'Er du sikker på at du vil slette dette produktet?',
      confirmText: 'Slett',
      cancelText: 'Avbryt',
      variant: 'destructive',
    });

    if (!confirmed) return;

    try {
      await deleteProduct(product.id);
      handleClose();
      onUpdate?.();
    } catch (error: any) {
      setErrorDialog({
        isOpen: true,
        message: `Feil ved sletting: ${error.message}`,
      });
    }
  };

  const handleChange = (field: keyof ProductFormData, value: any) => {
    setFormData((prev: ProductFormData) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: Partial<Record<keyof ProductFormData, string>>) => ({ ...prev, [field]: undefined }));
    }
  };

  const calculateFinalPrice = (enhetspris: number, påslag: number) => {
    return enhetspris * (1 + påslag / 100);
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
                <DrawerTitle>{product.produktnavn}</DrawerTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {categoryName} → {subcategoryName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
              <DrawerClose asChild>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </DrawerClose>
            </div>
          </div>
        </DrawerHeader>

        {isEditing ? (
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
                />
                {errors.produsent && (
                  <p className="mt-1 text-sm text-red-600">{errors.produsent}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori *
                </label>
                <select
                  value={formData.kategoriId}
                  onChange={(e) => handleChange('kategoriId', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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

              {/* Subcategory */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Underkategori *
                </label>
                <select
                  value={formData.underkategoriId}
                  onChange={(e) => handleChange('underkategoriId', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.underkategoriId ? 'border-red-500' : ''
                  }`}
                  disabled={!formData.kategoriId}
                >
                  <option value="">Velg underkategori</option>
                  {subcategories.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.navn}</option>
                  ))}
                </select>
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
                    Pris med påslag: {calculateFinalPrice(formData.enhetspris, formData.påslag).toLocaleString('no-NO')} kr
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
                />
              </div>
            </div>

            <DrawerFooter className="border-t bg-gray-50">
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4 mr-2" />
                  Avbryt
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  <Check className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Lagrer...' : 'Lagre endringer'}
                </Button>
              </div>
            </DrawerFooter>
          </form>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Product details view */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Produsent
                  </label>
                  <p className="text-base font-medium">{product.produsent}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Enhet
                  </label>
                  <p className="text-base font-medium">{product.enhet}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Enhetspris
                  </label>
                  <p className="text-base font-medium">
                    {product.enhetspris.toLocaleString('no-NO')} kr
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Påslag
                  </label>
                  <p className="text-base font-medium">{product.påslag}%</p>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Pris med påslag
                  </label>
                  <p className="text-2xl font-bold text-blue-600">
                    {calculateFinalPrice(product.enhetspris, product.påslag).toLocaleString('no-NO')} kr
                  </p>
                </div>

                {product.beskrivelse && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Beskrivelse
                    </label>
                    <p className="text-base">{product.beskrivelse}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DrawerContent>

      {/* Dialogs */}
      <ConfirmDialog dialogState={dialogState} />
      <ErrorDialog
        isOpen={errorDialog.isOpen}
        message={errorDialog.message}
        onClose={() => setErrorDialog({ isOpen: false, message: '' })}
      />
    </Drawer>
  );
};
