import { 
  ref,
  push,
  set,
  get,
  update,
  remove,
  DataSnapshot,
  serverTimestamp
} from 'firebase/database';
import { db, auth } from '@/lib/firebase';
import {
  Product,
  Category,
  Subcategory,
  ProductFormData,
  CategoryFormData,
  SubcategoryFormData,
  PriceList,
  PriceListColumnMapping,
  PriceListImportRow,
} from '@/lib/types';

// Helper function to ensure user is authenticated
const getCurrentUserId = (): string => {
  if (!auth.currentUser) {
    throw new Error('User not authenticated. Please log in.');
  }
  return auth.currentUser.uid;
};

// Enhanced error handling function for Realtime Database
const handleDatabaseError = (error: any, operation: string): Error => {
  console.error(`Firebase Realtime Database ${operation} error:`, error);
  console.error('Error details:', {
    code: error.code,
    message: error.message,
    stack: error.stack
  });

  if (error.code === 'PERMISSION_DENIED') {
    return new Error(`Ingen tilgang til ${operation}. Vennligst logg inn på nytt.`);
  }
  
  if (error.code === 'NETWORK_ERROR') {
    return new Error(`Nettverksfeil under ${operation}. Sjekk internettforbindelsen din.`);
  }

  return new Error(`Feil under ${operation}: ${error.message}`);
};

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value !== 'string') return 0;

  const normalized = value
    .replace(/\s/g, '')
    .replace(/kr/gi, '')
    .replace(/%/g, '')
    .replace(/,/g, '.');

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapProductData = (id: string, data: any, fallbackCategoryId: string): Product => ({
  id,
  produktnavn: data.produktnavn,
  produsent: data.produsent || '',
  enhet: data.enhet || 'stk',
  enhetspris: data.enhetspris || 0,
  påslag: data.påslag || 0,
  kategoriId: data.kategoriId || fallbackCategoryId,
  underkategoriId: data.underkategoriId || '',
  beskrivelse: data.beskrivelse || '',
  sourcePriceListId: data.sourcePriceListId || '',
  sourcePriceListName: data.sourcePriceListName || '',
  varekategori: data.varekategori || '',
  ean: data.ean || '',
  nobb: data.nobb || '',
  veilPris: data.veilPris || 0,
  rabatt: data.rabatt || 0,
  minPris: data.minPris || 0,
  rawColumns: data.rawColumns || {},
  opprettet: data.opprettet || Date.now(),
  oppdatert: data.oppdatert || Date.now(),
});

const getOrCreateCategoryByName = async (userId: string, categoryName: string): Promise<string> => {
  const resolvedName = categoryName.trim() || 'Materialer';
  const catalogRef = ref(db, `users/${userId}/katalog`);
  const snapshot = await get(catalogRef);

  if (snapshot.exists()) {
    let existingId = '';
    snapshot.forEach((categorySnapshot) => {
      const data = categorySnapshot.val();
      if (!data?.kategoriId && typeof data?.navn === 'string' && data.navn.trim().toLowerCase() === resolvedName.toLowerCase()) {
        existingId = categorySnapshot.key || '';
      }
    });
    if (existingId) return existingId;
  }

  const newCategoryRef = push(catalogRef);
  await set(newCategoryRef, {
    navn: resolvedName,
    beskrivelse: 'Importert fra prisliste',
    opprettet: Date.now(),
    oppdatert: Date.now(),
  });
  return newCategoryRef.key!;
};

const getOrCreateSubcategoryByName = async (userId: string, categoryId: string, subcategoryName: string): Promise<string> => {
  const resolvedName = subcategoryName.trim() || 'Importert prisliste';
  const categoryRef = ref(db, `users/${userId}/katalog/${categoryId}`);
  const snapshot = await get(categoryRef);

  if (snapshot.exists()) {
    let existingId = '';
    snapshot.forEach((itemSnapshot) => {
      const data = itemSnapshot.val();
      if (data?.kategoriId && !data?.produktnavn && typeof data?.navn === 'string' && data.navn.trim().toLowerCase() === resolvedName.toLowerCase()) {
        existingId = itemSnapshot.key || '';
      }
    });
    if (existingId) return existingId;
  }

  const newSubcategoryRef = push(categoryRef);
  await set(newSubcategoryRef, {
    navn: resolvedName,
    kategoriId: categoryId,
    beskrivelse: 'Produkter importert fra CSV-prisliste',
    opprettet: Date.now(),
    oppdatert: Date.now(),
  });
  return newSubcategoryRef.key!;
};

const valueForRole = (row: PriceListImportRow, columns: PriceListColumnMapping[], role: PriceListColumnMapping['role']): string => {
  const column = columns.find(item => item.role === role);
  if (!column) return '';
  return row.values[column.index]?.trim() || '';
};

// ============================================================================
// CATEGORY OPERATIONS
// ============================================================================

/**
 * Get all categories for the current user
 */
export const getCategories = async (): Promise<Category[]> => {
  try {
    const userId = getCurrentUserId();
    const categoriesRef = ref(db, `users/${userId}/katalog`);
    const snapshot = await get(categoriesRef);

    if (!snapshot.exists()) {
      return [];
    }

    const categories: Category[] = [];
    snapshot.forEach((categorySnapshot) => {
      const data = categorySnapshot.val();

      if (!data || typeof data !== 'object') {
        return;
      }
      
      // Filter out subcategories (they have kategoriId property)
      if (!data.kategoriId) {
        const navn = typeof data.navn === 'string' ? data.navn.trim() : '';

        if (!navn) {
          console.warn('Ignorerer katalogoppføring uten navn', {
            id: categorySnapshot.key,
            keys: Object.keys(data),
          });
          return;
        }

        categories.push({
          id: categorySnapshot.key!,
          navn,
          beskrivelse: data.beskrivelse || '',
          opprettet: data.opprettet || Date.now(),
          oppdatert: data.oppdatert || Date.now(),
        });
      }
    });

    return categories.sort((a, b) => a.navn.localeCompare(b.navn));
  } catch (error: any) {
    throw handleDatabaseError(error, 'henting av kategorier');
  }
};

/**
 * Get a single category by ID
 */
export const getCategory = async (categoryId: string): Promise<Category> => {
  try {
    const userId = getCurrentUserId();
    const categoryRef = ref(db, `users/${userId}/katalog/${categoryId}`);
    const snapshot = await get(categoryRef);

    if (!snapshot.exists()) {
      throw new Error('Kategori ikke funnet');
    }

    const data = snapshot.val();
    
    return {
      id: snapshot.key!,
      navn: data.navn,
      beskrivelse: data.beskrivelse || '',
      opprettet: data.opprettet || Date.now(),
      oppdatert: data.oppdatert || Date.now(),
    };
  } catch (error: any) {
    throw handleDatabaseError(error, 'henting av kategori');
  }
};

/**
 * Create a new category
 */
export const createCategory = async (formData: CategoryFormData): Promise<string> => {
  try {
    const userId = getCurrentUserId();
    const categoriesRef = ref(db, `users/${userId}/katalog`);
    const newCategoryRef = push(categoriesRef);

    const categoryData = {
      navn: formData.navn,
      beskrivelse: formData.beskrivelse || '',
      opprettet: Date.now(),
      oppdatert: Date.now(),
    };

    await set(newCategoryRef, categoryData);
    return newCategoryRef.key!;
  } catch (error: any) {
    throw handleDatabaseError(error, 'oppretting av kategori');
  }
};

/**
 * Update an existing category
 */
export const updateCategory = async (categoryId: string, formData: Partial<CategoryFormData>): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const categoryRef = ref(db, `users/${userId}/katalog/${categoryId}`);

    const updates: any = {
      oppdatert: Date.now(),
    };

    if (formData.navn !== undefined) {
      updates.navn = formData.navn;
    }
    if (formData.beskrivelse !== undefined) {
      updates.beskrivelse = formData.beskrivelse;
    }

    await update(categoryRef, updates);
  } catch (error: any) {
    throw handleDatabaseError(error, 'oppdatering av kategori');
  }
};

/**
 * Delete a category (will also delete all subcategories and products within it)
 */
export const deleteCategory = async (categoryId: string): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const categoryRef = ref(db, `users/${userId}/katalog/${categoryId}`);
    await remove(categoryRef);
  } catch (error: any) {
    throw handleDatabaseError(error, 'sletting av kategori');
  }
};

// ============================================================================
// SUBCATEGORY OPERATIONS
// ============================================================================

/**
 * Get all subcategories for the current user
 */
export const getSubcategories = async (): Promise<Subcategory[]> => {
  try {
    const userId = getCurrentUserId();
    const catalogRef = ref(db, `users/${userId}/katalog`);
    const snapshot = await get(catalogRef);

    if (!snapshot.exists()) {
      return [];
    }

    const subcategories: Subcategory[] = [];
    
    // Iterate through categories
    snapshot.forEach((categorySnapshot) => {
      const categoryId = categorySnapshot.key!;
      
      // Iterate through items in each category
      categorySnapshot.forEach((itemSnapshot) => {
        const data = itemSnapshot.val();
        
        // Check if this is a subcategory (has kategoriId but not produktnavn)
        if (data.kategoriId && !data.produktnavn) {
          subcategories.push({
            id: itemSnapshot.key!,
            navn: data.navn,
            kategoriId: data.kategoriId,
            beskrivelse: data.beskrivelse || '',
            opprettet: data.opprettet || Date.now(),
            oppdatert: data.oppdatert || Date.now(),
          });
        }
      });
    });

    return subcategories.sort((a, b) => a.navn.localeCompare(b.navn));
  } catch (error: any) {
    throw handleDatabaseError(error, 'henting av underkategorier');
  }
};

/**
 * Get subcategories for a specific category
 */
export const getSubcategoriesByCategory = async (categoryId: string): Promise<Subcategory[]> => {
  try {
    const userId = getCurrentUserId();
    const categoryRef = ref(db, `users/${userId}/katalog/${categoryId}`);
    const snapshot = await get(categoryRef);

    if (!snapshot.exists()) {
      return [];
    }

    const subcategories: Subcategory[] = [];
    
    snapshot.forEach((itemSnapshot) => {
      const data = itemSnapshot.val();
      
      // Check if this is a subcategory (has kategoriId but not produktnavn)
      if (data.kategoriId && !data.produktnavn) {
        subcategories.push({
          id: itemSnapshot.key!,
          navn: data.navn,
          kategoriId: data.kategoriId,
          beskrivelse: data.beskrivelse || '',
          opprettet: data.opprettet || Date.now(),
          oppdatert: data.oppdatert || Date.now(),
        });
      }
    });

    return subcategories.sort((a, b) => a.navn.localeCompare(b.navn));
  } catch (error: any) {
    throw handleDatabaseError(error, 'henting av underkategorier');
  }
};

/**
 * Get a single subcategory by ID
 * Note: Since subcategories are stored under their parent category,
 * we search through all categories to find the subcategory
 */
export const getSubcategory = async (subcategoryId: string): Promise<Subcategory | null> => {
  try {
    const userId = getCurrentUserId();
    const catalogRef = ref(db, `users/${userId}/katalog`);
    const snapshot = await get(catalogRef);

    if (!snapshot.exists()) {
      return null;
    }

    // Search through all categories to find the subcategory
    let foundSubcategory: Subcategory | null = null;
    
    snapshot.forEach((categorySnapshot) => {
      categorySnapshot.forEach((itemSnapshot) => {
        if (itemSnapshot.key === subcategoryId) {
          const data = itemSnapshot.val();
          // Verify it's actually a subcategory (has kategoriId but not produktnavn)
          if (data.kategoriId && !data.produktnavn) {
            foundSubcategory = {
              id: itemSnapshot.key!,
              navn: data.navn,
              kategoriId: data.kategoriId,
              beskrivelse: data.beskrivelse || '',
              opprettet: data.opprettet || Date.now(),
              oppdatert: data.oppdatert || Date.now(),
            };
          }
        }
      });
    });

    return foundSubcategory;
  } catch (error: any) {
    throw handleDatabaseError(error, 'henting av underkategori');
  }
};

/**
 * Create a new subcategory
 */
export const createSubcategory = async (formData: SubcategoryFormData): Promise<string> => {
  try {
    const userId = getCurrentUserId();
    const categoryRef = ref(db, `users/${userId}/katalog/${formData.kategoriId}`);
    const newSubcategoryRef = push(categoryRef);

    const subcategoryData = {
      navn: formData.navn,
      kategoriId: formData.kategoriId,
      beskrivelse: formData.beskrivelse || '',
      opprettet: Date.now(),
      oppdatert: Date.now(),
    };

    await set(newSubcategoryRef, subcategoryData);
    return newSubcategoryRef.key!;
  } catch (error: any) {
    throw handleDatabaseError(error, 'oppretting av underkategori');
  }
};

/**
 * Update an existing subcategory
 */
export const updateSubcategory = async (
  categoryId: string,
  subcategoryId: string,
  formData: Partial<SubcategoryFormData>
): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const subcategoryRef = ref(db, `users/${userId}/katalog/${categoryId}/${subcategoryId}`);

    const updates: any = {
      oppdatert: Date.now(),
    };

    if (formData.navn !== undefined) {
      updates.navn = formData.navn;
    }
    if (formData.beskrivelse !== undefined) {
      updates.beskrivelse = formData.beskrivelse;
    }

    await update(subcategoryRef, updates);
  } catch (error: any) {
    throw handleDatabaseError(error, 'oppdatering av underkategori');
  }
};

/**
 * Delete a subcategory (will also delete all products within it)
 */
export const deleteSubcategory = async (categoryId: string, subcategoryId: string): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const subcategoryRef = ref(db, `users/${userId}/katalog/${categoryId}/${subcategoryId}`);
    await remove(subcategoryRef);
  } catch (error: any) {
    throw handleDatabaseError(error, 'sletting av underkategori');
  }
};

// ============================================================================
// PRODUCT OPERATIONS
// ============================================================================

/**
 * Get all products for the current user
 */
export const getProducts = async (): Promise<Product[]> => {
  try {
    const userId = getCurrentUserId();
    const catalogRef = ref(db, `users/${userId}/katalog`);
    const snapshot = await get(catalogRef);

    if (!snapshot.exists()) {
      return [];
    }

    const products: Product[] = [];
    
    // Iterate through categories
    snapshot.forEach((categorySnapshot) => {
      const categoryId = categorySnapshot.key!;
      
      // Iterate through items in each category
      categorySnapshot.forEach((itemSnapshot) => {
        const data = itemSnapshot.val();
        
        // Check if this is a product (has produktnavn)
        if (data.produktnavn) {
          products.push(mapProductData(itemSnapshot.key!, data, categoryId));
        }
      });
    });

    return products.sort((a, b) => a.produktnavn.localeCompare(b.produktnavn));
  } catch (error: any) {
    throw handleDatabaseError(error, 'henting av produkter');
  }
};

/**
 * Get products for a specific category
 */
export const getProductsByCategory = async (categoryId: string): Promise<Product[]> => {
  try {
    const userId = getCurrentUserId();
    const categoryRef = ref(db, `users/${userId}/katalog/${categoryId}`);
    const snapshot = await get(categoryRef);

    if (!snapshot.exists()) {
      return [];
    }

    const products: Product[] = [];
    
    snapshot.forEach((itemSnapshot) => {
      const data = itemSnapshot.val();
      
      // Check if this is a product (has produktnavn)
      if (data.produktnavn) {
        products.push(mapProductData(itemSnapshot.key!, data, categoryId));
      }
    });

    return products.sort((a, b) => a.produktnavn.localeCompare(b.produktnavn));
  } catch (error: any) {
    throw handleDatabaseError(error, 'henting av produkter');
  }
};

/**
 * Get products for a specific subcategory
 */
export const getProductsBySubcategory = async (categoryId: string, subcategoryId: string): Promise<Product[]> => {
  try {
    const userId = getCurrentUserId();
    const categoryRef = ref(db, `users/${userId}/katalog/${categoryId}`);
    const snapshot = await get(categoryRef);

    if (!snapshot.exists()) {
      return [];
    }

    const products: Product[] = [];
    
    snapshot.forEach((itemSnapshot) => {
      const data = itemSnapshot.val();
      
      // Check if this is a product with matching subcategory
      if (data.produktnavn && data.underkategoriId === subcategoryId) {
        products.push(mapProductData(itemSnapshot.key!, data, categoryId));
      }
    });

    return products.sort((a, b) => a.produktnavn.localeCompare(b.produktnavn));
  } catch (error: any) {
    throw handleDatabaseError(error, 'henting av produkter');
  }
};

/**
 * Get a single product by ID
 */
export const getProduct = async (categoryId: string, productId: string): Promise<Product> => {
  try {
    const userId = getCurrentUserId();
    const productRef = ref(db, `users/${userId}/katalog/${categoryId}/${productId}`);
    const snapshot = await get(productRef);

    if (!snapshot.exists()) {
      throw new Error('Produkt ikke funnet');
    }

    const data = snapshot.val();
    
    return mapProductData(snapshot.key!, data, categoryId);
  } catch (error: any) {
    throw handleDatabaseError(error, 'henting av produkt');
  }
};

/**
 * Create a new product
 */
export const createProduct = async (formData: ProductFormData): Promise<string> => {
  try {
    const userId = getCurrentUserId();
    
    // Products are stored under their category
    const categoryRef = ref(db, `users/${userId}/katalog/${formData.kategoriId}`);
    const newProductRef = push(categoryRef);

    const productData = {
      produktnavn: formData.produktnavn,
      produsent: formData.produsent,
      enhet: formData.enhet,
      enhetspris: formData.enhetspris,
      påslag: formData.påslag,
      kategoriId: formData.kategoriId,
      underkategoriId: formData.underkategoriId,
      beskrivelse: formData.beskrivelse || '',
      opprettet: Date.now(),
      oppdatert: Date.now(),
    };

    await set(newProductRef, productData);
    return newProductRef.key!;
  } catch (error: any) {
    throw handleDatabaseError(error, 'oppretting av produkt');
  }
};

/**
 * Update an existing product
 */
export const updateProduct = async (
  categoryId: string,
  productId: string,
  formData: Partial<ProductFormData>
): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const productRef = ref(db, `users/${userId}/katalog/${categoryId}/${productId}`);

    const updates: any = {
      oppdatert: Date.now(),
    };

    if (formData.produktnavn !== undefined) {
      updates.produktnavn = formData.produktnavn;
    }
    if (formData.produsent !== undefined) {
      updates.produsent = formData.produsent;
    }
    if (formData.enhet !== undefined) {
      updates.enhet = formData.enhet;
    }
    if (formData.enhetspris !== undefined) {
      updates.enhetspris = formData.enhetspris;
    }
    if (formData.påslag !== undefined) {
      updates.påslag = formData.påslag;
    }
    if (formData.underkategoriId !== undefined) {
      updates.underkategoriId = formData.underkategoriId;
    }
    if (formData.beskrivelse !== undefined) {
      updates.beskrivelse = formData.beskrivelse;
    }

    await update(productRef, updates);
  } catch (error: any) {
    throw handleDatabaseError(error, 'oppdatering av produkt');
  }
};

/**
 * Delete a product
 */
export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    
    // First, find which category the product belongs to
    const catalogRef = ref(db, `users/${userId}/katalog`);
    const snapshot = await get(catalogRef);

    if (!snapshot.exists()) {
      throw new Error('Katalog ikke funnet');
    }

    let categoryId: string | null = null;
    
    // Search through categories to find the product
    snapshot.forEach((categorySnapshot) => {
      categorySnapshot.forEach((itemSnapshot) => {
        if (itemSnapshot.key === productId) {
          categoryId = categorySnapshot.key!;
        }
      });
    });

    if (!categoryId) {
      throw new Error('Produkt ikke funnet');
    }

    const productRef = ref(db, `users/${userId}/katalog/${categoryId}/${productId}`);
    await remove(productRef);
  } catch (error: any) {
    throw handleDatabaseError(error, 'sletting av produkt');
  }
};

/**
 * Search products by name, manufacturer, or description
 */
export const searchProducts = async (searchTerm: string): Promise<Product[]> => {
  try {
    const allProducts = await getProducts();
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return allProducts.filter(product => 
      product.produktnavn.toLowerCase().includes(lowerSearchTerm) ||
      product.produsent.toLowerCase().includes(lowerSearchTerm) ||
      (product.beskrivelse && product.beskrivelse.toLowerCase().includes(lowerSearchTerm))
    );
  } catch (error: any) {
    throw handleDatabaseError(error, 'søk i produkter');
  }
};

export const getPriceLists = async (): Promise<PriceList[]> => {
  try {
    const userId = getCurrentUserId();
    const priceListsRef = ref(db, `users/${userId}/prislister`);
    const snapshot = await get(priceListsRef);

    if (!snapshot.exists()) return [];

    const priceLists: PriceList[] = [];
    snapshot.forEach((priceListSnapshot) => {
      const data = priceListSnapshot.val();
      priceLists.push({
        id: priceListSnapshot.key!,
        navn: data.navn || 'Prisliste',
        rowCount: data.rowCount || 0,
        columns: data.columns || [],
        opprettet: data.opprettet || Date.now(),
        oppdatert: data.oppdatert || Date.now(),
      });
    });

    return priceLists.sort((a, b) => b.oppdatert - a.oppdatert);
  } catch (error: any) {
    throw handleDatabaseError(error, 'henting av prislister');
  }
};

export const importPriceListProducts = async (
  priceListName: string,
  columns: PriceListColumnMapping[],
  rows: PriceListImportRow[]
): Promise<{ priceListId: string; importedCount: number }> => {
  try {
    const userId = getCurrentUserId();
    const priceListsRef = ref(db, `users/${userId}/prislister`);
    const newPriceListRef = push(priceListsRef);
    const priceListId = newPriceListRef.key!;
    const resolvedPriceListName = priceListName.trim() || `Prisliste ${new Date().toLocaleDateString('nb-NO')}`;
    let importedCount = 0;

    const rowsWithProduct = rows.filter(row => valueForRole(row, columns, 'produkt'));
    const categoryCache = new Map<string, string>();
    const subcategoryCache = new Map<string, string>();

    for (const row of rowsWithProduct) {
      const varekategori = valueForRole(row, columns, 'varekategori') || 'Materialer';
      let categoryId = categoryCache.get(varekategori);
      if (!categoryId) {
        categoryId = await getOrCreateCategoryByName(userId, varekategori);
        categoryCache.set(varekategori, categoryId);
      }

      const subcategoryCacheKey = `${categoryId}:${resolvedPriceListName}`;
      let subcategoryId = subcategoryCache.get(subcategoryCacheKey);
      if (!subcategoryId) {
        subcategoryId = await getOrCreateSubcategoryByName(userId, categoryId, resolvedPriceListName);
        subcategoryCache.set(subcategoryCacheKey, subcategoryId);
      }

      const produktnavn = valueForRole(row, columns, 'produkt');
      const veilPris = toNumber(valueForRole(row, columns, 'veilPris'));
      const minPris = toNumber(valueForRole(row, columns, 'minPris'));
      const rabatt = toNumber(valueForRole(row, columns, 'rabatt'));
      const enhetspris = minPris || (veilPris && rabatt ? Math.round(veilPris * (1 - rabatt / 100)) : veilPris);
      const rawColumns = columns.reduce<Record<string, string>>((acc, column) => {
        acc[column.displayName || column.originalName || `Kolonne ${column.index + 1}`] = row.values[column.index] || '';
        return acc;
      }, {});

      const productRef = push(ref(db, `users/${userId}/katalog/${categoryId}`));
      await set(productRef, {
        produktnavn,
        produsent: valueForRole(row, columns, 'produsent'),
        enhet: valueForRole(row, columns, 'enhet') || 'stk',
        enhetspris,
        påslag: 0,
        kategoriId: categoryId,
        underkategoriId: subcategoryId,
        beskrivelse: valueForRole(row, columns, 'beskrivelse'),
        sourcePriceListId: priceListId,
        sourcePriceListName: resolvedPriceListName,
        varekategori,
        ean: valueForRole(row, columns, 'ean'),
        nobb: valueForRole(row, columns, 'nobb'),
        veilPris,
        rabatt,
        minPris,
        rawColumns,
        opprettet: Date.now(),
        oppdatert: Date.now(),
      });
      importedCount += 1;
    }

    await set(newPriceListRef, {
      navn: resolvedPriceListName,
      rowCount: importedCount,
      columns,
      opprettet: Date.now(),
      oppdatert: Date.now(),
    });

    return { priceListId, importedCount };
  } catch (error: any) {
    throw handleDatabaseError(error, 'import av prisliste');
  }
};
