import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/common/SidebarNav';
import { AIChatSheet } from '@/components/ai/AIChatSheet';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarNav />
      </Sidebar>
      <SidebarInset>
        {children}
        <AIChatSheet />
      </SidebarInset>
    </SidebarProvider>
  );
}
