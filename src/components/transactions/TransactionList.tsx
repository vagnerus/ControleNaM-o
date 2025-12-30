import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Transaction, Account, Category } from "@/lib/types";
import { deleteTransaction, getIconComponent } from "@/lib/data";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { AddTransactionDialog } from "./AddTransactionDialog";
import { useState } from "react";
import { collection, query } from "firebase/firestore";

type TransactionListProps = {
  transactions: Transaction[];
  accounts: Account[];
};

export function TransactionList({ transactions, accounts }: TransactionListProps) {
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    const categoriesQuery = useMemoFirebase(() =>
        user ? query(collection(firestore, 'users', user.uid, 'categories')) : null
    , [firestore, user]);
    const { data: categories } = useCollection<Category>(categoriesQuery);

    const getCategory = (categoryId: string) => {
        return categories?.find(cat => cat.id === categoryId);
    }

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        }).format(value);
    
    const getAccountName = (accountId: string) => {
        return accounts.find(acc => acc.id === accountId)?.name || 'Conta desconhecida';
    }

    const handleDelete = async (transaction: Transaction) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado.' });
            return;
        }
        try {
            await deleteTransaction(firestore, user.uid, transaction);
            toast({ title: 'Sucesso', description: transaction.installmentId ? 'Parcelas removidas com sucesso.' : 'Transação removida com sucesso.' });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível remover a transação.' });
        }
    };

    const openEditDialog = (transaction: Transaction) => {
        if (transaction.installmentId) {
            toast({
                variant: "destructive",
                title: "Edição não permitida",
                description: "Não é possível editar uma única parcela. Por favor, remova o grupo de parcelas e crie novamente.",
            });
            return;
        }
        setSelectedTransaction(transaction);
        setIsEditDialogOpen(true);
    };

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="hidden sm:table-cell">Categoria</TableHead>
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
            const Icon = category ? getIconComponent(category.icon) : null;
            return (
              <TableRow key={transaction.id}>
                <TableCell className="hidden sm:table-cell">
                  {category && Icon && (
                    <Badge variant="outline" className="flex w-fit items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {category.name}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{transaction.description}</div>
                  <div className="text-sm text-muted-foreground sm:hidden">
                    {category?.name}
                  </div>
                   <div className="text-sm text-muted-foreground md:hidden">
                    {getAccountName(transaction.accountId)} - {format(new Date(transaction.date), "dd/MM/yyyy")}
                  </div>
                  {transaction.totalInstallments && transaction.totalInstallments > 1 && (
                    <Badge variant="secondary" className="mt-1">
                        Parcela {transaction.installmentNumber}/{transaction.totalInstallments}
                    </Badge>
                  )}
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
                                    {transaction.installmentId ? 
                                    "Isso excluirá permanentemente esta e todas as outras parcelas relacionadas. Essa ação não pode ser desfeita." :
                                    "Essa ação não pode ser desfeita. Isso excluirá permanentemente a transação."}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(transaction)} className="bg-destructive hover:bg-destructive/90">
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
