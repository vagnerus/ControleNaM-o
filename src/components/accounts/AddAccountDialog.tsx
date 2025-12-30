
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
import { AddAccountForm } from "./AddAccountForm";
import { useState } from "react";
import type { Account } from "@/lib/types";

type AddAccountDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  account?: Account;
  children?: React.ReactNode;
};

export function AddAccountDialog({ open: controlledOpen, onOpenChange: setControlledOpen, account, children }: AddAccountDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;
  
  const title = account ? "Editar Conta" : "Adicionar Nova Conta";
  const description = account ? "Ajuste os detalhes da sua conta." : "Preencha os detalhes da sua nova conta bancária.";

  if (children) {
     return (
        <Dialog open={open} onOpenChange={setOpen}>
            {/* The trigger is now external to this component */}
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <AddAccountForm onFinished={() => setOpen(false)} account={account} />
            </DialogContent>
        </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Conta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <AddAccountForm onFinished={() => setOpen(false)} account={account} />
      </DialogContent>
    </Dialog>
  );
}
