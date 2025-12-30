
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveBudget } from "@/lib/data";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import type { Budget, Category } from "@/lib/types";
import { useEffect } from "react";
import { collection, query, where } from "firebase/firestore";


const formSchema = z.object({
  categoryId: z.string({ required_error: "A categoria é obrigatória." }),
  amount: z.coerce.number().positive("O valor deve ser positivo."),
});

type AddBudgetFormProps = {
    onFinished?: () => void;
    budget?: Budget;
};

export function AddBudgetForm({ onFinished, budget }: AddBudgetFormProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const budgetsQuery = useMemoFirebase(() => 
    user ? collection(firestore, 'users', user.uid, 'budgets') : null
  , [firestore, user]);
  const { data: existingBudgets } = useCollection<Budget>(budgetsQuery);

  const categoriesQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, 'users', user.uid, 'categories'), where('type', '==', 'expense')) : null
  , [firestore, user]);
  const { data: expenseCategories } = useCollection<Category>(categoriesQuery);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: budget?.categoryId || "",
      amount: budget?.amount || 0,
    },
  });

  useEffect(() => {
    if (budget) {
      form.reset({
        categoryId: budget.categoryId,
        amount: budget.amount,
      });
    }
  }, [budget, form]);

  const availableCategories = expenseCategories?.filter(
    (cat) => 
        !existingBudgets?.some((b) => b.categoryId === cat.id) ||
        (budget && budget.categoryId === cat.id)
  );

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Erro!",
            description: "Você precisa estar logado.",
        });
        return;
    }

    const category = expenseCategories?.find(c => c.id === values.categoryId);
    if (!category) {
        toast({ variant: "destructive", title: "Erro!", description: "Categoria não encontrada." });
        return;
    }

    const payload = {
        ...values,
        categoryName: category.name,
    }

    try {
        saveBudget(firestore, user.uid, payload, budget?.id);
        toast({
            title: "Sucesso!",
            description: budget ? "Orçamento atualizado com sucesso." : "Orçamento adicionado com sucesso.",
        });
        form.reset();
        onFinished?.();
    } catch (error) {
        console.error("Error saving budget:", error);
        toast({
            variant: "destructive",
            title: "Erro!",
            description: "Não foi possível salvar o orçamento.",
        });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
         <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!!budget}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {budget && <SelectItem value={budget.categoryId}>{budget.categoryName}</SelectItem>}
                  {availableCategories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor do Orçamento</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Ex: 500.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Orçamento
        </Button>
      </form>
    </Form>
  );
}
