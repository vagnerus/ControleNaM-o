

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Transaction, Account, Category, Tag } from "@/lib/types";
import { deleteTransaction, getCategoryDetails } from "@/lib/data.tsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Edit, Trash2, Paperclip } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
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
import { AddTransactionDialog } from "./AddTransactionDialog";
import { useState } from "react";
import Link from "next/link";

type TransactionListProps = {
  transactions: Transaction[];
  accounts: Account[];
  categories?: Category[];
  tags?: Tag[];
};

export function TransactionList({ transactions, accounts, categories = [], tags = [] }: TransactionListProps) {
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    const getCategory = (categoryId: string) => {
        return categories?.find(cat => cat.id === categoryId);
    }

    const getTags = (tagIds: string[] = []) => {
        return tagIds.map(tagId => tags?.find(tag => tag.id === tagId)).filter(Boolean) as Tag[];
    }

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        }).format(value);
    
    const getAccountName = (accountId: string) => {
        return accounts.find(acc => acc.id === accountId)?.name || 'Conta desconhecida';
    }

    const handleDelete = (transactionId: string) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado.' });
            return;
        }
        deleteTransaction(firestore, user.uid, transactionId);
        toast({ title: 'Sucesso', description: 'Transação removida.' });
    };

    const openEditDialog = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setIsEditDialogOpen(true);
    };

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead className="hidden md:table-cell">Conta</TableHead>
            <TableHead className="hidden md:table-cell">Data</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="w-[40px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            const category = getCategory(transaction.categoryId);
            const transactionTags = getTags(transaction.tagIds);
            return (
              <TableRow key={transaction.id}>
                <TableCell>
                  <div className="font-medium flex items-center gap-2">
                    {transaction.description}
                    {transaction.attachmentUrls && transaction.attachmentUrls.length > 0 && (
                        <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {category?.name || 'Sem categoria'}
                  </div>
                   <div className="flex flex-wrap gap-1 mt-1">
                     {transactionTags.map(tag => (
                         <Badge key={tag.id} variant="outline" className="font-normal">{tag.name}</Badge>
                     ))}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {getAccountName(transaction.accountId)}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {format(new Date(transaction.date), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-semibold",
                    transaction.type === "income"
                      ? "text-emerald-600"
                      : "text-red-600"
                  )}
                >
                  {transaction.type === "income" ? "+ " : "- "}
                  {formatCurrency(transaction.amount)}
                </TableCell>
                <TableCell>
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
                                {transaction.attachmentUrls && transaction.attachmentUrls.length > 0 && (
                                  <>
                                    <DropdownMenuSeparator />
                                    {transaction.attachmentUrls.map((url, index) => (
                                      <DropdownMenuItem key={index} asChild>
                                        <Link href={url} target="_blank" rel="noopener noreferrer">
                                          <Paperclip className="mr-2 h-4 w-4" />
                                          Ver Anexo {index + 1}
                                        </Link>
                                      </DropdownMenuItem>
                                    ))}
                                  </>
                                )}
                                <DropdownMenuSeparator />
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
                                    transação.
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
       {selectedTransaction && (
         <AddTransactionDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            transaction={selectedTransaction}
            onFinished={() => setSelectedTransaction(null)}
         />
      )}
    </div>
  );
}
