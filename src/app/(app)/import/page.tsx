
'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Account, Category, Transaction } from '@/lib/types';
import { Header } from "@/components/common/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUp, Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { saveTransaction, saveAccount, saveCategory } from '@/lib/data.tsx';
import { format } from 'date-fns';

type ParsedTransaction = Omit<Transaction, 'id' | 'accountId' | 'categoryId'> & {
    categoryName: string;
    accountName: string;
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
                        // Handle CSVs with quotes and commas inside descriptions
                        const values = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/^"|"$/g, ''));
                        if (!values || values.length < 6) return null;

                        const [date, description, amount, type, categoryName, accountName] = values;
                        
                        return {
                            date,
                            description,
                            amount: parseFloat(amount),
                            type: type === 'Receita' ? 'income' : 'expense',
                            categoryName: categoryName,
                            accountName: accountName,
                        };
                    }).filter((t): t is ParsedTransaction => t !== null);

                setParsedTransactions(transactions);
                toast({ title: 'Arquivo processado!', description: `${transactions.length} transações prontas para importação.` });
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
        if (!user || !accounts || !categories || parsedTransactions.length === 0) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não há dados suficientes para importar.' });
            return;
        }

        setIsImporting(true);

        try {
            const accountsMap = new Map(accounts.map(a => [a.name, a.id]));
            const categoriesMap = new Map(categories.map(c => [c.name, c.id]));
            
            for (const t of parsedTransactions) {
                // Find or create account
                let accountId = accountsMap.get(t.accountName);
                if (!accountId) {
                    const newAccount = await saveAccount(firestore, user.uid, { name: t.accountName, balance: 0 });
                    accountId = newAccount.id;
                    accountsMap.set(t.accountName, accountId);
                }

                // Find or create category
                let categoryId = categoriesMap.get(t.categoryName);
                if (!categoryId) {
                    const newCategory = await saveCategory(firestore, user.uid, { name: t.categoryName, type: t.type, icon: 'Receipt' });
                    categoryId = newCategory.id;
                    categoriesMap.set(t.categoryName, categoryId);
                }

                const transactionPayload: Omit<Transaction, 'id'> = {
                    date: new Date(t.date).toISOString(),
                    description: t.description,
                    amount: Math.abs(t.amount), // Amount is always positive in the DB
                    type: t.type,
                    categoryId,
                    accountId,
                };
                
                // Use saveTransaction which handles balance updates
                saveTransaction(firestore, user.uid, transactionPayload);
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


    const isLoading = accountsLoading || categoriesLoading;

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
                        <CardDescription className="text-center">
                            Envie um arquivo CSV no mesmo formato da nossa exportação para adicionar transações em lote.
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
                                                <TableCell>{format(new Date(t.date), 'dd/MM/yyyy')}</TableCell>
                                                <TableCell>{t.description}</TableCell>
                                                <TableCell>{t.categoryName}</TableCell>
                                                <TableCell>{t.accountName}</TableCell>
                                                <TableCell className={`text-right font-medium ${t.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
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
