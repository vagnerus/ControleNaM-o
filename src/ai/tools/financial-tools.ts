'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, query, where, getFirestore, runTransaction, doc, addDoc, updateDoc, increment } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

const { firestore, auth: firebaseAuth } = initializeFirebase();

async function getCurrentUserId(): Promise<string> {
    // This is a placeholder for getting the current user's ID.
    // In a real application, you would get this from the session or auth state.
    const user = firebaseAuth.currentUser;
    if (!user) {
        throw new Error("User not authenticated.");
    }
    return user.uid;
}

// Define the schema for adding a transaction
const AddTransactionSchema = z.object({
    description: z.string().describe("A descrição da transação. Ex: 'Café na padaria'"),
    amount: z.number().describe("O valor da transação."),
    categoryName: z.string().describe("O nome da categoria da despesa. Ex: 'Alimentação'"),
    type: z.enum(['income', 'expense']).default('expense').describe("O tipo de transação, 'income' para receita e 'expense' para despesa."),
    accountName: z.string().optional().describe("O nome da conta de onde o dinheiro saiu. Se não especificado, usar a primeira conta encontrada."),
});

// Define the schema for updating a budget
const UpdateBudgetSchema = z.object({
    categoryName: z.string().describe("O nome da categoria do orçamento a ser atualizado. Ex: 'Lazer'"),
    newAmount: z.number().describe("O novo valor para o orçamento."),
});


export const addTransactionTool = ai.defineTool(
    {
        name: 'addTransaction',
        description: 'Adiciona uma nova transação financeira (despesa ou receita)',
        inputSchema: AddTransactionSchema,
        outputSchema: z.string(),
    },
    async (input) => {
        const userId = await getCurrentUserId();
        
        // Find category by name
        const categoriesRef = collection(firestore, `users/${userId}/categories`);
        const qCategory = query(categoriesRef, where("name", "==", input.categoryName));
        const categorySnap = await getDocs(qCategory);
        if (categorySnap.empty) {
            return `Erro: Categoria "${input.categoryName}" não encontrada.`;
        }
        const categoryId = categorySnap.docs[0].id;

        // Find account by name or get the first one
        const accountsRef = collection(firestore, `users/${userId}/accounts`);
        let accountId: string;
        if (input.accountName) {
            const qAccount = query(accountsRef, where("name", "==", input.accountName));
            const accountSnap = await getDocs(qAccount);
            if (accountSnap.empty) {
                return `Erro: Conta "${input.accountName}" não encontrada.`;
            }
            accountId = accountSnap.docs[0].id;
        } else {
            const accountSnap = await getDocs(accountsRef);
            if (accountSnap.empty) {
                 return `Erro: Nenhuma conta bancária encontrada.`;
            }
            accountId = accountSnap.docs[0].id;
        }

        const accountRef = doc(firestore, `users/${userId}/accounts`, accountId);

        await runTransaction(firestore, async (transaction) => {
            const transRef = doc(collection(firestore, `users/${userId}/transactions`));
            transaction.set(transRef, {
                ...input,
                date: new Date().toISOString(),
                accountId: accountId,
                categoryId: categoryId,
            });

            const balanceChange = input.type === 'income' ? input.amount : -input.amount;
            transaction.update(accountRef, { balance: increment(balanceChange) });
        });
        
        return `Transação de R$ ${input.amount} em "${input.categoryName}" adicionada com sucesso.`;
    }
);


export const updateBudgetByCategoryNameTool = ai.defineTool(
    {
        name: 'updateBudgetByCategoryName',
        description: 'Atualiza o valor de um orçamento para uma categoria específica',
        inputSchema: UpdateBudgetSchema,
        outputSchema: z.string(),
    },
    async (input) => {
        const userId = await getCurrentUserId();

        const budgetsRef = collection(firestore, `users/${userId}/budgets`);
        const qBudget = query(budgetsRef, where("categoryName", "==", input.categoryName));
        const budgetSnap = await getDocs(qBudget);

        if (budgetSnap.empty) {
            return `Erro: Orçamento para a categoria "${input.categoryName}" não encontrado.`;
        }

        const budgetDocRef = budgetSnap.docs[0].ref;
        await updateDoc(budgetDocRef, { amount: input.newAmount });

        return `Orçamento para "${input.categoryName}" atualizado para R$ ${input.newAmount}.`;
    }
);
