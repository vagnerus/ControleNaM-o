'use client';

import { Header } from "@/components/common/Header";
import { DashboardSettingsForm } from "@/components/settings/DashboardSettingsForm";


export default function SettingsPage() {
  return (
    <>
      <Header title="Configurações" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <DashboardSettingsForm />
      </main>
    </>
  );
}
