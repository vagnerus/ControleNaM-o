'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export function PreferencesForm() {
    const { theme, setTheme } = useTheme();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [language, setLanguage] = useState('pt-br');
    const [currency, setCurrency] = useState('brl');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        // Simulate saving to a backend
        setTimeout(() => {
            setIsSaving(false);
            toast({
                title: "Preferências salvas!",
                description: "Suas configurações de idioma e moeda foram atualizadas.",
            });
        }, 1000);
    }
    
  return (
    <form onSubmit={handleSubmit}>
        <Card>
            <CardHeader>
                <CardTitle>Preferências Gerais</CardTitle>
                <CardDescription>
                    Personalize o idioma, moeda e aparência do aplicativo para se adequar ao seu uso.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="language">Idioma</Label>
                        <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger id="language">
                                <SelectValue placeholder="Selecione o idioma" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pt-br">Português Brasil</SelectItem>
                                <SelectItem value="en-us" disabled>English (US)</SelectItem>
                                <SelectItem value="es" disabled>Español</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="currency">Moeda</Label>
                        <Select value={currency} onValueChange={setCurrency}>
                            <SelectTrigger id="currency">
                                <SelectValue placeholder="Selecione a moeda" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="brl">BRL (R$) - Real Brasileiro</SelectItem>
                                <SelectItem value="usd" disabled>USD ($) - Dólar Americano</SelectItem>
                                <SelectItem value="eur" disabled>EUR (€) - Euro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="appearance">Aparência</Label>
                        <Select value={theme} onValueChange={setTheme}>
                            <SelectTrigger id="appearance">
                                <SelectValue placeholder="Selecione a aparência" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="light">Modo Claro</SelectItem>
                                <SelectItem value="dark">Modo Escuro</SelectItem>
                                <SelectItem value="system">Padrão do Sistema</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Alterações
                    </Button>
                </div>
                 <p className="text-sm text-muted-foreground text-center">
                    * As funcionalidades de mudança de idioma e moeda não estão disponíveis na versão atual.
                </p>
            </CardContent>
        </Card>
    </form>
  );
}
