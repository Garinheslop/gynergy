-- enums
create type journalType as enum (
  'morning',
  'evening',
  'weekly'
);
create type journalEntryType as enum (
  'affirmation',
  'gratitude',
  'excitement',
  'dream'
);
create type ActionLogType as enum (
  'gratitude',
  'weekly-challenge'
);
create type VisionType as enum (
  'highest-self',
  'mantra',
  'creed',
  'discovery'
);

-- user sessions
CREATE TABLE IF NOT EXISTS "session_enrollments" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES book_sessions(id) ON DELETE CASCADE NOT NULL,

    enrollment_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    
    morning_completion INTEGER DEFAULT 0,
    morning_streak INTEGER DEFAULT 0,

    evening_completion INTEGER DEFAULT 0,
    evening_streak INTEGER DEFAULT 0,

    gratitude_completion INTEGER DEFAULT 0,
    gratitude_streak INTEGER DEFAULT 0,

    weekly_reflection_completion INTEGER DEFAULT 0,
    weekly_reflection_streak INTEGER DEFAULT 0,

    weekly_challenge_completion INTEGER DEFAULT 0,
    weekly_challenge_streak INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(session_id, user_id)
);

-- user visions
CREATE TABLE IF NOT EXISTS "user_visions" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES book_sessions(id) ON DELETE CASCADE NOT NULL,

    images TEXT[],

    
    name TEXT,
    abilities TEXT,
    purpose TEXT,
    traits TEXT,
    symbols TEXT,


    mantra TEXT,
    creed TEXT,


    qualities TEXT,
    achievements TEXT,
    importance TEXT,
    self_values TEXT,
    lifestyle TEXT,
    foreseen  TEXT,
    relationships  TEXT,
    legacy  TEXT,
    improvement  TEXT,
    self_evaluation  TEXT,
    interests  TEXT,
    triggers  TEXT,
    envision  TEXT,
    milestones  TEXT,
    contributions  TEXT,

    vision_type VisionType NOT NULL,

    is_completed BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    
    UNIQUE(session_id, user_id, vision_type)
);

-- Jjournals entries table
CREATE TABLE IF NOT EXISTS "journals" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES book_sessions(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    entry_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    images TEXT[],

    captured_essence TEXT, -- morning
    mood_score INTEGER, -- morning & evening
    mood_contribution TEXT, -- morning
    mantra TEXT,  -- morning

    insight TEXT, -- evening
    insight_impact TEXT, -- evening
    success TEXT, -- evening
    changes TEXT, -- evening
    freeflow TEXT, -- evening

    wins TEXT, -- weekly
    challenges TEXT, -- weekly
    lessons TEXT, -- weekly


    journal_type journalType NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(session_id, user_id, entry_date, journal_type),
    
    -- Ensure morning journal fields is required if journal_type is 'morning'
    CHECK (journal_type != 'morning' 
    OR mood_score IS NOT NULL
    OR mood_contribution IS NOT NULL
    OR mantra IS NOT NULL),

    -- Ensure evening journal fields is required if journal_type is 'evening'
    CHECK (journal_type != 'evening' 
    OR insight IS NOT NULL
    OR insight_impact IS NOT NULL
    OR success IS NOT NULL
    OR changes IS NOT NULL),

    -- Ensure weekly journal fields is required if journal_type is 'weekly'
    CHECK (journal_type != 'weekly' 
    OR wins IS NOT NULL
    OR challenges IS NOT NULL
    OR lessons IS NOT NULL)
);


-- Affirmations, excitements, gratitudes table
CREATE TABLE IF NOT EXISTS "journal_entries" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    journal_id UUID REFERENCES journals(id) ON DELETE CASCADE,
    content TEXT[] NOT NULL,
    entry_type journalEntryType NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Gratitude action responses
CREATE TABLE IF NOT EXISTS "action_logs" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action_id UUID REFERENCES actions(id) ON DELETE CASCADE,
    session_id UUID REFERENCES book_sessions(id) ON DELETE CASCADE,

    entry_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    images TEXT[],

    -- Fields from daily actions:
    note TEXT,  -- How did it make you feel
    reflection TEXT,  -- How did it make you feel
    obstacles TEXT,  -- What obstacles did you encounter
    list TEXT[],  
    draw TEXT,  

    -- Weekly challenge fields:
    reward TEXT,          -- Your weekly reward
    motivation TEXT,      -- How will this reward motivate you
    purpose TEXT,         -- Why is this challenge important to you
    success TEXT,         -- What will success look like at the end of the week
    focus TEXT,           -- Next week’s focus for growth


    action_type ActionLogType NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    
    -- Ensure reflection and obstacles is not populate at the same row if action_type is 'gratitude'
    CHECK (action_type != 'gratitude' or reflection IS NOT NULL OR obstacles IS NOT NULL),

    -- Ensure morning journal fields is required if action_type is 'weekly-challenge'
    CHECK (action_type != 'weekly-challenge' 
    OR reward IS NOT NULL
    OR motivation IS NOT NULL
    OR purpose IS NOT NULL
    OR success IS NOT NULL
    OR focus IS NOT NULL)

);

-- Meditations 
CREATE TABLE IF NOT EXISTS "meditations" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES book_sessions(id) ON DELETE CASCADE,

    reflection TEXT,  -- How did it make you feel

    entry_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- journey 
CREATE TABLE IF NOT EXISTS "journey" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES book_sessions(id) ON DELETE CASCADE,

    -- Group 1: Current / Vision
    romantic_relationship_situation    TEXT,
    romantic_relationship_vision       TEXT,
    family_friend_situation            TEXT,
    family_friend_vision               TEXT,
    quality_of_life_situation          TEXT,
    quality_of_life_vision             TEXT,
    spiritual_situation                TEXT,
    spiritual_vision                   TEXT,

    -- Group 1: Why / Strategy
    romantic_relationship_why          TEXT,
    romantic_relationship_strategy     TEXT,
    family_friend_why                  TEXT,
    family_friend_strategy             TEXT,
    quality_of_life_why                TEXT,
    quality_of_life_strategy           TEXT,
    spiritual_why                      TEXT,
    spiritual_strategy                 TEXT,

    -- Group 2: Current / Vision
    health_fitness_situation           TEXT,
    health_fitness_vision              TEXT,
    personal_dev_situation             TEXT,
    personal_dev_vision                TEXT,
    career_business_situation          TEXT,
    career_business_vision             TEXT,
    financial_situation                TEXT,
    financial_vision                   TEXT,

    -- Group 2: Why / Strategy
    health_fitness_why                 TEXT,
    health_fitness_strategy            TEXT,
    personal_dev_why                   TEXT,
    personal_dev_strategy              TEXT,
    career_business_why                TEXT,
    career_business_strategy           TEXT,
    financial_why                      TEXT,
    financial_strategy                 TEXT,

    entry_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE session_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_visions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meditations ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- books policies
CREATE POLICY "Authenticated user can read user pointsUsers can read their own book session" ON session_enrollments FOR SELECT to authenticated USING (true);
CREATE POLICY "Users can read their own enrollment or enrollments for sessions they are in" 
ON session_enrollments
FOR SELECT
USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 
        FROM session_enrollments AS se
        WHERE se.user_id = auth.uid()
          AND se.session_id = session_enrollments.session_id
    )
);


CREATE POLICY "Authenticated user can read visions" ON user_visions FOR SELECT to authenticated USING (true);
CREATE POLICY "Authenticated user can read meditaions" ON meditations FOR SELECT to authenticated USING (true);
CREATE POLICY "Authenticated user can read journey" ON journey FOR SELECT to authenticated USING (true);
    
-- Journal entries policies
CREATE POLICY "Users can CRUD own journals" ON journals
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own journal entries" ON journal_entries
    FOR ALL USING (
        EXISTS (
            SELECT 1
              FROM journals
             WHERE journals.id = journal_entries.journal_id
               AND journals.user_id = auth.uid()
        )
    );

-- actions policies
CREATE POLICY "Users can CRUD own action responses" ON action_logs
    FOR ALL USING (auth.uid() = user_id);



-- Create indexes
CREATE INDEX idx_user_session_enrollments ON session_enrollments(user_id, session_id);
CREATE INDEX idx_user_visions ON user_visions(user_id, session_id);
CREATE INDEX idx_journals_user_date ON journals(user_id, session_id, entry_date);
CREATE INDEX idx_journal_entries ON journal_entries(journal_id);
CREATE INDEX idx_action_logs_user ON action_logs(user_id,action_id,entry_date,session_id);