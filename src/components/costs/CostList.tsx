'use client';

import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { UserCostItem } from '@/types';
import { CostItemCard } from './CostItemCard';
import { AddItemDialog } from './AddItemDialog';
import { ItemEditSheet } from './ItemEditSheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Filter,
  X,
  Search,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  GraduationCap,
  Building2,
  Stamp,
  Home,
  Plane,
  LucideIcon,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { convertToBDT, getEffectiveRate } from '@/lib/budget';
import costsData from '@/data/costs.json';

type FilterType = 'all' | 'pending' | 'arranged' | 'EUR' | 'BDT';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  preparation: FileText,
  university: GraduationCap,
  'blocked-account': Building2,
  visa: Stamp,
  'housing-ticket': Home,
  arrival: Plane,
};

export function CostList() {
  const t = useT();
  const { items, activeStep, setActiveStep, language, exchangeRate } = useStore();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedCategoryForAdd, setSelectedCategoryForAdd] = useState<string>('preparation');
  const [mobileEditingItem, setMobileEditingItem] = useState<UserCostItem | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');

  // Accordion open/close state: active step or first category open by default
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    preparation: true,
  });

  const categories = costsData.categories;

  const effectiveRate = getEffectiveRate(
    exchangeRate.manualOverride ? (exchangeRate.manualRate || exchangeRate.rate) : exchangeRate.rate,
    exchangeRate.bankMargin
  );

  const toggleCategory = (catId: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleOpenAddForCategory = (catId: string) => {
    setSelectedCategoryForAdd(catId);
    setAddDialogOpen(true);
  };

  // Filter categories by active step if selected
  const visibleCategories = activeStep !== null
    ? categories.filter((_, idx) => idx === activeStep)
    : categories;

  // Search and filter logic
  const filteredItemsByCategory = useMemo(() => {
    const map: Record<string, UserCostItem[]> = {};
    const query = searchQuery.trim().toLowerCase();

    for (const cat of categories) {
      const catItems = items
        .filter((i) => i.category === cat.id)
        .sort((a, b) => a.order - b.order)
        .filter((item) => {
          if (statusFilter === 'pending' && item.arranged) return false;
          if (statusFilter === 'arranged' && !item.arranged) return false;
          if (statusFilter === 'EUR' && item.currency !== 'EUR') return false;
          if (statusFilter === 'BDT' && item.currency !== 'BDT') return false;

          if (query) {
            const matchBn = item.labelBn?.toLowerCase().includes(query);
            const matchEn = item.labelEn?.toLowerCase().includes(query);
            const matchNoteBn = item.noteBn?.toLowerCase().includes(query);
            const matchNoteEn = item.noteEn?.toLowerCase().includes(query);
            return matchBn || matchEn || matchNoteBn || matchNoteEn;
          }

          return true;
        });

      map[cat.id] = catItems;
    }

    return map;
  }, [items, categories, searchQuery, statusFilter]);

  return (
    <section className="space-y-4" id="cost-list">
      {/* Search Bar & Quick Filters */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/70 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 text-xs sm:text-sm bg-muted/40 focus-visible:ring-1 border-border/70"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Add Item Button */}
          <Button
            size="sm"
            onClick={() => {
              setSelectedCategoryForAdd(activeStep !== null ? categories[activeStep].id : 'preparation');
              setAddDialogOpen(true);
            }}
            className="h-9 text-xs gap-1.5 shadow-2xs shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{t('addItem')}</span>
          </Button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
          <span className="text-muted-foreground text-[11px] font-semibold uppercase pr-1 shrink-0 flex items-center gap-1">
            <Filter className="h-3 w-3" />
            {language === 'bn' ? 'ফিল্টার:' : 'Filter:'}
          </span>

          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-primary text-primary-foreground shadow-2xs font-semibold'
                : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('filterAll')}
          </button>

          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-2xs font-semibold'
                : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="h-3 w-3" />
            <span>{t('filterPending')}</span>
          </button>

          <button
            onClick={() => setStatusFilter('arranged')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
              statusFilter === 'arranged'
                ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <CheckCircle className="h-3 w-3" />
            <span>{t('filterArranged')}</span>
          </button>

          <button
            onClick={() => setStatusFilter('EUR')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 font-mono cursor-pointer ${
              statusFilter === 'EUR'
                ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('filterEUR')}
          </button>

          <button
            onClick={() => setStatusFilter('BDT')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 font-mono cursor-pointer ${
              statusFilter === 'BDT'
                ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('filterBDT')}
          </button>

          {activeStep !== null && (
            <button
              onClick={() => setActiveStep(null)}
              className="ml-auto px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span>{language === 'bn' ? 'ধাপ ফিল্টার বাতিল' : 'Clear step filter'}</span>
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Category Accordion Cards */}
      <div className="space-y-4">
        {visibleCategories.map((category) => {
          const categoryItems = filteredItemsByCategory[category.id] || [];
          const allItemsInCat = items.filter((i) => i.category === category.id);
          const arrangedInCat = allItemsInCat.filter((i) => i.arranged).length;
          const isCategoryComplete = allItemsInCat.length > 0 && arrangedInCat === allItemsInCat.length;

          const categoryTotalBDT = categoryItems.reduce((acc, item) => {
            return acc + convertToBDT(item.estimate, item.currency, effectiveRate, 0);
          }, 0);

          const stepIndex = categories.findIndex((c) => c.id === category.id);
          const isOpen = activeStep === stepIndex || openCategories[category.id] !== false || searchQuery.length > 0;
          const Icon = CATEGORY_ICONS[category.id] || FileText;

          return (
            <Card
              key={category.id}
              id={`step-${stepIndex}`}
              className="scroll-mt-24 overflow-hidden border-border/70 shadow-xs transition-all"
            >
              {/* Category Collapsible Header */}
              <div
                onClick={() => toggleCategory(category.id)}
                className="bg-muted/30 hover:bg-muted/50 py-3 px-4 md:px-5 border-b border-border/40 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-sm md:text-base font-bold leading-tight truncate">
                      {language === 'bn' ? category.labelBn : category.labelEn}
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                      {language === 'bn' ? 'মোট: ' : 'Total: '}
                      <span className="font-semibold text-foreground">
                        {formatCurrency(categoryTotalBDT, 'BDT', language)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={isCategoryComplete ? 'success' : 'secondary'}
                    className="text-xs px-2 py-0.5 font-mono font-medium"
                  >
                    {language === 'bn'
                      ? `${formatNumber(arrangedInCat, language)} / ${formatNumber(allItemsInCat.length, language)}`
                      : `${arrangedInCat} / ${allItemsInCat.length}`}
                  </Badge>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenAddForCategory(category.id);
                    }}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/80"
                    title={t('addItem')}
                  >
                    <Plus className="h-4 w-4" />
                  </button>

                  <div className="text-muted-foreground">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              </div>

              {/* Items List */}
              {isOpen && (
                <CardContent className="p-3 sm:p-4 space-y-2.5">
                  {categoryItems.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground">
                      {searchQuery || statusFilter !== 'all'
                        ? (language === 'bn' ? 'এই ফিল্টারে কোনো খরচ পাওয়া যায়নি' : 'No items match current filters')
                        : (language === 'bn' ? 'এই ক্যাটাগরিতে কোনো আইটেম নেই' : 'No items in this category')}
                    </div>
                  ) : (
                    categoryItems.map((item) => (
                      <CostItemCard
                        key={item.id}
                        item={item}
                        onOpenMobileEdit={(selectedItem) => setMobileEditingItem(selectedItem)}
                      />
                    ))
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Dialog for adding custom item */}
      <AddItemDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        defaultCategory={selectedCategoryForAdd}
      />

      {/* Bottom Sheet for Mobile Edit */}
      <ItemEditSheet
        item={mobileEditingItem}
        open={Boolean(mobileEditingItem)}
        onOpenChange={(open) => !open && setMobileEditingItem(null)}
      />
    </section>
  );
}
