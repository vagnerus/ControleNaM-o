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
import { updateUserEmail } from '@/firebase/auth/auth';
import { FirebaseError } from 'firebase/app';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { useState } from 'react';

const emailSchema = z.object({
  email: z.string().email('Email inválido.'),
});

const passwordSchema = z.object({
  password: z.string().min(1, 'A senha é obrigatória.'),
});

export function ChangeEmailForm() {
  const { user } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const [isReauthDialogOpen, setIsReauthDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '' },
  });

  const handleEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
    if (!user) return;
    if (values.email === user.email) {
        emailForm.setError('email', { message: 'Este já é o seu e-mail atual.' });
        return;
    }
    setNewEmail(values.email);
    setIsReauthDialogOpen(true);
  };

  const handleReauthAndSubmit = async (values: z.infer<typeof passwordSchema>) => {
    try {
      await updateUserEmail(auth, values.password, newEmail);
      toast({
        title: 'Verificação de e-mail enviada!',
        description: `Enviamos um link de confirmação para ${newEmail}. Sua conta continuará vinculada ao e-mail antigo até a confirmação.`,
      });
    } catch (error) {
        let description = 'Ocorreu um erro desconhecido.';
        if (error instanceof FirebaseError) {
            if (error.code === 'auth/invalid-credential') {
                description = 'A senha informada está incorreta.';
            } else if (error.code === 'auth/email-already-in-use') {
                description = 'Este endereço de e-mail já está em uso por outra conta.';
            }
        }
        toast({ variant: 'destructive', title: 'Erro ao alterar e-mail', description });
    } finally {
        setIsReauthDialogOpen(false);
        passwordForm.reset();
        emailForm.reset();
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Mudar meu e-mail</CardTitle>
          <CardDescription>
            Após solicitar a mudança, enviaremos uma confirmação para o novo e-mail cadastrado. Até a confirmação, sua conta continuará vinculada ao seu e-mail atual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
              <div className="flex items-end gap-4">
                <div className="flex-grow">
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Novo e-mail</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="seu-novo@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" disabled={emailForm.formState.isSubmitting}>
                    {emailForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Mudar E-mail
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Dialog open={isReauthDialogOpen} onOpenChange={setIsReauthDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Confirme sua identidade</DialogTitle>
                <DialogDescription>Para sua segurança, por favor, digite sua senha atual para confirmar a alteração do e-mail.</DialogDescription>
            </DialogHeader>
             <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(handleReauthAndSubmit)} className="space-y-4">
                    <FormField
                        control={passwordForm.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Senha Atual</FormLabel>
                                <FormControl>
                                <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={passwordForm.formState.isSubmitting}>
                        {passwordForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar e Alterar E-mail
                    </Button>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
