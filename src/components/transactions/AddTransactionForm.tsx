
"use client";

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { saveTransaction, getIconComponent } from "@/lib/data";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import type { Category, CreditCard, Account, Transaction, Tag } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { Checkbox } from "../ui/checkbox";
import { collection, query, where } from "firebase/firestore";
import { Badge } from "../ui/badge";
import { MagicInput } from "../common/MagicInput";

const formSchema = z.object({
  type: z.enum(["income", "expense"], {
    required_error: "O tipo é obrigatório.",
  }),
  amount: z.coerce.number().positive("O valor deve ser positivo."),
  description: z.string().min(2, "A descrição é muito curta.").max(100),
  date: z.date({
    required_error: "A data é obrigatória.",
  }),
  categoryId: z.string({
    required_error: "A categoria é obrigatória.",
  }),
  accountId: z.string({
    required_error: "A conta é obrigatória.",
  }),
  creditCardId: z.string().optional(),
  isInstallment: z.boolean().default(false),
  totalInstallments: z.coerce.number().optional(),
  tagIds: z.array(z.string()).optional(),
});

type AddTransactionFormProps = {
    onFinished?: () => void;
    transaction?: Transaction;
};

export function AddTransactionForm({ onFinished, transaction }: AddTransactionFormProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "expense",
      amount: 0,
      description: "",
      date: new Date(),
      isInstallment: false,
      tagIds: [],
    },
  });

  const transactionType = form.watch("type");
  const isInstallment = form.watch("isInstallment");
  const selectedTagIds = form.watch("tagIds") || [];

  // Fetch user's custom categories
  const categoriesQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, 'users', user.uid, 'categories'), where('type', '==', transactionType)) : null
  , [firestore, user, transactionType]);
  const { data: categories } = useCollection<Category>(categoriesQuery);

  const cardsQuery = useMemoFirebase(() => 
    user ? collection(firestore, 'users', user.uid, 'creditCards') : null
  , [firestore, user]);
  const { data: cards } = useCollection<CreditCard>(cardsQuery);
  
  const accountsQuery = useMemoFirebase(() =>
    user ? collection(firestore, 'users', user.uid, 'accounts') : null
  , [firestore, user]);
  const { data: accounts } = useCollection<Account>(accountsQuery);

  const tagsQuery = useMemoFirebase(() =>
    user ? collection(firestore, 'users', user.uid, 'tags') : null
  , [firestore, user]);
  const { data: tags } = useCollection<Tag>(tagsQuery);

  useEffect(() => {
    if (transaction) {
      form.reset({
        ...transaction,
        amount: transaction.amount || 0,
        date: new Date(transaction.date),
        isInstallment: transaction.totalInstallments ? transaction.totalInstallments > 1 : false,
        tagIds: transaction.tagIds || [],
      });
    }
  }, [transaction, form]);


  useEffect(() => {
    if (form.getValues('type') !== transactionType) {
        form.setValue("categoryId", "");
    }
  }, [transactionType, form]);

  useEffect(() => {
    if (transactionType === 'income') {
        form.setValue('creditCardId', undefined);
        form.setValue('isInstallment', false);
        form.setValue('totalInstallments', undefined);
    }
  }, [transactionType, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Erro!",
            description: "Você precisa estar logado para salvar uma transação.",
        });
        return;
    }
     if (values.creditCardId && values.type === 'income') {
      form.setError('creditCardId', { message: 'Receitas não podem ser associadas a um cartão de crédito.'});
      return;
    }
    if (values.isInstallment && !values.creditCardId) {
        form.setError('creditCardId', { message: 'Selecione um cartão de crédito para compras parceladas.'});
        return;
    }
    if (values.isInstallment && (!values.totalInstallments || values.totalInstallments <= 1)) {
        form.setError('totalInstallments', { message: 'O número de parcelas deve ser maior que 1.'});
        return;
    }


    try {
        saveTransaction(firestore, user.uid, { 
            ...values,
            date: values.date.toISOString(),
            totalInstallments: values.isInstallment ? values.totalInstallments : undefined, // Set to undefined if not installment
        }, transaction?.id);
        toast({
            title: "Sucesso!",
            description: transaction ? "Transação atualizada com sucesso." : "Transação adicionada com sucesso.",
        });
        form.reset();
        if (onFinished) {
            onFinished();
        }
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Erro!",
            description: "Não foi possível salvar a transação.",
        });
    }
  }
  
  const toggleTag = (tagId: string) => {
    const currentTags = form.getValues('tagIds') || [];
    const newTags = currentTags.includes(tagId) 
        ? currentTags.filter(id => id !== tagId)
        : [...currentTags, tagId];
    form.setValue('tagIds', newTags, { shouldValidate: true });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Transação</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!transaction}>
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
                    placeholder="Ex: 25 + 10"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
                  {categories?.map((cat) => {
                    const Icon = getIconComponent(cat.icon);
                    return (
                        <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {cat.name}
                        </div>
                        </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {transactionType === 'expense' && (
            <FormField
                control={form.control}
                name="creditCardId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Cartão de Crédito (Opcional)</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === '' ? undefined : value)} value={field.value} disabled={!!transaction}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Nenhum" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="">Nenhum</SelectItem>
                        {cards?.map((card) => (
                            <SelectItem key={card.id} value={card.id}>
                                {card.name} (final {card.last4})
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
        )}
        
        {transactionType === 'expense' && form.getValues('creditCardId') && !transaction && (
            <div className="space-y-4 rounded-md border p-4">
                <FormField
                    control={form.control}
                    name="isInstallment"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                            <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={!!transaction}
                            />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>
                            É uma compra parcelada?
                            </FormLabel>
                        </div>
                        </FormItem>
                    )}
                />
                {isInstallment && (
                    <FormField
                        control={form.control}
                        name="totalInstallments"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Número de Parcelas</FormLabel>
                            <FormControl>
                                <Input type="number" min="2" placeholder="Ex: 12" {...field} disabled={!!transaction} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
            </div>
        )}


        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: ptBR })
                      ) : (
                        <span>Escolha uma data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea placeholder="Ex: Café com amigos" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
            control={form.control}
            name="tagIds"
            render={() => (
                <FormItem>
                    <FormLabel>Tags (Opcional)</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button variant="outline" role="combobox" className="w-full justify-start font-normal h-auto min-h-10 flex-wrap">
                                    {selectedTagIds.length > 0 ? (
                                        <div className="flex gap-1 flex-wrap">
                                            {selectedTagIds.map(tagId => {
                                                const tag = tags?.find(t => t.id === tagId);
                                                return <Badge key={tagId} variant="secondary">{tag?.name}</Badge>
                                            })}
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">Selecione uma ou mais tags</span>
                                    )}
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <div className="flex flex-wrap gap-2 p-4">
                                {tags?.map(tag => (
                                    <Button
                                        key={tag.id}
                                        variant={selectedTagIds.includes(tag.id) ? 'default' : 'outline'}
                                        size="sm"
                                        className="h-auto"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            toggleTag(tag.id);
                                        }}
                                    >
                                        {tag.name}
                                    </Button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
            )}
        />

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
        </Button>
      </form>
    </Form>
  );
}

    