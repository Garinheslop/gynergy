-- enums
create type journalType as enum (
  'morning',
  'evening',
);


-- Drop existing tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS "morning_affirmations" CASCADE;
DROP TABLE IF EXISTS "affirmations" CASCADE;
DROP TABLE IF EXISTS "gratitude_excitement" CASCADE;
DROP TABLE IF EXISTS "gratitude_action_responses" CASCADE;
DROP TABLE IF EXISTS "free_flow" CASCADE;
DROP TABLE IF EXISTS "dream_magic" CASCADE;
DROP TABLE IF EXISTS "journal_entries" CASCADE;
DROP TABLE IF EXISTS "daily_quotes" CASCADE;
DROP TABLE IF EXISTS "daily_actions" CASCADE;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- Create tables first, then we'll add RLS



-- profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  is_anonymous BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Daily quotes table
CREATE TABLE IF NOT EXISTS "daily_quotes" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    quote TEXT NOT NULL,
    author TEXT,
    last_shown DATE
);

-- Daily gratitude actions table
CREATE TABLE IF NOT EXISTS "daily_actions" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    action_text TEXT NOT NULL,
    tip_text TEXT,
    active_date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE
);

-- Main journal entries table
CREATE TABLE IF NOT EXISTS "journal_entries" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Morning section
    is_completed BOOLEAN DEFAULT FALSE,
    mood_score INTEGER,
    mood_factors TEXT[],
    reflection TEXT,
    tomorrow_plan TEXT,
    -- Gratitude action
    gratitude_action_completed BOOLEAN DEFAULT FALSE,
    gratitude_action_points INTEGER DEFAULT 0,
    
    -- Points tracking
    total_points INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, date)
);

-- Affirmations table
CREATE TABLE IF NOT EXISTS "affirmations" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    affirmation TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Gratitude and excitement items
CREATE TABLE IF NOT EXISTS "gratitude_excitement" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('gratitude', 'excitement')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Gratitude action responses
CREATE TABLE IF NOT EXISTS "gratitude_action_responses" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    action_completed BOOLEAN DEFAULT FALSE,
    morning_reflection TEXT,  -- Reflection & commitment
    evening_reflection TEXT,  -- How did it make you feel
    obstacles TEXT,  -- What obstacles did you encounter
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Free flow section
CREATE TABLE IF NOT EXISTS "free_flow" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Dream magic visualization
CREATE TABLE IF NOT EXISTS "dream_magic" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    statement_text TEXT NOT NULL,
    statement_order INTEGER CHECK (statement_order BETWEEN 1 AND 5),
    action_steps TEXT,  -- Small actions for tomorrow
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "user_points" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES UNIQUE auth.users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE affirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gratitude_excitement ENABLE ROW LEVEL SECURITY;
ALTER TABLE gratitude_action_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_magic ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Profile entries policies
CREATE POLICY "Users can CRUD own profile" ON profiles
    FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can only read all profiles" ON profiles
    FOR SELECT to authenticated USING (true);

-- Journal entries policies
CREATE POLICY "Users can CRUD own journal entries" ON journal_entries
    FOR ALL USING (auth.uid() = user_id);

-- User Points entries policies
CREATE POLICY "Users can CRUD own points" ON user_points
    FOR ALL USING (auth.uid() = user_id);

-- Affirmations policies
CREATE POLICY "Users can CRUD own affirmations" ON affirmations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM journal_entries
            WHERE id = journal_entry_id
            AND user_id = auth.uid()
        )
    );

-- Gratitude/excitement policies
CREATE POLICY "Users can CRUD own gratitude items" ON gratitude_excitement
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM journal_entries
            WHERE id = journal_entry_id
            AND user_id = auth.uid()
        )
    );

-- Gratitude actions policies
CREATE POLICY "Users can CRUD own action responses" ON gratitude_action_responses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM journal_entries
            WHERE id = journal_entry_id
            AND user_id = auth.uid()
        )
    );

-- Free flow policies
CREATE POLICY "Users can CRUD own free flow" ON free_flow
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM journal_entries
            WHERE id = journal_entry_id
            AND user_id = auth.uid()
        )
    );

-- Dream magic policies
CREATE POLICY "Users can CRUD own dream magic" ON dream_magic
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM journal_entries
            WHERE id = journal_entry_id
            AND user_id = auth.uid()
        )
    );

-- Public content policies
CREATE POLICY "Anyone can read quotes" ON daily_quotes FOR SELECT USING (true);
CREATE POLICY "Authenticated user can update quotes" ON daily_quotes FOR UPDATE to authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated user can read user points" ON user_points FOR SELECT to authenticated USING (true);
CREATE POLICY "Anyone can read actions" ON daily_actions FOR SELECT USING (true);

-- Create indexes
CREATE INDEX idx_journal_entries_user_date ON journal_entries(user_id, date);
CREATE INDEX idx_journal_entries_user_id ON journal_entries (user_id);
CREATE INDEX idx_affirmations_journal ON affirmations(journal_entry_id);
CREATE INDEX idx_gratitude_excitement_entry ON gratitude_excitement(journal_entry_id);
CREATE INDEX idx_gratitude_responses_entry ON gratitude_action_responses(journal_entry_id);
CREATE INDEX idx_free_flow_entry ON free_flow(journal_entry_id);
CREATE INDEX idx_dream_magic_entry ON dream_magic(journal_entry_id);

-- Function to check if morning section is complete
CREATE OR REPLACE FUNCTION is_morning_complete(journal_entry_id UUID) 
RETURNS BOOLEAN AS $$
DECLARE
    morning_affirmation_count INTEGER;
    gratitude_count INTEGER;
    excitement_count INTEGER;
BEGIN
    -- Check main morning fields
    IF NOT EXISTS (
        SELECT 1 FROM journal_entries 
        WHERE id = journal_entry_id 
        AND morning_mood_score IS NOT NULL
        AND morning_mood_factors IS NOT NULL
        AND morning_reflection IS NOT NULL
    ) THEN
        RETURN FALSE;
    END IF;

    -- Check affirmations (need all 5)
    SELECT COUNT(*) INTO morning_affirmation_count
    FROM affirmations
    WHERE journal_entry_id = journal_entry_id;
    
    -- Check gratitude items (need all 3)
    SELECT COUNT(*) INTO gratitude_count
    FROM gratitude_excitement
    WHERE journal_entry_id = journal_entry_id AND type = 'gratitude';
    
    -- Check excitement items (need all 3)
    SELECT COUNT(*) INTO excitement_count
    FROM gratitude_excitement
    WHERE journal_entry_id = journal_entry_id AND type = 'excitement';
    
    RETURN morning_affirmation_count >= 5 
        AND gratitude_count >= 3 
        AND excitement_count >= 3;
END;
$$ LANGUAGE plpgsql;

-- Function to check if evening section is complete
CREATE OR REPLACE FUNCTION is_evening_complete(journal_entry_id UUID) 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM journal_entries 
        WHERE id = journal_entry_id 
        AND evening_mood_score IS NOT NULL
        AND evening_mood_factors IS NOT NULL
        AND evening_reflection IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql;

-- Function to update points
CREATE OR REPLACE FUNCTION update_journal_points(entry_id UUID)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    morning_complete BOOLEAN;
    evening_complete BOOLEAN;
    action_complete BOOLEAN;
    user_id UUID;
BEGIN
    -- Get user_id for this entry
    SELECT journal_entries.user_id INTO user_id
    FROM journal_entries
    WHERE journal_entries.id = entry_id;

    -- Only proceed if the user owns this entry
    IF user_id = auth.uid() THEN
        morning_complete := is_morning_complete(entry_id);
        evening_complete := is_evening_complete(entry_id);
        
        SELECT action_completed INTO action_complete
        FROM gratitude_action_responses
        WHERE journal_entry_id = entry_id;

        -- Update points
        UPDATE journal_entries
        SET 
            morning_points = CASE WHEN morning_complete THEN 5 ELSE 0 END,
            evening_points = CASE WHEN evening_complete THEN 5 ELSE 0 END,
            gratitude_action_points = CASE WHEN action_complete THEN 10 ELSE 0 END
        WHERE id = entry_id;

        -- Update user's total points
        UPDATE auth.users 
        SET raw_user_meta_data = jsonb_set(
            COALESCE(raw_user_meta_data, '{}'::jsonb),
            '{total_points}',
            (
                SELECT to_jsonb(COALESCE(SUM(total_points), 0))
                FROM journal_entries
                WHERE user_id = auth.uid()
            )
        )
        WHERE id = auth.uid();
    END IF;
END;
$$;

-- Function to update user streak
CREATE OR REPLACE FUNCTION update_user_streak(user_id UUID)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    last_entry_date DATE;
    current_streak INTEGER;
    latest_entry_date DATE;
BEGIN
    -- Only proceed if this is the user's own streak
    IF user_id = auth.uid() THEN
        -- Get the user's latest entry date
        SELECT date INTO latest_entry_date
        FROM journal_entries
        WHERE user_id = auth.uid()
        ORDER BY date DESC
        LIMIT 1;

        -- Get the previous entry date
        SELECT date INTO last_entry_date
        FROM journal_entries
        WHERE user_id = auth.uid()
        AND date < latest_entry_date
        ORDER BY date DESC
        LIMIT 1;

        -- Get current streak
        SELECT streak_count INTO current_streak
        FROM auth.users
        WHERE id = auth.uid();

        -- Update streak based on entry dates
        IF last_entry_date IS NULL OR latest_entry_date = last_entry_date + INTERVAL '1 day' THEN
            -- First entry or consecutive day
            UPDATE auth.users 
            SET streak_count = COALESCE(current_streak, 0) + 1
            WHERE id = auth.uid();
        ELSIF latest_entry_date > last_entry_date + INTERVAL '1 day' THEN
            -- Streak broken
            UPDATE auth.users 
            SET streak_count = 1
            WHERE id = auth.uid();
        END IF;
    END IF;
END;
$$;

-- Create functions that can be called from the client
CREATE OR REPLACE FUNCTION complete_morning_entry(entry_id UUID)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    -- Update points
    PERFORM update_journal_points(entry_id);
    -- Update streak
    PERFORM update_user_streak(auth.uid());
END;
$$;

-- Function to complete evening entry and update points
CREATE OR REPLACE FUNCTION complete_evening_entry(
  entry_id UUID,
  tomorrow_plan TEXT
)
RETURNS VOID AS $$
DECLARE
  current_points INTEGER;
  current_streak INTEGER;
BEGIN
  -- Verify the entry exists and evening section is complete
  IF NOT is_evening_complete(entry_id) THEN
    RAISE EXCEPTION 'Evening section is not complete';
  END IF;

  -- Update tomorrow's plan
  UPDATE journal_entries
  SET tomorrow_plan = $2,
      evening_points = 5
  WHERE id = entry_id;

  -- Get current points and streak
  SELECT total_points, streak_count
  INTO current_points, current_streak
  FROM journal_entries
  WHERE id = entry_id;

  -- Update total points
  UPDATE journal_entries
  SET total_points = current_points + 5
  WHERE id = entry_id;

  -- Update user metadata with new points
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{total_points}',
    to_jsonb(current_points + 5)
  )
  WHERE id = (
    SELECT user_id 
    FROM journal_entries 
    WHERE id = entry_id
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION complete_gratitude_action(entry_id UUID)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    -- Update points
    PERFORM update_journal_points(entry_id);
END;
$$;

-- Create function to update points
CREATE OR REPLACE FUNCTION update_journal_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total points for the entry
    NEW.total_points := COALESCE(NEW.morning_points, 0) + 
                       COALESCE(NEW.evening_points, 0) + 
                       COALESCE(NEW.gratitude_action_points, 0);
    
    -- Update user's metadata in auth.users
    UPDATE auth.users 
    SET raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{total_points}',
        (
            SELECT to_jsonb(COALESCE(SUM(total_points), 0))
            FROM journal_entries 
            WHERE user_id = NEW.user_id
        )
    )
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for points update
DROP TRIGGER IF EXISTS update_points_trigger ON journal_entries;
CREATE TRIGGER update_points_trigger
    BEFORE INSERT OR UPDATE ON journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_journal_points(); 