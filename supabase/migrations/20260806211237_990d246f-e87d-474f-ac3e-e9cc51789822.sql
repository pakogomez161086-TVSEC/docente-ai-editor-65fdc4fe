CREATE POLICY "Administradores ven todos los perfiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Administradores editan perfiles"
ON public.profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'administrador'))
WITH CHECK (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Administradores ven todos los roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Administradores asignan roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Administradores quitan roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'administrador'));