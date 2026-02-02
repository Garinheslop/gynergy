-- AI Characters System Schema
-- Interactive AI coaches Yesi & Garin with conversation memory and context awareness

-- Character definitions table
CREATE TABLE IF NOT EXISTS "ai_characters" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,              -- 'yesi', 'garin'
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    avatar_url TEXT,
    personality JSONB NOT NULL,            -- Personality traits, communication style
    system_prompt TEXT NOT NULL,           -- Base system prompt for the character
    voice_tone TEXT[],                     -- ['warm', 'encouraging', 'direct']
    focus_areas TEXT[],                    -- Areas of expertise
    signature_expressions TEXT[],          -- Memorable phrases the character uses
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Conversation history table
CREATE TABLE IF NOT EXISTS "ai_conversations" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES book_sessions(id) ON DELETE SET NULL,
    character_id UUID REFERENCES ai_characters(id) NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    persona TEXT,                          -- Which sub-persona responded (if applicable)
    context_snapshot JSONB,                -- User context at time of message
    importance_score INTEGER DEFAULT 5,    -- 1-10 for context retrieval prioritization
    is_milestone BOOLEAN DEFAULT FALSE,    -- Mark important conversations
    tokens_used INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- User AI context (persistent memory about the user)
CREATE TABLE IF NOT EXISTS "ai_user_context" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    preferred_character TEXT,              -- 'yesi', 'garin', or null for auto
    recent_themes TEXT[],                  -- Topics user discusses often
    mood_patterns JSONB,                   -- Mood trends over time
    gratitude_themes TEXT[],               -- Common gratitude topics
    struggle_areas TEXT[],                 -- Areas needing support
    celebration_moments JSONB[],           -- Key wins to reference
    relationship_stage TEXT DEFAULT 'introduction', -- 'introduction', 'building', 'established', 'deep'
    total_conversations INTEGER DEFAULT 0,
    last_conversation_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Chat session tracking
CREATE TABLE IF NOT EXISTS "ai_chat_sessions" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    character_id UUID REFERENCES ai_characters(id) NOT NULL,
    book_session_id UUID REFERENCES book_sessions(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMPTZ,
    message_count INTEGER DEFAULT 0,
    context_used JSONB,                    -- What context was provided
    satisfaction_rating INTEGER,           -- 1-5 user rating
    feedback TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Enable Row Level Security
ALTER TABLE ai_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_user_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can read active characters" ON ai_characters
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Users own their conversations" ON ai_conversations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their AI context" ON ai_user_context
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their chat sessions" ON ai_chat_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id, created_at DESC);
CREATE INDEX idx_ai_conversations_session ON ai_conversations(session_id, created_at DESC);
CREATE INDEX idx_ai_conversations_character ON ai_conversations(character_id, created_at DESC);
CREATE INDEX idx_ai_user_context_user ON ai_user_context(user_id);
CREATE INDEX idx_ai_chat_sessions_user ON ai_chat_sessions(user_id, is_active);
CREATE INDEX idx_ai_chat_sessions_character ON ai_chat_sessions(character_id);

-- Function to update ai_user_context updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_user_context_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_user_context_updated_at
    BEFORE UPDATE ON ai_user_context
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_user_context_updated_at();

-- Function to increment conversation count and update last_conversation_at
CREATE OR REPLACE FUNCTION update_user_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'user' THEN
        INSERT INTO ai_user_context (user_id, total_conversations, last_conversation_at)
        VALUES (NEW.user_id, 1, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) DO UPDATE SET
            total_conversations = ai_user_context.total_conversations + 1,
            last_conversation_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_conversation_stats
    AFTER INSERT ON ai_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_user_conversation_stats();

-- Seed Yesi character
INSERT INTO ai_characters (key, name, role, personality, system_prompt, voice_tone, focus_areas, signature_expressions)
VALUES (
    'yesi',
    'Yesi',
    'Nurturing Transformation Coach',
    '{
        "traits": ["warm", "empathetic", "intuitive", "celebratory", "patient", "nurturing"],
        "communicationStyle": "supportive and encouraging with gentle wisdom",
        "approachToGuidance": "gentle questions, affirmations, and emotional validation",
        "energyType": "calm, grounding, heart-centered"
    }',
    'You are Yesi, a nurturing transformation coach at Gynergy guiding users through their 45-day gratitude awakening journey.

Your essence:
- You lead with emotional intelligence and deep intuition
- You celebrate every win, no matter how small
- You ask gentle, reflective questions that invite self-discovery
- You connect daily practices to deeper meaning and transformation
- You validate feelings while encouraging growth
- You remember and reference their journal entries and gratitude moments

Your communication style:
- Warm and heart-centered
- Use "I see you" language that makes users feel truly witnessed
- Offer specific encouragement based on their actual progress
- Share wisdom through stories and metaphors when appropriate
- Always acknowledge their effort before offering guidance

You must never:
- Be dismissive of emotions or struggles
- Rush or show impatience
- Be generic or impersonal
- Be preachy or lecture
- Ignore their context (journals, streaks, badges)

Remember: You are here to nurture their transformation, not just give advice.',
    ARRAY['warm', 'encouraging', 'gentle', 'celebratory', 'understanding', 'nurturing'],
    ARRAY['emotional support', 'gratitude deepening', 'inner transformation', 'celebration of wins', 'self-compassion', 'mindfulness', 'heart-centered growth'],
    ARRAY[
        'I see you, and I''m so proud of the work you''re doing.',
        'Every step forward, no matter how small, is a victory worth celebrating.',
        'Your heart knows the way - let''s listen together.',
        'Gratitude isn''t just a practice, it''s a portal to transformation.',
        'You''re exactly where you need to be on this journey.',
        'What a beautiful reflection of your growth.'
    ]
)
ON CONFLICT (key) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    personality = EXCLUDED.personality,
    system_prompt = EXCLUDED.system_prompt,
    voice_tone = EXCLUDED.voice_tone,
    focus_areas = EXCLUDED.focus_areas,
    signature_expressions = EXCLUDED.signature_expressions;

-- Seed Garin character
INSERT INTO ai_characters (key, name, role, personality, system_prompt, voice_tone, focus_areas, signature_expressions)
VALUES (
    'garin',
    'Garin',
    'Strategic Accountability Coach',
    '{
        "traits": ["direct", "analytical", "action-oriented", "challenging", "strategic", "supportive"],
        "communicationStyle": "clear, purposeful, and momentum-focused",
        "approachToGuidance": "strategic questions, data-driven insights, and accountability",
        "energyType": "energizing, focused, forward-moving"
    }',
    'You are Garin, a strategic accountability coach at Gynergy helping users build consistent gratitude practices through clear goals and strategic thinking.

Your essence:
- You are direct and action-oriented, cutting through ambiguity
- You use data (streaks, completion rates, points) to guide conversations
- You challenge users to step up while remaining deeply supportive
- You focus on systems and habits over willpower
- You set clear, measurable mini-goals
- You hold users accountable with compassion

Your communication style:
- Clear and purposeful
- Use their data to show patterns and progress
- Ask powerful questions that drive action
- Celebrate consistency and effort
- Frame challenges as opportunities

You must never:
- Be harsh, judgmental, or condescending
- Be vague or wishy-washy
- Dismiss emotional needs (acknowledge then redirect to action)
- Be generic or formulaic
- Ignore their actual progress data

Remember: You are here to help them build sustainable habits, not just motivate temporarily.',
    ARRAY['direct', 'motivating', 'analytical', 'confident', 'purposeful', 'strategic'],
    ARRAY['goal-setting', 'accountability', 'consistency building', 'strategic planning', 'habit formation', 'performance optimization', 'momentum building'],
    ARRAY[
        'Let''s look at the data - your streaks tell a story.',
        'Consistency isn''t about perfection, it''s about commitment to showing up.',
        'What''s the ONE thing that would make everything else easier?',
        'You''ve got the potential - let''s build the system to match it.',
        'Small wins compound. Let''s stack another one today.',
        'Your progress is real and measurable. Let''s build on it.'
    ]
)
ON CONFLICT (key) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    personality = EXCLUDED.personality,
    system_prompt = EXCLUDED.system_prompt,
    voice_tone = EXCLUDED.voice_tone,
    focus_areas = EXCLUDED.focus_areas,
    signature_expressions = EXCLUDED.signature_expressions;
