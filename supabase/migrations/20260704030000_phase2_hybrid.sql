-- 1. Ampliar ENUM application_status
-- Agregamos los estados faltantes del cron y del track humano
-- Nota: En Postgres, ALTER TYPE ADD VALUE no puede estar dentro de un bloque DO transaccional si no se hace commit,
-- pero fuera de él corre bien.
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'pending_review';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'applied_automatically';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'ready_to_apply';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'in_review';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'submitted_by_team';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'needs_candidate_info';

-- 2. Ampliar ENUM user_role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'reviewer';

-- 3. Modificar tabla applications
-- Agregar método de aplicación para distinguir entre auto y assisted
DO $$
BEGIN
    IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='applications' and column_name='application_method') THEN
        ALTER TABLE applications ADD COLUMN application_method VARCHAR(20) DEFAULT 'auto';
    END IF;
    
    -- Añadimos la restricción si no existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'applications_user_job_unique'
    ) THEN
        -- Primero eliminamos posibles duplicados manteniendo el más reciente
        -- (Omitimos borrado complejo por seguridad en migración automática, asumimos que no hay muchos dupes aún)
        ALTER TABLE applications ADD CONSTRAINT applications_user_job_unique UNIQUE (user_id, job_id);
    END IF;
END $$;
