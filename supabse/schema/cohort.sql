-- Cohort System Schema
-- Enables multiple groups/cohorts running the 45-day challenge simultaneously

-- Cohorts table
CREATE TABLE IF NOT EXISTS "cohorts" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    session_id UUID REFERENCES book_sessions(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    max_members INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Cohort memberships table
CREATE TABLE IF NOT EXISTS "cohort_memberships" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cohort_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cohorts
CREATE POLICY "Anyone can view public cohorts" ON cohorts
    FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Members can view their cohorts" ON cohorts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cohort_memberships
            WHERE cohort_memberships.cohort_id = cohorts.id
            AND cohort_memberships.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can update cohorts" ON cohorts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM cohort_memberships
            WHERE cohort_memberships.cohort_id = cohorts.id
            AND cohort_memberships.user_id = auth.uid()
            AND cohort_memberships.role = 'admin'
        )
    );

-- RLS Policies for cohort_memberships
CREATE POLICY "Users can view memberships in their cohorts" ON cohort_memberships
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM cohort_memberships AS cm
            WHERE cm.cohort_id = cohort_memberships.cohort_id
            AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join public cohorts" ON cohort_memberships
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM cohorts
            WHERE cohorts.id = cohort_id
            AND cohorts.is_public = TRUE
            AND cohorts.is_active = TRUE
        )
    );

CREATE POLICY "Users can leave cohorts" ON cohort_memberships
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage memberships" ON cohort_memberships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM cohort_memberships AS cm
            WHERE cm.cohort_id = cohort_memberships.cohort_id
            AND cm.user_id = auth.uid()
            AND cm.role = 'admin'
        )
    );

-- Indexes for performance
CREATE INDEX idx_cohorts_session ON cohorts(session_id);
CREATE INDEX idx_cohorts_active ON cohorts(is_active, is_public);
CREATE INDEX idx_cohort_memberships_user ON cohort_memberships(user_id);
CREATE INDEX idx_cohort_memberships_cohort ON cohort_memberships(cohort_id);
