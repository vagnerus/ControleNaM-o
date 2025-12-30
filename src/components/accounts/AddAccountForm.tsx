
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
import { saveAccount } from "@/lib/data";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser } from "@/firebase";
import type { Account } from "@/lib/types";
import { useEffect } from "react";
import { MagicInput } from "../common/MagicInput";

const formSchema = z.object({
  name: z.string().min(2, "O nome da conta é muito curto."),
  balance: z.coerce.number(),
});

type AddAccountFormProps = {
    onFinished?: () => void;
    account?: Account;
};

export function AddAccountForm({ onFinished, account }: AddAccountFormProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      balance: 0,
    },
  });

  useEffect(() => {
    if (account) {
      form.reset({
        name: account.name,
        balance: account.balance,
      });
    }
  }, [account, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Erro!",
            description: "Você precisa estar logado para adicionar uma conta.",
        });
        return;
    }

    try {
        const payload: Partial<Omit<Account, 'id'>> = {
            name: values.name
        };
        // Only set balance on creation, not on update.
        if (!account) {
            payload.balance = values.balance;
        }

        await saveAccount(firestore, user.uid, payload, account?.id);
        toast({
            title: "Sucesso!",
            description: account ? "Conta atualizada com sucesso." : "Conta adicionada com sucesso.",
        });
        form.reset();
        onFinished?.();
    } catch (error) {
        console.error("Error saving account:", error);
        toast({
            variant: "destructive",
            title: "Erro!",
            description: "Não foi possível salvar a conta.",
        });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Conta</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Conta Corrente, Poupança" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="balance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Saldo {account ? 'Atual' : 'Inicial'}</FormLabel>
              <FormControl>
                 <MagicInput 
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="1000,00"
                    disabled={!!account}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Conta
        </Button>
      </form>
    </Form>
  );
}
