'use client';

import { Header } from "@/components/common/Header";
import { ChangeEmailForm } from "@/components/settings/ChangeEmailForm";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { ConnectedDevices } from "@/components/settings/ConnectedDevices";
import { DashboardSettingsForm } from "@/components/settings/DashboardSettingsForm";
import { NotificationsSettingsForm } from "@/components/settings/NotificationsSettingsForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


function PlaceholderTabContent({ title }: { title: string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Esta funcionalidade estará disponível em breve.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Estamos trabalhando para trazer mais opções de personalização para você!</p>
            </CardContent>
        </Card>
    )
}

export default function SettingsPage() {
  return (
    <>
      <Header title="Configurações" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Tabs defaultValue="security">
          <TabsList className="grid w-full grid-cols-4 md:w-fit">
            <TabsTrigger value="preferences">Preferências</TabsTrigger>
            <TabsTrigger value="notifications">Alertas e notificações</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="mt-6">
            <DashboardSettingsForm />
          </TabsContent>
          <TabsContent value="preferences" className="mt-6">
            <PlaceholderTabContent title="Preferências" />
          </TabsContent>
          <TabsContent value="notifications" className="mt-6">
            <NotificationsSettingsForm />
          </TabsContent>
          <TabsContent value="security" className="mt-6 space-y-8">
            <h2 className="text-xl font-semibold tracking-tight">Informações da conta</h2>
            <ChangeEmailForm />
            <ChangePasswordForm />
            <h2 className="text-xl font-semibold tracking-tight">Dispositivos conectados</h2>
            <ConnectedDevices />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
