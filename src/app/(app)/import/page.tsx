'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, writeBatch, doc, increment } from 'firebase/firestore';
import type { Account, Category, Transaction, CreditCard } from '@/lib/types';
import { Header } from "@/components/common/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUp, Loader2, Upload, Check, AlertCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parse, isValid } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ParsedTransaction = {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    categoryId: string;
    accountId: string;
    creditCardId?: string;
    isInstallment: boolean;
    totalInstallments?: number;
};

export default function ImportPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();
    const [isParsing, setIsParsing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
    const [fileName, setFileName] = useState<string>('');

    const { data: accounts, isLoading: accountsLoading } = useCollection<Account>(useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'accounts') : null, [firestore, user]));
    const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]));
    const { data: cards, isLoading: cardsLoading } = useCollection<CreditCard>(useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'creditCards') : null, [firestore, user]));

    const parseCSV = (text: string) => {
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) return [];

        // Detect delimiter
        const firstLine = lines[0];
        const delimiter = firstLine.includes(';') ? ';' : ',';

        const rows = lines.map(line => {
            // Simple split handling quotes
            const matches = line.match(/(".*?"|[^";,]+)(?=\s*[;,]|\s*$)/g);
            return matches ? matches.map(v => v.replace(/^"|"$/g, '').trim()) : [];
        });

        const header = rows[0].map(h => h.toLowerCase());
        const dataRows = rows.slice(1);

        // Map column indices with more robust detection
        const colMap = {
            date: header.findIndex(h => h.includes('data') || h.includes('date') || h.includes('quando')),
            description: header.findIndex(h => h.includes('desc') || h.includes('historico') || h.includes('item') || h.includes('estabelecimento') || h.includes('title')),
            amount: header.findIndex(h => h.includes('valor') || h.includes('quantia') || h.includes('amount') || h.includes('total') || h.includes('price')),
            type: header.findIndex(h => h.includes('tipo') || h.includes('type')),
            category: header.findIndex(h => h.includes('cat')),
            account: header.findIndex(h => h.includes('conta') || h.includes('account') || h.includes('banco')),
            card: header.findIndex(h => h.includes('cartao') || h.includes('card')),
        };

        // Default IDs
        const defaultAccountId = accounts && accounts.length > 0 ? accounts[0].id : '';
        const defaultCategoryId = categories && categories.length > 0 ? categories.find(c => c.name.toLowerCase().includes('outro'))?.id || categories[0].id : '';

        return dataRows.map((row, index) => {
            try {
                let dateStr = row[colMap.date] || '';
                let date: Date = new Date();
                
                // Try various formats
                if (dateStr.includes('/')) {
                    const parts = dateStr.split('/');
                    if (parts.length === 3) {
                        // Check if it's YYYY/MM/DD or DD/MM/YYYY
                        if (parts[0].length === 4) {
                            date = parse(dateStr, 'yyyy/MM/dd', new Date());
                        } else {
                            date = parse(dateStr, 'dd/MM/yyyy', new Date());
                        }
                    } else if (parts.length === 2) {
                        date = parse(dateStr, 'dd/MM', new Date());
                    }
                } else if (dateStr.includes('-')) {
                    date = new Date(dateStr);
                } else {
                    date = new Date(dateStr);
                }

                if (!isValid(date)) date = new Date();

                let amountStr = row[colMap.amount] || '0';
                // Handle PT-BR numbers (1.234,56 -> 1234.56 or -1.234,56)
                let amount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.'));
                
                let type: 'income' | 'expense' = amount >= 0 ? 'income' : 'expense';
                const typeVal = (row[colMap.type] || '').toLowerCase();
                if (typeVal.includes('receita') || typeVal.includes('income') || typeVal.includes('entrada') || typeVal.includes('credito') || typeVal.includes('crédito')) {
                    type = 'income';
                } else if (typeVal.includes('despesa') || typeVal.includes('expense') || typeVal.includes('saida') || typeVal.includes('debito') || typeVal.includes('débito')) {
                    type = 'expense';
                }
                
                amount = Math.abs(amount);

                // Try to find matching category by name
                const catName = (row[colMap.category] || '').toLowerCase();
                const matchedCategory = categories?.find(c => c.name.toLowerCase() === catName || catName.includes(c.name.toLowerCase()));

                // Try to find matching account by name
                const accName = (row[colMap.account] || '').toLowerCase();
                const matchedAccount = accounts?.find(a => a.name.toLowerCase() === accName || accName.includes(a.name.toLowerCase()));

                return {
                    id: `temp-${index}`,
                    date: date.toISOString(),
                    description: row[colMap.description] || 'Transação Importada',
                    amount,
                    type,
                    categoryId: matchedCategory?.id || defaultCategoryId,
                    accountId: matchedAccount?.id || defaultAccountId,
                    isInstallment: false,
                } as ParsedTransaction;
            } catch (e) {
                return null;
            }
        }).filter((t): t is ParsedTransaction => t !== null);
    };

    const handleFileParse = (file: File) => {
        if (!file) return;
        
        setIsParsing(true);
        setFileName(file.name);
        const reader = new FileReader();

        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) return;

            try {
                const transactions = parseCSV(text);

                if (transactions.length === 0) {
                     toast({
                        variant: 'destructive',
                        title: 'Erro no processamento',
                        description: 'Não conseguimos identificar os dados no arquivo. Verifique se é um CSV válido.'
                    });
                } else {
                    setParsedTransactions(transactions);
                    toast({ title: 'Arquivo processado!', description: `${transactions.length} transações prontas para revisão.` });
                }
            } catch (error) {
                console.error(error);
                toast({ variant: 'destructive', title: 'Erro ao processar', description: 'O arquivo parece estar mal formatado.' });
            } finally {
                setIsParsing(false);
            }
        };

        reader.readAsText(file);
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileParse(file);
        }
    };
    
    const updateTransaction = (id: string, updates: Partial<ParsedTransaction>) => {
        setParsedTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const removeTransaction = (id: string) => {
        setParsedTransactions(prev => prev.filter(t => t.id !== id));
    };

    const handleImport = async () => {
        if (!user || parsedTransactions.length === 0) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não há dados para importar.' });
            return;
        }

        setIsImporting(true);

        try {
            const batch = writeBatch(firestore);
            
            for (const t of parsedTransactions) {
                const transRef = doc(collection(firestore, 'users', user.uid, 'transactions'));
                
                const transactionData = {
                    date: t.date,
                    description: t.description,
                    amount: t.amount,
                    type: t.type,
                    categoryId: t.categoryId,
                    accountId: t.accountId,
                    creditCardId: t.creditCardId || null,
                    isInstallment: t.isInstallment,
                    totalInstallments: t.totalInstallments || null,
                    createdAt: new Date().toISOString()
                };

                batch.set(transRef, transactionData);

                // Update account balance
                if (!t.creditCardId) {
                    const accountRef = doc(firestore, 'users', user.uid, 'accounts', t.accountId);
                    const balanceChange = t.type === 'income' ? t.amount : -t.amount;
                    batch.update(accountRef, { balance: increment(balanceChange) });
                }
            }
            
            await batch.commit();
            
            toast({
                title: 'Sucesso!',
                description: `${parsedTransactions.length} transações importadas com sucesso.`,
            });
            
            setParsedTransactions([]);
            setFileName('');
            
            // Navigate to dashboard or transactions
            setTimeout(() => {
                router.push('/transactions');
            }, 1500);

        } catch (error) {
             console.error(error);
             toast({ variant: 'destructive', title: 'Erro na importação', description: 'Ocorreu um erro ao salvar as transações.' });
        } finally {
            setIsImporting(false);
        }
    };

    const isLoading = accountsLoading || categoriesLoading || cardsLoading;

    return (
        <>
            <Header title="Importar Extrato" />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                         <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            <FileUp className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-center">Upload de Arquivo</CardTitle>
                        <CardDescription className="text-center">
                            Selecione seu arquivo CSV. Vamos tentar organizar tudo automaticamente.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div 
                            className="w-full p-10 border-2 border-dashed rounded-xl text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                            onClick={() => document.getElementById('csv-upload')?.click()}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const file = e.dataTransfer.files?.[0];
                                if (file) handleFileParse(file);
                            }}
                        >
                            <input type="file" id="csv-upload" className="hidden" accept=".csv" onChange={handleFileChange} />
                            {isParsing || isLoading ? (
                                <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
                            ) : (
                                <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                            )}
                            <p className="mt-4 text-lg font-medium">
                                {isParsing ? 'Lendo dados...' : isLoading ? 'Carregando configurações...' : 'Clique ou arraste o arquivo CSV aqui'}
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">Suporta Nubank, Itaú, Bradesco e formatos padrão</p>
                             {fileName && !isParsing && (
                                <div className="mt-4 flex items-center justify-center gap-2 text-primary font-semibold">
                                    <Check className="h-4 w-4" /> {fileName}
                                </div>
                             )}
                        </div>
                    </CardContent>
                </Card>

                {parsedTransactions.length > 0 && (
                    <Card className="animate-in fade-in slide-in-from-bottom-4">
                        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <CardTitle>Revisar Transações</CardTitle>
                                <CardDescription>Confira se os dados estão corretos antes de salvar.</CardDescription>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <Button variant="outline" onClick={() => setParsedTransactions([])} disabled={isImporting}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleImport} disabled={isImporting} className="flex-1 md:flex-none">
                                    {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                    Salvar {parsedTransactions.length} Transações
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 sm:p-6">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[120px]">Data</TableHead>
                                            <TableHead>Descrição</TableHead>
                                            <TableHead className="w-[180px]">Categoria</TableHead>
                                            <TableHead className="w-[180px]">Conta</TableHead>
                                            <TableHead className="text-right w-[120px]">Valor</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedTransactions.map((t) => (
                                            <TableRow key={t.id}>
                                                <TableCell className="py-2">
                                                    <input 
                                                        type="date" 
                                                        className="bg-transparent border-none focus:ring-0 w-full text-sm"
                                                        value={t.date.split('T')[0]}
                                                        onChange={(e) => updateTransaction(t.id, { date: new Date(e.target.value).toISOString() })}
                                                    />
                                                </TableCell>
                                                <TableCell className="py-2">
                                                     <input 
                                                        type="text" 
                                                        className="bg-transparent border-none focus:ring-0 w-full text-sm font-medium"
                                                        value={t.description}
                                                        onChange={(e) => updateTransaction(t.id, { description: e.target.value })}
                                                    />
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    <Select value={t.categoryId} onValueChange={(val) => updateTransaction(t.id, { categoryId: val }) }>
                                                        <SelectTrigger className="h-8 border-none bg-muted/50 focus:ring-0">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {categories?.map(c => (
                                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    <Select value={t.accountId} onValueChange={(val) => updateTransaction(t.id, { accountId: val }) }>
                                                        <SelectTrigger className="h-8 border-none bg-muted/50 focus:ring-0">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {accounts?.map(a => (
                                                                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className={`text-right font-bold py-2 ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    <div className="flex items-center justify-end">
                                                        <span className="mr-1">{t.type === 'income' ? '+' : '-'}</span>
                                                        <input 
                                                            type="number" 
                                                            className="bg-transparent border-none focus:ring-0 w-20 text-right text-sm font-bold"
                                                            value={t.amount}
                                                            onChange={(e) => updateTransaction(t.id, { amount: parseFloat(e.target.value) || 0 })}
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeTransaction(t.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {!parsedTransactions.length && !isParsing && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        <Card className="bg-muted/30 border-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-primary" /> Como funciona?
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs text-muted-foreground">
                                Exportre seu extrato em formato CSV do seu banco e arraste para cá. Nós identificamos os campos automaticamente.
                            </CardContent>
                        </Card>
                        <Card className="bg-muted/30 border-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Check className="h-4 w-4 text-emerald-500" /> Posso editar?
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs text-muted-foreground">
                                Sim! Antes de salvar, você pode alterar a data, descrição, categoria, conta e até o valor de cada transação.
                            </CardContent>
                        </Card>
                        <Card className="bg-muted/30 border-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <FileUp className="h-4 w-4 text-blue-500" /> Vários bancos
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs text-muted-foreground">
                                O sistema é treinado para entender os cabeçalhos mais comuns de bancos brasileiros e internacionais.
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>
        </>
    );
}