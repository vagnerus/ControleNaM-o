import { getCreditCards, getCardTransactions } from "@/lib/data";
import { Header } from "@/components/common/Header";
import { CreditCardView } from "@/components/cards/CreditCardView";

export default async function CardsPage() {
  const cards = await getCreditCards();

  const cardsWithTransactions = await Promise.all(
    cards.map(async (card) => {
      const transactions = await getCardTransactions(card.id);
      return { ...card, transactions };
    })
  );

  return (
    <>
      <Header title="Cartões de Crédito" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
        {cardsWithTransactions.map((cardData) => (
          <CreditCardView key={cardData.id} cardData={cardData} />
        ))}
      </main>
    </>
  );
}
