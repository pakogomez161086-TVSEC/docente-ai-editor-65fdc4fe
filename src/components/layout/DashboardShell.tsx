import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  titulo: string;
  subtitulo?: string;
  acciones?: ReactNode;
  children: ReactNode;
};

export function DashboardShell({ titulo, subtitulo, acciones, children }: Props) {
  const { perfil, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const nombre = perfil?.nombre_completo ?? user?.email?.split("@")[0] ?? "Docente";
  const iniciales = nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  async function cerrarSesion() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", search: { modo: undefined }, replace: true });
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{titulo}</p>
              <p className="truncate text-xs text-muted-foreground">
                {subtitulo ?? "Ciclo escolar 2026–2027"}
              </p>
            </div>
            {acciones}
            <ThemeToggle />
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                {iniciales || "DP"}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={cerrarSesion} aria-label="Cerrar sesión">
              <LogOut className="h-4 w-4" />
            </Button>
          </header>
          <main className="flex-1 space-y-6 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
