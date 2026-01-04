
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RecurringTransaction, Account, Category } from "@/lib/types";
import { deleteRecurringTransaction } from "@/lib/data";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
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
import { AddRecurringDialog } from "./AddRecurringDialog";
import { useState } from "react";
import { Badge } from "../ui/badge";

type RecurringTransactionListProps = {
  recurringTransactions: RecurringTransaction[];
  accounts: Account[];
  categories: Category[];
};

export function RecurringTransactionList({ recurringTransactions, accounts, categories }: RecurringTransactionListProps) {
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<RecurringTransaction | null>(null);

    const getCategoryName = (categoryId: string) => categories.find(c => c.id === categoryId)?.name || 'N/A';
    const getAccountName = (accountId: string) => accounts.find(a => a.id === accountId)?.name || 'N/A';

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
    
    const formatFrequency = (freq: RecurringTransaction['frequency']) => {
        const map = { daily: 'Diária', weekly: 'Semanal', monthly: 'Mensal', yearly: 'Anual' };
        return map[freq];
    }

    const handleDelete = (id: string) => {
        if (!user) return;
        deleteRecurringTransaction(firestore, user.uid, id);
        toast({ title: 'Sucesso', description: 'Recorrência removida.' });
    };

    const openEditDialog = (transaction: RecurringTransaction) => {
        setSelectedTransaction(transaction);
        setIsEditDialogOpen(true);
    };

  return (
    <div className="w-full border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead className="hidden md:table-cell">Categoria</TableHead>
            <TableHead className="hidden lg:table-cell">Frequência</TableHead>
            <TableHead className="hidden lg:table-cell">Próxima Ocorrência</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="w-[40px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recurringTransactions.map((transaction) => {
            return (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">{transaction.description}</TableCell>
                <TableCell className="hidden md:table-cell">{getCategoryName(transaction.categoryId)}</TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Badge variant="secondary">{formatFrequency(transaction.frequency)}</Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {/* TODO: Calculate next occurrence date */}
                  {format(new Date(transaction.startDate), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-semibold",
                    transaction.type === "income" ? "text-emerald-600" : "text-red-600"
                  )}
                >
                  {transaction.type === "income" ? "+ " : "- "}
                  {formatCurrency(transaction.amount)}
                </TableCell>
                <TableCell>
                    <AddRecurringDialog 
                        open={isEditDialogOpen && selectedTransaction?.id === transaction.id}
                        onOpenChange={setIsEditDialogOpen}
                        transaction={selectedTransaction || undefined}
                    >
                        <AlertDialog>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => openEditDialog(transaction)}>
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
                                        transação recorrente.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(transaction.id)} className="bg-destructive hover:bg-destructive/90">
                                        Excluir
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </AddRecurringDialog>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
       
    </div>
  );
}
