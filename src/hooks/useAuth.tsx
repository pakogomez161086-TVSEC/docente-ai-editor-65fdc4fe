import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";

type Role = "administrador" | "docente" | "suscriptor";

export type Perfil = {
  id: string;
  email: string | null;
  nombre_completo: string | null;
  escuela: string | null;
  cct: string | null;
  grado: string | null;
  avatar_url: string | null;
};

type AuthValue = {
  user: User | null;
  session: Session | null;
  perfil: Perfil | null;
  roles: Role[];
  loading: boolean;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthValue>({
  user: null,
  session: null,
  perfil: null,
  roles: [],
  loading: true,
  isAdmin: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setPerfil(null);
        setRoles([]);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) return;
    let active = true;

    void (async () => {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, email, nombre_completo, escuela, cct, grado, avatar_url")
          .eq("id", userId)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      if (!active) return;
      setPerfil((p as Perfil | null) ?? null);
      setRoles((r ?? []).map((row) => row.role as Role));
    })();

    return () => {
      active = false;
    };
  }, [session?.user.id]);

  const value = useMemo<AuthValue>(
    () => ({
      user: session?.user ?? null,
      session,
      perfil,
      roles,
      loading,
      isAdmin: roles.includes("administrador"),
    }),
    [session, perfil, roles, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);