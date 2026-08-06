CREATE TABLE public.campos_formativos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  color text,
  orden int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.campos_formativos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.campos_formativos TO authenticated;
GRANT ALL ON public.campos_formativos TO service_role;
ALTER TABLE public.campos_formativos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Catalogo campos lectura publica" ON public.campos_formativos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins gestionan campos" ON public.campos_formativos FOR ALL TO authenticated USING (public.has_role(auth.uid(),'administrador')) WITH CHECK (public.has_role(auth.uid(),'administrador'));

CREATE TABLE public.disciplinas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campo_formativo_id uuid NOT NULL REFERENCES public.campos_formativos(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  orden int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campo_formativo_id, nombre)
);
GRANT SELECT ON public.disciplinas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.disciplinas TO authenticated;
GRANT ALL ON public.disciplinas TO service_role;
ALTER TABLE public.disciplinas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Catalogo disciplinas lectura publica" ON public.disciplinas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins gestionan disciplinas" ON public.disciplinas FOR ALL TO authenticated USING (public.has_role(auth.uid(),'administrador')) WITH CHECK (public.has_role(auth.uid(),'administrador'));

CREATE TABLE public.proyectos_aula (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grado int NOT NULL CHECK (grado BETWEEN 1 AND 3),
  tomo int NOT NULL CHECK (tomo BETWEEN 1 AND 3),
  trimestre int CHECK (trimestre BETWEEN 1 AND 3),
  campo_formativo text NOT NULL,
  disciplina text,
  ppa text NOT NULL,
  proyecto_academico text,
  producto_integrador text,
  pda text[] NOT NULL DEFAULT '{}',
  saberes text[] NOT NULL DEFAULT '{}',
  estado text NOT NULL DEFAULT 'borrador',
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proyectos_aula TO authenticated;
GRANT ALL ON public.proyectos_aula TO service_role;
ALTER TABLE public.proyectos_aula ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Docente gestiona sus proyectos" ON public.proyectos_aula FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'administrador'))
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_proyectos_user ON public.proyectos_aula(user_id, grado, tomo);

CREATE TABLE public.planeaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proyecto_id uuid REFERENCES public.proyectos_aula(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  grado int,
  tomo int,
  campo_formativo text,
  disciplina text,
  metodologia text,
  proposito text,
  inicio text,
  desarrollo text,
  cierre text,
  etapas jsonb NOT NULL DEFAULT '[]'::jsonb,
  evaluacion jsonb NOT NULL DEFAULT '{}'::jsonb,
  rubricas jsonb NOT NULL DEFAULT '[]'::jsonb,
  listas_cotejo jsonb NOT NULL DEFAULT '[]'::jsonb,
  productos text[] NOT NULL DEFAULT '{}',
  materiales text[] NOT NULL DEFAULT '{}',
  adecuaciones text,
  inclusion text,
  transversalidad text,
  generada_por_ia boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planeaciones TO authenticated;
GRANT ALL ON public.planeaciones TO service_role;
ALTER TABLE public.planeaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Docente gestiona sus planeaciones" ON public.planeaciones FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'administrador'))
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_planeaciones_user ON public.planeaciones(user_id, created_at DESC);

CREATE TABLE public.sesiones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  planeacion_id uuid REFERENCES public.planeaciones(id) ON DELETE CASCADE,
  numero int NOT NULL,
  titulo text NOT NULL,
  tiempo text,
  inicio text,
  desarrollo text,
  cierre text,
  materiales text[] NOT NULL DEFAULT '{}',
  evaluacion text,
  instrumentos text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sesiones TO authenticated;
GRANT ALL ON public.sesiones TO service_role;
ALTER TABLE public.sesiones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Docente gestiona sus sesiones" ON public.sesiones FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'administrador'))
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_sesiones_planeacion ON public.sesiones(planeacion_id, numero);

CREATE TABLE public.agenda_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria text NOT NULL DEFAULT 'tarea',
  titulo text NOT NULL,
  descripcion text,
  fecha date NOT NULL DEFAULT (now()::date),
  hora time,
  grupo text,
  estado text NOT NULL DEFAULT 'pendiente',
  prioridad text NOT NULL DEFAULT 'media',
  datos jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_items TO authenticated;
GRANT ALL ON public.agenda_items TO service_role;
ALTER TABLE public.agenda_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Docente gestiona su agenda" ON public.agenda_items FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'administrador'))
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_agenda_user_fecha ON public.agenda_items(user_id, fecha);

CREATE TABLE public.biblioteca_recursos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  descripcion text,
  tipo text NOT NULL DEFAULT 'pdf',
  categoria text,
  grado int,
  campo_formativo text,
  disciplina text,
  url text,
  storage_path text,
  publico boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.biblioteca_recursos TO authenticated;
GRANT ALL ON public.biblioteca_recursos TO service_role;
ALTER TABLE public.biblioteca_recursos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recursos publicos o propios" ON public.biblioteca_recursos FOR SELECT TO authenticated
  USING (publico OR auth.uid() = user_id OR public.has_role(auth.uid(),'administrador'));
CREATE POLICY "Docente crea recursos" ON public.biblioteca_recursos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Docente edita sus recursos" ON public.biblioteca_recursos FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'administrador'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'administrador'));
CREATE POLICY "Docente borra sus recursos" ON public.biblioteca_recursos FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'administrador'));

CREATE TABLE public.calendario_escolar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ciclo text NOT NULL DEFAULT '2026-2027',
  fecha date NOT NULL,
  fecha_fin date,
  titulo text NOT NULL,
  tipo text NOT NULL DEFAULT 'evento',
  descripcion text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.calendario_escolar TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.calendario_escolar TO authenticated;
GRANT ALL ON public.calendario_escolar TO service_role;
ALTER TABLE public.calendario_escolar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Calendario lectura publica" ON public.calendario_escolar FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins gestionan calendario" ON public.calendario_escolar FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'administrador')) WITH CHECK (public.has_role(auth.uid(),'administrador'));

CREATE TABLE public.planes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  periodo text NOT NULL,
  precio numeric(10,2) NOT NULL DEFAULT 0,
  precio_promocion numeric(10,2),
  promocion_activa boolean NOT NULL DEFAULT false,
  beneficios text[] NOT NULL DEFAULT '{}',
  activo boolean NOT NULL DEFAULT true,
  orden int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.planes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.planes TO authenticated;
GRANT ALL ON public.planes TO service_role;
ALTER TABLE public.planes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Planes lectura publica" ON public.planes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins gestionan planes" ON public.planes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'administrador')) WITH CHECK (public.has_role(auth.uid(),'administrador'));

CREATE TABLE public.suscripciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.planes(id) ON DELETE SET NULL,
  estado text NOT NULL DEFAULT 'activa',
  inicia_en timestamptz NOT NULL DEFAULT now(),
  termina_en timestamptz,
  monto numeric(10,2),
  metodo_pago text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suscripciones TO authenticated;
GRANT ALL ON public.suscripciones TO service_role;
ALTER TABLE public.suscripciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Docente ve su suscripcion" ON public.suscripciones FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'administrador'));
CREATE POLICY "Admins gestionan suscripciones" ON public.suscripciones FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'administrador')) WITH CHECK (public.has_role(auth.uid(),'administrador'));

CREATE TABLE public.landing_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seccion text NOT NULL UNIQUE,
  contenido jsonb NOT NULL DEFAULT '{}'::jsonb,
  activo boolean NOT NULL DEFAULT true,
  orden int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.landing_config TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.landing_config TO authenticated;
GRANT ALL ON public.landing_config TO service_role;
ALTER TABLE public.landing_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Landing lectura publica" ON public.landing_config FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins gestionan landing" ON public.landing_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'administrador')) WITH CHECK (public.has_role(auth.uid(),'administrador'));

CREATE TABLE public.base_conocimiento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grado int,
  tomo int,
  trimestre int,
  campo_formativo text,
  disciplina text,
  ppa text,
  proyecto_academico text,
  pda text[] NOT NULL DEFAULT '{}',
  saberes text[] NOT NULL DEFAULT '{}',
  etapas jsonb NOT NULL DEFAULT '[]'::jsonb,
  instrumentos jsonb NOT NULL DEFAULT '[]'::jsonb,
  recursos jsonb NOT NULL DEFAULT '[]'::jsonb,
  evaluaciones jsonb NOT NULL DEFAULT '[]'::jsonb,
  productos text[] NOT NULL DEFAULT '{}',
  fuente text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.base_conocimiento TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.base_conocimiento TO authenticated;
GRANT ALL ON public.base_conocimiento TO service_role;
ALTER TABLE public.base_conocimiento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Docentes consultan base de conocimiento" ON public.base_conocimiento FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins gestionan base de conocimiento" ON public.base_conocimiento FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'administrador')) WITH CHECK (public.has_role(auth.uid(),'administrador'));
CREATE INDEX idx_bc_lookup ON public.base_conocimiento(grado, tomo, campo_formativo);

CREATE TRIGGER trg_campos_updated BEFORE UPDATE ON public.campos_formativos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_disciplinas_updated BEFORE UPDATE ON public.disciplinas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_proyectos_updated BEFORE UPDATE ON public.proyectos_aula FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_planeaciones_updated BEFORE UPDATE ON public.planeaciones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_sesiones_updated BEFORE UPDATE ON public.sesiones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_agenda_updated BEFORE UPDATE ON public.agenda_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_biblioteca_updated BEFORE UPDATE ON public.biblioteca_recursos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_calendario_updated BEFORE UPDATE ON public.calendario_escolar FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_planes_updated BEFORE UPDATE ON public.planes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_suscripciones_updated BEFORE UPDATE ON public.suscripciones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_landing_updated BEFORE UPDATE ON public.landing_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_bc_updated BEFORE UPDATE ON public.base_conocimiento FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.campos_formativos (nombre, slug, color, orden) VALUES
  ('Lenguajes','lenguajes','#2563eb',1),
  ('Saberes y Pensamiento Científico','saberes-pensamiento-cientifico','#16a34a',2),
  ('Ética, Naturaleza y Sociedades','etica-naturaleza-sociedades','#f59e0b',3),
  ('De lo Humano y lo Comunitario','humano-comunitario','#ea580c',4);

INSERT INTO public.disciplinas (campo_formativo_id, nombre, orden)
SELECT c.id, d.nombre, d.orden FROM public.campos_formativos c
JOIN (VALUES
  ('lenguajes','Español',1),('lenguajes','Inglés',2),('lenguajes','Artes',3),
  ('saberes-pensamiento-cientifico','Matemáticas',1),('saberes-pensamiento-cientifico','Biología',2),
  ('saberes-pensamiento-cientifico','Física',3),('saberes-pensamiento-cientifico','Química',4),
  ('etica-naturaleza-sociedades','Historia',1),('etica-naturaleza-sociedades','Geografía',2),
  ('etica-naturaleza-sociedades','Formación Cívica y Ética',3),
  ('humano-comunitario','Educación Física',1),('humano-comunitario','Tecnología',2),
  ('humano-comunitario','Tutoría y Educación Socioemocional',3)
) AS d(slug, nombre, orden) ON d.slug = c.slug;

INSERT INTO public.planes (nombre, periodo, precio, beneficios, orden) VALUES
  ('Mensual','mensual',199.00,ARRAY['Planeaciones ilimitadas','IA Pedagógica','Exportación PDF y Word'],1),
  ('Semestral','semestral',999.00,ARRAY['Todo lo del plan mensual','Biblioteca completa','Agenda docente avanzada'],2),
  ('Anual','anual',1699.00,ARRAY['Todo lo del plan semestral','Generador de exámenes','Soporte prioritario'],3);

INSERT INTO public.calendario_escolar (ciclo, fecha, titulo, tipo, descripcion) VALUES
  ('2026-2027','2026-08-24','Inicio del ciclo escolar','evento','Primer día de clases'),
  ('2026-2027','2026-09-16','Día de la Independencia','suspension','Suspensión oficial de labores'),
  ('2026-2027','2026-09-25','Consejo Técnico Escolar','cte','Primera sesión ordinaria'),
  ('2026-2027','2026-11-16','Aniversario de la Revolución Mexicana','suspension','Suspensión oficial de labores'),
  ('2026-2027','2026-11-27','Registro de calificaciones del primer trimestre','evaluacion','Cierre del primer trimestre'),
  ('2026-2027','2026-12-21','Inicio del periodo vacacional de invierno','vacaciones','Hasta el 8 de enero'),
  ('2026-2027','2027-03-19','Registro de calificaciones del segundo trimestre','evaluacion','Cierre del segundo trimestre'),
  ('2026-2027','2027-07-15','Fin del ciclo escolar','evento','Último día de clases');

INSERT INTO public.landing_config (seccion, contenido, orden) VALUES
  ('hero','{"titulo":"La plataforma más completa para docentes de Telesecundaria","subtitulo":"Planeaciones, proyectos y sesiones alineadas a la Nueva Escuela Mexicana en un clic.","cta":"Comenzar gratis"}'::jsonb,1),
  ('avisos','{"activo":false,"texto":""}'::jsonb,2);