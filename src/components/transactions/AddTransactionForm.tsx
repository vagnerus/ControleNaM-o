

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
import { saveTransaction } from "@/lib/data";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2, Paperclip, X, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState, useMemo } from "react";
import type { Category, CreditCard, Account, Transaction, Tag } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { MagicInput } from "../common/MagicInput";
import { Switch } from "../ui/switch";
import { MultiSelect, Option } from "../ui/multi-select";
import { useStorage, uploadAttachment } from "@/firebase/storage";
import { Badge } from "../ui/badge";
import { suggestCategory } from "@/lib/ai-client";

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
  attachmentUrls: z.array(z.string()).optional(),
  isInstallment: z.boolean().default(false),
  totalInstallments: z.coerce.number().optional(),
  tags: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
}).refine(data => {
    if (data.isInstallment && (!data.totalInstallments || data.totalInstallments < 2)) {
        return false;
    }
    return true;
}, {
    message: "O número de parcelas deve ser 2 ou mais.",
    path: ["totalInstallments"],
});

type AddTransactionFormProps = {
    onFinished?: () => void;
    transaction?: Transaction;
};

export function AddTransactionForm({ onFinished, transaction }: AddTransactionFormProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // @ts-ignore
      type: undefined,
      // @ts-ignore
      amount: undefined,
      description: "",
      // @ts-ignore
      date: undefined,
      accountId: "",
      categoryId: "",
      creditCardId: "",
      attachmentUrls: [],
      isInstallment: false,
      totalInstallments: 2,
      tags: [],
    },
  });

  const transactionType = form.watch("type");
  const useCreditCard = form.watch("creditCardId");
  const isInstallmentPurchase = form.watch("isInstallment");

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
  const tagOptions = useMemo(() => (tags || []).map(tag => ({ value: tag.id, label: tag.name })), [tags]);


  useEffect(() => {
    if (transaction) {
      const selectedTags = tagOptions.filter(opt => transaction.tagIds?.includes(opt.value));
      form.reset({
        ...transaction,
        amount: transaction.amount || 0,
        date: new Date(transaction.date),
        creditCardId: transaction.creditCardId || "",
        attachmentUrls: transaction.attachmentUrls || [],
        tags: selectedTags,
      });
      setExistingAttachments(transaction.attachmentUrls || []);
    }
  }, [transaction, form, tagOptions]);


  useEffect(() => {
    // Reset category when transaction type changes
    if (form.getValues('type') !== transactionType) {
        form.setValue("categoryId", "");
    }
    // Reset credit card if type changes to income
    if (transactionType === 'income') {
        form.setValue('creditCardId', undefined);
        form.setValue('isInstallment', false);
    }
  }, [transactionType, form]);

  useEffect(() => {
      if (!useCreditCard) {
          form.setValue('isInstallment', false);
      }
  }, [useCreditCard, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  const removeExistingAttachment = (url: string) => {
    setExistingAttachments(prev => prev.filter(item => item !== url));
  };
  
  const handleSuggestCategory = async () => {
    const description = form.getValues('description');
    if (!description || !categories || categories.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Informação insuficiente',
        description: 'Por favor, preencha a descrição primeiro.',
      });
      return;
    }
    
    setIsSuggesting(true);
    try {
      const result = await suggestCategory({
        description,
        categories: categories.map(c => ({ id: c.id, name: c.name })),
      });
      if (result.categoryId && categories.some(c => c.id === result.categoryId)) {
        form.setValue('categoryId', result.categoryId, { shouldValidate: true });
        toast({
          title: 'Categoria Sugerida!',
          description: `A IA sugeriu a categoria "${categories.find(c => c.id === result.categoryId)?.name}".`,
        });
      } else {
        toast({
          title: 'Nenhuma sugestão clara',
          description: 'A IA não encontrou uma categoria correspondente. Por favor, selecione manualmente.',
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erro na IA',
        description: 'Não foi possível obter uma sugestão. Tente novamente.',
      });
    } finally {
      setIsSuggesting(false);
    }
  };


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
        form.setError('isInstallment', { message: 'Compras parceladas devem ser associadas a um cartão de crédito.'});
        return;
    }

    try {
        const attachmentUploadPromises = attachments.map(file => uploadAttachment(storage, user.uid, file));
        const newAttachmentUrls = await Promise.all(attachmentUploadPromises);
        
        const finalAttachments = [...existingAttachments, ...newAttachmentUrls];

        saveTransaction(firestore, user.uid, { 
            ...values,
            tagIds: values.tags?.map(t => t.value),
            date: values.date.toISOString(),
            creditCardId: values.creditCardId || undefined,
            attachmentUrls: finalAttachments,
        }, transaction?.id);
        toast({
            title: "Sucesso!",
            description: transaction ? "Transação atualizada com sucesso." : "Transação adicionada com sucesso.",
        });
        form.reset();
        onFinished?.();
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Erro!",
            description: "Não foi possível salvar a transação.",
        });
    }
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
                    placeholder="0,00"
                />
              </FormControl>
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
              <div className="flex items-center gap-2">
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
                <Button variant="outline" size="icon" type="button" onClick={handleSuggestCategory} disabled={isSuggesting} title="Sugerir Categoria com IA">
                    {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
                </Button>
              </div>
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
                    <Select onValueChange={(value) => field.onChange(value === 'null' ? undefined : value)} value={field.value || 'null'}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Nenhum" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="null">Nenhum</SelectItem>
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
        
        {useCreditCard && transactionType === 'expense' && (
            <div className="space-y-4 rounded-md border p-4">
                <FormField
                    control={form.control}
                    name="isInstallment"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                            <div className="space-y-0.5">
                                <FormLabel>Compra Parcelada?</FormLabel>
                                <p className="text-xs text-muted-foreground">Marque se esta é uma compra com múltiplas parcelas.</p>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={!!transaction}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
                {isInstallmentPurchase && (
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
            name="tags"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Tags (Opcional)</FormLabel>
                    <MultiSelect
                        selected={field.value || []}
                        options={tagOptions}
                        placeholder="Selecione as tags"
                        onChange={field.onChange}
                        className="w-full"
                    />
                    <FormMessage />
                </FormItem>
            )}
        />


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
        
        <FormItem>
            <FormLabel>Anexos (Opcional)</FormLabel>
            <FormControl>
                <div className="flex items-center gap-2">
                    <label htmlFor="attachment-upload" className="flex-grow">
                        <Input id="attachment-upload" type="file" multiple onChange={handleFileChange} className="hidden" />
                        <Button type="button" variant="outline" asChild>
                            <span className="cursor-pointer flex items-center gap-2">
                                <Paperclip className="h-4 w-4" />
                                Adicionar Comprovante
                            </span>
                        </Button>
                    </label>
                </div>
            </FormControl>
            <div className="mt-2 space-y-2">
                {existingAttachments.map((url, index) => (
                    <Badge key={index} variant="secondary" className="flex justify-between items-center">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">
                            Anexo {index + 1}
                        </a>
                        <Button variant="ghost" size="icon" className="h-5 w-5 -mr-1" onClick={() => removeExistingAttachment(url)}>
                            <X className="h-3 w-3"/>
                        </Button>
                    </Badge>
                ))}
                {attachments.map((file, index) => (
                    <Badge key={index} variant="outline" className="flex justify-between items-center">
                        <span className="truncate">{file.name}</span>
                        <Button variant="ghost" size="icon" className="h-5 w-5 -mr-1" onClick={() => removeAttachment(index)}>
                             <X className="h-3 w-3"/>
                        </Button>
                    </Badge>
                ))}
            </div>
             <FormMessage />
        </FormItem>

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
        </Button>
      </form>
    </Form>
  );
}
