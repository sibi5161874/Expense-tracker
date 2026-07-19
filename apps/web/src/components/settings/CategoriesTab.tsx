'use client';

import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { CategoryForm } from '@/components/CategoryForm';
import { CategoryRow } from '@/components/settings/CategoryRow';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';
import type { Category } from '@repo/shared/types';

export function CategoriesTab() {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { data: categories, isLoading, error, deleteCategory, isDeleting } = useCategories();

  const handleDelete = useCallback((id: string) => deleteCategory(id), [deleteCategory]);
  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingCategory(null);
  }, []);

  if (isLoading) return <LoadingState label="Loading categories..." />;
  if (error) return <ErrorState error={error} />;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setShowForm(true)}>
          <Plus className="size-4" />
          Add Category
        </Button>
      </div>

      <div className="bg-card border-border/60 overflow-hidden rounded-2xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories?.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                onEdit={setEditingCategory}
                onDelete={handleDelete}
                isDeleting={isDeleting}
              />
            ))}
            {categories?.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground h-32 text-center">
                  No categories yet. Add your first category to start logging transactions.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {(showForm || editingCategory) && (
        <CategoryForm
          onSuccess={closeForm}
          onCancel={closeForm}
          editing={
            editingCategory
              ? { id: editingCategory.id, name: editingCategory.name, type: editingCategory.type }
              : undefined
          }
        />
      )}
    </div>
  );
}
