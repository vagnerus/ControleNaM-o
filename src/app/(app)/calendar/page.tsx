
'use client';

import { useMemo, useState } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Header } from "@/components/common/Header";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TransactionList } from '@/components/transactions/TransactionList';
import type { Account, Category, Tag, Transaction } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { isSameDay } from 'date-fns';
import { format } from 'date-fns';

export default function CalendarPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    // Queries
    const transactionsQuery = useMemoFirebase(() => 
        user ? query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc')) : null
    , [firestore, user]);

    const accountsQuery = useMemoFirebase(() =>
        user ? collection(firestore, 'users', user.uid, 'accounts') : null
    , [firestore, user]);
    
    const categoriesQuery = useMemoFirebase(() =>
        user ? collection(firestore, 'users', user.uid, 'categories') : null
    , [firestore, user]);

    const tagsQuery = useMemoFirebase(() =>
        user ? collection(firestore, 'users', user.uid, 'tags') : null
    , [firestore, user]);

    // Data fetching
    const { data: transactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);
    const { data: accounts, isLoading: accountsLoading } = useCollection<Account>(accountsQuery);
    const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesQuery);
    const { data: tags, isLoading: tagsLoading } = useCollection<Tag>(tagsQuery);
    
    const isLoading = transactionsLoading || accountsLoading || categoriesLoading || tagsLoading;

    const dayTransactionInfo = useMemo(() => {
        const info = new Map<string, { income: boolean, expense: boolean }>();
        if (!transactions) return info;
        
        for (const t of transactions) {
            const dayKey = format(new Date(t.date), 'yyyy-MM-dd');
            const dayInfo = info.get(dayKey) || { income: false, expense: false };
            if (t.type === 'income') dayInfo.income = true;
            if (t.type === 'expense') dayInfo.expense = true;
            info.set(dayKey, dayInfo);
        }
        return info;

    }, [transactions]);


    const selectedDayTransactions = useMemo(() => {
        if (!selectedDate || !transactions) return [];
        return transactions.filter(t => isSameDay(new Date(t.date), selectedDate));
    }, [selectedDate, transactions]);
    
  return (
    <>
      <Header title="Calendário Financeiro" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        <div className="xl:col-span-2">
            <Card>
                <CardContent className="p-1">
                     <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        month={currentMonth}
                        onMonthChange={setCurrentMonth}
                        className="p-0"
                        classNames={{
                            cell: "text-center text-sm p-0 relative first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                            day: "h-16 w-full p-1 font-normal aria-selected:opacity-100",
                        }}
                        components={{
                            DayContent: ({ date }) => {
                                const dayKey = format(date, 'yyyy-MM-dd');
                                const info = dayTransactionInfo.get(dayKey);
                                return (
                                    <div className="relative h-full w-full flex items-start justify-end flex-col p-1">
                                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">{date.getDate()}</span>
                                        {(info?.income || info?.expense) && (
                                            <div className="flex space-x-1 self-center">
                                                {info.income && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                                                {info.expense && <div className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                        }}
                    />
                </CardContent>
            </Card>
        </div>
        <div className="xl:col-span-1">
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
                        <TransactionList transactions={selectedDayTransactions} accounts={accounts || []} categories={categories || []} tags={tags || []} />
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
