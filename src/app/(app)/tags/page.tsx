'use client';

import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Tag } from '@/lib/types';
import { Header } from "@/components/common/Header";
import { Loader2 } from 'lucide-react';
import { AddTagForm } from '@/components/tags/AddTagForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { deleteTag } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function TagsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const tagsQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, 'users', user.uid, 'tags'), orderBy('name', 'asc')) : null
  , [firestore, user]);

  const { data: tags, isLoading: tagsLoading } = useCollection<Tag>(tagsQuery);
  
  const handleDelete = async (tagId: string) => {
    if (!user) return;
    try {
      await deleteTag(firestore, user.uid, tagId);
      toast({ title: 'Tag removida' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao remover tag',
        description: error.message || 'Não foi possível remover a tag. Verifique se ela não está em uso.'
      });
    }
  }

  if (tagsLoading) {
    return (
        <>
            <Header title="Tags" />
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        </>
    )
  }

  return (
    <>
      <Header title="Tags" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Suas Tags</CardTitle>
                    <CardDescription>
                        {tags && tags.length > 0 
                            ? "Gerencie suas tags. Tags em uso não podem ser removidas."
                            : "Você ainda não tem nenhuma tag. Crie uma para começar a organizar."
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {tags && tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {tags.map(tag => (
                                <Badge key={tag.id} variant="secondary" className="text-sm py-1 pl-3 pr-1">
                                    {tag.name}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 ml-1 rounded-full"
                                        onClick={() => handleDelete(tag.id)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </Badge>
                            ))}
                        </div>
                    ) : (
                         <p className="text-sm text-muted-foreground">Nenhuma tag encontrada.</p>
                    )}
                </CardContent>
            </Card>
        </div>
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Nova Tag</CardTitle>
                    <CardDescription>Adicione uma nova tag para organizar suas transações.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AddTagForm />
                </CardContent>
            </Card>
        </div>
      </main>
    </>
  );
}
