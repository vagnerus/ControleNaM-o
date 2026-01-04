import type { FinancialGoal } from "@/lib/types";
import { getPlaceholderImage } from "@/lib/placeholder-images";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { useFirestore, useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { deleteGoal } from "@/lib/data";
import { Edit, MoreVertical, Trash2 } from "lucide-react";
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
import { AddGoalDialog } from "./AddGoalDialog";

type GoalCardProps = {
  goal: FinancialGoal;
};

export function GoalCard({ goal }: GoalCardProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const placeholderImage = getPlaceholderImage(goal.imageId);
  const fallbackUrl = "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=600&h=400&fit=crop"; // Generic financial goal image
  
  const imageUrl = placeholderImage?.imageUrl || fallbackUrl;
  const imageAlt = placeholderImage?.description || goal.name;
  const imageHint = placeholderImage?.imageHint || "financial goal";

  // Safety checks for amounts
  const currentAmount = goal.currentAmount || 0;
  const targetAmount = goal.targetAmount || 0;
  
  const percentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
  const displayPercentage = isFinite(percentage) ? percentage : 0;
  
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);

  const handleDelete = () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado.' });
        return;
    }
    deleteGoal(firestore, user.uid, goal.id);
    toast({ title: 'Sucesso', description: 'Objetivo removido.' });
  }

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative bg-muted">
            <div className="relative aspect-[16/9] w-full overflow-hidden">
                <Image
                src={imageUrl}
                alt={imageAlt}
                fill
                className="object-cover transition-all hover:scale-105"
                data-ai-hint={imageHint}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
            </div>
            <div className="absolute top-2 right-2">
                 <AlertDialog>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-black/30 hover:bg-black/50 border-none text-white">
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
                                seu objetivo financeiro.
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
            </div>
        </div>
        <div className="p-6 pb-0">
            <CardTitle>{goal.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-6 pt-2">
        <div className="flex justify-between items-baseline mb-2">
            <span className="text-2xl font-bold">{formatCurrency(currentAmount)}</span>
            <span className="text-sm font-medium text-muted-foreground">de {formatCurrency(targetAmount)}</span>
        </div>
        <Progress value={displayPercentage} />
         <p className="text-sm text-muted-foreground text-right mt-1">{displayPercentage.toFixed(0)}% concluído</p>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground w-full text-center">
            Meta de economia: <span className="font-semibold text-primary">{formatCurrency(goal.monthlySaving)}/mês</span>
        </p>
      </CardFooter>
      <AddGoalDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          goal={goal}
      />
    </Card>
  );
}
