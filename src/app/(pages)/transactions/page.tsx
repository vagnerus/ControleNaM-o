import { getTransactions } from "@/lib/data";
import { TransactionList } from "@/components/transactions/TransactionList";
import { Header } from "@/components/common/Header";
import { AddTransactionDialog } from "@/components/transactions/AddTransactionDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function TransactionsPage() {
  const transactions = await getTransactions();

  return (
    <>
      <Header title="Transações">
        <AddTransactionDialog />
      </Header>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="income">Receitas</TabsTrigger>
            <TabsTrigger value="expenses">Despesas</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <TransactionList transactions={transactions} />
          </TabsContent>
          <TabsContent value="income">
            <TransactionList transactions={transactions.filter(t => t.type === 'income')} />
          </TabsContent>
          <TabsContent value="expenses">
            <TransactionList transactions={transactions.filter(t => t.type === 'expense')} />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
