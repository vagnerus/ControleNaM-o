'use client';

import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Account, Category, Transaction } from '@/lib/types';
import { Header } from "@/components/common/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function ExportPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    // Queries to fetch all necessary data for export
    const transactionsQuery = useMemoFirebase(() => 
        user ? query(collection(firestore, 'users', user.uid, 'transactions')) : null
    , [firestore, user]);

    const accountsQuery = useMemoFirebase(() =>
        user ? collection(firestore, 'users', user.uid, 'accounts') : null
    , [firestore, user]);

    const categoriesQuery = useMemoFirebase(() =>
        user ? collection(firestore, 'users', user.uid, 'categories') : null
    , [firestore, user]);
    
    const cardsQuery = useMemoFirebase(() =>
        user ? collection(firestore, 'users', user.uid, 'creditCards') : null
    , [firestore, user]);

    const { data: transactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);
    const { data: accounts, isLoading: accountsLoading } = useCollection<Account>(accountsQuery);
    const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesQuery);
    const { data: cards, isLoading: cardsLoading } = useCollection(cardsQuery);

    const isLoading = transactionsLoading || accountsLoading || categoriesLoading || cardsLoading;

    const handleExport = () => {
        if (!transactions || !accounts || !categories || isLoading) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Dados ainda não carregados ou indisponíveis para exportação."
            });
            return;
        }

        try {
            const headers = ["Data", "Descrição", "Valor", "Tipo", "Categoria", "Conta", "Cartão de Crédito", "É Parcela", "Total de Parcelas"];
            const csvRows = [headers.join(',')];

            for (const transaction of transactions) {
                 if (transaction.isInstallment && transaction.description.includes('(Compra Original)')) {
                    continue;
                }

                const date = format(new Date(transaction.date), 'yyyy-MM-dd');
                const description = `"${transaction.description.replace(/"/g, '""')}"`;
                const amount = transaction.amount; // Store the absolute value
                const type = transaction.type === 'income' ? 'Receita' : 'Despesa';
                const category = categories.find(c => c.id === transaction.categoryId)?.name || 'N/A';
                const accountName = accounts.find(a => a.id === transaction.accountId)?.name || 'N/A';
                const cardName = transaction.creditCardId ? cards?.find(c => c.id === transaction.creditCardId)?.name : '';
                
                const isInstallment = transaction.isInstallment ? 'SIM' : 'NÃO';
                 const totalInstallments = transaction.isInstallment ? (transaction.totalInstallments || '') : '';


                const row = [date, description, amount, type, `"${category}"`, `"${accountName}"`, `"${cardName || ''}"`, isInstallment, totalInstallments];
                csvRows.push(row.join(','));
            }

            const csvString = csvRows.join('\n');
            const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });

            const link = document.createElement("a");
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", `transacoes-${format(new Date(), 'yyyy-MM-dd')}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
             toast({
                title: "Exportação Iniciada!",
                description: "Seu download deve começar em breve."
            });
        } catch (error) {
            console.error("Failed to export data:", error);
            toast({
                variant: "destructive",
                title: "Erro na Exportação",
                description: "Não foi possível gerar o arquivo. Tente novamente."
            });
        }
    };

    return (
        <>
            <Header title="Exportar Transações" />
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                <Card>
                    <CardHeader>
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            <FileDown className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-center">Exportação de Transações</CardTitle>
                        <CardDescription className="text-center">
                            Baixe um arquivo CSV com todas as suas movimentações financeiras para análise em planilhas ou backup pessoal.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center">
                        <Button onClick={handleExport} disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Carregando dados...
                                </>
                            ) : (
                                <>
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Exportar para CSV
                                </>
                            )}
                        </Button>
                        <p className="text-sm text-muted-foreground mt-4">
                            Você receberá um arquivo chamado `transacoes-AAAA-MM-DD.csv`.
                        </p>
                    </CardContent>
                </Card>
            </main>
        </>
    );
}
