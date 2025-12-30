
'use client';

import type { Account } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, MoreVertical, Trash2, Edit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser } from "@/firebase";
import { deleteAccount } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { AddAccountDialog } from "./AddAccountDialog";

type AccountCardProps = {
  account: Account;
  isCompact?: boolean;
};

export function AccountCard({ account, isCompact = false }: AccountCardProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const handleDelete = () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado.' });
        return;
    }
    deleteAccount(firestore, user.uid, account.id);
    toast({ title: 'Sucesso', description: 'Conta removida.' });
  }

  if (isCompact) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Landmark className="h-4 w-4" />
                </div>
                <span className="font-medium">{account.name}</span>
            </div>
            <span className={cn("font-semibold", account.balance < 0 && "text-destructive")}>{formatCurrency(account.balance)}</span>
        </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
                <Landmark className="h-6 w-6" />
            </div>
            <div>
                <CardTitle>{account.name}</CardTitle>
                <CardDescription>Saldo disponível</CardDescription>
            </div>
        </div>
        <AddAccountDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} account={account}>
          <AlertDialog>
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                      </DropdownMenuItem>
                      <AlertDialogTrigger asChild>
                          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                          </DropdownMenuItem>
                      </AlertDialogTrigger>
                  </DropdownMenuContent>
              </DropdownMenu>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                          Essa ação não pode ser desfeita. Isso excluirá permanentemente a
                          sua conta. Transações associadas não serão excluídas.
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                          Excluir
                      </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
        </AddAccountDialog>
      </CardHeader>
      <CardContent>
        <p className={cn("text-3xl font-bold", account.balance < 0 && "text-destructive")}>{formatCurrency(account.balance)}</p>
      </CardContent>
    </Card>
  );
}
