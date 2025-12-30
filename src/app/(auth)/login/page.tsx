import { LoginForm } from '@/components/auth/LoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, LayoutGrid, TrendingUp, Target, Sparkles } from 'lucide-react';
import Link from 'next/link';

const features = [
    {
        icon: <LayoutGrid className="h-6 w-6 text-primary" />,
        title: "Dashboard Intuitivo",
        description: "Visualize suas finanças com clareza e rapidez."
    },
    {
        icon: <TrendingUp className="h-6 w-6 text-primary" />,
        title: "Relatórios Inteligentes",
        description: "Entenda seus padrões de gastos e receitas."
    },
    {
        icon: <Target className="h-6 w-6 text-primary" />,
        title: "Metas e Orçamentos",
        description: "Planeje seu futuro financeiro e alcance seus objetivos."
    },
    {
        icon: <Sparkles className="h-6 w-6 text-primary" />,
        title: "Previsão com IA",
        description: "Receba insights e dicas para otimizar suas finanças."
    }
]

export default function LoginPage() {
  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:flex flex-col items-center justify-center gap-8 bg-muted p-8 text-center">
        <div className="flex items-center gap-3">
             <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Wallet className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">ControleNaMão</h1>
        </div>
        <p className="max-w-md text-muted-foreground">
            A plataforma completa para você tomar as rédeas da sua vida financeira. Inteligente, simples e sempre com você.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-6 max-w-lg">
            {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-background">
                        {feature.icon}
                    </div>
                    <div>
                        <h3 className="font-semibold">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                </div>
            ))}
        </div>
      </div>
      <div className="flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">Acesse sua conta</h2>
                <p className="mt-2 text-muted-foreground">
                    Ainda não tem uma conta?{' '}
                    <Link href="/signup" className="font-semibold text-primary hover:underline">
                        Cadastre-se aqui
                    </Link>
                </p>
            </div>
            <Card>
                <CardContent className="p-6">
                    <LoginForm />
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
