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
import { saveTag } from "@/lib/data";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser } from "@/firebase";

const formSchema = z.object({
  name: z.string().min(2, "O nome da tag é muito curto.").max(30, "O nome da tag é muito longo."),
});

export function AddTagForm() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Erro!",
            description: "Você precisa estar logado para adicionar uma tag.",
        });
        return;
    }

    try {
        saveTag(firestore, user.uid, values);
        toast({
            title: "Sucesso!",
            description: "Tag adicionada com sucesso.",
        });
        form.reset();
    } catch (error) {
        console.error("Error saving tag:", error);
        toast({
            variant: "destructive",
            title: "Erro!",
            description: "Não foi possível salvar a tag.",
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
              <FormLabel>Nome da Tag</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Férias 2024" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Adicionar Tag
        </Button>
      </form>
    </Form>
  );
}
