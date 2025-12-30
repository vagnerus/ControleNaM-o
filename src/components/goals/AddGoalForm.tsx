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
import { saveGoal } from "@/lib/data";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser } from "@/firebase";
import type { FinancialGoal } from "@/lib/types";
import { useEffect } from "react";
import { placeholderImages } from "@/lib/placeholder-images";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { MagicInput } from "../common/MagicInput";


const formSchema = z.object({
  name: z.string().min(2, "O nome do objetivo é muito curto."),
  targetAmount: z.coerce.number().positive("O valor alvo deve ser positivo."),
  currentAmount: z.coerce.number().min(0, "O valor atual não pode ser negativo."),
  monthlySaving: z.coerce.number().min(0, "A economia mensal não pode ser negativa."),
  imageId: z.string({ required_error: "Selecione uma imagem." }),
});

type AddGoalFormProps = {
    onFinished?: () => void;
    goal?: FinancialGoal;
};

export function AddGoalForm({ onFinished, goal }: AddGoalFormProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: goal?.name || "",
      targetAmount: goal?.targetAmount || 0,
      currentAmount: goal?.currentAmount || 0,
      monthlySaving: goal?.monthlySaving || 0,
      imageId: goal?.imageId || "",
    },
  });

  useEffect(() => {
    if (goal) {
      form.reset({
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        monthlySaving: goal.monthlySaving,
        imageId: goal.imageId,
      });
    }
  }, [goal, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Erro!",
            description: "Você precisa estar logado.",
        });
        return;
    }
    if (values.currentAmount > values.targetAmount) {
        form.setError("currentAmount", { message: "O valor atual não pode ser maior que o valor alvo." });
        return;
    }

    try {
        saveGoal(firestore, user.uid, values, goal?.id);
        toast({
            title: "Sucesso!",
            description: goal ? "Objetivo atualizado com sucesso." : "Objetivo adicionado com sucesso.",
        });
        form.reset();
        onFinished?.();
    } catch (error) {
        console.error("Error saving goal:", error);
        toast({
            variant: "destructive",
            title: "Erro!",
            description: "Não foi possível salvar o objetivo.",
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
              <FormLabel>Nome do Objetivo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Viagem para o Japão" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="targetAmount"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Valor Alvo</FormLabel>
                <FormControl>
                    <MagicInput 
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="20000,00"
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="currentAmount"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Valor Atual</FormLabel>
                <FormControl>
                     <MagicInput 
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="1500,00"
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
          control={form.control}
          name="monthlySaving"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meta de Economia Mensal</FormLabel>
              <FormControl>
                <MagicInput 
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="500,00"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="imageId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagem Representativa</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma imagem" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {placeholderImages.map((img) => (
                    <SelectItem key={img.id} value={img.id}>
                      <div className="flex items-center gap-3">
                        <Image src={img.imageUrl} alt={img.description} width={24} height={24} className="h-6 w-6 rounded-sm object-cover" />
                        <span>{img.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Objetivo
        </Button>
      </form>
    </Form>
  );
}
