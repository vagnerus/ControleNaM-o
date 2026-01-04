'use client';
import type { Account, Category, CreditCard, Tag, Transaction } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { TransactionList } from "../transactions/TransactionList";
import { Button } from "../ui/button";
import { MoreVertical, Trash2, Edit, FileText } from "lucide-react";
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
import { deleteCard } from "@/lib/data";
import { useFirestore, useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { AddCardDialog } from "./AddCardDialog";
import { BrandIcon } from "./BrandIcon";
import Link from "next/link";


type CreditCardViewProps = {
  cardData: CreditCard & { transactions: Transaction[], spent: number };
  accounts: Account[];
  categories: Category[];
  tags: Tag[];
};


export function CreditCardView({ cardData, accounts, categories, tags }: CreditCardViewProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const availableLimit = cardData.limit - cardData.spent;
  const usagePercentage = (cardData.spent / cardData.limit) * 100;

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
    deleteCard(firestore, user.uid, cardData.id);
    toast({ title: 'Sucesso', description: 'Cartão removido.' });
  }

  return (
    <>
      <Card className="overflow-hidden shadow-lg">
          <CardHeader className="flex-row items-start justify-between">
              <div>
                  <CardTitle>{cardData.name}</CardTitle>
                  <CardDescription>Gerenciamento da fatura e limite do seu cartão.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
          <Link href={`/cards/statement?cardId=${cardData.id}`}>
            <Button variant="outline" className="w-full">
              Ver Fatura Detalhada
            </Button>
          </Link>
                </Button>
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
                                seu cartão e todas as transações associadas a ele.
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
          </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            {/* Credit Card Visual */}
            <div className="relative aspect-[1.586] w-full max-w-sm mx-auto rounded-xl p-6 flex flex-col justify-between bg-gradient-to-br from-primary via-primary/70 to-accent text-primary-foreground shadow-2xl">
              <div>
                  <div className="flex justify-between items-center">
                      <span className="text-sm font-light">ControleNaMão</span>
                      <BrandIcon brand={cardData.brand} className="h-8" />
                  </div>
              </div>
              <div className="text-center font-mono text-xl tracking-widest">
                  •••• •••• •••• {cardData.last4}
              </div>
              <div>
                  <div className="text-xs uppercase">Titular</div>
                  <div className="font-medium">{user?.displayName || 'Usuário App'}</div>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <div>
                  <div className="flex justify-between text-sm font-medium mb-1">
                      <span>Fatura Atual</span>
                      <span>{formatCurrency(cardData.spent)}</span>
                  </div>
                  <Progress value={usagePercentage} />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{usagePercentage.toFixed(0)}% usado</span>
                      <span>Limite: {formatCurrency(cardData.limit)}</span>
                  </div>
              </div>
              <div className="text-sm space-y-2 border-t pt-4">
                  <div className="flex justify-between">
                      <span className="text-muted-foreground">Limite disponível:</span>
                      <span className="font-medium">{formatCurrency(availableLimit)}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-muted-foreground">Fecha em:</span>
                      <span className="font-medium">Dia {cardData.closingDate}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-muted-foreground">Vence em:</span>
                      <span className="font-medium">Dia {cardData.dueDate}</span>
                  </div>
              </div>
            </div>
          </div>
          <div className="md:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Transações Recentes do Cartão</h3>
              <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                  {cardData.transactions.length > 0 ? (
                      <TransactionList transactions={cardData.transactions.slice(0, 10)} accounts={accounts} categories={categories} tags={tags} />
                  ) : (
                      <div className="text-center py-12 text-muted-foreground">
                          Nenhuma transação neste cartão ainda.
                      </div>
                  )}
              </div>
          </div>
        </CardContent>
      </Card>
      <AddCardDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} card={cardData} />
    </>
  );
}
