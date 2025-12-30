'use client';

import { useMemo, useState } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Header } from "@/components/common/Header";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TransactionList } from '@/components/transactions/TransactionList';
import type { Account, Transaction } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { isSameDay } from 'date-fns';

export default function CalendarPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    // Queries
    const transactionsQuery = useMemoFirebase(() => 
        user ? query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc')) : null
    , [firestore, user]);

    const accountsQuery = useMemoFirebase(() =>
        user ? collection(firestore, 'users', user.uid, 'accounts') : null
    , [firestore, user]);

    // Data fetching
    const { data: transactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);
    const { data: accounts, isLoading: accountsLoading } = useCollection<Account>(accountsQuery);
    
    const isLoading = transactionsLoading || accountsLoading;

    const transactionDates = useMemo(() => {
        return (transactions || []).map(t => new Date(t.date));
    }, [transactions]);

    const selectedDayTransactions = useMemo(() => {
        if (!selectedDate || !transactions) return [];
        return transactions.filter(t => isSameDay(new Date(t.date), selectedDate));
    }, [selectedDate, transactions]);
    
  return (
    <>
      <Header title="Calendário Financeiro" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <Card>
                <CardContent className="p-2">
                     <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="p-0"
                        classNames={{
                            day_cell: "text-center text-sm p-0 relative",
                            day: "h-12 w-full justify-center p-0 font-normal aria-selected:opacity-100",
                        }}
                        components={{
                            DayContent: ({ date }) => {
                                const hasTransactions = transactionDates.some(tDate => isSameDay(tDate, date));
                                return (
                                    <div className="relative h-full w-full flex items-center justify-center">
                                        <span>{date.getDate()}</span>
                                        {hasTransactions && (
                                            <div className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                                        )}
                                    </div>
                                );
                            }
                        }}
                    />
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
             <Card className="h-full">
                <CardHeader>
                    <CardTitle>Transações do Dia</CardTitle>
                    <CardDescription>
                        {selectedDate ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(selectedDate) : 'Selecione uma data'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : selectedDayTransactions.length > 0 ? (
                        <TransactionList transactions={selectedDayTransactions} accounts={accounts || []} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-center">
                            <p className="text-muted-foreground">Nenhuma transação neste dia.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </main>
    </>
  );
}
