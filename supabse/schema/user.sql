
-- users table
CREATE TABLE IF NOT EXISTS "users" (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  supabase_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  profile_image TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  welcome_email_sent BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


-- users roles table
CREATE TABLE IF NOT EXISTS "user_roles" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  role text NOT NULL CHECK (role IN ('admin', 'user')),
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);



-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Profile entries policies
CREATE POLICY "Users can CRUD own profile" ON users
    FOR ALL USING (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can read own roles" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_user_roles ON user_roles(user_id, role);