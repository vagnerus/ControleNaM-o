
'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Account, Category, Transaction, CreditCard } from '@/lib/types';
import { Header } from "@/components/common/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUp, Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { saveTransaction, saveAccount, saveCategory, saveCard } from '@/lib/data.tsx';
import { format } from 'date-fns';

type ParsedTransaction = Partial<Omit<Transaction, 'id' | 'accountId' | 'categoryId'>> & {
    categoryName: string;
    accountName: string;
    cardName?: string;
    isInstallment: boolean;
    totalInstallments?: number;
    rawRow: string;
};

export default function ImportPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isParsing, setIsParsing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
    const [fileName, setFileName] = useState<string>('');

    const { data: accounts, isLoading: accountsLoading } = useCollection<Account>(useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'accounts') : null, [firestore, user]));
    const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]));
    const { data: cards, isLoading: cardsLoading } = useCollection<CreditCard>(useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'creditCards') : null, [firestore, user]));

    const handleFileParse = (file: File) => {
        if (!file) return;
        if (file.type !== 'text/csv') {
            toast({ variant: 'destructive', title: 'Formato inválido', description: 'Por favor, selecione um arquivo CSV.' });
            return;
        }

        setIsParsing(true);
        setFileName(file.name);
        const reader = new FileReader();

        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) return;

            try {
                const rows = text.split('\n').slice(1); // Skip header
                const transactions: ParsedTransaction[] = rows
                    .map(row => row.trim())
                    .filter(row => row)
                    .map(row => {
                        const values = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/^"|"$/g, ''));
                        if (!values || values.length < 9) return null;

                        const [date, description, amount, type, categoryName, accountName, cardName, isInstallment, totalInstallments] = values;
                        
                        // Detect original purchase from installments and skip it
                        if (description.includes('(Compra Original)')) return null;

                        return {
                            date,
                            description,
                            amount: parseFloat(amount),
                            type: type === 'Receita' ? 'income' : 'expense',
                            categoryName: categoryName,
                            accountName: accountName,
                            cardName: cardName || undefined,
                            isInstallment: isInstallment === 'SIM',
                            totalInstallments: isInstallment === 'SIM' ? parseInt(totalInstallments, 10) : undefined,
                            rawRow: row,
                        };
                    }).filter((t): t is ParsedTransaction => t !== null);

                // Filter out individual installments if the main purchase is present
                const installmentDescriptions = new Set(transactions.filter(t => t.isInstallment).map(t => t.description.split(' (')[0]));
                const finalTransactions = transactions.filter(t => {
                    if (t.isInstallment) {
                         const baseDesc = t.description.split(' (')[0];
                         return t.description.includes(' (1/') || !installmentDescriptions.has(baseDesc);
                    }
                    return true;
                });


                setParsedTransactions(finalTransactions);
                toast({ title: 'Arquivo processado!', description: `${finalTransactions.length} transações prontas para importação.` });
            } catch (error) {
                console.error(error);
                toast({ variant: 'destructive', title: 'Erro ao processar', description: 'O arquivo CSV parece estar mal formatado.' });
            } finally {
                setIsParsing(false);
            }
        };

        reader.onerror = () => {
            toast({ variant: 'destructive', title: 'Erro de Leitura', description: 'Não foi possível ler o arquivo.' });
            setIsParsing(false);
        };

        reader.readAsText(file);
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileParse(file);
        }
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileParse(file);
        }
    };

    const handleImport = async () => {
        if (!user || !accounts || !categories || !cards || parsedTransactions.length === 0) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não há dados suficientes para importar.' });
            return;
        }

        setIsImporting(true);

        try {
            const accountsMap = new Map(accounts.map(a => [a.name, a.id]));
            const categoriesMap = new Map(categories.map(c => [c.name, c.id]));
            const cardsMap = new Map(cards.map(c => [c.name, c.id]));
            
            for (const t of parsedTransactions) {
                let accountId = accountsMap.get(t.accountName);
                if (!accountId) {
                    const newAccount = await saveAccount(firestore, user.uid, { name: t.accountName, balance: 0, icon: 'Landmark' });
                    accountId = newAccount.id;
                    accountsMap.set(t.accountName, accountId!);
                }

                let categoryId = categoriesMap.get(t.categoryName);
                if (!categoryId) {
                    const newCategory = await saveCategory(firestore, user.uid, { name: t.categoryName, type: t.type!, icon: 'Receipt' });
                    categoryId = newCategory.id;
                    categoriesMap.set(t.categoryName, categoryId!);
                }
                
                let creditCardId: string | undefined = undefined;
                if(t.cardName) {
                    creditCardId = cardsMap.get(t.cardName);
                }


                const transactionPayload: Omit<Transaction, 'id'> = {
                    date: new Date(t.date!).toISOString(),
                    description: t.description!,
                    amount: Math.abs(t.amount!),
                    type: t.type!,
                    categoryId,
                    accountId,
                    creditCardId,
                    isInstallment: t.isInstallment,
                    totalInstallments: t.totalInstallments,
                };
                
                await saveTransaction(firestore, user.uid, transactionPayload);
            }
            
            toast({ title: 'Importação Concluída!', description: `${parsedTransactions.length} transações importadas com sucesso.` });
            setParsedTransactions([]);
            setFileName('');

        } catch (error) {
             console.error(error);
             toast({ variant: 'destructive', title: 'Erro na importação', description: 'Não foi possível salvar as transações.' });
        } finally {
            setIsImporting(false);
        }
    };


    const isLoading = accountsLoading || categoriesLoading || cardsLoading;

    return (
        <>
            <Header title="Importar Transações" />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
                <Card>
                    <CardHeader>
                         <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            <FileUp className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-center">Importar de Arquivo CSV</CardTitle>
                        <CardDescription className="text-center max-w-xl mx-auto">
                            Envie um arquivo CSV no mesmo formato da nossa exportação para adicionar transações em lote. 
                            O sistema identificará compras parceladas e criará as parcelas futuras automaticamente.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center">
                        <div 
                            className="w-full max-w-lg p-8 border-2 border-dashed rounded-lg text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={handleDrop}
                        >
                            <input type="file" id="csv-upload" className="hidden" accept=".csv" onChange={handleFileChange} />
                            {isParsing || isLoading ? (
                                <Loader2 className="h-8 w-8 mx-auto animate-spin" />
                            ) : (
                                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                            )}
                            <p className="mt-4 font-semibold">
                                {isParsing ? 'Processando...' : isLoading ? 'Carregando dependências...' : 'Arraste e solte o arquivo aqui'}
                            </p>
                            <p className="text-sm text-muted-foreground">ou</p>
                            <Button type="button" variant="outline" onClick={() => document.getElementById('csv-upload')?.click()} disabled={isParsing || isLoading}>
                                Selecione um arquivo
                            </Button>
                             {fileName && !isParsing && <p className="text-sm text-muted-foreground mt-4">Arquivo: {fileName}</p>}
                        </div>
                    </CardContent>
                </Card>

                {parsedTransactions.length > 0 && (
                    <Card>
                        <CardHeader className="flex-row justify-between items-center">
                            <div>
                                <CardTitle>Pré-visualização da Importação</CardTitle>
                                <CardDescription>Confira as transações antes de importar.</CardDescription>
                            </div>
                            <Button onClick={handleImport} disabled={isImporting}>
                                {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Importar {parsedTransactions.length} Transações
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-96 overflow-y-auto border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Descrição</TableHead>
                                            <TableHead>Categoria</TableHead>
                                            <TableHead>Conta</TableHead>
                                            <TableHead className="text-right">Valor</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedTransactions.map((t, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{format(new Date(t.date!), 'dd/MM/yyyy')}</TableCell>
                                                <TableCell>{t.description}</TableCell>
                                                <TableCell>{t.categoryName}</TableCell>
                                                <TableCell>{t.accountName}</TableCell>
                                                <TableCell className={`text-right font-medium ${t.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount!)}
                                                    {t.isInstallment && <span className="text-xs text-muted-foreground ml-1"> (1/{t.totalInstallments})</span>}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>
        </>
    );
}
