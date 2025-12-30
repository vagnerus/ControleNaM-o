
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
import { AddCardForm } from "./AddCardForm";
import { useState } from "react";
import type { CreditCard } from "@/lib/types";

type AddCardDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  card?: CreditCard;
  children?: React.ReactNode;
};

export function AddCardDialog({ open: controlledOpen, onOpenChange: setControlledOpen, card, children }: AddCardDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;
  
  const title = card ? "Editar Cartão" : "Adicionar Novo Cartão";
  const description = card ? "Ajuste os detalhes do seu cartão." : "Preencha os detalhes do seu novo cartão de crédito.";

  if (children) {
     return (
        <Dialog open={open} onOpenChange={setOpen}>
            {/* The trigger is now external to this component */}
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <AddCardForm onFinished={() => setOpen(false)} card={card} />
            </DialogContent>
        </Dialog>
    )
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Cartão
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <AddCardForm onFinished={() => setOpen(false)} card={card} />
      </DialogContent>
    </Dialog>
  );
}
