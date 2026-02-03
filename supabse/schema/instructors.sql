-- Instructors & Coaching System Schema
-- Enables multiple cohorts with different instructors and comprehensive feedback

-- Instructor status enum
CREATE TYPE instructor_status AS ENUM ('pending', 'approved', 'suspended', 'inactive');

-- Instructor specialization enum
CREATE TYPE instructor_specialization AS ENUM (
    'gratitude_coaching',
    'mindfulness',
    'accountability',
    'life_coaching',
    'group_facilitation',
    'wellness',
    'spiritual_growth'
);

-- Instructors table
CREATE TABLE IF NOT EXISTS "instructors" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,

    -- Profile
    display_name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    title TEXT,                                    -- e.g., "Lead Coach", "Gratitude Guide"

    -- Qualifications
    specializations instructor_specialization[] DEFAULT '{}',
    certifications TEXT[],
    years_experience INTEGER DEFAULT 0,

    -- Status
    status instructor_status DEFAULT 'pending',
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),

    -- Settings
    max_cohorts INTEGER DEFAULT 3,                 -- Max concurrent cohorts
    accepts_new_cohorts BOOLEAN DEFAULT TRUE,
    timezone TEXT DEFAULT 'America/New_York',

    -- Social links
    linkedin_url TEXT,
    website_url TEXT,

    -- Metrics (denormalized for performance)
    total_cohorts_led INTEGER DEFAULT 0,
    total_participants_coached INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_ratings INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Cohort-Instructor assignment (allows multiple instructors per cohort)
CREATE TABLE IF NOT EXISTS "cohort_instructors" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE NOT NULL,
    instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE NOT NULL,

    -- Role within the cohort
    role TEXT CHECK (role IN ('lead', 'assistant', 'guest')) DEFAULT 'lead',

    -- Assignment details
    assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    UNIQUE(cohort_id, instructor_id)
);

-- Instructor availability for scheduling
CREATE TABLE IF NOT EXISTS "instructor_availability" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE NOT NULL,

    -- Recurring availability (e.g., "every Monday 9am-12pm")
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    -- Or specific date availability
    specific_date DATE,

    -- Whether this is available or blocked
    is_available BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_availability CHECK (
        (day_of_week IS NOT NULL AND specific_date IS NULL) OR
        (day_of_week IS NULL AND specific_date IS NOT NULL)
    )
);

-- Enable RLS
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies for instructors
CREATE POLICY "Anyone can view approved instructors" ON instructors
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can view own instructor profile" ON instructors
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own instructor profile" ON instructors
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage instructors" ON instructors
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for cohort_instructors
CREATE POLICY "Anyone can view cohort instructors" ON cohort_instructors
    FOR SELECT USING (TRUE);

CREATE POLICY "Service role can manage cohort instructors" ON cohort_instructors
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for instructor_availability
CREATE POLICY "Anyone can view instructor availability" ON instructor_availability
    FOR SELECT USING (TRUE);

CREATE POLICY "Instructors can manage own availability" ON instructor_availability
    FOR ALL USING (
        instructor_id IN (SELECT id FROM instructors WHERE user_id = auth.uid())
    );

-- Indexes
CREATE INDEX idx_instructors_user ON instructors(user_id);
CREATE INDEX idx_instructors_status ON instructors(status) WHERE status = 'approved';
CREATE INDEX idx_instructors_rating ON instructors(average_rating DESC) WHERE status = 'approved';
CREATE INDEX idx_cohort_instructors_cohort ON cohort_instructors(cohort_id);
CREATE INDEX idx_cohort_instructors_instructor ON cohort_instructors(instructor_id);
CREATE INDEX idx_instructor_availability_instructor ON instructor_availability(instructor_id);
CREATE INDEX idx_instructor_availability_day ON instructor_availability(day_of_week) WHERE is_available = TRUE;

-- Function to update instructor metrics
CREATE OR REPLACE FUNCTION update_instructor_metrics(p_instructor_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE instructors
    SET
        total_cohorts_led = (
            SELECT COUNT(DISTINCT cohort_id)
            FROM cohort_instructors
            WHERE instructor_id = p_instructor_id AND is_active = TRUE
        ),
        total_participants_coached = (
            SELECT COUNT(DISTINCT cm.user_id)
            FROM cohort_instructors ci
            JOIN cohort_memberships cm ON ci.cohort_id = cm.cohort_id
            WHERE ci.instructor_id = p_instructor_id
        ),
        updated_at = NOW()
    WHERE id = p_instructor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update metrics when cohort instructor changes
CREATE OR REPLACE FUNCTION trigger_update_instructor_metrics()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM update_instructor_metrics(NEW.instructor_id);
    END IF;
    IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
        PERFORM update_instructor_metrics(OLD.instructor_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_instructor_metrics_trigger
    AFTER INSERT OR UPDATE OR DELETE ON cohort_instructors
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_instructor_metrics();
