
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { saveRecurringTransaction } from "@/lib/data";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect } from "react";
import type { Category, Account, RecurringTransaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { MagicInput } from "../common/MagicInput";

const formSchema = z.object({
  description: z.string().min(2, "A descrição é muito curta.").max(100),
  amount: z.coerce.number().positive("O valor deve ser positivo."),
  type: z.enum(["income", "expense"]),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  startDate: z.date(),
  endDate: z.date().optional(),
  categoryId: z.string().min(1, "A categoria é obrigatória."),
  accountId: z.string().min(1, "A conta é obrigatória."),
});

type AddRecurringFormProps = {
    onFinished?: () => void;
    transaction?: RecurringTransaction;
};

export function AddRecurringForm({ onFinished, transaction }: AddRecurringFormProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: transaction?.description || "",
      // @ts-ignore
      amount: transaction?.amount || undefined,
      // @ts-ignore
      type: transaction?.type || undefined,
      // @ts-ignore
      frequency: transaction?.frequency || undefined,
      // @ts-ignore
      startDate: transaction ? new Date(transaction.startDate) : undefined,
      endDate: transaction?.endDate ? new Date(transaction.endDate) : undefined,
      accountId: "",
      categoryId: "",
    },
  });

  const transactionType = form.watch("type");

  const categoriesQuery = useMemoFirebase(() => 
    user && transactionType ? query(collection(firestore, 'users', user.uid, 'categories'), where('type', '==', transactionType)) : null
  , [firestore, user, transactionType]);
  const { data: categories } = useCollection<Category>(categoriesQuery);

  const accountsQuery = useMemoFirebase(() =>
    user ? collection(firestore, 'users', user.uid, 'accounts') : null
  , [firestore, user]);
  const { data: accounts } = useCollection<Account>(accountsQuery);

  useEffect(() => {
    if (transaction) {
      form.reset({
        ...transaction,
        startDate: new Date(transaction.startDate),
        endDate: transaction.endDate ? new Date(transaction.endDate) : undefined,
      });
    }
  }, [transaction, form]);


  useEffect(() => {
    form.setValue("categoryId", "");
  }, [transactionType, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Erro!",
            description: "Você precisa estar logado.",
        });
        return;
    }
    
    const category = categories?.find(c => c.id === values.categoryId);
    const account = accounts?.find(a => a.id === values.accountId);

    const payload = {
        ...values,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate?.toISOString(),
        categoryName: category?.name,
        accountName: account?.name,
    };

    try {
        await saveRecurringTransaction(firestore, user.uid, payload, transaction?.id);
        toast({
            title: "Sucesso!",
            description: transaction ? "Recorrência atualizada." : "Recorrência adicionada.",
        });
        form.reset();
        onFinished?.();
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Erro!",
            description: "Não foi possível salvar a recorrência.",
        });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Assinatura Spotify" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Valor</FormLabel>
                <FormControl>
                    <MagicInput 
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="39,90"
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="expense">Despesa</SelectItem>
                    <SelectItem value="income">Receita</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
         <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Conta</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione uma conta" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {accounts?.map((acc) => (
                            <SelectItem key={acc.id} value={acc.id}>
                            {acc.name}
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
                name="categoryId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {categories?.map((cat) => (
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
        </div>

        <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Frequência</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="daily">Diária</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
        />
        
        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Data de Início</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR}/>
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Data Final (Opcional)</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Nunca termina</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR}/>
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
        </Button>
      </form>
    </Form>
  );
}
