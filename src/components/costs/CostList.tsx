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
import { Plus, Filter, X, Search, CheckCircle, Clock, Euro, DollarSign, Layers } from 'lucide-react';
import { formatCurrency, toBanglaDigits } from '@/lib/utils';
import { convertToBDT, getEffectiveRate } from '@/lib/budget';
import costsData from '@/data/costs.json';

type FilterType = 'all' | 'pending' | 'arranged' | 'EUR' | 'BDT';

export function CostList() {
  const t = useT();
  const { items, activeStep, setActiveStep, language, reorderItems, exchangeRate } = useStore();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedCategoryForAdd, setSelectedCategoryForAdd] = useState<string>('preparation');
  const [mobileEditingItem, setMobileEditingItem] = useState<UserCostItem | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');

  const categories = costsData.categories;

  const effectiveRate = getEffectiveRate(
    exchangeRate.manualOverride ? (exchangeRate.manualRate || exchangeRate.rate) : exchangeRate.rate,
    exchangeRate.bankMargin
  );

  const handleOpenAddForCategory = (catId: string) => {
    setSelectedCategoryForAdd(catId);
    setAddDialogOpen(true);
  };

  const handleMoveItem = (categoryId: string, index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0) {
      reorderItems(categoryId, index, targetIndex);
    }
  };

  // Filter categories by active step
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
          // Status filter
          if (statusFilter === 'pending' && item.arranged) return false;
          if (statusFilter === 'arranged' && !item.arranged) return false;
          if (statusFilter === 'EUR' && item.currency !== 'EUR') return false;
          if (statusFilter === 'BDT' && item.currency !== 'BDT') return false;

          // Search query filter
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

  const totalFilteredCount = Object.values(filteredItemsByCategory).reduce((sum, list) => sum + list.length, 0);

  return (
    <section className="space-y-5" id="cost-list">
      {/* Search Bar & Quick Filters */}
      <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 text-xs sm:text-sm bg-muted/30 focus-visible:ring-1"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
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
            className="h-9 text-xs gap-1.5 shadow-xs shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>{t('addItem')}</span>
          </Button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          <span className="text-muted-foreground text-[11px] font-semibold uppercase pr-1 shrink-0 flex items-center gap-1">
            <Filter className="h-3 w-3" />
            {language === 'bn' ? 'ফিল্টার:' : 'Filter:'}
          </span>

          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 ${
              statusFilter === 'all'
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('filterAll')}
          </button>

          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1 ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="h-3 w-3" />
            <span>{t('filterPending')}</span>
          </button>

          <button
            onClick={() => setStatusFilter('arranged')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1 ${
              statusFilter === 'arranged'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <CheckCircle className="h-3 w-3" />
            <span>{t('filterArranged')}</span>
          </button>

          <button
            onClick={() => setStatusFilter('EUR')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 font-mono ${
              statusFilter === 'EUR'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('filterEUR')}
          </button>

          <button
            onClick={() => setStatusFilter('BDT')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 font-mono ${
              statusFilter === 'BDT'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('filterBDT')}
          </button>

          {activeStep !== null && (
            <button
              onClick={() => setActiveStep(null)}
              className="ml-auto px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium flex items-center gap-1 shrink-0"
            >
              <span>{language === 'bn' ? 'ধাপ ফিল্টার বাতিল' : 'Clear step filter'}</span>
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Category Accordion Cards */}
      <div className="space-y-5">
        {visibleCategories.map((category) => {
          const categoryItems = filteredItemsByCategory[category.id] || [];
          const allItemsInCat = items.filter((i) => i.category === category.id);
          const arrangedInCat = allItemsInCat.filter((i) => i.arranged).length;
          const isCategoryComplete = allItemsInCat.length > 0 && arrangedInCat === allItemsInCat.length;

          // Calculate category total BDT
          const categoryTotalBDT = categoryItems.reduce((acc, item) => {
            return acc + convertToBDT(item.estimate, item.currency, effectiveRate, 0);
          }, 0);

          const stepIndex = categories.findIndex((c) => c.id === category.id);

          return (
            <Card
              key={category.id}
              id={`step-${stepIndex}`}
              className="scroll-mt-24 overflow-hidden border-border/80 shadow-xs transition-all"
            >
              <CardHeader className="bg-muted/40 py-3.5 px-4 md:px-6 border-b border-border/50">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl" role="img" aria-hidden="true">
                      {category.icon}
                    </span>
                    <div className="min-w-0">
                      <CardTitle className="text-base md:text-lg font-bold leading-tight truncate">
                        {language === 'bn' ? category.labelBn : category.labelEn}
                      </CardTitle>
                      <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                        {language === 'bn' ? 'মোট আনুমানিক: ' : 'Total: '}
                        <span className="font-semibold text-foreground">
                          {formatCurrency(categoryTotalBDT, 'BDT', language)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={isCategoryComplete ? 'success' : 'secondary'}
                      className="text-xs px-2.5 py-0.5 font-mono font-medium"
                    >
                      {language === 'bn'
                        ? `${toBanglaDigits(String(arrangedInCat))}/${toBanglaDigits(String(allItemsInCat.length))} প্রস্তুত`
                        : `${arrangedInCat}/${allItemsInCat.length} arranged`}
                    </Badge>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenAddForCategory(category.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      title={t('addItem')}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 md:p-6 space-y-3">
                {categoryItems.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    {searchQuery || statusFilter !== 'all'
                      ? (language === 'bn' ? 'এই ফিল্টারে কোনো খরচ পাওয়া যায়নি' : 'No items match current filters')
                      : (language === 'bn' ? 'এই ক্যাটাগরিতে কোনো আইটেম নেই' : 'No items in this category')}
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {categoryItems.map((item, index) => (
                      <div key={item.id} className="relative group/item flex items-center gap-1.5">
                        <div className="flex-1">
                          <CostItemCard
                            item={item}
                            onOpenMobileEdit={(selectedItem) => setMobileEditingItem(selectedItem)}
                          />
                        </div>

                        {/* Reorder controls for desktop */}
                        <div className="hidden group-hover/item:flex flex-col gap-0.5 opacity-40 hover:opacity-100 shrink-0">
                          {index > 0 && (
                            <button
                              onClick={() => handleMoveItem(category.id, index, 'up')}
                              className="p-1 hover:bg-muted rounded text-[10px] text-muted-foreground"
                              title="Move up"
                            >
                              ▲
                            </button>
                          )}
                          {index < categoryItems.length - 1 && (
                            <button
                              onClick={() => handleMoveItem(category.id, index, 'down')}
                              className="p-1 hover:bg-muted rounded text-[10px] text-muted-foreground"
                              title="Move down"
                            >
                              ▼
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </AnimatePresence>
                )}
              </CardContent>
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
