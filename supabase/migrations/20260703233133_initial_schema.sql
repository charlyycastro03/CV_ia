-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE application_status AS ENUM ('pending', 'applied', 'under_review', 'interview', 'offer', 'hired', 'rejected');

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR,
  name VARCHAR,
  role user_role DEFAULT 'user',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cv_url VARCHAR,
  cv_data JSONB,
  target_roles TEXT[],
  target_salary_min INT,
  target_salary_max INT,
  target_locations TEXT[],
  skills TEXT[],
  experience_years INT,
  preferences JSONB,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Jobs
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR,
  company VARCHAR,
  location VARCHAR,
  description TEXT,
  requirements TEXT[],
  salary_min INT,
  salary_max INT,
  source VARCHAR,
  apply_url VARCHAR,
  external_id VARCHAR,
  posted_date TIMESTAMP,
  is_remote BOOLEAN,
  job_type VARCHAR,
  created_at TIMESTAMP DEFAULT now()
);

-- Applications
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  status application_status DEFAULT 'pending',
  applied_at TIMESTAMP,
  cv_version_url VARCHAR,
  cover_letter TEXT,
  notes TEXT,
  last_updated TIMESTAMP DEFAULT now()
);

-- Application Logs
CREATE TABLE application_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  status VARCHAR,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Test Results
CREATE TABLE test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  test_type VARCHAR,
  score INT,
  passed BOOLEAN,
  details JSONB,
  created_at TIMESTAMP DEFAULT now()
);
