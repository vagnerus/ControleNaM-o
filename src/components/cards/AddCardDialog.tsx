
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

export function AddCardDialog() {
  const [open, setOpen] = useState(false);

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
          <DialogTitle>Adicionar Novo Cartão</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do seu novo cartão de crédito.
          </DialogDescription>
        </DialogHeader>
        <AddCardForm onFinished={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
