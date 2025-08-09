"use client"

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from "@/components/ui/sidebar"
import { BarChart, Calendar, LayoutDashboard, Settings, Workflow, LogOut } from "lucide-react"
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import ProtectedRoute from "./protected-route";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();

  const menuItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/agenda", label: "Agenda", icon: Calendar },
    { href: "/indicators", label: "Indicadores", icon: BarChart },
    { href: "/settings", label: "Configurações", icon: Settings },
  ]

  if (pathname === '/login' || loading) {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Workflow className="w-6 h-6 text-primary" />
              <h1 className="text-lg font-semibold">Talentus</h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {menuItems.map(item => (
                  <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon />
                      {item.label}
                    </Link>
                  </SidebarMenuButton>
                  </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                  <SidebarMenuButton onClick={logout}>
                      <LogOut />
                      Sair
                  </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
              <SidebarTrigger className="md:hidden" />
              <div className="flex-1">
                <h1 className="font-semibold text-lg">{menuItems.find(i => i.href === pathname)?.label || 'Dashboard'}</h1>
              </div>
          </header>
          <main>{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
