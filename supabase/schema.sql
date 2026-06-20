-- Nexus AI Platform - Supabase Schema
-- Run this in your Supabase SQL Editor to set up all tables

-- Organizations (multi-tenant)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  size TEXT,
  website TEXT,
  logo_url TEXT,
  headquarters TEXT,
  founded_year INTEGER,
  fiscal_year_start TEXT DEFAULT 'January',
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users/Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'recruiter', 'hr_manager', 'cfo', 'manager', 'viewer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  avatar_url TEXT,
  organization_id UUID REFERENCES organizations(id),
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  employment_type TEXT NOT NULL CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'internship')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'on_hold', 'draft')),
  description TEXT,
  requirements TEXT,
  salary_min NUMERIC NOT NULL DEFAULT 0,
  salary_max NUMERIC NOT NULL DEFAULT 0,
  posted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Candidates
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  job_id UUID REFERENCES jobs(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  stage TEXT NOT NULL DEFAULT 'applied' CHECK (stage IN ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected')),
  ai_score NUMERIC,
  skills TEXT[] DEFAULT '{}',
  experience_years NUMERIC,
  current_company TEXT,
  current_title TEXT,
  expected_salary NUMERIC,
  resume_url TEXT,
  notes TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interviews
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  candidate_id UUID REFERENCES candidates(id),
  job_id UUID REFERENCES jobs(id),
  type TEXT NOT NULL CHECK (type IN ('screening', 'technical', 'behavioral', 'final', 'panel')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  interviewer_id UUID REFERENCES profiles(id),
  notes TEXT,
  overall_rating NUMERIC,
  technical_score NUMERIC,
  communication_score NUMERIC,
  problem_solving_score NUMERIC,
  hire_recommendation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  department TEXT NOT NULL,
  job_title TEXT NOT NULL,
  employment_type TEXT NOT NULL CHECK (employment_type IN ('full_time', 'part_time', 'contract')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'terminated')),
  start_date DATE NOT NULL,
  end_date DATE,
  base_salary NUMERIC NOT NULL DEFAULT 0,
  performance_score NUMERIC,
  manager_id UUID REFERENCES employees(id),
  avatar_url TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financial Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  type TEXT NOT NULL CHECK (type IN ('revenue', 'expense')),
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  reference TEXT,
  vendor TEXT,
  department TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll Runs
CREATE TABLE IF NOT EXISTS payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'approved')),
  total_gross NUMERIC NOT NULL DEFAULT 0,
  total_net NUMERIC NOT NULL DEFAULT 0,
  total_tax NUMERIC NOT NULL DEFAULT 0,
  total_benefits NUMERIC NOT NULL DEFAULT 0,
  employee_count INTEGER NOT NULL DEFAULT 0,
  processed_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  user_id UUID REFERENCES profiles(id),
  user_name TEXT NOT NULL,
  ip_address TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Demo Organization and seed data
INSERT INTO organizations (id, name, industry, size, headquarters, currency)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Nexus Corp',
  'Technology',
  '51-200',
  'San Francisco, CA',
  'USD'
) ON CONFLICT DO NOTHING;

-- Demo Profile
INSERT INTO profiles (id, email, full_name, role, status, organization_id)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'demo@nexus.ai',
  'Alex Johnson',
  'admin',
  'active',
  'a0000000-0000-0000-0000-000000000001'
) ON CONFLICT DO NOTHING;

-- Demo Jobs
INSERT INTO jobs (id, organization_id, title, department, location, employment_type, status, salary_min, salary_max, description)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Senior Software Engineer', 'Engineering', 'San Francisco, CA', 'full_time', 'open', 120000, 180000, 'We are looking for a senior engineer to join our growing team.'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Product Manager', 'Product', 'Remote', 'full_time', 'open', 130000, 170000, 'Lead product strategy and execution for our core platform.'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Data Analyst', 'Analytics', 'New York, NY', 'full_time', 'open', 90000, 130000, 'Drive data-driven decisions across the organization.'),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'UX Designer', 'Design', 'Remote', 'full_time', 'on_hold', 100000, 145000, 'Create exceptional user experiences for our enterprise platform.')
ON CONFLICT DO NOTHING;

-- Demo Candidates
INSERT INTO candidates (id, organization_id, job_id, full_name, email, stage, ai_score, skills, experience_years, current_company, expected_salary, source)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Sarah Chen', 'sarah.chen@email.com', 'interview', 87, ARRAY['React', 'TypeScript', 'Node.js', 'AWS'], 6, 'Google', 160000, 'LinkedIn'),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Marcus Williams', 'marcus.w@email.com', 'screening', 72, ARRAY['Python', 'Go', 'Kubernetes', 'Docker'], 4, 'Stripe', 150000, 'Indeed'),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Emily Rodriguez', 'emily.r@email.com', 'offer', 94, ARRAY['Product Strategy', 'Agile', 'SQL', 'Analytics'], 8, 'Airbnb', 165000, 'Referral'),
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'James Park', 'james.park@email.com', 'applied', 61, ARRAY['Java', 'Spring Boot', 'PostgreSQL'], 3, 'Accenture', 130000, 'ZipRecruiter'),
  ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'Priya Patel', 'priya.patel@email.com', 'hired', 91, ARRAY['Python', 'R', 'Tableau', 'SQL', 'Machine Learning'], 5, 'Meta', 125000, 'LinkedIn')
ON CONFLICT DO NOTHING;

-- Demo Employees
INSERT INTO employees (id, organization_id, full_name, email, department, job_title, employment_type, status, start_date, base_salary, performance_score, location)
VALUES
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Alex Johnson', 'alex.johnson@nexus.ai', 'Leadership', 'CEO', 'full_time', 'active', '2020-01-15', 250000, 4.8, 'San Francisco, CA'),
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Samantha Lee', 'samantha.lee@nexus.ai', 'Engineering', 'VP Engineering', 'full_time', 'active', '2020-03-01', 200000, 4.7, 'San Francisco, CA'),
  ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'David Kim', 'david.kim@nexus.ai', 'Engineering', 'Senior Engineer', 'full_time', 'active', '2021-06-15', 155000, 4.5, 'Remote'),
  ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Jennifer Walsh', 'jennifer.walsh@nexus.ai', 'Finance', 'CFO', 'full_time', 'active', '2020-05-01', 220000, 4.9, 'San Francisco, CA'),
  ('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Robert Martinez', 'robert.m@nexus.ai', 'HR', 'HR Manager', 'full_time', 'active', '2021-01-10', 110000, 4.3, 'New York, NY'),
  ('e0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Lisa Thompson', 'lisa.t@nexus.ai', 'Sales', 'Sales Director', 'full_time', 'active', '2020-09-15', 145000, 4.6, 'Chicago, IL'),
  ('e0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'Kevin O''Brien', 'kevin.ob@nexus.ai', 'Marketing', 'Marketing Manager', 'full_time', 'on_leave', '2021-11-01', 105000, 4.1, 'Remote'),
  ('e0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'Nina Patel', 'nina.patel@nexus.ai', 'Product', 'Product Manager', 'full_time', 'active', '2022-02-14', 135000, 4.4, 'San Francisco, CA')
ON CONFLICT DO NOTHING;

-- Demo Transactions
INSERT INTO transactions (id, organization_id, type, category, amount, description, date, vendor, department, status)
VALUES
  ('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'revenue', 'SaaS Subscriptions', 125000, 'Monthly recurring revenue from enterprise clients', '2026-05-31', NULL, NULL, 'completed'),
  ('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'revenue', 'Professional Services', 45000, 'Consulting and implementation services', '2026-05-28', NULL, NULL, 'completed'),
  ('f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'expense', 'Payroll', 280000, 'Monthly payroll for all employees', '2026-05-31', NULL, 'All', 'completed'),
  ('f0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'expense', 'Cloud Infrastructure', 18500, 'AWS and infrastructure costs', '2026-05-30', 'Amazon Web Services', 'Engineering', 'completed'),
  ('f0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'expense', 'Marketing', 32000, 'Digital marketing and advertising spend', '2026-05-29', NULL, 'Marketing', 'completed'),
  ('f0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'revenue', 'SaaS Subscriptions', 138000, 'Monthly recurring revenue - June', '2026-06-01', NULL, NULL, 'completed'),
  ('f0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'expense', 'Office & Facilities', 12000, 'Office rent and utilities', '2026-06-01', NULL, 'Operations', 'completed'),
  ('f0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'expense', 'Software & Tools', 8500, 'SaaS tools and subscriptions', '2026-06-02', NULL, 'All', 'completed')
ON CONFLICT DO NOTHING;

-- Demo Payroll Run
INSERT INTO payroll_runs (id, organization_id, period_start, period_end, status, total_gross, total_net, total_tax, total_benefits, employee_count)
VALUES
  ('g0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '2026-06-01', '2026-06-30', 'completed', 1120000, 784000, 280000, 56000, 8),
  ('g0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '2026-05-01', '2026-05-31', 'approved', 1120000, 784000, 280000, 56000, 8),
  ('g0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '2026-04-01', '2026-04-30', 'approved', 1060000, 742000, 265000, 53000, 7)
ON CONFLICT DO NOTHING;

-- Demo Interviews
INSERT INTO interviews (id, organization_id, candidate_id, job_id, type, scheduled_at, duration_minutes, status, notes)
VALUES
  ('h0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'technical', '2026-06-10 14:00:00+00', 60, 'scheduled', 'Technical screening for senior engineer role'),
  ('h0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'final', '2026-06-08 10:00:00+00', 90, 'completed', 'Final round interview - excellent candidate')
ON CONFLICT DO NOTHING;

-- Demo Audit Logs
INSERT INTO audit_logs (id, organization_id, action, entity_type, user_id, user_name, details)
VALUES
  ('i0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'CREATE', 'candidate', 'b0000000-0000-0000-0000-000000000001', 'Alex Johnson', 'Created candidate Sarah Chen for Senior Software Engineer'),
  ('i0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'UPDATE', 'candidate', 'b0000000-0000-0000-0000-000000000001', 'Alex Johnson', 'Advanced Emily Rodriguez to offer stage'),
  ('i0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'CREATE', 'payroll_run', 'b0000000-0000-0000-0000-000000000001', 'Alex Johnson', 'Processed payroll run for June 2026')
ON CONFLICT DO NOTHING;
