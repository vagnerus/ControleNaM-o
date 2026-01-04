
'use client';

import { useMemo, useState } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Header } from "@/components/common/Header";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TransactionList } from '@/components/transactions/TransactionList';
import type { Account, Category, Tag, Transaction, RecurringTransaction } from '@/lib/types';
import { Loader2, Repeat } from 'lucide-react';
import { isSameDay, format, startOfMonth, endOfMonth, isWithinInterval, addMonths, setDate, isFuture } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function CalendarPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    // Queries
    const transactionsQuery = useMemoFirebase(() => 
        user ? query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc')) : null
    , [firestore, user]);

    const recurringQuery = useMemoFirebase(() =>
        user ? query(collection(firestore, 'users', user.uid, 'recurringTransactions')) : null
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
    const { data: recurring, isLoading: recurringLoading } = useCollection<RecurringTransaction>(recurringQuery);
    const { data: accounts, isLoading: accountsLoading } = useCollection<Account>(accountsQuery);
    const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesQuery);
    const { data: tags, isLoading: tagsLoading } = useCollection<Tag>(tagsQuery);
    
    const isLoading = transactionsLoading || accountsLoading || categoriesLoading || tagsLoading || recurringLoading;

    const projectedRecurring = useMemo(() => {
        if (!recurring) return [];
        
        const monthInterval = { start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) };
        const futureEvents: Transaction[] = [];

        recurring.forEach(r => {
            const startDate = new Date(r.startDate);
            if (r.frequency === 'monthly') {
                let occurrenceDate = setDate(currentMonth, startDate.getDate());
                if (isWithinInterval(occurrenceDate, monthInterval) && isFuture(occurrenceDate)) {
                    if (!r.endDate || new Date(r.endDate) > occurrenceDate) {
                        futureEvents.push({
                            ...r,
                            id: `recurring-${r.id}-${format(occurrenceDate, 'yyyy-MM-dd')}`,
                            date: occurrenceDate.toISOString(),
                            isFuture: true,
                        } as unknown as Transaction);
                    }
                }
            }
            // TODO: Add logic for other frequencies (daily, weekly, yearly)
        });

        return futureEvents;
    }, [recurring, currentMonth]);


    const dayInfo = useMemo(() => {
        const info = new Map<string, { income: boolean, expense: boolean, future: boolean }>();
        if (transactions) {
            for (const t of transactions) {
                const dayKey = format(new Date(t.date), 'yyyy-MM-dd');
                const dayInfo = info.get(dayKey) || { income: false, expense: false, future: false };
                if (t.type === 'income') dayInfo.income = true;
                if (t.type === 'expense') dayInfo.expense = true;
                info.set(dayKey, dayInfo);
            }
        }
        if (projectedRecurring) {
            for (const p of projectedRecurring) {
                const dayKey = format(new Date(p.date), 'yyyy-MM-dd');
                const dayInfo = info.get(dayKey) || { income: false, expense: false, future: false };
                dayInfo.future = true;
                info.set(dayKey, dayInfo);
            }
        }
        return info;

    }, [transactions, projectedRecurring]);


    const selectedDayTransactions = useMemo(() => {
        if (!selectedDate) return [];
        
        const past = transactions?.filter(t => isSameDay(new Date(t.date), selectedDate)) || [];
        const future = projectedRecurring.filter(t => isSameDay(new Date(t.date), selectedDate));

        return [...past, ...future].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [selectedDate, transactions, projectedRecurring]);
    
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
                            Day: ({ day, modifiers, ...props }) => {
                                const date = day.date;
                                const dayKey = format(date, 'yyyy-MM-dd');
                                const info = dayInfo.get(dayKey);
                                return (
                                    <button
                                        {...props as any}
                                        className={cn(
                                            props.className,
                                            "relative h-full w-full flex items-start justify-end flex-col p-1",
                                            modifiers.selected && "bg-primary text-primary-foreground",
                                            modifiers.today && "bg-accent text-accent-foreground"
                                        )}
                                    >
                                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">{date.getDate()}</span>
                                        {(info?.income || info?.expense || info?.future) && (
                                            <div className="flex space-x-1 self-center items-center">
                                                {info.income && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                                                {info.expense && <div className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                                                {info.future && <Repeat className="h-3 w-3 text-blue-500" />}
                                            </div>
                                        )}
                                    </button>
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
                    <CardTitle>Eventos do Dia</CardTitle>
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
                        <div className="space-y-4">
                            {selectedDayTransactions.map(transaction => (
                                <div key={transaction.id} className="flex items-center gap-4 p-2 rounded-md bg-muted/50">
                                    { (transaction as any).isFuture && <Badge variant="outline" className="border-blue-500 text-blue-500">Previsto</Badge> }
                                    <div className="flex-grow">
                                        <p className="font-medium">{transaction.description}</p>
                                        <p className="text-sm text-muted-foreground">{categories?.find(c => c.id === transaction.categoryId)?.name}</p>
                                    </div>
                                    <div className={`font-semibold ${transaction.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-center">
                            <p className="text-muted-foreground">Nenhum evento neste dia.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </main>
    </>
  );
}
