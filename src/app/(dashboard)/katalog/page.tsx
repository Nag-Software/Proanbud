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
    }, [products, searchTerm, selectedCategory, selectedSubcategory]);

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

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.produktnavn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.produsent.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.beskrivelse?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

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
            description: `Er du sikker på at du vil slette kategorien "${categoryName}"?\n\nMerk: Du må først slette alle underkategorier før du kan slette kategorien.`,
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

    const handleDeleteSubcategory = async (subcategoryId: string, subcategoryName: string) => {
        const confirmed = await confirm({
            title: 'Slett underkategori',
            description: `Er du sikker på at du vil slette underkategorien "${subcategoryName}"?\n\nMerk: Du må først slette alle produkter før du kan slette underkategorien.`,
            confirmText: 'Slett',
            cancelText: 'Avbryt',
            variant: 'destructive',
        });

        if (!confirmed) return;

        try {
            await deleteSubcategory(subcategoryId);
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
        <>
            <PageHeader title="Katalog">
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsCategoryDrawerOpen(true)}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Ny kategori
                    </Button>
                    <Button onClick={() => setIsProductDrawerOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nytt produkt
                    </Button>
                </div>
            </PageHeader>

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
                                                                handleDeleteSubcategory(sub.id, sub.navn);
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
                            {/* Search bar */}
                            <div className="mb-6">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Søk etter produkter..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

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
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-3 px-4 font-medium text-gray-700">Produktnavn</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-700">Produsent</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-700">Enhet</th>
                                                <th className="text-right py-3 px-4 font-medium text-gray-700">Enhetspris</th>
                                                <th className="text-right py-3 px-4 font-medium text-gray-700">Påslag</th>
                                                <th className="text-right py-3 px-4 font-medium text-gray-700">Pris m/påslag</th>
                                                <th className="text-right py-3 px-4 font-medium text-gray-700">Handlinger</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredProducts.map(product => (
                                                <tr
                                                    key={product.id}
                                                    className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                                                    onClick={() => handleProductClick(product)}
                                                >
                                                    <td className="py-3 px-4 font-medium">{product.produktnavn}</td>
                                                    <td className="py-3 px-4 text-gray-600">{product.produsent}</td>
                                                    <td className="py-3 px-4 text-gray-600">{product.enhet}</td>
                                                    <td className="py-3 px-4 text-right text-gray-600">
                                                        {product.enhetspris.toLocaleString('no-NO')} kr
                                                    </td>
                                                    <td className="py-3 px-4 text-right text-gray-600">
                                                        {product.påslag}%
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-medium">
                                                        {calculateFinalPrice(product.enhetspris, product.påslag).toLocaleString('no-NO')} kr
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteProduct(product.id);
                                                            }}
                                                            className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
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
        </>
    );
}