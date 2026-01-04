'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from '../ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const getInitialSettings = () => {
    if (typeof window === 'undefined') {
        return {
            receiveNotifications: true,
            productNews: true,
            premiumInfo: true,
            financialAlerts: true,
            partnerships: true,
        };
    }
    const savedSettings = localStorage.getItem('notificationSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
        receiveNotifications: true,
        productNews: true,
        premiumInfo: true,
        financialAlerts: true,
        partnerships: true,
    };
};


type NotificationSetting = keyof ReturnType<typeof getInitialSettings>;

export function NotificationsSettingsForm() {
    const { toast } = useToast();
    const [settings, setSettings] = useState(getInitialSettings);
    const [isSaving, setIsSaving] = useState(false);
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('notificationSettings', JSON.stringify(settings));
        }
    }, [settings]);


    const handleSwitchChange = (id: NotificationSetting, checked: boolean) => {
        setSettings((prev: ReturnType<typeof getInitialSettings>) => {
            const newSettings = { ...prev, [id]: checked };
            // If the main switch is turned off, turn all others off.
            if (id === 'receiveNotifications' && !checked) {
                return Object.keys(newSettings).reduce((acc, key) => {
                    acc[key as NotificationSetting] = false;
                    return acc;
                }, {} as typeof settings);
            }
             // If a sub-switch is turned on, turn the main one on as well.
            if (id !== 'receiveNotifications' && checked) {
                newSettings.receiveNotifications = true;
            }
            return newSettings;
        });
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        // Simulate saving to a backend
        setTimeout(() => {
            setIsSaving(false);
            toast({
                title: "Configurações salvas!",
                description: "Suas preferências de notificação foram atualizadas.",
            });
        }, 1000);
    }

    return (
        <Card>
            <form onSubmit={handleSubmit}>
                <CardHeader>
                    <CardTitle>Alertas e Notificações</CardTitle>
                    <CardDescription>
                        Escolha como você quer receber atualizações e lembretes importantes.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="receive-notifications" className="text-lg font-semibold">Email</Label>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <h3 className="font-medium">Receber notificações</h3>
                            </div>
                            <Switch
                                id="receive-notifications"
                                checked={settings.receiveNotifications}
                                onCheckedChange={(checked) => handleSwitchChange('receiveNotifications', checked)}
                            />
                        </div>
                    </div>
                    
                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                       <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <h3 className="font-medium">Novidades do ControleNaMão</h3>
                                <p className="text-sm text-muted-foreground">
                                    Novas funcionalidades e as melhores dicas para transformar sua vida financeira para melhor.
                                </p>
                            </div>
                            <Switch
                                id="product-news"
                                checked={settings.productNews}
                                onCheckedChange={(checked) => handleSwitchChange('productNews', checked)}
                            />
                        </div>
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <h3 className="font-medium">Informações sobre o Premium</h3>
                                <p className="text-sm text-muted-foreground">
                                    Confirmação de pagamento, ativação do Premium, promoções e novidades dos planos.
                                </p>
                            </div>
                            <Switch
                                id="premium-info"
                                checked={settings.premiumInfo}
                                onCheckedChange={(checked) => handleSwitchChange('premiumInfo', checked)}
                            />
                        </div>
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <h3 className="font-medium">Alertas financeiros</h3>
                                <p className="text-sm text-muted-foreground">
                                    Lembretes sobre datas de vencimento, gastos, transferências, pagamentos, e mais.
                                </p>
                            </div>
                            <Switch
                                id="financial-alerts"
                                checked={settings.financialAlerts}
                                onCheckedChange={(checked) => handleSwitchChange('financialAlerts', checked)}
                            />
                        </div>
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <h3 className="font-medium">Parcerias</h3>
                                <p className="text-sm text-muted-foreground">
                                    Cupons, produtos financeiros, clube de benefício, e conteúdos especiais.
                                </p>
                            </div>
                             <Switch
                                id="partnerships"
                                checked={settings.partnerships}
                                onCheckedChange={(checked) => handleSwitchChange('partnerships', checked)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Alterações
                        </Button>
                    </div>
                     <p className="text-sm text-muted-foreground text-center">
                        * A funcionalidade de envio de notificações por email não está disponível na versão atual.
                    </p>
                </CardContent>
            </form>
        </Card>
    );
}
