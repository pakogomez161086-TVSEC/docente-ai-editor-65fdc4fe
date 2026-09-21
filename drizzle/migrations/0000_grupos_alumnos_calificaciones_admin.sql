-- Grupos
CREATE TABLE public.grupos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  docente_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  grado int NOT NULL CHECK (grado BETWEEN 1 AND 3),
  ciclo text NOT NULL DEFAULT '2026-2027',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grupos TO authenticated;
GRANT ALL ON public.grupos TO service_role;
ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "grupos propios" ON public.grupos FOR ALL TO authenticated
  USING (auth.uid() = docente_id OR public.has_role(auth.uid(),'administrador'))
  WITH CHECK (auth.uid() = docente_id);

-- Alumnos
CREATE TABLE public.alumnos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  docente_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grupo_id uuid NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  nombre_completo text NOT NULL,
  numero_lista int,
  tutor text,
  contacto_tutor text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alumnos TO authenticated;
GRANT ALL ON public.alumnos TO service_role;
ALTER TABLE public.alumnos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alumnos propios" ON public.alumnos FOR ALL TO authenticated
  USING (auth.uid() = docente_id OR public.has_role(auth.uid(),'administrador'))
  WITH CHECK (auth.uid() = docente_id);

-- Calificaciones
CREATE TABLE public.calificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  docente_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alumno_id uuid NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  trimestre int NOT NULL CHECK (trimestre BETWEEN 1 AND 3),
  campo_formativo text NOT NULL,
  disciplina text NOT NULL,
  calificacion numeric(4,1) NOT NULL CHECK (calificacion BETWEEN 5 AND 10),
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (alumno_id, trimestre, disciplina)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calificaciones TO authenticated;
GRANT ALL ON public.calificaciones TO service_role;
ALTER TABLE public.calificaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "calificaciones propias" ON public.calificaciones FOR ALL TO authenticated
  USING (auth.uid() = docente_id OR public.has_role(auth.uid(),'administrador'))
  WITH CHECK (auth.uid() = docente_id);

-- Administrador principal automatico
CREATE OR REPLACE FUNCTION public.asignar_admin_principal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF lower(NEW.email) = 'pakogs2025@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'administrador')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS asignar_admin_principal_trg ON auth.users;
CREATE TRIGGER asignar_admin_principal_trg
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.asignar_admin_principal();

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'administrador' FROM auth.users WHERE lower(email) = 'pakogs2025@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;