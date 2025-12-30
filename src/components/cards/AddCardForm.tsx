
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
import { saveCard } from "@/lib/data.tsx";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser } from "@/firebase";
import type { CreditCard } from "@/lib/types";
import { useEffect } from "react";
import { MagicInput } from "../common/MagicInput";

const formSchema = z.object({
  name: z.string().min(2, "O nome do cartão é muito curto."),
  last4: z.string().length(4, "Digite os 4 últimos dígitos.").regex(/^\d{4}$/, "Apenas números."),
  closingDate: z.coerce.number().min(1, "Dia inválido.").max(31, "Dia inválido."),
  dueDate: z.coerce.number().min(1, "Dia inválido.").max(31, "Dia inválido."),
  limit: z.coerce.number().positive("O limite deve ser positivo."),
  brand: z.enum(["visa", "mastercard", "amex", "other"], {
    required_error: "A bandeira é obrigatória.",
  }),
});

type AddCardFormProps = {
    onFinished?: () => void;
    card?: CreditCard;
};

export function AddCardForm({ onFinished, card }: AddCardFormProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: card?.name || "",
      last4: card?.last4 || "",
      limit: card?.limit || 0,
      closingDate: card?.closingDate,
      dueDate: card?.dueDate,
      brand: card?.brand
    },
  });

  useEffect(() => {
    if (card) {
        form.reset({
            name: card.name,
            last4: card.last4,
            closingDate: card.closingDate,
            dueDate: card.dueDate,
            limit: card.limit,
            brand: card.brand,
        });
    }
  }, [card, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Erro!",
            description: "Você precisa estar logado para adicionar um cartão.",
        });
        return;
    }

    try {
        await saveCard(firestore, user.uid, values, card?.id);
        toast({
            title: "Sucesso!",
            description: card ? "Cartão atualizado com sucesso." : "Cartão adicionado com sucesso.",
        });
        form.reset();
        onFinished?.();
    } catch (error) {
        console.error("Error saving card:", error);
        toast({
            variant: "destructive",
            title: "Erro!",
            description: "Não foi possível salvar o cartão.",
        });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Apelido do Cartão</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Nubank, Inter, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="last4"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Últimos 4 dígitos</FormLabel>
                <FormControl>
                    <Input placeholder="1234" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Bandeira</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="visa">Visa</SelectItem>
                        <SelectItem value="mastercard">Mastercard</SelectItem>
                        <SelectItem value="amex">American Express</SelectItem>
                        <SelectItem value="other">Outra</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
          control={form.control}
          name="limit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Limite Total</FormLabel>
              <FormControl>
                <MagicInput 
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="5.000,00"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="closingDate"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Dia do Fechamento</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="Ex: 20" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Dia do Vencimento</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="Ex: 28" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Cartão
        </Button>
      </form>
    </Form>
  );
}
