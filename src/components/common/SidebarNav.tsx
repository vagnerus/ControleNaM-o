
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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Home,
  Landmark,
  ArrowRightLeft,
  CreditCard,
  ListChecks,
  BarChart,
  Settings,
  Target,
  Bookmark,
  Tags,
  Calendar,
  Activity,
  FileUp,
  FileDown,
  LogOut
} from "lucide-react";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";


const mainMenuItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/accounts", label: "Contas", icon: Landmark },
  { href: "/transactions", label: "Transações", icon: ArrowRightLeft },
  { href: "/cards", label: "Cartões de crédito", icon: CreditCard },
  { href: "/budgets", label: "Planejamento", icon: ListChecks },
  { href: "/reports", label: "Relatórios", icon: BarChart },
];

const secondaryMenuItems = [
    { href: "/settings", label: "Configurações", icon: Settings },
    { href: "/goals", label: "Objetivos", icon: Target },
    { href: "/categories", label: "Categorias", icon: Bookmark },
    { href: "/tags", label: "Tags", icon: Tags },
    { href: "/calendar", label: "Calendário", icon: Calendar },
    { href: "/performance", label: "Meu Desempenho", icon: Activity },
    { href: "/import", label: "Importar transações", icon: FileUp },
    { href: "/export", label: "Exportar transações", icon: FileDown },
]

export function SidebarNav() {
  const pathname = usePathname();
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Você saiu!",
        description: "Até a próxima.",
      });
      // AuthGate will handle the redirect
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: "Não foi possível fazer o logout. Tente novamente.",
      });
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }


  return (
    <>
      <SidebarHeader className="border-b border-sidebar-border p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Landmark className="h-6 w-6" />
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
          {mainMenuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname.startsWith(item.href)}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
          <SidebarSeparator />
           {secondaryMenuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname.startsWith(item.href)}
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
      <SidebarFooter className="mt-auto border-t border-sidebar-border p-2">
        <div className="flex items-center gap-2 p-2 rounded-md hover:bg-sidebar-accent">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'}/>
              <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold truncate">{user?.displayName || 'Usuário'}</span>
                <span className="text-xs text-sidebar-foreground/80 truncate">{user?.email}</span>
            </div>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <button className="ml-auto p-1.5 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-primary hover:text-sidebar-primary-foreground">
                        <LogOut className="h-4 w-4" />
                    </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza que quer sair?</AlertDialogTitle>
                    <AlertDialogDescription>
                    Você será desconectado da sua conta e precisará fazer login novamente.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSignOut}>Sair</AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </SidebarFooter>
    </>
  );
}
