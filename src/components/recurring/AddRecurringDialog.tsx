
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
import { AddRecurringForm } from "./AddRecurringForm";
import { useState } from "react";
import type { RecurringTransaction } from "@/lib/types";

type AddRecurringDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  transaction?: RecurringTransaction;
  children?: React.ReactNode;
};

export function AddRecurringDialog({ open: controlledOpen, onOpenChange: setControlledOpen, transaction, children }: AddRecurringDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;
  
  const title = transaction ? "Editar Recorrência" : "Adicionar Recorrência";
  const description = transaction ? "Ajuste os detalhes da sua transação recorrente." : "Preencha os detalhes da sua nova despesa ou receita recorrente.";

  if (children) {
     return (
        <Dialog open={open} onOpenChange={setOpen}>
            {children}
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <AddRecurringForm onFinished={() => setOpen(false)} transaction={transaction} />
            </DialogContent>
        </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Recorrência
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <AddRecurringForm onFinished={() => setOpen(false)} transaction={transaction} />
      </DialogContent>
    </Dialog>
  );
}
