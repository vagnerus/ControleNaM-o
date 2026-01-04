
'use client';

import { useMemo, useState, Suspense } from 'react';
import { useDoc, useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import type { CreditCard, Transaction, Category, Tag, Account } from '@/lib/types';
import { Header } from "@/components/common/Header";
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionList } from '@/components/transactions/TransactionList';
import { Button } from '@/components/ui/button';
import { format, subMonths, addMonths, setDate, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BrandIcon } from '@/components/cards/BrandIcon';
import { useSearchParams } from 'next/navigation';

function CardStatementContent() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const searchParams = useSearchParams();
  const cardId = searchParams.get('cardId');

  const cardRef = useMemoFirebase(() => 
    user && cardId ? doc(firestore, 'users', user.uid, 'creditCards', cardId) : null
  , [firestore, user, cardId]);

  const { data: card, isLoading: cardLoading } = useDoc<CreditCard>(cardRef);
  
  // Fetch all transactions, including installment purchases
  const transactionsQuery = useMemoFirebase(() => 
    user && cardId ? query(
        collection(firestore, 'users', user.uid, 'transactions'), 
        where('creditCardId', '==', cardId)
    ) : null
  , [firestore, user, cardId]);

  const { data: transactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);

  const categoriesQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]);
  const tagsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'tags') : null, [firestore, user]);
  const accountsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'accounts') : null, [firestore, user]);

  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesQuery);
  const { data: tags, isLoading: tagsLoading } = useCollection<Tag>(tagsQuery);
  const { data: accounts, isLoading: accountsLoading } = useCollection<Account>(accountsQuery);


  const { statementTransactions, statementTotal, statementPeriod } = useMemo(() => {
    if (!card || !transactions) return { statementTransactions: [], statementTotal: 0, statementPeriod: { start: '', end: '' } };

    // Define the statement period based on the card's closing date and the currently viewed month
    const closingDay = card.closingDate;
    const currentStatementEnd = setDate(currentMonth, closingDay);
    const prevMonth = subMonths(currentMonth, 1);
    const currentStatementStart = setDate(prevMonth, closingDay + 1);

    const statementInterval = { start: currentStatementStart, end: currentStatementEnd };

    const transactionsInStatement: Transaction[] = [];

    transactions.forEach(t => {
      const transactionDate = new Date(t.date);

      if (t.isInstallment && t.totalInstallments) {
        // It's an installment purchase, project its installments
        const installmentAmount = parseFloat((t.amount / t.totalInstallments).toFixed(2));
        for (let i = 0; i < t.totalInstallments; i++) {
          const installmentDate = addMonths(transactionDate, i);
          
          if (isWithinInterval(installmentDate, statementInterval)) {
            transactionsInStatement.push({
              ...t,
              id: `${t.id}-installment-${i + 1}`, // Create a unique ID for the virtual installment
              amount: installmentAmount,
              date: installmentDate.toISOString(),
              description: `${t.description} (${i + 1}/${t.totalInstallments})`,
            });
          }
        }
      } else if (!t.isInstallment) {
        // It's a regular, single-payment transaction
        if (isWithinInterval(transactionDate, statementInterval)) {
          transactionsInStatement.push(t);
        }
      }
    });

    // Sort the final list of transactions by date
    const sortedTransactions = transactionsInStatement.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const total = sortedTransactions.reduce((acc, t) => acc + t.amount, 0);

    return {
      statementTransactions: sortedTransactions,
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
  const dueDate = setDate(addMonths(currentMonth, 1), card.dueDate);

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

export default function CardStatementPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <CardStatementContent />
        </Suspense>
    )
}
