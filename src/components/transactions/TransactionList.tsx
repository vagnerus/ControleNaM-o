import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Transaction } from "@/lib/types";
import { getCategoryByName } from "@/lib/data";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type TransactionListProps = {
  transactions: Transaction[];
};

export function TransactionList({ transactions }: TransactionListProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="hidden sm:table-cell">Categoria</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="hidden md:table-cell">Data</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            const category = getCategoryByName(transaction.category);
            return (
              <TableRow key={transaction.id}>
                <TableCell className="hidden sm:table-cell">
                  {category && (
                    <Badge variant="outline" className="flex w-fit items-center gap-2">
                        <category.icon className="h-4 w-4" />
                        {category.name}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{transaction.description}</div>
                  <div className="text-sm text-muted-foreground sm:hidden">
                    {category?.name}
                  </div>
                  {transaction.totalInstallments && transaction.totalInstallments > 1 && (
                    <div className="text-xs text-muted-foreground">
                        Parcela {transaction.installmentNumber}/{transaction.totalInstallments}
                    </div>
                  )}
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
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
