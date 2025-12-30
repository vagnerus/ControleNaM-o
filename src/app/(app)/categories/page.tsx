
'use client';

import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Category } from '@/lib/types';
import { Header } from "@/components/common/Header";
import { AddCategoryDialog } from "@/components/categories/AddCategoryDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from 'lucide-react';
import { CategoryList } from '@/components/categories/CategoryList';

export default function CategoriesPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const categoriesQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, 'users', user.uid, 'categories'), orderBy('name', 'asc')) : null
  , [firestore, user]);

  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesQuery);
  
  const isLoading = categoriesLoading;

  if (isLoading) {
    return (
      <>
        <Header title="Categorias">
          <AddCategoryDialog />
        </Header>
        <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </>
    );
  }

  const safeCategories = categories || [];
  const incomeCategories = safeCategories.filter(c => c.type === 'income');
  const expenseCategories = safeCategories.filter(c => c.type === 'expense');

  return (
    <>
      <Header title="Categorias">
        <AddCategoryDialog />
      </Header>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Tabs defaultValue="expenses">
          <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
            <TabsTrigger value="expenses">Despesas</TabsTrigger>
            <TabsTrigger value="income">Receitas</TabsTrigger>
          </TabsList>
          <TabsContent value="expenses">
            <CategoryList categories={expenseCategories} />
          </TabsContent>
          <TabsContent value="income">
            <CategoryList categories={incomeCategories} />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
