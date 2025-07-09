
-- Insert a test daily quote
INSERT INTO daily_quotes (quote, author, active_date)
VALUES (
    'The only way to do great work is to love what you do.',
    'Steve Jobs',
    CURRENT_DATE
) ON CONFLICT (active_date) DO NOTHING;

-- Insert a test daily action
INSERT INTO daily_actions (action_text, tip_text, active_date)
VALUES (
    'Write a thank you note to someone who helped you recently',
    'Be specific about how their actions impacted you positively',
    CURRENT_DATE
) ON CONFLICT (active_date) DO NOTHING;

-- Update user metadata
UPDATE auth.users 
SET raw_user_meta_data = jsonb_build_object(
    'first_name', 'Ben',
    'last_name', 'Shapiro',
    'onboarded', true,
    'total_points', 0,
    'streak_count', 0
)
WHERE id = '1e50ba7b-6ed4-4812-96a3-a48a2f320e4e';

-- Create a journal entry for today
INSERT INTO journal_entries (
    user_id,
    date,
    morning_completed,
    morning_mood_score,
    morning_mood_factors,
    morning_reflection,
    morning_points,
    evening_completed,
    evening_mood_score,
    evening_mood_factors,
    evening_reflection,
    evening_points,
    gratitude_action_completed,
    gratitude_action_points
)
VALUES (
    '1e50ba7b-6ed4-4812-96a3-a48a2f320e4e',
    CURRENT_DATE,
    true,
    8,
    ARRAY['Good sleep', 'Excited about project'],
    'Feeling energized and ready to tackle the day!',
    5,
    false,
    null,
    null,
    null,
    0,
    false,
    0
) ON CONFLICT (user_id, date) DO UPDATE SET
    morning_completed = EXCLUDED.morning_completed,
    morning_mood_score = EXCLUDED.morning_mood_score,
    morning_mood_factors = EXCLUDED.morning_mood_factors,
    morning_reflection = EXCLUDED.morning_reflection,
    morning_points = EXCLUDED.morning_points;

-- Insert affirmations
WITH journal_id AS (
    SELECT id FROM journal_entries 
    WHERE user_id = '1e50ba7b-6ed4-4812-96a3-a48a2f320e4e'
    AND date = CURRENT_DATE
)
INSERT INTO affirmations (journal_entry_id, affirmation)
VALUES 
    ((SELECT id FROM journal_id), 'I am capable of achieving great things today'),
    ((SELECT id FROM journal_id), 'I choose to be positive and productive'),
    ((SELECT id FROM journal_id), 'I am grateful for this new day'),
    ((SELECT id FROM journal_id), 'I trust in my abilities'),
    ((SELECT id FROM journal_id), 'I embrace all possibilities');

-- Insert gratitude and excitement items
WITH journal_id AS (
    SELECT id FROM journal_entries 
    WHERE user_id = '1e50ba7b-6ed4-4812-96a3-a48a2f320e4e'
    AND date = CURRENT_DATE
)
INSERT INTO gratitude_excitement (journal_entry_id, type, content)
VALUES 
    ((SELECT id FROM journal_id), 'gratitude', 'Grateful for my supportive family'),
    ((SELECT id FROM journal_id), 'gratitude', 'Thankful for good health'),
    ((SELECT id FROM journal_id), 'gratitude', 'Appreciative of this beautiful day'),
    ((SELECT id FROM journal_id), 'excitement', 'Looking forward to completing my project'),
    ((SELECT id FROM journal_id), 'excitement', 'Excited about weekend plans'),
    ((SELECT id FROM journal_id), 'excitement', 'Can''t wait to learn something new');

-- Insert gratitude action response
WITH journal_id AS (
    SELECT id FROM journal_entries 
    WHERE user_id = '1e50ba7b-6ed4-4812-96a3-a48a2f320e4e'
    AND date = CURRENT_DATE
)
INSERT INTO gratitude_action_responses (
    journal_entry_id,
    action_completed,
    morning_reflection,
    evening_reflection,
    obstacles
)
VALUES (
    (SELECT id FROM journal_id),
    false,
    'I will write a heartfelt note to my mentor today',
    null,
    null
);

-- Insert free flow entry
WITH journal_id AS (
    SELECT id FROM journal_entries 
    WHERE user_id = '1e50ba7b-6ed4-4812-96a3-a48a2f320e4e'
    AND date = CURRENT_DATE
)
INSERT INTO free_flow (journal_entry_id, content)
VALUES (
    (SELECT id FROM journal_id),
    'Today I feel particularly inspired to tackle new challenges. There are so many possibilities ahead, and I''m ready to embrace them all.'
);

-- Insert dream magic entries
WITH journal_id AS (
    SELECT id FROM journal_entries 
    WHERE user_id = '1e50ba7b-6ed4-4812-96a3-a48a2f320e4e'
    AND date = CURRENT_DATE
)
INSERT INTO dream_magic (journal_entry_id, statement_text, statement_order, action_steps)
VALUES 
    ((SELECT id FROM journal_id), 'I will complete my major project milestone', 1, 'Break down the next feature into small tasks'),
    ((SELECT id FROM journal_id), 'I will maintain a healthy work-life balance', 2, 'Set clear boundaries for work hours'),
    ((SELECT id FROM journal_id), 'I will learn a new programming concept', 3, 'Spend 30 minutes on tutorials'),
    ((SELECT id FROM journal_id), 'I will help someone else grow', 4, 'Share knowledge in team meetings'),
    ((SELECT id FROM journal_id), 'I will practice mindfulness', 5, 'Take meditation breaks'); 