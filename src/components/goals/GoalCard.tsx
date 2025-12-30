import type { FinancialGoal } from "@/lib/types";
import { getPlaceholderImage } from "@/lib/placeholder-images";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type GoalCardProps = {
  goal: FinancialGoal;
};

export function GoalCard({ goal }: GoalCardProps) {
  const image = getPlaceholderImage(goal.imageId);
  const percentage = (goal.currentAmount / goal.targetAmount) * 100;
  
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  return (
    <Card className="flex flex-col">
      <CardHeader className="p-0">
        {image && (
          <div className="relative aspect-[3/2] w-full">
            <Image
              src={image.imageUrl}
              alt={image.description}
              fill
              className="object-cover rounded-t-lg"
              data-ai-hint={image.imageHint}
            />
          </div>
        )}
        <div className="p-6 pb-0">
            <CardTitle>{goal.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-6 pt-2">
        <div className="flex justify-between items-baseline mb-2">
            <span className="text-2xl font-bold">{formatCurrency(goal.currentAmount)}</span>
            <span className="text-sm font-medium text-muted-foreground">de {formatCurrency(goal.targetAmount)}</span>
        </div>
        <Progress value={percentage} />
         <p className="text-sm text-muted-foreground text-right mt-1">{percentage.toFixed(0)}% concluído</p>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground w-full text-center">
            Meta de economia: <span className="font-semibold text-primary">{formatCurrency(goal.monthlySaving)}/mês</span>
        </p>
      </CardFooter>
    </Card>
  );
}
