
'use client';

import { useMemo, useState } from 'react';
import { useDoc, useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import type { CreditCard, Transaction, Category, Tag, Account } from '@/lib/types';
import { Header } from "@/components/common/Header";
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionList } from '@/components/transactions/TransactionList';
import { Button } from '@/components/ui/button';
import { format, subMonths, addMonths, startOfMonth, endOfMonth, setDate, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BrandIcon } from '@/components/cards/BrandIcon';

export default function CardStatementPage({ params }: { params: { cardId: string } }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const cardRef = useMemoFirebase(() => 
    user ? doc(firestore, 'users', user.uid, 'creditCards', params.cardId) : null
  , [firestore, user, params.cardId]);

  const { data: card, isLoading: cardLoading } = useDoc<CreditCard>(cardRef);
  
  const transactionsQuery = useMemoFirebase(() => 
    user ? query(
        collection(firestore, 'users', user.uid, 'transactions'), 
        where('creditCardId', '==', params.cardId),
        orderBy('date', 'desc')
    ) : null
  , [firestore, user, params.cardId]);

  const { data: transactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);

  const categoriesQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]);
  const tagsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'tags') : null, [firestore, user]);
  const accountsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'accounts') : null, [firestore, user]);

  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesQuery);
  const { data: tags, isLoading: tagsLoading } = useCollection<Tag>(tagsQuery);
  const { data: accounts, isLoading: accountsLoading } = useCollection<Account>(accountsQuery);


  const { statementTransactions, statementTotal, statementPeriod } = useMemo(() => {
    if (!card || !transactions) return { statementTransactions: [], statementTotal: 0, statementPeriod: { start: '', end: '' } };

    const closingDay = card.closingDate;
    
    const currentStatementEnd = setDate(currentMonth, closingDay);
    const prevMonth = subMonths(currentMonth, 1);
    const currentStatementStart = setDate(prevMonth, closingDay + 1);

    const filtered = transactions.filter(t => {
      const tDate = new Date(t.date);
      return isAfter(tDate, currentStatementStart) && isBefore(tDate, currentStatementEnd);
    });

    const total = filtered.reduce((acc, t) => acc + t.amount, 0);

    return {
      statementTransactions: filtered,
      statementTotal: total,
      statementPeriod: {
          start: format(currentStatementStart, 'dd/MM/yyyy'),
          end: format(currentStatementEnd, 'dd/MM/yyyy')
      }
    };
  }, [card, transactions, currentMonth]);

  const isLoading = cardLoading || transactionsLoading || categoriesLoading || tagsLoading || accountsLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!card) {
    return (
        <>
            <Header title="Fatura do Cartão" />
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>Cartão não encontrado</CardTitle>
                        <CardDescription>O cartão que você está procurando não foi encontrado.</CardDescription>
                    </CardHeader>
                </Card>
            </main>
        </>
    )
  }

  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  const dueDate = setDate(currentMonth, card.dueDate);

  return (
    <>
      <Header title="Fatura do Cartão" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="flex items-center gap-4">
                  <BrandIcon brand={card.brand} className="h-10 w-10 hidden sm:block" />
                  <div>
                      <CardTitle className="text-2xl">{card.name} (final {card.last4})</CardTitle>
                      <CardDescription>Fatura com vencimento em {format(dueDate, 'dd/MM/yyyy')}</CardDescription>
                  </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="w-32 text-center font-semibold capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </span>
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mt-6 border-t pt-4 flex flex-col sm:flex-row justify-between items-baseline gap-2">
                <div className="text-sm text-muted-foreground">
                    Período da fatura: {statementPeriod.start} - {statementPeriod.end}
                </div>
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">Valor total da fatura</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(statementTotal)}</p>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            {statementTransactions.length > 0 ? (
                <div className="border-t">
                    <TransactionList transactions={statementTransactions} accounts={accounts || []} categories={categories || []} tags={tags || []} />
                </div>
            ) : (
              <div className="border-t text-center py-12">
                <p className="text-muted-foreground">Nenhuma transação nesta fatura.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
