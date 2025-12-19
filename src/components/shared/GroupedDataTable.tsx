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
import { useEffect, useState, Fragment, useMemo } from "react";
import { Card, CardContent, CardHeader } from "./Card";
import { PriceComponent } from "@/lib/types";
import { PriceComponentDrawer } from "@/components/tilbud/PriceComponentDrawer";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
const FALLBACK_PROJECT_CATEGORY = "Ingen prosjekt";

interface GroupedDataTableProps {
  items: PriceComponent[];
  onItemsChange?: (items: PriceComponent[]) => void;
  editable?: boolean;
  onOpenCatalog?: () => void;
  catalogOpen?: boolean;
  customCategories?: string[];
  onCustomCategoriesChange?: (categories: string[]) => void;
  variant?: "default" | "public";
  enableProjectGrouping?: boolean;
}

export default function GroupedDataTable({
  items = [],
  onItemsChange,
  editable = false,
  onOpenCatalog,
  catalogOpen = false,
  customCategories,
  onCustomCategoriesChange,
  variant = "default",
  enableProjectGrouping = false,
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
  const [selectedComponent, setSelectedComponent] = useState<PriceComponent | null>(null);
  const [isComponentDrawerOpen, setIsComponentDrawerOpen] = useState(false);
  const [hiddenProjects, setHiddenProjects] = useState<Set<string>>(new Set());
  const [manualProjects, setManualProjects] = useState<string[]>([]);
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isAddManualComponentOpen, setIsAddManualComponentOpen] = useState(false);
  const [newComponentForm, setNewComponentForm] = useState({
    name: "",
    description: "",
    category: DEFAULT_CATEGORIES[0],
    project: FALLBACK_PROJECT_CATEGORY,
    quantity: "1",
    unit: "",
    unitPrice: "0",
  });
  const VAT_RATE = 0.25;
  const isPublicView = variant === "public";
  const showActionsColumn = editable && !isPublicView;
  const formatCurrency = (value: number) =>
    value.toLocaleString("no-NO", { style: "currency", currency: "NOK" });
  const applyMarkup = (value: number, markupPercent?: number | null) =>
    value * (1 + ((markupPercent ?? 0) / 100));
  const applyVat = (value: number) => value * (1 + VAT_RATE);
  const unitPriceWithMarkup = (item: PriceComponent) => applyMarkup(item.unitPrice ?? 0, item.priceMarkup);

  const activeCustomCategories = customCategories ?? localCustomCategories;
  const applyCustomCategoryUpdate = (updater: (prev: string[]) => string[]) => {
    if (onCustomCategoriesChange) {
      onCustomCategoriesChange(updater(customCategories ?? []));
    } else {
      setLocalCustomCategories((prev) => updater(prev));
    }
  };

  const getComponentTotal = (component: PriceComponent) => {
    if (typeof component.amount === "number") {
      return component.amount;
    }
    const quantity = component.quantity ?? 1;
    const unitPrice = component.unitPrice ?? 0;
    const markupMultiplier = 1 + ((component.priceMarkup ?? 0) / 100);
    return unitPrice * quantity * markupMultiplier;
  };

  const projectSummary = useMemo(() => {
    const groups: Record<string, PriceComponent[]> = {};
    const totals: Record<string, number> = {};

    items.forEach((component) => {
      const label = component.projectCategory?.trim() || FALLBACK_PROJECT_CATEGORY;
      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(component);
    });

    Object.entries(groups).forEach(([label, comps]) => {
      totals[label] = comps.reduce((sum, comp) => sum + getComponentTotal(comp), 0);
    });

    const order = Object.keys(groups).sort((a, b) => a.localeCompare(b, "nb-NO", { sensitivity: "base" }));

    return { groups, totals, order };
  }, [items]);

  const projectChipOrder = useMemo(() => {
    if (!enableProjectGrouping) {
      return [] as string[];
    }
    const combined = new Set<string>([...projectSummary.order, ...manualProjects]);
    return Array.from(combined).filter(Boolean).sort((a, b) => a.localeCompare(b, "nb-NO", { sensitivity: "base" }));
  }, [enableProjectGrouping, manualProjects, projectSummary.order]);

  const isProjectVisible = (project: string) => !hiddenProjects.has(project);

  const toggleProjectVisibility = (project: string) => {
    setHiddenProjects((prev) => {
      const next = new Set(prev);
      if (next.has(project)) {
        next.delete(project);
      } else {
        next.add(project);
      }
      return next;
    });
  };

  const resetProjectVisibility = () => {
    setHiddenProjects(new Set());
  };

  const handleCreateManualProject = () => {
    const trimmed = newProjectName.trim();
    if (!trimmed) return;
    const exists = projectChipOrder.some((project) => project.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setIsAddProjectDialogOpen(false);
      setNewProjectName("");
      return;
    }
    setManualProjects((prev) => [...prev, trimmed]);
    setHiddenProjects((prev) => {
      if (!prev.has(trimmed)) {
        return prev;
      }
      const next = new Set(prev);
      next.delete(trimmed);
      return next;
    });
    setIsAddProjectDialogOpen(false);
    setNewProjectName("");
  };

  useEffect(() => {
    if (!isAddProjectDialogOpen) {
      setNewProjectName("");
    }
  }, [isAddProjectDialogOpen]);

  const resetNewComponentForm = () => {
    setNewComponentForm({
      name: "",
      description: "",
      category: DEFAULT_CATEGORIES[0],
      project: FALLBACK_PROJECT_CATEGORY,
      quantity: "1",
      unit: "",
      unitPrice: "0",
    });
  };

  const updateNewComponentForm = <K extends keyof typeof newComponentForm>(field: K, value: string) => {
    setNewComponentForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateManualComponent = () => {
    if (!onItemsChange) return;

    const parsedQuantity = Number(newComponentForm.quantity);
    const parsedUnitPrice = Number(newComponentForm.unitPrice);
    const quantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1;
    const unitPrice = Number.isFinite(parsedUnitPrice) && parsedUnitPrice >= 0 ? parsedUnitPrice : 0;
    const projectValue =
      enableProjectGrouping && newComponentForm.project !== FALLBACK_PROJECT_CATEGORY
        ? newComponentForm.project
        : undefined;

    const newComponent: PriceComponent = {
      id: `manual-${Date.now()}`,
      name: newComponentForm.name.trim() || "Ny vare",
      description: newComponentForm.description.trim(),
      category: newComponentForm.category as PriceComponent["category"],
      projectCategory: projectValue,
      quantity,
      unit: newComponentForm.unit.trim() || undefined,
      unitPrice,
      amount: quantity * unitPrice,
      priceMarkup: 0,
      materialMarkup: 0,
      isEditable: true,
      confidence: 0,
    };

    onItemsChange([...items, newComponent]);
    setIsAddManualComponentOpen(false);
    resetNewComponentForm();
  };

  useEffect(() => {
    if (!isAddManualComponentOpen) {
      resetNewComponentForm();
    }
  }, [isAddManualComponentOpen]);

  useEffect(() => {
    if (!enableProjectGrouping) return;
    setHiddenProjects((prev) => {
      let hasChanges = false;
      const next = new Set(prev);
      const available = new Set([...projectSummary.order, ...manualProjects]);
      prev.forEach((project) => {
        if (!available.has(project)) {
          next.delete(project);
          hasChanges = true;
        }
      });
      return hasChanges ? next : prev;
    });
  }, [enableProjectGrouping, projectSummary.order, manualProjects]);

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

  const displayItems = enableProjectGrouping
    ? items.filter((item) => isProjectVisible(item.projectCategory?.trim() || FALLBACK_PROJECT_CATEGORY))
    : items;

  const groupedItems = displayItems.reduce((acc, item) => {
    const category = item.category || "annet";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, PriceComponent[]>);

  const categoriesFromItems = Array.from(new Set(displayItems.map((item) => item.category)));

  const hasItems = items.length > 0;
  const hasVisibleItems = displayItems.length > 0;
  const showHiddenProjectNotice = enableProjectGrouping && hasItems && !hasVisibleItems;
  const projectFilterActive = enableProjectGrouping && hiddenProjects.size > 0;
  const getProjectLabel = (value: string) => (value === FALLBACK_PROJECT_CATEGORY ? "Ingen prosjekt" : value);
  const canSaveNewComponent = Boolean(newComponentForm.name.trim() && onItemsChange);
  const normalizedProjectName = newProjectName.trim();
  const normalizedProjectNameLower = normalizedProjectName.toLowerCase();
  const projectNameExists =
    normalizedProjectNameLower === FALLBACK_PROJECT_CATEGORY.toLowerCase() ||
    projectChipOrder.some((project) => project.toLowerCase() === normalizedProjectNameLower);
  const canSaveNewProject = Boolean(normalizedProjectName) && !projectNameExists;

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

  const categoryOptions = useMemo(() => {
    return Array.from(
      new Set<string>([
        ...DEFAULT_CATEGORIES,
        ...mergedCustomCategories,
      ])
    ).filter((category) => Boolean(category));
  }, [mergedCustomCategories]);

  const projectOptions = useMemo(() => {
    if (!enableProjectGrouping) {
      return [FALLBACK_PROJECT_CATEGORY];
    }
    return Array.from(new Set([FALLBACK_PROJECT_CATEGORY, ...projectChipOrder]));
  }, [enableProjectGrouping, projectChipOrder]);

  const baseColumnCount = isPublicView ? 4 : 6 + (showActionsColumn ? 1 : 0);
  const columnCount = baseColumnCount + (enableProjectGrouping ? 1 : 0);

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

  const handleComponentClick = (component: PriceComponent) => {
    if (draggedItemId || isPublicView) return;
    setSelectedComponent(component);
    setIsComponentDrawerOpen(true);
  };

  const closeComponentDrawer = () => {
    setIsComponentDrawerOpen(false);
    setSelectedComponent(null);
  };

  const handleComponentSave = (updatedComponent: PriceComponent) => {
    if (!onItemsChange) {
      closeComponentDrawer();
      return;
    }

    const updatedItems = items.map((item) =>
      item.id === updatedComponent.id ? updatedComponent : item
    );
    onItemsChange(updatedItems);
    closeComponentDrawer();
  };

  // Calculate totals
  const subtotal = displayItems.reduce((sum, item) => {
    const unitPrice = item.unitPrice ?? 0;
    const quantity = item.quantity ?? 1;
    const markup = item.priceMarkup ?? 0;
    return sum + unitPrice * quantity * (1 + markup / 100);
  }, 0);
  
  const profit = displayItems.reduce((sum, item) => {
    const unitPrice = item.unitPrice ?? 0;
    const quantity = item.quantity ?? 1;
    const markup = item.priceMarkup ?? 0;
    return sum + unitPrice * quantity * (markup / 100);
  }, 0);
  
  const mva = subtotal * 0.25; // 25% MVA
  const total = subtotal + mva;
  const costBase = subtotal - profit;
  const profitPercentage = costBase > 0 ? (profit / costBase) * 100 : 0;

  return (
    <>
      <Card className={`${isPublicView ? '!border-none shadow-none' : ''}`}>
        {!isPublicView && (
        <CardHeader >
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
                              <DropdownMenuItem
                                onSelect={() => {
                                  setIsAddManualComponentOpen(true);
                                }}
                              >
                                ny vare
                              </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                      {enableProjectGrouping && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => setIsAddProjectDialogOpen(true)}>
                            nytt prosjekt
                          </DropdownMenuItem>
                        </>
                      )}

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
        )}
        <CardContent className={`${isPublicView ? '!p-0' : ''}`}>
          {enableProjectGrouping && (
            <div className="mb-4 rounded-lg border border-dashed border-primary/30 bg-muted/50 p-4">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Prosjekter</h4>
                  <p className="text-xs text-muted-foreground">Filtrer prislinjer per prosjekt og fokuser raskt på riktige grupper.</p>
                </div>
                {projectChipOrder.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary/80"
                      onClick={resetProjectVisibility}
                      disabled={!projectFilterActive}
                    >
                      Vis alle
                    </Button>
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {projectChipOrder.length > 0 ? (
                  projectChipOrder.map((project) => {
                    const count = projectSummary.groups[project]?.length ?? 0;
                    const total = projectSummary.totals[project] ?? 0;
                    const visible = isProjectVisible(project);
                    return (
                      <button
                        key={project}
                        type="button"
                        onClick={() => toggleProjectVisibility(project)}
                        className={cn(
                          "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          visible
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-border bg-white text-muted-foreground"
                        )}
                      >
                        <span>{getProjectLabel(project)}</span>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {count} linjer
                        </span>
                        <span className="text-xs font-semibold text-foreground">
                          {formatCurrency(total)}
                        </span>
                        {!visible && <span className="text-[10px] text-muted-foreground">(skjult)</span>}
                      </button>
                    );
                  })
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Legg til et prosjekt og tilordne linjer for å komme i gang.
                  </span>
                )}
              </div>
            </div>
          )}
          <div className="w-full overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <Table>
              <TableHeader>
              <TableRow>
                <TableHead className="font-semibold text-foreground">Produktnavn</TableHead>
                {enableProjectGrouping && (
                  <TableHead className="font-semibold text-foreground">Prosjekt</TableHead>
                )}
                {isPublicView ? (
                  <>
                    <TableHead className="font-semibold text-foreground">Antall</TableHead>
                    <TableHead className="font-semibold text-foreground">Enhetspris</TableHead>
                    <TableHead className="font-semibold text-foreground">Pris</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="font-semibold text-foreground">AI-score</TableHead>
                    <TableHead className="font-semibold text-foreground">Enhetspris</TableHead>
                    <TableHead className="font-semibold text-foreground">Antall</TableHead>
                    <TableHead className="font-semibold text-foreground">Påslag</TableHead>
                    <TableHead className="font-semibold text-foreground">Pris</TableHead>
                    {showActionsColumn && (
                      <TableHead className="font-semibold text-right text-foreground">Handlinger</TableHead>
                    )}
                  </>
                )}
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
                      <TableCell colSpan={columnCount}>
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
                        <TableCell colSpan={columnCount}>
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
                        <TableCell colSpan={columnCount} className="text-sm text-muted-foreground italic">
                          Ingen komponenter i denne kategorien
                        </TableCell>
                      </TableRow>
                    )}
                    {isExpanded &&
                      groupItems.map((item) => (
                        <TableRow
                          key={item.id}
                          draggable={editable && !isPublicView}
                          onDragStart={(event) => handleDragStart(event, item.id)}
                          onDragEnd={handleDragEnd}
                          onClick={isPublicView ? undefined : () => handleComponentClick(item)}
                          className={cn(
                            "hover:bg-muted/40",
                            editable && !isPublicView && "cursor-grab",
                            isPublicView && "cursor-default"
                          )}
                        >
                          <TableCell className="font-medium">{item.name}</TableCell>
                          {enableProjectGrouping && (
                            <TableCell className="text-sm text-muted-foreground">
                              {getProjectLabel(item.projectCategory?.trim() || FALLBACK_PROJECT_CATEGORY)}
                            </TableCell>
                          )}
                          {isPublicView ? (
                            <>
                              <TableCell>
                                {item.quantity ?? 1} {item.unit ?? "stk"}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(applyVat(unitPriceWithMarkup(item)))}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(
                                  applyVat(unitPriceWithMarkup(item) * (item.quantity ?? 1))
                                )}
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell>{item.confidence}</TableCell>
                              <TableCell>{formatCurrency(item.unitPrice ?? 0)}</TableCell>
                              <TableCell>
                                {item.quantity ?? 1} {item.unit ?? ""}
                              </TableCell>
                              <TableCell>{item.priceMarkup ?? 0}%</TableCell>
                              <TableCell>
                                {formatCurrency(
                                  applyMarkup((item.unitPrice ?? 0) * (item.quantity ?? 1), item.priceMarkup)
                                )}
                              </TableCell>
                              {showActionsColumn && (
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
                            </>
                          )}
                        </TableRow>
                      ))}
                  </Fragment>
                );
              })}
              {categoryEntries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columnCount} className="py-6 text-center text-sm text-muted-foreground">
                    {showHiddenProjectNotice
                      ? "Ingen prosjekter er synlige. Bruk filteret over for å vise minst én gruppe."
                      : "Ingen prisgrunnlag er lagt til enda."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Summary Section */}
        <div className="mt-6">
          <div className="w-full rounded-lg border border-border bg-muted/30 px-6 py-4">
            {isPublicView ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-md font-semibold text-foreground">Sum inkl. MVA: </span>
                  <span className="font-medium">{formatCurrency(total)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">MVA (25%)</span>
                  <span className="font-medium">{formatCurrency(mva)}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-md font-semibold text-foreground">Total:</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Profitt ({profitPercentage.toFixed(1)}%)
                  </span>
                  <span className="font-medium text-green-600">+{formatCurrency(profit)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">MVA (25%)</span>
                  <span className="font-medium">{formatCurrency(mva)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>

    {enableProjectGrouping && (
      <Dialog open={isAddProjectDialogOpen} onOpenChange={setIsAddProjectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nytt prosjekt</DialogTitle>
            <DialogDescription>Opprett et prosjekt du kan filtrere på og knytte prislinjer til.</DialogDescription>
          </DialogHeader>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Prosjektnavn</label>
            <Input
              value={newProjectName}
              onChange={(event) => setNewProjectName(event.target.value)}
              placeholder="F.eks. Tilbygg inngangsparti"
              autoFocus
            />
            {normalizedProjectName && projectNameExists && (
              <p className="mt-1 text-xs text-destructive">Prosjektnavnet finnes allerede.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddProjectDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleCreateManualProject} disabled={!canSaveNewProject}>
              Opprett prosjekt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )}

    <Dialog open={isAddManualComponentOpen} onOpenChange={setIsAddManualComponentOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ny prislinje</DialogTitle>
          <DialogDescription>Opprett en tom komponent du kan fylle ut senere eller redigere direkte i tabellen.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Navn</label>
            <Input
              value={newComponentForm.name}
              onChange={(event) => updateNewComponentForm("name", event.target.value)}
              placeholder="F.eks. Rigg og drift"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Kategori</label>
              <Select
                value={newComponentForm.category}
                onValueChange={(value) => updateNewComponentForm("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {enableProjectGrouping && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Prosjekt</label>
                <Select
                  value={newComponentForm.project}
                  onValueChange={(value) => updateNewComponentForm("project", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg prosjekt" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectOptions.map((project) => (
                      <SelectItem key={project} value={project}>
                        {getProjectLabel(project)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Beskrivelse</label>
            <Textarea
              value={newComponentForm.description}
              onChange={(event) => updateNewComponentForm("description", event.target.value)}
              placeholder="Kort beskrivelse (valgfritt)"
              rows={3}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Antall</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={newComponentForm.quantity}
                onChange={(event) => updateNewComponentForm("quantity", event.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Enhet</label>
              <Input
                value={newComponentForm.unit}
                onChange={(event) => updateNewComponentForm("unit", event.target.value)}
                placeholder="stk, m²"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Enhetspris</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={newComponentForm.unitPrice}
                onChange={(event) => updateNewComponentForm("unitPrice", event.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setIsAddManualComponentOpen(false)}
          >
            Avbryt
          </Button>
          <Button onClick={handleCreateManualComponent} disabled={!canSaveNewComponent}>
            Opprett komponent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {!isPublicView && selectedComponent && (
      <PriceComponentDrawer
        open={isComponentDrawerOpen}
        onClose={closeComponentDrawer}
        component={selectedComponent}
        onSave={handleComponentSave}
        readOnly={!editable || !onItemsChange}
        categoryOptions={Array.from(
          new Set<string>([
            ...DEFAULT_CATEGORIES,
            ...mergedCustomCategories,
          ])
        )}
        projectOptions={projectOptions}
      />
    )}
    </>
  );
}
