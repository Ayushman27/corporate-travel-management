-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id VARCHAR(64) PRIMARY KEY,
  company_id VARCHAR(64) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  head_name VARCHAR(255) NOT NULL,
  head_email VARCHAR(255) UNIQUE NOT NULL,
  head_password VARCHAR(255) NOT NULL,
  hrms_sheet_url TEXT NOT NULL,
  finance_sheet_url TEXT NOT NULL,
  policy JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  last_sheet_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  employee_id VARCHAR(64) NOT NULL,
  company_id VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255),
  department VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'employee',
  login_type VARCHAR(50) DEFAULT 'email_only',
  manager_id VARCHAR(64),
  travel_budget_used NUMERIC DEFAULT 0,
  travel_budget_limit NUMERIC DEFAULT 50000,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_company_employee UNIQUE(company_id, employee_id),
  CONSTRAINT uq_company_email UNIQUE(company_id, email)
);

-- Trips table
CREATE TABLE IF NOT EXISTS trips (
  id VARCHAR(64) PRIMARY KEY,
  trip_id VARCHAR(64) UNIQUE NOT NULL,
  company_id VARCHAR(64) NOT NULL,
  employee_id VARCHAR(64) NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  from_city VARCHAR(255) NOT NULL,
  to_city VARCHAR(255) NOT NULL,
  travel_date TIMESTAMPTZ NOT NULL,
  return_date TIMESTAMPTZ,
  purpose TEXT NOT NULL,
  travel_mode VARCHAR(50) DEFAULT 'mixed',
  preference_note TEXT DEFAULT '',
  estimated_budget NUMERIC DEFAULT 0,
  approved_budget NUMERIC DEFAULT 0,
  actual_cost NUMERIC DEFAULT 0,
  selected_plan_id VARCHAR(64),
  selected_hotel JSONB,
  status VARCHAR(50) DEFAULT 'draft',
  booking_id VARCHAR(64),
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  chat_history JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
  id VARCHAR(64) PRIMARY KEY,
  trip_id VARCHAR(64) NOT NULL,
  plan_type VARCHAR(50) NOT NULL,
  rank INT,
  segments JSONB DEFAULT '[]',
  total_cost NUMERIC NOT NULL,
  total_duration INT NOT NULL,
  comfort_score NUMERIC,
  cost_score NUMERIC,
  speed_score NUMERIC,
  overall_score NUMERIC,
  summary TEXT,
  highlights JSONB DEFAULT '[]',
  warnings JSONB DEFAULT '[]',
  is_selected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(64) PRIMARY KEY,
  booking_id VARCHAR(64) UNIQUE NOT NULL,
  trip_id VARCHAR(64) NOT NULL,
  employee_id VARCHAR(64) NOT NULL,
  plan_id VARCHAR(64),
  tickets JSONB DEFAULT '[]',
  total_cost NUMERIC NOT NULL,
  status VARCHAR(50) DEFAULT 'confirmed',
  booked_at TIMESTAMPTZ DEFAULT NOW(),
  employee_notified BOOLEAN DEFAULT FALSE,
  manager_notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approvals table
CREATE TABLE IF NOT EXISTS approvals (
  id VARCHAR(64) PRIMARY KEY,
  trip_id VARCHAR(64) NOT NULL,
  approval_type VARCHAR(50) NOT NULL,
  approver_id VARCHAR(64),
  approver_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  comments TEXT DEFAULT '',
  budget_requested NUMERIC,
  budget_approved NUMERIC,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reimbursements table
CREATE TABLE IF NOT EXISTS reimbursements (
  id VARCHAR(64) PRIMARY KEY,
  employee_id VARCHAR(64) NOT NULL,
  company_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  bills JSONB DEFAULT '[]',
  total_requested_amount NUMERIC DEFAULT 0,
  total_approved_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hotels table
CREATE TABLE IF NOT EXISTS hotels (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  state VARCHAR(255),
  price VARCHAR(50),
  rating NUMERIC,
  amenities JSONB DEFAULT '[]',
  source VARCHAR(50) DEFAULT 'serpapi',
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Logs table
CREATE TABLE IF NOT EXISTS logs (
  id VARCHAR(64) PRIMARY KEY,
  trip_id VARCHAR(64),
  actor_id VARCHAR(64),
  actor_name VARCHAR(255),
  actor_role VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address VARCHAR(100),
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

