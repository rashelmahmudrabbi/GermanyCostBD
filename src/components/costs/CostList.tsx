'use client';

import { useState } from 'react';
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
import { Plus, Filter, X, ArrowUpDown } from 'lucide-react';
import costsData from '@/data/costs.json';

export function CostList() {
  const t = useT();
  const { items, activeStep, setActiveStep, language, reorderItems } = useStore();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedCategoryForAdd, setSelectedCategoryForAdd] = useState<string>('preparation');
  const [mobileEditingItem, setMobileEditingItem] = useState<UserCostItem | null>(null);

  const categories = costsData.categories;

  const filteredCategories = activeStep !== null
    ? categories.filter((_, idx) => idx === activeStep)
    : categories;

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

  return (
    <section className="space-y-6" id="cost-list">
      {/* Header and Filter Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>{t('costBreakdown')}</span>
            {activeStep !== null && (
              <Badge variant="outline" className="text-xs font-normal flex items-center gap-1 border-primary/50 text-primary">
                <Filter className="h-3 w-3" />
                {language === 'bn' ? categories[activeStep]?.labelBn : categories[activeStep]?.labelEn}
                <button
                  onClick={() => setActiveStep(null)}
                  className="ml-1 hover:text-foreground"
                  aria-label="Clear filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            {language === 'bn'
              ? 'প্রতিটি খরচ পরীক্ষা করুন, আপনার আনুমানিক খরচ লিখুন এবং ব্যবস্থা হলে টিক দিন'
              : 'Review each item, adjust your estimate, and check when arranged'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeStep !== null && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveStep(null)}
              className="text-xs h-8 text-muted-foreground"
            >
              {language === 'bn' ? 'সব ধাপ দেখুন' : 'Show all steps'}
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => {
              setSelectedCategoryForAdd(activeStep !== null ? categories[activeStep].id : 'preparation');
              setAddDialogOpen(true);
            }}
            className="h-8 text-xs gap-1.5 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('addItem')}
          </Button>
        </div>
      </div>

      {/* Category Cards */}
      <div className="space-y-6">
        {filteredCategories.map((category) => {
          const categoryItems = items
            .filter((i) => i.category === category.id)
            .sort((a, b) => a.order - b.order);

          const arrangedCount = categoryItems.filter((i) => i.arranged).length;
          const isAllArranged = categoryItems.length > 0 && arrangedCount === categoryItems.length;
          const stepIndex = categories.findIndex((c) => c.id === category.id);

          return (
            <Card
              key={category.id}
              id={`step-${stepIndex}`}
              className="scroll-mt-20 overflow-hidden border-border/80 shadow-sm transition-all"
            >
              <CardHeader className="bg-muted/30 py-3.5 px-4 md:px-6 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base md:text-lg flex items-center gap-2.5">
                    <span className="text-xl" role="img" aria-hidden="true">{category.icon}</span>
                    <span>{language === 'bn' ? category.labelBn : category.labelEn}</span>
                  </CardTitle>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={isAllArranged ? 'success' : 'secondary'}
                      className="text-xs px-2.5 py-0.5 font-mono"
                    >
                      {arrangedCount}/{categoryItems.length} {t('arranged')}
                    </Badge>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenAddForCategory(category.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title={t('addItem')}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 md:p-6 space-y-3">
                {categoryItems.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    {language === 'bn' ? 'এই ক্যাটাগরিতে কোনো আইটেম নেই' : 'No items in this category'}
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

                        {/* Reorder controls for desktop / keyboard */}
                        <div className="hidden group-hover/item:flex flex-col gap-0.5 opacity-60 hover:opacity-100 shrink-0">
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
