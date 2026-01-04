
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Category } from "@/lib/types";
import { deleteCategory, getIconComponent, isCategoryInUse } from "@/lib/data";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser } from "@/firebase";
import { AddCategoryDialog } from "./AddCategoryDialog";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { AddCategoryForm } from "./AddCategoryForm";

type CategoryListProps = {
  categories: Category[];
};

export function CategoryList({ categories }: CategoryListProps) {
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    const handleDelete = async (categoryId: string) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado.' });
            return;
        }

        const inUse = await isCategoryInUse(firestore, user.uid, categoryId);
        if (inUse) {
            toast({
                variant: 'destructive',
                title: 'Categoria em uso',
                description: 'Esta categoria está sendo usada em transações ou planejamentos e não pode ser excluída.',
            });
            return;
        }

        try {
            await deleteCategory(firestore, user.uid, categoryId);
            toast({ title: 'Sucesso', description: 'Categoria removida.' });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível remover a categoria.' });
        }
    };

    const openEditDialog = (category: Category) => {
        setSelectedCategory(category);
        setIsEditDialogOpen(true);
    };

    if (categories.length === 0) {
        return (
            <Card className="flex flex-col items-center justify-center h-96 border-dashed mt-4">
                <CardHeader className="text-center">
                    <CardTitle>Nenhuma categoria encontrada</CardTitle>
                    <CardDescription>Adicione sua primeira categoria para começar a organizar.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AddCategoryDialog />
                </CardContent>
            </Card>
        )
    }

  return (
    <div className="w-full mt-4 border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead className="hidden sm:table-cell">Tipo</TableHead>
            <TableHead className="text-right w-[40px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => {
            const Icon = getIconComponent(category.icon);
            return (
              <TableRow key={category.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-md">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <span className="font-medium">{category.name}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell capitalize">{category.type === 'income' ? 'Receita' : 'Despesa'}</TableCell>
                <TableCell>
                    <AddCategoryDialog 
                        open={isEditDialogOpen && selectedCategory?.id === category.id} 
                        onOpenChange={setIsEditDialogOpen} 
                        category={selectedCategory || undefined}
                    >
                        <AlertDialog>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => openEditDialog(category)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Editar
                                    </DropdownMenuItem>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Excluir
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Essa ação não pode ser desfeita. Isso excluirá permanentemente a categoria.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(category.id)} className="bg-destructive hover:bg-destructive/90">
                                        Excluir
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </AddCategoryDialog>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
