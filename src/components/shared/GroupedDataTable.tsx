"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ChevronDown, Edit2, Trash2 } from "lucide-react";
import { useEffect, useState, Fragment } from "react";
import { Card, CardContent, CardHeader } from "./Card";
import { PriceComponent, Product } from "@/lib/types";
import { ProductDetailsDrawer } from "@/components/katalog/ProductDetailsDrawer";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DEFAULT_CATEGORIES = [
  "materialer",
  "arbeid",
  "transport",
  "utstyr",
  "margin",
  "annet",
] as const;

const DEFAULT_CATEGORY_SET = new Set<string>(DEFAULT_CATEGORIES);

interface GroupedDataTableProps {
  items: PriceComponent[];
  onItemsChange?: (items: PriceComponent[]) => void;
  editable?: boolean;
  onOpenCatalog?: () => void;
  catalogOpen?: boolean;
  customCategories?: string[];
  onCustomCategoriesChange?: (categories: string[]) => void;
}

export default function GroupedDataTable({
  items = [],
  onItemsChange,
  editable = false,
  onOpenCatalog,
  catalogOpen = false,
  customCategories,
  onCustomCategoriesChange,
}: GroupedDataTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [localCustomCategories, setLocalCustomCategories] = useState<string[]>([]);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null);
  const [renameCategoryValue, setRenameCategoryValue] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDrawerOpen, setIsProductDrawerOpen] = useState(false);

  const activeCustomCategories = customCategories ?? localCustomCategories;
  const applyCustomCategoryUpdate = (updater: (prev: string[]) => string[]) => {
    if (onCustomCategoriesChange) {
      onCustomCategoriesChange(updater(customCategories ?? []));
    } else {
      setLocalCustomCategories((prev) => updater(prev));
    }
  };

  useEffect(() => {
    if (!editable) {
      setShowAddCategory(false);
      setNewCategoryName("");
    }
  }, [editable]);

  const handleOpenCatalog = () => {
    if (onOpenCatalog) {
      onOpenCatalog();
    }
  };

  const toggleGroup = (category: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedGroups(newExpanded);
  };

  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || "annet";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, PriceComponent[]>);

  const categoriesFromItems = Array.from(new Set(items.map((item) => item.category)));

  const mergedCustomCategories = Array.from(
    new Set([
      ...activeCustomCategories,
      ...categoriesFromItems.filter((category) => category && !DEFAULT_CATEGORY_SET.has(category)),
    ])
  );

  const categoriesWithItems = Object.keys(groupedItems);
  const customCategoriesToShow = editable
    ? mergedCustomCategories
    : mergedCustomCategories.filter((category) => (groupedItems[category] ?? []).length > 0);

  const categoryOrder = Array.from(
    new Set<string>([...categoriesWithItems, ...customCategoriesToShow])
  ).filter((category) => Boolean(category));

  const categoryEntries = categoryOrder.map((category) => ({
    category,
    items: groupedItems[category] ?? [],
    isCustom: !DEFAULT_CATEGORY_SET.has(category),
  }));

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      return;
    }

    const exists = categoryOrder.some((category) => category.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setShowAddCategory(false);
      setNewCategoryName("");
      return;
    }

    applyCustomCategoryUpdate((prev) => [...prev, trimmed]);
    setExpandedGroups((prev) => new Set(prev).add(trimmed));
    setShowAddCategory(false);
    setNewCategoryName("");
  };

  const handleDragStart = (event: React.DragEvent<HTMLTableRowElement>, itemId: string) => {
    if (!editable) return;
    event.dataTransfer.setData("text/plain", itemId);
    event.dataTransfer.effectAllowed = "move";
    setDraggedItemId(itemId);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverCategory(null);
  };

  const handleDragOver = (event: React.DragEvent<HTMLTableRowElement>, category: string) => {
    if (!editable || !draggedItemId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragOverCategory !== category) {
      setDragOverCategory(category);
    }
  };

  const handleDropOnCategory = (event: React.DragEvent<HTMLTableRowElement>, category: string) => {
    if (!editable || !draggedItemId) return;
    event.preventDefault();
    setDragOverCategory(null);

    const draggedItem = items.find((item) => item.id === draggedItemId);
    if (!draggedItem || draggedItem.category === category) {
      return;
    }

    const updatedItems = items.map((item) =>
      item.id === draggedItemId ? { ...item, category: category as PriceComponent["category"] } : item
    );

    onItemsChange?.(updatedItems);
    setExpandedGroups((prev) => new Set(prev).add(category));
    setDraggedItemId(null);
  };

  const handleStartRenameCategory = (category: string) => {
    setRenamingCategory(category);
    setRenameCategoryValue(category);
    setRenameError(null);
  };

  const handleRenameInputChange = (value: string) => {
    setRenameCategoryValue(value);
    if (!renamingCategory) return;
    const trimmed = value.trim();
    if (!trimmed || trimmed === renamingCategory) {
      setRenameError(null);
      return;
    }
    const conflict = categoryOrder.some(
      (category) => category.toLowerCase() === trimmed.toLowerCase() && category !== renamingCategory
    );
    setRenameError(conflict ? "Kategori finnes allerede" : null);
  };

  const handleSaveRenamedCategory = () => {
    if (!renamingCategory) return;
    const trimmed = renameCategoryValue.trim();
    if (!trimmed || renameError) return;

    applyCustomCategoryUpdate((prev) => prev.map((cat) => (cat === renamingCategory ? trimmed : cat)));

    const updatedItems = items.map((item) =>
      item.category === renamingCategory ? { ...item, category: trimmed as PriceComponent["category"] } : item
    );
    onItemsChange?.(updatedItems);

    setExpandedGroups((prev) => {
      const updated = new Set(prev);
      if (updated.delete(renamingCategory)) {
        updated.add(trimmed);
      }
      return updated;
    });

    setRenamingCategory(null);
    setRenameCategoryValue("");
    setRenameError(null);
  };

  const handleCancelRename = () => {
    setRenamingCategory(null);
    setRenameCategoryValue("");
    setRenameError(null);
  };

  const handleRemoveCategory = (category: string) => {
    if (!editable || DEFAULT_CATEGORY_SET.has(category)) return;

    applyCustomCategoryUpdate((prev) => prev.filter((cat) => cat !== category));

    if (renamingCategory === category) {
      handleCancelRename();
    }

    const updatedItems = items.map((item) =>
      item.category === category ? { ...item, category: "annet" as PriceComponent["category"] } : item
    );

    onItemsChange?.(updatedItems);
    setExpandedGroups((prev) => {
      const updated = new Set(prev);
      updated.delete(category);
      updated.add("annet");
      return updated;
    });
  };

  const handleRemoveItem = (itemId: string) => {
    if (!editable) return;
    const updatedItems = items.filter((item) => item.id !== itemId);
    onItemsChange?.(updatedItems);
  };

  const convertComponentToProduct = (component: PriceComponent): Product => {
    const timestamp = Date.now();
    return {
      id: component.id,
      produktnavn: component.name,
      produsent: component.produsent || "-",
      enhet: component.unit || "stk",
      enhetspris: component.unitPrice || 0,
      påslag: component.priceMarkup || 0,
      kategoriId: component.category || "annet",
      underkategoriId: "custom",
      beskrivelse: component.description,
      opprettet: timestamp,
      oppdatert: timestamp,
    };
  };

  const handleComponentClick = (component: PriceComponent) => {
    if (draggedItemId) return;
    const product = convertComponentToProduct(component);
    setSelectedProduct(product);
    setIsProductDrawerOpen(true);
  };

  const closeProductDrawer = () => {
    setIsProductDrawerOpen(false);
    setSelectedProduct(null);
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.unitPrice! * item.quantity! * (1 + item.priceMarkup! / 100));
  }, 0);
  
  const profit = items.reduce((sum, item) => {
    return sum + (item.unitPrice! * item.quantity! * (item.priceMarkup! / 100));
  }, 0);
  
  const mva = subtotal * 0.25; // 25% MVA
  const total = subtotal + mva;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h1 className="px-2 text-lg">Prisgrunnlag</h1>
            {editable && (
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setShowAddCategory((prev) => !prev)}>
                  Ny kategori
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="mr-2">Rediger</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-30" align="start">
                    <DropdownMenuGroup>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Legg til</DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={handleOpenCatalog}>fra katalog</DropdownMenuItem>
                            <DropdownMenuItem>ny vare</DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>

                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          {editable && showAddCategory && (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Kategorinavn..."
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                className="sm:flex-1"
              />
              <div className="flex gap-2">
                <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                  Legg til
                </Button>
                <Button variant="ghost" onClick={() => { setShowAddCategory(false); setNewCategoryName(""); }}>
                  Avbryt
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <Table>
              <TableHeader>
              <TableRow>
                <TableHead className="font-semibold text-foreground">Produktnavn</TableHead>
                <TableHead className="font-semibold text-foreground">AI-score</TableHead>
                <TableHead className="font-semibold text-foreground">Enhetspris</TableHead>
                <TableHead className="font-semibold text-foreground">Antall</TableHead>
                <TableHead className="font-semibold text-foreground">Påslag</TableHead>
                <TableHead className="font-semibold text-foreground">Pris</TableHead>
                {editable && <TableHead className="font-semibold text-right text-foreground">Handlinger</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryEntries.map(({ category, items: groupItems, isCustom }) => {
                const isExpanded = expandedGroups.has(category);
                return (
                  <Fragment key={category}>
                    <TableRow
                      className={cn(
                        "bg-muted/50 hover:bg-muted/70 cursor-pointer",
                        editable && dragOverCategory === category && "bg-primary/10 border border-primary/60"
                      )}
                      onClick={() => toggleGroup(category)}
                      onDragOver={(event) => handleDragOver(event, category)}
                      onDrop={(event) => handleDropOnCategory(event, category)}
                    >
                      <TableCell colSpan={editable ? 7 : 6}>
                        <div className="flex items-center gap-3">
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform duration-200",
                              !isExpanded && "-rotate-90"
                            )}
                          />
                          <span className="font-semibold">{category}</span>
                          <Badge variant="outline" className="ml-2">
                            {groupItems.length}
                          </Badge>
                          {editable && draggedItemId && (
                            <span className="text-xs text-muted-foreground">Dra komponenter hit</span>
                          )}
                          {editable && isCustom && (
                            <div className="ml-auto flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-muted-foreground"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleStartRenameCategory(category);
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-muted-foreground"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleRemoveCategory(category);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {editable && renamingCategory === category && (
                      <TableRow onClick={(event) => event.stopPropagation()}>
                        <TableCell colSpan={editable ? 7 : 6}>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Input
                              value={renameCategoryValue}
                              onChange={(event) => handleRenameInputChange(event.target.value)}
                              className="sm:flex-1"
                              placeholder="Nytt kategorinavn"
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={handleSaveRenamedCategory}
                                disabled={!renameCategoryValue.trim() || Boolean(renameError)}
                              >
                                Lagre
                              </Button>
                              <Button variant="ghost" onClick={handleCancelRename}>
                                Avbryt
                              </Button>
                            </div>
                          </div>
                          {renameError && (
                            <p className="mt-2 text-sm text-destructive">{renameError}</p>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                    {isExpanded && groupItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={editable ? 7 : 6} className="text-sm text-muted-foreground italic">
                          Ingen komponenter i denne kategorien
                        </TableCell>
                      </TableRow>
                    )}
                    {isExpanded &&
                      groupItems.map((item) => (
                        <TableRow
                          key={item.id}
                          draggable={editable}
                          onDragStart={(event) => handleDragStart(event, item.id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => handleComponentClick(item)}
                          className={cn("hover:bg-muted/40", editable && "cursor-grab")}
                        >
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.confidence}</TableCell>
                          <TableCell>
                            {item.unitPrice?.toLocaleString("no-NO", { style: "currency", currency: "NOK" })}
                          </TableCell>
                          <TableCell>
                            {item.quantity!} {item.unit}
                          </TableCell>
                          <TableCell>{item.priceMarkup}%</TableCell>
                          <TableCell>
                            {(item.unitPrice! * item.quantity! * (1 + item.priceMarkup! / 100)).toLocaleString("no-NO", {
                              style: "currency",
                              currency: "NOK",
                            })}
                          </TableCell>
                          {editable && (
                            <TableCell className="text-right">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleRemoveItem(item.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                  </Fragment>
                );
              })}
              {categoryEntries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={editable ? 7 : 6} className="py-6 text-center text-sm text-muted-foreground">
                    Ingen prisgrunnlag er lagt til enda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Summary Section */}
        <div className="mt-6">
          <div className="w-full rounded-lg border border-border bg-muted/30 px-6 py-4">
            <div className="flex justify-between items-center gap-8">
              <div className="flex items-center gap-2">
                <span className="text-md font-semibold text-foreground">Total: </span>
                <span className="font-medium">
                  {subtotal.toLocaleString("no-NO", { style: "currency", currency: "NOK" })}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Profitt ({((profit / (subtotal - profit)) * 100).toFixed(1)}%)</span>
                <span className="font-medium text-green-600">
                  +{profit.toLocaleString("no-NO", { style: "currency", currency: "NOK" })}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">MVA (25%)</span>
                <span className="font-medium">
                  {mva.toLocaleString("no-NO", { style: "currency", currency: "NOK" })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    {selectedProduct && (
      <ProductDetailsDrawer
        open={isProductDrawerOpen}
        onClose={closeProductDrawer}
        product={selectedProduct}
      />
    )}
    </>
  );
}
