"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  PieChart,
  Target,
  CreditCard,
  Settings,
  CircleHelp,
  LogOut,
} from "lucide-react";

const menuItems = [
  { href: "/", label: "Painel", icon: LayoutDashboard },
  { href: "/transactions", label: "Transações", icon: ArrowRightLeft },
  { href: "/budgets", label: "Orçamentos", icon: PieChart },
  { href: "/goals", label: "Objetivos", icon: Target },
  { href: "/cards", label: "Cartões", icon: CreditCard },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader className="border-b border-sidebar-border p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Wallet className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-semibold text-lg">ControleNaMão</h2>
            <p className="text-xs text-sidebar-foreground/80">
              Gerencie suas finanças
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={
                    item.href === "/"
                      ? pathname === item.href
                      : pathname.startsWith(item.href)
                  }
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="mt-auto border-t border-sidebar-border">
         <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton tooltip="Configurações">
                    <Settings />
                    <span>Configurações</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton tooltip="Ajuda">
                    <CircleHelp />
                    <span>Ajuda</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton tooltip="Sair">
                    <LogOut />
                    <span>Sair</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
