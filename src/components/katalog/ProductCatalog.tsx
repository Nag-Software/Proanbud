'use client';

import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  forwardRef,
} from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBreakpoint } from '@/hooks/useResponsive';
import { getProducts, getCategories, getSubcategories } from '@/lib/services/catalogService';
import { Category, Product, Subcategory } from '@/lib/types';

export interface ProductCatalogSelectionItem {
  product: Product;
  quantity: number;
}

export interface ProductCatalogSelectionResult {
  confirmed: boolean;
  selections: ProductCatalogSelectionItem[];
}

export interface ProductCatalogSnapshot {
  products: Product[];
  categories: Category[];
  subcategories: Subcategory[];
}

export interface ProductCatalogOpenOptions {
  viewMode?: 'grid' | 'list';
}

export interface ProductCatalogHandle {
  open: (options?: ProductCatalogOpenOptions) => Promise<ProductCatalogSelectionResult>;
  close: () => void;
  refresh: () => Promise<ProductCatalogSnapshot | null>;
  getCatalogData: () => ProductCatalogSnapshot | null;
}

const ProductCatalogComponent = (_: unknown, ref: React.Ref<ProductCatalogHandle>) => {
  const breakpoints = useBreakpoint();
  const isMobile = !breakpoints.md;

  const [isOpen, setIsOpen] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<Category[]>([]);
  const [catalogSubcategories, setCatalogSubcategories] = useState<Subcategory[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Map<string, ProductCatalogSelectionItem>>(new Map());
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedSubcategoryFilter, setSelectedSubcategoryFilter] = useState('all');
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  const [catalogSortBy, setCatalogSortBy] = useState<'name' | 'price'>('name');
  const [catalogViewMode, setCatalogViewMode] = useState<'grid' | 'list'>('list');
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  const pendingResolverRef = useRef<((result: ProductCatalogSelectionResult) => void) | null>(null);

  const snapshot: ProductCatalogSnapshot | null = useMemo(() => {
    if (!catalogLoaded) return null;
    return {
      products: catalogProducts,
      categories: catalogCategories,
      subcategories: catalogSubcategories,
    };
  }, [catalogLoaded, catalogProducts, catalogCategories, catalogSubcategories]);

  const selectionTotal = useMemo(() => {
    return Array.from(selectedProducts.values()).reduce((sum, { product, quantity }) => sum + product.enhetspris * quantity, 0);
  }, [selectedProducts]);

  const filteredProducts = useMemo(() => {
    const searchTerm = catalogSearchTerm.toLowerCase();
    return catalogProducts
      .filter(product => {
        const matchesSearch =
          catalogSearchTerm === '' ||
          product.produktnavn.toLowerCase().includes(searchTerm) ||
          product.beskrivelse?.toLowerCase().includes(searchTerm) ||
          product.produsent?.toLowerCase().includes(searchTerm);

        const matchesCategory = selectedCategoryFilter === 'all' || product.kategoriId === selectedCategoryFilter;
        const matchesSubcategory = selectedSubcategoryFilter === 'all' || product.underkategoriId === selectedSubcategoryFilter;

        return matchesSearch && matchesCategory && matchesSubcategory;
      })
      .sort((a, b) => {
        if (catalogSortBy === 'name') {
          return a.produktnavn.localeCompare(b.produktnavn);
        }
        return a.enhetspris - b.enhetspris;
      });
  }, [catalogProducts, catalogSearchTerm, selectedCategoryFilter, selectedSubcategoryFilter, catalogSortBy]);

  const availableSubcategories = useMemo(() => {
    if (selectedCategoryFilter === 'all') return [];
    return catalogSubcategories.filter(sub => sub.kategoriId === selectedCategoryFilter);
  }, [catalogSubcategories, selectedCategoryFilter]);

  const resetFilters = useCallback(() => {
    setSelectedProducts(new Map());
    setSelectedCategoryFilter('all');
    setSelectedSubcategoryFilter('all');
    setCatalogSearchTerm('');
  }, []);

  const resolvePending = useCallback((result: ProductCatalogSelectionResult) => {
    if (pendingResolverRef.current) {
      pendingResolverRef.current(result);
      pendingResolverRef.current = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    resolvePending({ confirmed: false, selections: [] });
    resetFilters();
  }, [resetFilters, resolvePending]);

  const handleConfirm = useCallback(() => {
    const selections = Array.from(selectedProducts.values());
    setIsOpen(false);
    resolvePending({ confirmed: true, selections });
    resetFilters();
  }, [selectedProducts, resolvePending, resetFilters]);

  const toggleProductSelection = useCallback((product: Product) => {
    setSelectedProducts(prev => {
      const next = new Map(prev);
      if (next.has(product.id)) {
        next.delete(product.id);
      } else {
        next.set(product.id, { product, quantity: 1 });
      }
      return next;
    });
  }, []);

  const updateProductQuantity = useCallback((productId: string, quantity: number) => {
    if (Number.isNaN(quantity) || quantity <= 0) {
      quantity = 1;
    }

    setSelectedProducts(prev => {
      const next = new Map(prev);
      const item = next.get(productId);
      if (item) {
        next.set(productId, { ...item, quantity });
      }
      return next;
    });
  }, []);

  const loadCatalogData = useCallback(async () => {
    setIsLoadingCatalog(true);
    try {
      const [products, categories, subcategories] = await Promise.all([
        getProducts(),
        getCategories(),
        getSubcategories(),
      ]);
      setCatalogProducts(products);
      setCatalogCategories(categories);
      setCatalogSubcategories(subcategories);
      setCatalogLoaded(true);
      return { products, categories, subcategories } satisfies ProductCatalogSnapshot;
    } catch (error) {
      console.error('Error loading catalog data:', error);
      return snapshot;
    } finally {
      setIsLoadingCatalog(false);
    }
  }, [snapshot]);

  const ensureCatalogLoaded = useCallback(async () => {
    if (catalogLoaded && snapshot) {
      return snapshot;
    }
    return await loadCatalogData();
  }, [catalogLoaded, snapshot, loadCatalogData]);

  useEffect(() => {
    ensureCatalogLoaded();
  }, [ensureCatalogLoaded]);

  useImperativeHandle(ref, () => ({
    open: async (options) => {
      await ensureCatalogLoaded();
      if (options?.viewMode) {
        setCatalogViewMode(options.viewMode);
      } else {
        setCatalogViewMode('list');
      }
      resetFilters();
      setIsOpen(true);
      return new Promise<ProductCatalogSelectionResult>(resolve => {
        pendingResolverRef.current = resolve;
      });
    },
    close: () => handleCancel(),
    refresh: () => loadCatalogData(),
    getCatalogData: () => snapshot,
  }), [ensureCatalogLoaded, handleCancel, loadCatalogData, resetFilters, snapshot]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const markerAttr = 'data-hidden-by-product-catalog';
    const customBackdropZIndex = 450;

    if (isOpen) {
      const overlays = Array.from(document.querySelectorAll<HTMLElement>('.fixed.inset-0'));
      overlays.forEach(el => {
        const computedZIndex = parseInt(getComputedStyle(el).zIndex, 10) || 0;
        if (computedZIndex < customBackdropZIndex && el.style.display !== 'none') {
          el.setAttribute(markerAttr, el.style.display || '');
          el.style.display = 'none';
        }
      });
      return () => {
        overlays.forEach(el => {
          if (el.hasAttribute(markerAttr)) {
            const prevDisplay = el.getAttribute(markerAttr) || '';
            el.style.display = prevDisplay;
            el.removeAttribute(markerAttr);
          }
        });
      };
    }
  }, [isOpen]);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      handleCancel();
    } else {
      setIsOpen(true);
    }
  }, [handleCancel]);

  const selectionCount = selectedProducts.size;

  const CatalogToolbar = (
    <div className="p-4 border-b bg-white space-y-3">
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Søk etter produktnavn, produsent eller beskrivelse..."
          value={catalogSearchTerm}
          onChange={(e) => setCatalogSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <Select value={catalogSortBy} onValueChange={(value) => setCatalogSortBy(value as 'name' | 'price')}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sorter: Navn</SelectItem>
            <SelectItem value="price">Sorter: Pris</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Viser {filteredProducts.length} produkter</span>
      </div>
    </div>
  );

  const CategorySidebar = (
    <div className="w-64 border-r bg-gray-50 overflow-y-auto p-4">
      <h3 className="font-semibold text-sm text-gray-700 mb-3 px-2">KATEGORIER</h3>
      <div className="space-y-1">
        <button
          onClick={() => {
            setSelectedCategoryFilter('all');
            setSelectedSubcategoryFilter('all');
          }}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
            selectedCategoryFilter === 'all' ? 'bg-primary text-white' : 'hover:bg-gray-200'
          }`}
        >
          Alle kategorier
          <span className="ml-2 text-xs opacity-75">({catalogProducts.length})</span>
        </button>

        {catalogCategories.map(category => {
          const categoryProducts = catalogProducts.filter(p => p.kategoriId === category.id);
          const categorySubcategories = catalogSubcategories.filter(s => s.kategoriId === category.id);

          return (
            <div key={category.id}>
              <button
                onClick={() => {
                  setSelectedCategoryFilter(category.id);
                  setSelectedSubcategoryFilter('all');
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategoryFilter === category.id ? 'bg-primary text-white' : 'hover:bg-gray-200'
                }`}
              >
                {category.navn}
                <span className="ml-2 text-xs opacity-75">({categoryProducts.length})</span>
              </button>

              {selectedCategoryFilter === category.id && categorySubcategories.length > 0 && (
                <div className="ml-4 mt-1 space-y-1">
                  <button
                    onClick={() => setSelectedSubcategoryFilter('all')}
                    className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${
                      selectedSubcategoryFilter === 'all' ? 'bg-primary/20 text-primary font-medium' : 'hover:bg-gray-200'
                    }`}
                  >
                    Alle
                  </button>
                  {categorySubcategories.map(subcat => {
                    const subcatProducts = categoryProducts.filter(p => p.underkategoriId === subcat.id);
                    return (
                      <button
                        key={subcat.id}
                        onClick={() => setSelectedSubcategoryFilter(subcat.id)}
                        className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${
                          selectedSubcategoryFilter === subcat.id
                            ? 'bg-primary/20 text-primary font-medium'
                            : 'hover:bg-gray-200'
                        }`}
                      >
                        {subcat.navn}
                        <span className="ml-2 opacity-75">({subcatProducts.length})</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const ProductList = (
    <div className={catalogViewMode === 'grid' ? 'grid grid-cols-3 gap-4' : 'space-y-3'}>
      {filteredProducts.map(product => {
        const category = catalogCategories.find(c => c.id === product.kategoriId);
        const subcategory = catalogSubcategories.find(s => s.id === product.underkategoriId);
        const isSelected = selectedProducts.has(product.id);
        const selectedItem = selectedProducts.get(product.id);

        return (
          <div
            key={product.id}
            className={`border rounded-lg p-4 transition-all ${
              isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleProductSelection(product)}
                className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              />

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 mb-1">{product.produktnavn}</h4>
                {product.produsent && <p className="text-sm text-gray-600 mb-1">{product.produsent}</p>}
                {product.beskrivelse && (
                  <p className="text-sm text-gray-500 mb-2 line-clamp-2">{product.beskrivelse}</p>
                )}

                <div className="flex flex-wrap gap-2 mt-2">
                  {category && (
                    <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                      {category.navn}
                    </span>
                  )}
                  {subcategory && (
                    <span className="inline-flex items-center px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                      {subcategory.navn}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right space-y-2">
                <div>
                  <p className="font-bold text-lg text-gray-900">
                    {product.enhetspris.toLocaleString('nb-NO')} kr
                  </p>
                  <p className="text-xs text-gray-500">per {product.enhet}</p>
                </div>

                {isSelected && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600">Antall:</label>
                    <input
                      type="number"
                      min="1"
                      value={selectedItem?.quantity || 1}
                      onChange={(e) => updateProductQuantity(product.id, parseInt(e.target.value, 10) || 1)}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {filteredProducts.length === 0 && (
        <div className="col-span-3 p-12 text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Ingen produkter funnet</p>
          <p className="text-gray-500 text-sm mt-1">Prøv å endre søkeord eller filter</p>
        </div>
      )}
    </div>
  );

  const MobileProductList = (
    <div className="space-y-3 pb-4">
      {filteredProducts.map(product => {
        const category = catalogCategories.find(c => c.id === product.kategoriId);
        const subcategory = catalogSubcategories.find(s => s.id === product.underkategoriId);
        const isSelected = selectedProducts.has(product.id);
        const selectedItem = selectedProducts.get(product.id);

        return (
          <div
            key={product.id}
            className={`border rounded-lg p-3 transition-all ${
              isSelected ? 'border-primary bg-primary/5' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start gap-3" onClick={() => toggleProductSelection(product)}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleProductSelection(product)}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-gray-900 mb-0.5">{product.produktnavn}</h4>
                {product.produsent && <p className="text-xs text-gray-600 mb-1">{product.produsent}</p>}
                {product.beskrivelse && (
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">{product.beskrivelse}</p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {category && (
                      <span className="inline-flex items-center px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                        {category.navn}
                      </span>
                    )}
                    {subcategory && (
                      <span className="inline-flex items-center px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                        {subcategory.navn}
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-sm text-gray-900">
                      {product.enhetspris.toLocaleString('nb-NO')} kr
                    </p>
                    <p className="text-xs text-gray-500">/{product.enhet}</p>
                  </div>
                </div>
              </div>
            </div>

            {isSelected && selectedItem && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600">Antall:</label>
                  <input
                    type="number"
                    min="1"
                    value={selectedItem.quantity}
                    onChange={(e) => updateProductQuantity(product.id, parseInt(e.target.value, 10) || 1)}
                    className="w-16 px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-xs text-gray-500">× kr {product.enhetspris.toLocaleString('nb-NO')}</span>
                  <span className="text-xs font-medium text-gray-900 ml-auto">
                    = kr {(product.enhetspris * selectedItem.quantity).toLocaleString('nb-NO')}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {filteredProducts.length === 0 && (
        <div className="p-8 text-center">
          <p className="text-gray-600 text-sm">Ingen produkter funnet</p>
          <p className="text-gray-500 text-xs mt-1">Prøv å endre søkeord eller filter</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {isMobile ? (
        <Drawer open={isOpen} onOpenChange={handleOpenChange}>
          <DrawerOverlay className="!z-[500]" />
          <DrawerContent className="max-h-[95vh] flex flex-col !z-[800]">
            <DrawerHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <DrawerTitle>Produktkatalog</DrawerTitle>
                  <DrawerDescription>Velg produkter fra katalogen</DrawerDescription>
                </div>
                {selectionCount > 0 && (
                  <div className="bg-primary/10 px-3 py-1.5 rounded-lg">
                    <span className="text-xs font-medium text-primary">{selectionCount} valgt</span>
                  </div>
                )}
              </div>
            </DrawerHeader>

            <div className="flex-1 overflow-hidden flex flex-col p-4">
              <div className="space-y-3 mb-4">
                <input
                  type="text"
                  placeholder="Søk etter produkt..."
                  value={catalogSearchTerm}
                  onChange={(e) => setCatalogSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />

                <div className="flex gap-2">
                  <Select
                    value={selectedCategoryFilter}
                    onValueChange={(value) => {
                      setSelectedCategoryFilter(value);
                      setSelectedSubcategoryFilter('all');
                    }}
                  >
                    <SelectTrigger className="flex-1 text-sm">
                      <SelectValue placeholder="Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle kategorier</SelectItem>
                      {catalogCategories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.navn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {availableSubcategories.length > 0 && (
                    <Select value={selectedSubcategoryFilter} onValueChange={setSelectedSubcategoryFilter}>
                      <SelectTrigger className="flex-1 text-sm">
                        <SelectValue placeholder="Underkategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle</SelectItem>
                        {availableSubcategories.map(subcat => (
                          <SelectItem key={subcat.id} value={subcat.id}>
                            {subcat.navn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <Select value={catalogSortBy} onValueChange={(value) => setCatalogSortBy(value as 'name' | 'price')}>
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Sorter: Navn</SelectItem>
                    <SelectItem value="price">Sorter: Pris</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 overflow-y-auto -mx-4 px-4">
                {isLoadingCatalog ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="text-center">
                      <div className="animate-spin w-8 h-8 mx-auto mb-3 border-4 border-primary border-t-transparent rounded-full"></div>
                      <p className="text-sm text-gray-500">Laster...</p>
                    </div>
                  </div>
                ) : (
                  MobileProductList
                )}
              </div>
            </div>

            <DrawerFooter className="border-t bg-gray-50">
              {selectionCount > 0 && (
                <div className="text-sm text-gray-600 mb-2 text-center">
                  <span className="font-medium">{selectionCount}</span> produkt{selectionCount !== 1 ? 'er' : ''} valgt
                  <span className="block mt-1">
                    Total: <span className="font-semibold">{selectionTotal.toLocaleString('nb-NO')} kr</span>
                  </span>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel} className="flex-1">
                  Avbryt
                </Button>
                <Button onClick={handleConfirm} disabled={selectionCount === 0} className="flex-1">
                  Legg til{selectionCount > 0 ? ` (${selectionCount})` : ''}
                </Button>
              </div>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogOverlay className="!z-[500]" />
          <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col p-0 !z-[800]">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl">Produktkatalog</DialogTitle>
                  <DialogDescription>Velg produkter fra katalogen og legg til i tilbudet</DialogDescription>
                </div>
                {selectionCount > 0 && (
                  <div className="bg-primary/10 px-4 py-2 rounded-lg">
                    <span className="text-sm font-medium text-primary">
                      {selectionCount} produkt{selectionCount !== 1 ? 'er' : ''} valgt
                    </span>
                  </div>
                )}
              </div>
            </DialogHeader>

            <div className="flex flex-1 overflow-hidden">
              {CategorySidebar}
              <div className="flex-1 flex flex-col overflow-hidden">
                {CatalogToolbar}
                <div className="flex-1 overflow-y-auto p-4">
                  {isLoadingCatalog ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <div className="animate-spin w-10 h-10 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full"></div>
                        <p className="text-gray-500">Laster produkter...</p>
                      </div>
                    </div>
                  ) : (
                    ProductList
                  )}
                </div>
              </div>
            </div>

            <div className="border-t bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {selectionCount > 0 && (
                    <>
                      <span className="font-medium">{selectionCount}</span> produkt{selectionCount !== 1 ? 'er' : ''} valgt
                      <span className="ml-4">
                        Total: <span className="font-semibold">{selectionTotal.toLocaleString('nb-NO')} kr</span>
                      </span>
                    </>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleCancel}>
                    Avbryt
                  </Button>
                  <Button onClick={handleConfirm} disabled={selectionCount === 0} className="min-w-32">
                    Legg til{selectionCount > 0 ? ` (${selectionCount})` : ''}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export const ProductCatalog = forwardRef(ProductCatalogComponent);
ProductCatalog.displayName = 'ProductCatalog';
