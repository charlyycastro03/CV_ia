-- 1. Eliminar tablas del pipeline viejo (si existen)
DROP TABLE IF EXISTS cv_master CASCADE;
DROP TABLE IF EXISTS matches CASCADE;

-- 2. Renombrar columnas en jobs para que coincidan con el código
DO $$
BEGIN
    IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='jobs' and column_name='company') THEN
        IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='jobs' and column_name='company_name') THEN
            ALTER TABLE jobs RENAME COLUMN company TO company_name;
        ELSE
            ALTER TABLE jobs DROP COLUMN company;
        END IF;
    END IF;
    
    IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='jobs' and column_name='apply_url') THEN
        IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='jobs' and column_name='url') THEN
            ALTER TABLE jobs RENAME COLUMN apply_url TO url;
        ELSE
            ALTER TABLE jobs DROP COLUMN apply_url;
        END IF;
    END IF;
    
    IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='jobs' and column_name='job_type') THEN
        IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='jobs' and column_name='type') THEN
            ALTER TABLE jobs RENAME COLUMN job_type TO type;
        ELSE
            ALTER TABLE jobs DROP COLUMN job_type;
        END IF;
    END IF;
END $$;

-- Asegurar que la tabla applications tenga un valor por defecto para applied_at
ALTER TABLE applications ALTER COLUMN applied_at SET DEFAULT now();

-- Agregar campos faltantes en applications que el cron intenta insertar
DO $$
BEGIN
    IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='applications' and column_name='match_score') THEN
        ALTER TABLE applications ADD COLUMN match_score INT;
    END IF;
    IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='applications' and column_name='match_details') THEN
        ALTER TABLE applications ADD COLUMN match_details JSONB;
    END IF;
END $$;

-- 3. Configurar RLS (Row Level Security)

-- Habilitar RLS en todas las tablas activas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'application_logs') THEN
        EXECUTE 'ALTER TABLE application_logs ENABLE ROW LEVEL SECURITY';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'test_results') THEN
        EXECUTE 'ALTER TABLE test_results ENABLE ROW LEVEL SECURITY';
    END IF;
END $$;

-- Políticas para Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
CREATE POLICY "Users can delete own profile" ON profiles FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Applications
DROP POLICY IF EXISTS "Users can view own applications" ON applications;
CREATE POLICY "Users can view own applications" ON applications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own applications" ON applications;
CREATE POLICY "Users can update own applications" ON applications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own applications" ON applications;
CREATE POLICY "Users can insert own applications" ON applications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para Jobs (Cualquier usuario logueado puede leer jobs, solo Service Role puede insertar/modificar)
DROP POLICY IF EXISTS "Anyone can read jobs" ON jobs;
CREATE POLICY "Anyone can read jobs" ON jobs FOR SELECT USING (true);
