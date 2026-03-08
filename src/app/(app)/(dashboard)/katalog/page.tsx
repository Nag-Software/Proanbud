'use client';

import { PageHeader } from "@/components/shared/PageHeader";
import { useState, useEffect } from "react";
import { Plus, Search, ChevronRight, ChevronDown, Edit, Trash2, Package } from "lucide-react";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/ui/button";
import { Product, Category, Subcategory } from "@/lib/types";
import {
    getCategories,
    getSubcategories,
    getProducts,
    deleteProduct,
    deleteCategory,
    deleteSubcategory,
} from "@/lib/services/catalogService";
import { NewProductDrawer } from "@/components/katalog/NewProductDrawer";
import { NewCategoryDrawer } from "@/components/katalog/NewCategoryDrawer";
import { ProductDetailsDrawer } from "@/components/katalog/ProductDetailsDrawer";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ErrorDialog } from "@/components/shared/ErrorDialog";
import { DataTable } from "@/components/ui/data-table";
import { getProductColumns } from "@/lib/table-columns/products-columns";

interface CategoryWithSubcategories extends Category {
    subcategories: Subcategory[];
}

export default function KatalogPage() {
    const [categories, setCategories] = useState<CategoryWithSubcategories[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
    const [isProductDrawerOpen, setIsProductDrawerOpen] = useState(false);
    const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false);
    const [errorDialog, setErrorDialog] = useState<{ isOpen: boolean; message: string }>({
        isOpen: false,
        message: '',
    });

    const { dialogState, confirm } = useConfirmDialog();

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterProducts();
    }, [products, selectedCategory, selectedSubcategory]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [categoriesData, subcategoriesData, productsData] = await Promise.all([
                getCategories(),
                getSubcategories(),
                getProducts(),
            ]);

            // Organize categories with their subcategories
            const categoriesWithSubs: CategoryWithSubcategories[] = categoriesData.map((cat: Category) => ({
                ...cat,
                subcategories: subcategoriesData.filter((sub: Subcategory) => sub.kategoriId === cat.id),
            }));

            setCategories(categoriesWithSubs);
            setProducts(productsData);
        } catch (error) {
            console.error('Error loading catalog data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterProducts = () => {
        let filtered = [...products];

        // Filter by category
        if (selectedCategory) {
            filtered = filtered.filter(p => p.kategoriId === selectedCategory);
        }

        // Filter by subcategory
        if (selectedSubcategory) {
            filtered = filtered.filter(p => p.underkategoriId === selectedSubcategory);
        }

        setFilteredProducts(filtered);
    };

    const toggleCategory = (categoryId: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId);
        } else {
            newExpanded.add(categoryId);
        }
        setExpandedCategories(newExpanded);
    };

    const handleCategoryClick = (categoryId: string) => {
        setSelectedCategory(categoryId);
        setSelectedSubcategory(null);
    };

    const handleSubcategoryClick = (categoryId: string, subcategoryId: string) => {
        setSelectedCategory(categoryId);
        setSelectedSubcategory(subcategoryId);
    };

    const handleDeleteProduct = async (productId: string) => {
        const confirmed = await confirm({
            title: 'Slett produkt',
            description: 'Er du sikker på at du vil slette dette produktet?',
            confirmText: 'Slett',
            cancelText: 'Avbryt',
            variant: 'destructive',
        });

        if (!confirmed) return;

        try {
            await deleteProduct(productId);
            await loadData();
        } catch (error: any) {
            setErrorDialog({
                isOpen: true,
                message: `Feil ved sletting: ${error.message}`,
            });
        }
    };

    const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
        const confirmed = await confirm({
            title: 'Slett kategori',
            description: `Er du sikker på at du vil slette kategorien "${categoryName}"?\n\nAdvarsel: Dette vil også slette alle underkategorier og produkter i denne kategorien.`,
            confirmText: 'Slett',
            cancelText: 'Avbryt',
            variant: 'destructive',
        });

        if (!confirmed) return;

        try {
            await deleteCategory(categoryId);
            // Reset selection if deleted category was selected
            if (selectedCategory === categoryId) {
                setSelectedCategory(null);
                setSelectedSubcategory(null);
            }
            await loadData();
        } catch (error: any) {
            setErrorDialog({
                isOpen: true,
                message: `Feil ved sletting: ${error.message}`,
            });
        }
    };

    const handleDeleteSubcategory = async (categoryId: string, subcategoryId: string, subcategoryName: string) => {
        const confirmed = await confirm({
            title: 'Slett underkategori',
            description: `Er du sikker på at du vil slette underkategorien "${subcategoryName}"?\n\nAdvarsel: Dette vil også slette alle produkter i denne underkategorien.`,
            confirmText: 'Slett',
            cancelText: 'Avbryt',
            variant: 'destructive',
        });

        if (!confirmed) return;

        try {
            await deleteSubcategory(categoryId, subcategoryId);
            // Reset selection if deleted subcategory was selected
            if (selectedSubcategory === subcategoryId) {
                setSelectedSubcategory(null);
            }
            await loadData();
        } catch (error: any) {
            setErrorDialog({
                isOpen: true,
                message: `Feil ved sletting: ${error.message}`,
            });
        }
    };

    const handleProductClick = (product: Product) => {
        setSelectedProduct(product);
        setIsProductDetailsOpen(true);
    };

    const calculateFinalPrice = (enhetspris: number, påslag: number) => {
        return enhetspris * (1 + påslag / 100);
    };

    if (loading) {
        return (
            <>
                <PageHeader title="Katalog" />
                <div className="p-6">
                    <p>Laster...</p>
                </div>
            </>
        );
    }

    return (
        <div className="w-full min-h-full px-3 lg:px-6 pt-4 pb-3 lg:pb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-0">
                <PageHeader title="Katalog"/>
                <div className="flex flex-row gap-3 mb-6 sm:mb-0">
                    <Button
                        variant="outline"
                        onClick={() => setIsCategoryDrawerOpen(true)}
                        className="flex-1 lg:flex-none"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Ny kategori
                    </Button>
                    <Button 
                        onClick={() => setIsProductDrawerOpen(true)}
                        className="flex-1 lg:flex-none"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nytt produkt
                    </Button>
                </div>
            </div>

            <div className="">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left sidebar - Categories */}
                    <div className="lg:col-span-1">
                        <Card className="p-4">
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold mb-2">Kategorier</h3>
                                <button
                                    onClick={() => {
                                        setSelectedCategory(null);
                                        setSelectedSubcategory(null);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                        !selectedCategory
                                            ? 'bg-blue-50 text-blue-700 font-medium'
                                            : 'hover:bg-gray-50'
                                    }`}
                                >
                                    Alle produkter ({products.length})
                                </button>
                            </div>

                            <div className="space-y-1">
                                {categories.map(category => (
                                    <div key={category.id}>
                                        <div className="flex items-center group">
                                            <button
                                                onClick={() => toggleCategory(category.id)}
                                                className="p-1 hover:bg-gray-100 rounded"
                                            >
                                                {expandedCategories.has(category.id) ? (
                                                    <ChevronDown className="w-4 h-4" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleCategoryClick(category.id)}
                                                className={`flex-1 text-left px-2 py-2 rounded-md text-sm transition-colors ${
                                                    selectedCategory === category.id && !selectedSubcategory
                                                        ? 'bg-blue-50 text-blue-700 font-medium'
                                                        : 'hover:bg-gray-50'
                                                }`}
                                            >
                                                {category.navn}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteCategory(category.id, category.navn);
                                                }}
                                                className="p-1 text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Slett kategori"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {expandedCategories.has(category.id) && (
                                            <div className="ml-6 mt-1 space-y-1">
                                                {category.subcategories.map(sub => (
                                                    <div key={sub.id} className="flex items-center group">
                                                        <button
                                                            onClick={() => handleSubcategoryClick(category.id, sub.id)}
                                                            className={`flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                                                selectedSubcategory === sub.id
                                                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                                                    : 'hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            {sub.navn}
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteSubcategory(category.id, sub.id, sub.navn);
                                                            }}
                                                            className="p-1 mr-2 text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="Slett underkategori"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Right content - Products */}
                    <div className="lg:col-span-3">
                        <Card className="p-6">
                            {/* Products table */}
                            {filteredProducts.length === 0 ? (
                                <div className="text-center py-12">
                                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Ingen produkter funnet
                                    </h3>
                                    <p className="text-gray-500 mb-4">
                                        {searchTerm
                                            ? 'Prøv et annet søk'
                                            : 'Kom i gang ved å legge til ditt første produkt'}
                                    </p>
                                    {!searchTerm && (
                                        <Button onClick={() => setIsProductDrawerOpen(true)}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Legg til produkt
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <DataTable
                                    columns={getProductColumns(
                                        handleProductClick,
                                        handleDeleteProduct,
                                        calculateFinalPrice
                                    )}
                                    data={filteredProducts}
                                    searchKey="produktnavn"
                                    searchPlaceholder="Søk etter produkter..."
                                    onRowClick={handleProductClick}
                                />
                            )}
                        </Card>
                    </div>
                </div>
            </div>

            {/* Drawers */}
            <NewProductDrawer
                open={isProductDrawerOpen}
                onClose={() => setIsProductDrawerOpen(false)}
                onSuccess={loadData}
            />

            <NewCategoryDrawer
                open={isCategoryDrawerOpen}
                onClose={() => setIsCategoryDrawerOpen(false)}
                onSuccess={loadData}
            />

            {selectedProduct && (
                <ProductDetailsDrawer
                    open={isProductDetailsOpen}
                    onClose={() => {
                        setIsProductDetailsOpen(false);
                        setSelectedProduct(null);
                    }}
                    product={selectedProduct}
                    onUpdate={loadData}
                />
            )}

            {/* Dialogs */}
            <ConfirmDialog dialogState={dialogState} />
            <ErrorDialog
                isOpen={errorDialog.isOpen}
                message={errorDialog.message}
                onClose={() => setErrorDialog({ isOpen: false, message: '' })}
            />
        </div>
    );
}