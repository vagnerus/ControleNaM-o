'use client';

import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Account } from '@/lib/types';
import { Header } from "@/components/common/Header";
import { Loader2 } from 'lucide-react';
import { AccountCard } from '@/components/accounts/AccountCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddAccountDialog } from '@/components/accounts/AddAccountDialog';

export default function AccountsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const accountsQuery = useMemoFirebase(() => 
    user ? collection(firestore, 'users', user.uid, 'accounts') : null
  , [firestore, user]);

  const { data: accounts, isLoading } = useCollection<Account>(accountsQuery);
  
  if (isLoading) {
    return (
        <>
            <Header title="Contas Bancárias">
              <AddAccountDialog />
            </Header>
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        </>
    )
  }

  return (
    <>
      <Header title="Contas Bancárias">
        <AddAccountDialog />
      </Header>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {(accounts || []).length === 0 ? (
          <Card className="flex flex-col items-center justify-center h-96 border-dashed">
            <CardHeader className="text-center">
              <CardTitle>Nenhuma conta encontrada</CardTitle>
              <CardDescription>Adicione sua primeira conta para começar.</CardDescription>
            </CardHeader>
            <CardContent>
              <AddAccountDialog />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(accounts || []).map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
