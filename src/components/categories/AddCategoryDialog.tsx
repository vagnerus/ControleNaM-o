
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { AddCategoryForm } from "./AddCategoryForm";
import { useState } from "react";
import type { Category } from "@/lib/types";

type AddCategoryDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  category?: Category;
  children?: React.ReactNode;
};

export function AddCategoryDialog({ open: controlledOpen, onOpenChange: setControlledOpen, category, children }: AddCategoryDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;

  const title = category ? "Editar Categoria" : "Adicionar Nova Categoria";
  const description = category ? "Ajuste os detalhes da sua categoria." : "Crie uma nova categoria para suas transações.";

  const handleFinish = () => {
    setOpen(false);
  }

  if (children) {
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {children}
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <AddCategoryForm onFinished={handleFinish} category={category} />
            </DialogContent>
        </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Categoria
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <AddCategoryForm onFinished={handleFinish} category={category} />
      </DialogContent>
    </Dialog>
  );
}
