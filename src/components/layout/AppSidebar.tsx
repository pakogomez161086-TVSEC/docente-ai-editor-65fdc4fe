import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  LayoutDashboard,
  Library,
  NotebookPen,
  Settings,
  Sparkles,
} from "lucide-react";

import { BrandLogo } from "@/components/brand/BrandLogo";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

type Item = { title: string; url: string; icon: typeof LayoutDashboard };

const principal: Item[] = [{ title: "Inicio", url: "/dashboard", icon: LayoutDashboard }];

const pedagogia: Item[] = [
  { title: "Proyectos de Aula", url: "/proyectos", icon: BookOpen },
  { title: "IA Pedagógica", url: "/ia", icon: Sparkles },
  { title: "Planeaciones", url: "/planeaciones", icon: NotebookPen },
  { title: "Sesiones", url: "/sesiones", icon: ClipboardList },
];

const organizacion: Item[] = [
  { title: "Agenda Docente", url: "/agenda", icon: CalendarDays },
  { title: "Calendario Escolar", url: "/calendario", icon: CalendarRange },
  { title: "Biblioteca", url: "/biblioteca", icon: Library },
  { title: "Administración", url: "/admin", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const renderGroup = (label: string, items: Item[]) => (
    <SidebarGroup key={label}>
      {!collapsed ? <SidebarGroupLabel>{label}</SidebarGroupLabel> : null}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={pathname.startsWith(item.url)} tooltip={item.title}>
                <Link to={item.url} className="flex items-center gap-2.5">
                  <item.icon className="h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <BrandLogo size="sm" showWordmark={!collapsed} showTelesecundaria={false} inverted />
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("General", principal)}
        {renderGroup("Pedagogía", pedagogia)}
        {renderGroup("Organización", organizacion)}
      </SidebarContent>
    </Sidebar>
  );
}
