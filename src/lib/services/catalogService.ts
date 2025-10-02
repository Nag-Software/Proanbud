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
import { Product, Category, Subcategory, ProductFormData, CategoryFormData, SubcategoryFormData } from '@/lib/types';

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

// ============================================================================
// CATEGORY OPERATIONS
// ============================================================================

/**
 * Get all categories for the current user
 */
export const getCategories = async (): Promise<Category[]> => {
  try {
    const userId = getCurrentUserId();
    const categoriesRef = ref(db, 'katalog');
    const snapshot = await get(categoriesRef);

    if (!snapshot.exists()) {
      return [];
    }

    const categories: Category[] = [];
    snapshot.forEach((categorySnapshot) => {
      const data = categorySnapshot.val();
      
      // Filter out subcategories (they have kategoriId property)
      if (!data.kategoriId) {
        categories.push({
          id: categorySnapshot.key!,
          navn: data.navn,
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
    const categoryRef = ref(db, `katalog/${categoryId}`);
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
    const categoriesRef = ref(db, 'katalog');
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
    const categoryRef = ref(db, `katalog/${categoryId}`);

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
    const categoryRef = ref(db, `katalog/${categoryId}`);
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
    const catalogRef = ref(db, 'katalog');
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
    const categoryRef = ref(db, `katalog/${categoryId}`);
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
 * Create a new subcategory
 */
export const createSubcategory = async (formData: SubcategoryFormData): Promise<string> => {
  try {
    const userId = getCurrentUserId();
    const categoryRef = ref(db, `katalog/${formData.kategoriId}`);
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
    const subcategoryRef = ref(db, `katalog/${categoryId}/${subcategoryId}`);

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
    const subcategoryRef = ref(db, `katalog/${categoryId}/${subcategoryId}`);
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
    const catalogRef = ref(db, 'katalog');
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
          products.push({
            id: itemSnapshot.key!,
            produktnavn: data.produktnavn,
            produsent: data.produsent || '',
            enhet: data.enhet || 'stk',
            enhetspris: data.enhetspris || 0,
            påslag: data.påslag || 0,
            kategoriId: data.kategoriId || categoryId,
            underkategoriId: data.underkategoriId || '',
            beskrivelse: data.beskrivelse || '',
            opprettet: data.opprettet || Date.now(),
            oppdatert: data.oppdatert || Date.now(),
          });
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
    const categoryRef = ref(db, `katalog/${categoryId}`);
    const snapshot = await get(categoryRef);

    if (!snapshot.exists()) {
      return [];
    }

    const products: Product[] = [];
    
    snapshot.forEach((itemSnapshot) => {
      const data = itemSnapshot.val();
      
      // Check if this is a product (has produktnavn)
      if (data.produktnavn) {
        products.push({
          id: itemSnapshot.key!,
          produktnavn: data.produktnavn,
          produsent: data.produsent || '',
          enhet: data.enhet || 'stk',
          enhetspris: data.enhetspris || 0,
          påslag: data.påslag || 0,
          kategoriId: data.kategoriId || categoryId,
          underkategoriId: data.underkategoriId || '',
          beskrivelse: data.beskrivelse || '',
          opprettet: data.opprettet || Date.now(),
          oppdatert: data.oppdatert || Date.now(),
        });
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
    const categoryRef = ref(db, `katalog/${categoryId}`);
    const snapshot = await get(categoryRef);

    if (!snapshot.exists()) {
      return [];
    }

    const products: Product[] = [];
    
    snapshot.forEach((itemSnapshot) => {
      const data = itemSnapshot.val();
      
      // Check if this is a product with matching subcategory
      if (data.produktnavn && data.underkategoriId === subcategoryId) {
        products.push({
          id: itemSnapshot.key!,
          produktnavn: data.produktnavn,
          produsent: data.produsent || '',
          enhet: data.enhet || 'stk',
          enhetspris: data.enhetspris || 0,
          påslag: data.påslag || 0,
          kategoriId: data.kategoriId || categoryId,
          underkategoriId: data.underkategoriId || '',
          beskrivelse: data.beskrivelse || '',
          opprettet: data.opprettet || Date.now(),
          oppdatert: data.oppdatert || Date.now(),
        });
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
    const productRef = ref(db, `katalog/${categoryId}/${productId}`);
    const snapshot = await get(productRef);

    if (!snapshot.exists()) {
      throw new Error('Produkt ikke funnet');
    }

    const data = snapshot.val();
    
    return {
      id: snapshot.key!,
      produktnavn: data.produktnavn,
      produsent: data.produsent || '',
      enhet: data.enhet || 'stk',
      enhetspris: data.enhetspris || 0,
      påslag: data.påslag || 0,
      kategoriId: data.kategoriId || categoryId,
      underkategoriId: data.underkategoriId || '',
      beskrivelse: data.beskrivelse || '',
      opprettet: data.opprettet || Date.now(),
      oppdatert: data.oppdatert || Date.now(),
    };
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
    const categoryRef = ref(db, `katalog/${formData.kategoriId}`);
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
    const productRef = ref(db, `katalog/${categoryId}/${productId}`);

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
    const catalogRef = ref(db, 'katalog');
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

    const productRef = ref(db, `katalog/${categoryId}/${productId}`);
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
