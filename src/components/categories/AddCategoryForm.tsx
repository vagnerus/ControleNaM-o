
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
import { saveCategory, ICONS } from "@/lib/data";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser } from "@/firebase";
import type { Category } from "@/lib/types";
import { useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getIconComponent } from "@/lib/data";
import { ScrollArea } from "../ui/scroll-area";


const formSchema = z.object({
  name: z.string().min(2, "O nome da categoria é muito curto.").max(50),
  type: z.enum(["income", "expense"], {
    required_error: "O tipo é obrigatório.",
  }),
  icon: z.string({
    required_error: "O ícone é obrigatório.",
  }),
});

type AddCategoryFormProps = {
    onFinished?: () => void;
    category?: Category;
};

export function AddCategoryForm({ onFinished, category }: AddCategoryFormProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "expense",
      icon: "Receipt",
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        type: category.type,
        icon: category.icon,
      });
    }
  }, [category, form]);

  const selectedIconName = form.watch('icon');
  const SelectedIcon = getIconComponent(selectedIconName);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Erro!",
            description: "Você precisa estar logado.",
        });
        return;
    }

    try {
        saveCategory(firestore, user.uid, values, category?.id);
        toast({
            title: "Sucesso!",
            description: category ? "Categoria atualizada com sucesso." : "Categoria adicionada com sucesso.",
        });
        form.reset();
        onFinished?.();
    } catch (error) {
        console.error("Error saving category:", error);
        toast({
            variant: "destructive",
            title: "Erro!",
            description: "Não foi possível salvar a categoria.",
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
              <FormLabel>Nome da Categoria</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Mercado, Lazer" {...field} />
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
              <Select onValueChange={field.onChange} value={field.value} disabled={!!category}>
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
          name="icon"
          render={({ field }) => (
            <FormItem>
                <FormLabel>Ícone</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                        <FormControl>
                            <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                                <div className="flex items-center gap-2">
                                    <SelectedIcon />
                                    {field.value}
                                </div>
                            </Button>
                        </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                       <ScrollArea className="h-72">
                         <div className="grid grid-cols-4 gap-2 p-4">
                            {ICONS.map((icon) => {
                                const IconComponent = icon.component;
                                return (
                                    <Button
                                        key={icon.id}
                                        variant="outline"
                                        size="icon"
                                        className={cn("h-12 w-12", field.value === icon.name && "border-primary ring-2 ring-primary")}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            form.setValue('icon', icon.name, { shouldValidate: true });
                                        }}
                                    >
                                        <IconComponent />
                                    </Button>
                                )
                            })}
                        </div>
                       </ScrollArea>
                    </PopoverContent>
                </Popover>
                <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Categoria
        </Button>
      </form>
    </Form>
  );
}
