'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { PriceComponent } from '@/lib/types';
import { X, Check, Calculator } from 'lucide-react';

const DEFAULT_CATEGORY_LABELS: Record<string, string> = {
  materialer: 'Materialer',
  arbeid: 'Arbeid',
  transport: 'Transport',
  utstyr: 'Utstyr',
  margin: 'Margin',
  annet: 'Annet',
};

interface PriceComponentDrawerProps {
  open: boolean;
  component: PriceComponent | null;
  onClose: () => void;
  onSave: (component: PriceComponent) => void;
  readOnly?: boolean;
  categoryOptions?: string[];
  projectOptions?: string[];
}

type ComponentFormState = {
  name: string;
  description: string;
  category: string;
  projectCategory: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  priceMarkup: string;
  produsent: string;
};

const parseNumberInput = (value: string): number => {
  if (!value.trim()) {
    return NaN;
  }
  const normalized = value.replace(',', '.');
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const FALLBACK_PROJECT_LABEL = 'Ingen prosjekt';

const buildFormState = (component: PriceComponent | null): ComponentFormState => ({
  name: component?.name ?? '',
  description: component?.description ?? '',
  category: component?.category ?? 'annet',
  projectCategory: component?.projectCategory ?? FALLBACK_PROJECT_LABEL,
  unit: component?.unit ?? 'stk',
  quantity: component?.quantity?.toString() ?? '1',
  unitPrice: component?.unitPrice?.toString() ?? '0',
  priceMarkup: component?.priceMarkup?.toString() ?? '0',
  produsent: component?.produsent ?? '',
});

const calculateAmount = (quantity: number, unitPrice: number, priceMarkup: number) => {
  const safeQuantity = Number.isNaN(quantity) ? 0 : quantity;
  const safeUnitPrice = Number.isNaN(unitPrice) ? 0 : unitPrice;
  const safeMarkup = Number.isNaN(priceMarkup) ? 0 : priceMarkup;
  return safeQuantity * safeUnitPrice * (1 + safeMarkup / 100);
};

export function PriceComponentDrawer({
  open,
  component,
  onClose,
  onSave,
  readOnly = false,
  categoryOptions,
  projectOptions,
}: PriceComponentDrawerProps) {
  const [formState, setFormState] = useState<ComponentFormState>(buildFormState(component));
  const [errors, setErrors] = useState<Partial<Record<keyof ComponentFormState, string>>>({});

  useEffect(() => {
    if (open) {
      setFormState(buildFormState(component));
      setErrors({});
    }
  }, [open, component]);

  const resolvedCategories = useMemo(() => {
    const base = Object.keys(DEFAULT_CATEGORY_LABELS);
    const extras = categoryOptions ?? [];
    return Array.from(new Set([...base, ...extras])).filter(Boolean);
  }, [categoryOptions]);

  const resolvedProjects = useMemo(() => {
    if (!projectOptions || projectOptions.length === 0) {
      return [] as string[];
    }
    return Array.from(new Set([FALLBACK_PROJECT_LABEL, ...projectOptions])).filter(Boolean);
  }, [projectOptions]);

  const parsedQuantity = parseNumberInput(formState.quantity);
  const parsedUnitPrice = parseNumberInput(formState.unitPrice);
  const parsedMarkup = parseNumberInput(formState.priceMarkup) || 0;
  const calculatedAmount = calculateAmount(parsedQuantity, parsedUnitPrice, parsedMarkup);
  const canShowCalculatedAmount = !Number.isNaN(parsedQuantity) && parsedQuantity > 0 && !Number.isNaN(parsedUnitPrice);

  const handleChange = (field: keyof ComponentFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ComponentFormState, string>> = {};

    if (!formState.name.trim()) {
      newErrors.name = 'Navn er påkrevd';
    }

    if (!formState.category) {
      newErrors.category = 'Kategori er påkrevd';
    }

    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      newErrors.quantity = 'Antall må være større enn 0';
    }

    if (Number.isNaN(parsedUnitPrice) || parsedUnitPrice < 0) {
      newErrors.unitPrice = 'Enhetspris må være 0 eller høyere';
    }

    if (parsedMarkup < 0) {
      newErrors.priceMarkup = 'Påslag kan ikke være negativt';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (readOnly) {
      handleClose();
      return;
    }

    if (!validate() || !component) {
      return;
    }

    const updatedComponent: PriceComponent = {
      ...component,
      name: formState.name.trim(),
      description: formState.description.trim(),
      category: formState.category as PriceComponent['category'],
      projectCategory:
        !projectOptions || resolvedProjects.length === 0
          ? formState.projectCategory.trim() || undefined
          : formState.projectCategory === FALLBACK_PROJECT_LABEL
            ? undefined
            : formState.projectCategory.trim() || undefined,
      unit: formState.unit.trim() || 'stk',
      quantity: Number.isNaN(parsedQuantity) ? 0 : parsedQuantity,
      unitPrice: Number.isNaN(parsedUnitPrice) ? 0 : parsedUnitPrice,
      priceMarkup: Number.isNaN(parsedMarkup) ? 0 : parsedMarkup,
      produsent: formState.produsent.trim(),
      amount: calculateAmount(parsedQuantity, parsedUnitPrice, parsedMarkup),
    };

    onSave(updatedComponent);
    handleClose();
  };

  const handleClose = () => {
    onClose();
  };

  const categoryLabel = (value: string) => DEFAULT_CATEGORY_LABELS[value] || value;

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[90vh] z-[400]">
        <DrawerHeader className="border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Calculator className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <DrawerTitle>{component?.name ?? 'Prisdetaljer'}</DrawerTitle>
              {component?.category && (
                <p className="text-sm text-gray-500">
                  Kategori: {categoryLabel(component.category)}
                </p>
              )}
            </div>
          </div>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Navn *</label>
                <input
                  type="text"
                  value={formState.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    errors.name ? 'border-red-500' : ''
                  }`}
                  disabled={readOnly}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategori *</label>
                <select
                  value={formState.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    errors.category ? 'border-red-500' : ''
                  }`}
                  disabled={readOnly}
                >
                  {resolvedCategories.map((category) => (
                    <option key={category} value={category}>
                      {categoryLabel(category)}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prosjekt</label>
                {resolvedProjects.length > 0 ? (
                  <select
                    value={formState.projectCategory}
                    onChange={(e) => handleChange('projectCategory', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    disabled={readOnly}
                  >
                    {resolvedProjects.map((project) => (
                      <option key={project} value={project}>
                        {project}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formState.projectCategory}
                    onChange={(e) => handleChange('projectCategory', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    disabled={readOnly}
                    placeholder="f.eks. Bygge terrasse"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Beskrivelse</label>
              <textarea
                value={formState.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                rows={3}
                disabled={readOnly}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Produsent</label>
                <input
                  type="text"
                  value={formState.produsent}
                  onChange={(e) => handleChange('produsent', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  disabled={readOnly}
                  placeholder="Valgfritt"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Enhet</label>
                <input
                  type="text"
                  value={formState.unit}
                  onChange={(e) => handleChange('unit', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  disabled={readOnly}
                  placeholder="f.eks. stk, time"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Antall *</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formState.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    errors.quantity ? 'border-red-500' : ''
                  }`}
                  disabled={readOnly}
                />
                {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Enhetspris (kr) *</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formState.unitPrice}
                  onChange={(e) => handleChange('unitPrice', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    errors.unitPrice ? 'border-red-500' : ''
                  }`}
                  disabled={readOnly}
                />
                {errors.unitPrice && <p className="mt-1 text-sm text-red-600">{errors.unitPrice}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Påslag (%)</label>
                <input
                  type="number"
                  step="any"
                  value={formState.priceMarkup}
                  onChange={(e) => handleChange('priceMarkup', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    errors.priceMarkup ? 'border-red-500' : ''
                  }`}
                  disabled={readOnly}
                />
                {errors.priceMarkup && <p className="mt-1 text-sm text-red-600">{errors.priceMarkup}</p>}
              </div>
            </div>

            {canShowCalculatedAmount && (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-sm text-amber-800">
                  Beregnet pris med påslag: <span className="font-semibold">{calculatedAmount.toLocaleString('no-NO')} kr</span>
                </p>
              </div>
            )}
          </div>

          <DrawerFooter className="border-t bg-gray-50">
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={handleClose}>
                <X className="w-4 h-4 mr-2" />
                Lukk
              </Button>
              {!readOnly && (
                <Button type="submit">
                  <Check className="w-4 h-4 mr-2" />
                  Lagre endringer
                </Button>
              )}
            </div>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
