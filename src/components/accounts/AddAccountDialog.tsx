
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

export function AddAccountDialog() {
  const [open, setOpen] = useState(false);

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
          <DialogTitle>Adicionar Nova Conta</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da sua nova conta bancária.
          </DialogDescription>
        </DialogHeader>
        <AddAccountForm onFinished={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
