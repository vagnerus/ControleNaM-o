
import { getIconComponent, deleteBudget } from "@/lib/data";
import type { Budget, Transaction, Category } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
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
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { AddBudgetDialog } from "./AddBudgetDialog";
import { collection } from "firebase/firestore";

type BudgetCardProps = {
  budget: Budget;
  transactions: Transaction[];
  isCompact?: boolean;
};

export function BudgetCard({ budget, transactions, isCompact = false }: BudgetCardProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const categoriesQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]);
  const { data: categories } = useCollection<Category>(categoriesQuery);
  
  const category = useMemo(() => {
    return categories?.find(c => c.id === budget.categoryId);
  }, [categories, budget.categoryId]);

  const spent = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    return transactions
        .filter(t => 
            t.categoryId === budget.categoryId && 
            t.type === 'expense' &&
            new Date(t.date).getMonth() === currentMonth &&
            new Date(t.date).getFullYear() === currentYear
        )
        .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, budget.categoryId]);
  
  const percentage = (spent / budget.amount) * 100;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const progressColor =
    percentage > 90 ? "bg-destructive" : percentage > 75 ? "bg-warning" : "bg-primary";
    
  const handleDelete = () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado.' });
      return;
    }
    deleteBudget(firestore, user.uid, budget.id);
    toast({ title: 'Sucesso', description: 'Orçamento removido.' });
  };
  
  const Icon = category ? getIconComponent(category.icon) : null;

  if (isCompact) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 font-medium">
                    {Icon && <Icon className="h-4 w-4" />}
                    <span>{budget.categoryName}</span>
                </div>
                <span className="text-muted-foreground">{formatCurrency(spent)}</span>
            </div>
            <Progress value={percentage} indicatorClassName={progressColor} />
        </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
            </div>
          )}
          <div>
            <CardTitle>{budget.categoryName}</CardTitle>
            <p className="text-sm text-muted-foreground">Planejamento Mensal</p>
          </div>
        </div>
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
                        Essa ação não pode ser desfeita. Isso excluirá permanentemente o
                        seu planejamento para esta categoria.
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
        <AddBudgetDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            budget={budget}
        />
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-muted-foreground text-sm">
          <span>Gasto</span>
          <span>Planejado</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-2xl font-bold">
            {formatCurrency(spent)}
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            / {formatCurrency(budget.amount)}
          </span>
        </div>
        <Progress value={percentage} indicatorClassName={progressColor} className="h-3" />
        <p className={cn(
            "text-sm text-right font-medium",
            percentage > 90 ? "text-destructive" : percentage > 75 ? "text-warning" : "text-muted-foreground"
        )}>
            {percentage.toFixed(0)}% utilizado
        </p>
      </CardContent>
    </Card>
  );
}
