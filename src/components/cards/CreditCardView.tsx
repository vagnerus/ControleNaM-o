import type { CreditCard, Transaction } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { TransactionList } from "../transactions/TransactionList";

type CreditCardViewProps = {
  cardData: CreditCard & { transactions: Transaction[] };
};

const BrandLogo = ({ brand }: { brand: CreditCard['brand'] }) => {
    // In a real app, these would be proper logo components or images
    if (brand === 'visa') return <div className="font-bold text-lg italic text-blue-800">VISA</div>
    if (brand === 'mastercard') return <div className="font-bold text-lg italic text-orange-500">Mastercard</div>
    if (brand === 'amex') return <div className="font-bold text-lg text-blue-600">AMEX</div>
    return null;
}

export function CreditCardView({ cardData }: CreditCardViewProps) {
  const spentAmount = cardData.transactions.reduce((sum, t) => sum + t.amount, 0);
  const availableLimit = cardData.limit - spentAmount;
  const usagePercentage = (spentAmount / cardData.limit) * 100;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  return (
    <Card className="overflow-hidden">
        <CardHeader>
            <CardTitle>{cardData.name}</CardTitle>
            <CardDescription>Gerenciamento da fatura e limite do seu cartão.</CardDescription>
        </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          {/* Credit Card Visual */}
          <div className="relative aspect-[1.586] w-full max-w-sm mx-auto rounded-xl p-6 flex flex-col justify-between bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg">
             <div>
                <div className="flex justify-between items-center">
                    <span className="text-sm font-light">ControleNaMão</span>
                    <BrandLogo brand={cardData.brand} />
                </div>
             </div>
             <div className="text-center font-mono text-xl tracking-widest">
                •••• •••• •••• {cardData.last4}
             </div>
             <div>
                <div className="text-xs uppercase">Titular</div>
                <div className="font-medium">Usuário App</div>
             </div>
          </div>
          <div className="mt-6 space-y-4">
            <div>
                <div className="flex justify-between text-sm font-medium mb-1">
                    <span>Fatura Atual</span>
                    <span>{formatCurrency(spentAmount)}</span>
                </div>
                <Progress value={usagePercentage} />
            </div>
            <div className="text-sm space-y-2">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Limite disponível:</span>
                    <span className="font-medium">{formatCurrency(availableLimit)}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Limite total:</span>
                    <span className="font-medium">{formatCurrency(cardData.limit)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha em:</span>
                    <span className="font-medium">Dia {cardData.closingDate}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Vence em:</span>
                    <span className="font-medium">Dia {cardData.dueDate}</span>
                </div>
            </div>
          </div>
        </div>
        <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-2">Transações do Cartão</h3>
            <div className="border rounded-lg">
                <TransactionList transactions={cardData.transactions} />
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
