
-- Books table
CREATE TABLE IF NOT EXISTS "books" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,

    heading TEXT,
    description TEXT,
    message_heading TEXT,
    message_description TEXT,
    farewell TEXT NOT NULL,

    cover TEXT,

    duration_days INTEGER NOT NULL,
    daily_journal_points INTEGER NOT NULL,
    weekly_journal_points INTEGER NOT NULL,
    daily_action_points INTEGER NOT NULL,
    weekly_action_points INTEGER NOT NULL,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(slug)
);

-- Book sessions
CREATE TABLE IF NOT EXISTS "book_sessions" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
    duration_days INTEGER NOT NULL,

    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    
);

-- Book sessions
CREATE TABLE IF NOT EXISTS "book_milestones" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
    
    "order" INTEGER NOT NULL,

    name TEXT NOT NULL,
    start_point INTEGER NOT NULL,
    end_point INTEGER,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_milestones ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- books policies
CREATE POLICY "Authenticated users can read books" ON books
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only Admins can crud books" ON books
    FOR ALL USING (auth.uid() = admin_id)
    WITH CHECK(auth.uid() = admin_id);

CREATE POLICY "Admins can CRUD books"
ON books
FOR ALL
USING (
  EXISTS (SELECT 1 FROM "user_roles" WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM "user_roles" WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

CREATE POLICY "Authenticated users can read book sesssions" ON book_sessions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can CRUD book sessions"
ON book_sessions
FOR ALL
USING (
  EXISTS (SELECT 1 FROM "user_roles" WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM "user_roles" WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

CREATE POLICY "Authenticated users can read book milestones" ON book_milestones
    FOR SELECT USING (auth.role() = 'authenticated');
-- Create indexes
CREATE INDEX idx_books_slug ON books(slug);