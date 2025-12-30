"use client";

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
import { AddTransactionForm } from "./AddTransactionForm";
import { useState } from "react";
import type { Transaction } from "@/lib/types";

type AddTransactionDialogProps = {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    transaction?: Transaction;
    onFinished?: () => void;
};


export function AddTransactionDialog({ open: controlledOpen, onOpenChange: setControlledOpen, transaction, onFinished }: AddTransactionDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = (value: boolean) => {
    setControlledOpen ? setControlledOpen(value) : setInternalOpen(value);
    if (!value) {
      onFinished?.();
    }
  };

  const title = transaction ? "Editar Transação" : "Adicionar Nova Transação";
  const description = transaction ? "Ajuste os detalhes da sua movimentação." : "Preencha os detalhes da sua movimentação financeira.";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        {!transaction && (
            <DialogTrigger asChild>
                <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Transação
                </Button>
            </DialogTrigger>
        )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <AddTransactionForm onFinished={() => setOpen(false)} transaction={transaction}/>
      </DialogContent>
    </Dialog>
  );
}