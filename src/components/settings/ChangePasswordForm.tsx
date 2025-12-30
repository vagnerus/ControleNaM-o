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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useUser, useAuth } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { updateUserPassword } from '@/firebase/auth/auth';
import { FirebaseError } from 'firebase/app';

const formSchema = z.object({
    currentPassword: z.string().min(1, 'A senha atual é obrigatória.'),
    newPassword: z.string().min(6, 'A nova senha deve ter pelo menos 6 caracteres.'),
});

export function ChangePasswordForm() {
  const { user } = useUser();
  const auth = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;
    
    try {
        await updateUserPassword(auth, values.currentPassword, values.newPassword);
        toast({
            title: 'Senha alterada com sucesso!',
            description: 'Sua nova senha já está ativa.',
        });
        form.reset();
    } catch (error) {
         let description = 'Ocorreu um erro desconhecido.';
        if (error instanceof FirebaseError) {
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                description = 'A senha atual informada está incorreta.';
            } else if (error.code === 'auth/weak-password') {
                description = 'A nova senha é muito fraca. Tente uma mais forte.';
            } else if (error.code === 'auth/requires-recent-login') {
                description = 'Esta operação é sensível e requer autenticação recente. Por favor, faça login novamente e tente de novo.';
            }
        }
        toast({ variant: 'destructive', title: 'Erro ao alterar senha', description });
    }
  };

  return (
      <Card>
        <CardHeader>
          <CardTitle>Mudar minha senha</CardTitle>
          <CardDescription>
            Dica: Se possível, use uma senha que contenha números, letras maiúsculas, minúsculas e caracteres especiais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Senha atual</FormLabel>
                        <FormControl>
                        <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nova senha</FormLabel>
                        <FormControl>
                        <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <div className="flex justify-start">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Alterar Senha
                    </Button>
                </div>
            </form>
          </Form>
        </CardContent>
      </Card>
  );
}
