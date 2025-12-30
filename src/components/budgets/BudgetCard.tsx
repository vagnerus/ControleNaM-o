import { getCategoryByName } from "@/lib/data";
import type { Budget } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BudgetCardProps = {
  budget: Budget;
  isCompact?: boolean;
};

export function BudgetCard({ budget, isCompact = false }: BudgetCardProps) {
  const category = getCategoryByName(budget.category);
  const percentage = (budget.spent / budget.amount) * 100;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const progressColor =
    percentage > 90 ? "bg-destructive" : percentage > 75 ? "bg-warning" : "bg-primary";

  if (isCompact) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 font-medium">
                    {category?.icon && <category.icon className="h-4 w-4" />}
                    <span>{budget.category}</span>
                </div>
                <span className="text-muted-foreground">{formatCurrency(budget.spent)}</span>
            </div>
            <Progress value={percentage} indicatorClassName={progressColor} />
        </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          {category?.icon && <category.icon className="h-6 w-6" />}
          <span>{budget.category}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-muted-foreground text-sm">
          <span>Gasto</span>
          <span>Orçamento</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-2xl font-bold">
            {formatCurrency(budget.spent)}
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
