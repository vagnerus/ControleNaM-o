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
import { AddBudgetForm } from "./AddBudgetForm";
import { useState } from "react";
import type { Budget } from "@/lib/types";

type AddBudgetDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  budget?: Budget;
  children?: React.ReactNode;
};

export function AddBudgetDialog({ open: controlledOpen, onOpenChange: setControlledOpen, budget, children }: AddBudgetDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;

  const title = budget ? "Editar Orçamento" : "Adicionar Novo Orçamento";
  const description = budget ? "Ajuste os detalhes do seu orçamento." : "Crie um novo orçamento para uma categoria de despesa.";

  if (children) {
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {children}
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <AddBudgetForm onFinished={() => setOpen(false)} budget={budget} />
            </DialogContent>
        </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Orçamento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <AddBudgetForm onFinished={() => setOpen(false)} budget={budget} />
      </DialogContent>
    </Dialog>
  );
}
