-- Remove the old incorrect constraint that only checks external_id
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_external_id_key;

-- Add the correct constraint that checks the combination of source and external_id
ALTER TABLE jobs ADD CONSTRAINT jobs_source_external_id_key UNIQUE (source, external_id);
