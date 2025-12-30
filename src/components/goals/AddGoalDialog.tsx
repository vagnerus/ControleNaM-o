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
import { AddGoalForm } from "./AddGoalForm";
import { useState } from "react";
import type { FinancialGoal } from "@/lib/types";

type AddGoalDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  goal?: FinancialGoal;
};

export function AddGoalDialog({ open: controlledOpen, onOpenChange: setControlledOpen, goal }: AddGoalDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;
  
  const title = goal ? "Editar Objetivo" : "Adicionar Novo Objetivo";
  const description = goal ? "Ajuste os detalhes do seu objetivo." : "Crie um novo objetivo para alcançar seus sonhos.";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!goal && (
        <DialogTrigger asChild>
            <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Objetivo
            </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <AddGoalForm onFinished={() => setOpen(false)} goal={goal} />
      </DialogContent>
    </Dialog>
  );
}
