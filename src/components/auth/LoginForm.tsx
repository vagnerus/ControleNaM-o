'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Chrome } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '../ui/separator';
import { signInWithGoogle, signInWithEmail } from '@/firebase/auth/auth';
import { useAuth } from '@/firebase';
import { FirebaseError } from 'firebase/app';

const formSchema = z.object({
  email: z.string().email('Email inválido.'),
  password: z.string().min(1, 'A senha é obrigatória.'),
});

export function LoginForm() {
  const auth = useAuth();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle(auth);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro no Login',
        description: 'Não foi possível fazer login com o Google. Tente novamente.',
      });
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await signInWithEmail(auth, values.email, values.password);
      // The redirect is handled by the AuthGate
    } catch (error) {
      let description = 'Ocorreu um erro desconhecido. Tente novamente.';
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            description = 'Email ou senha inválidos. Verifique suas credenciais.';
        }
      }
      toast({
        variant: 'destructive',
        title: 'Erro no Login',
        description,
      });
    }
  }

  return (
    <div className="space-y-6">
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
            <Chrome className="mr-2 h-4 w-4" />
            Entrar com Google
        </Button>

        <div className="flex items-center space-x-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">OU</span>
            <Separator className="flex-1" />
        </div>
      
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                    <Input type="email" placeholder="seu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                    <Input type="password" placeholder="Sua senha" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Entrar
            </Button>
            </form>
        </Form>
        <p className="text-center text-sm text-muted-foreground">
            Não tem uma conta?{' '}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
                Cadastre-se
            </Link>
        </p>
    </div>
  );
}
