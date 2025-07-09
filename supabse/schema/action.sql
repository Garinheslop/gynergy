-- Create the ENUM type for action_type
CREATE TYPE actionType AS ENUM ('daily', 'weekly');

-- Create the actions table
CREATE TABLE actions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,

    period INTEGER NOT NULL,
    title TEXT NOT NULL,
    tip TEXT,
    hyperlink TEXT,

    is_self BOOLEAN DEFAULT FALSE,
    is_draw BOOLEAN DEFAULT FALSE,
    is_list BOOLEAN DEFAULT FALSE,
    
    action_type actionType NOT NULL,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);



-- Enable Row Level Security
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Authenticated user can read actions" ON actions FOR SELECT to authenticated USING (true);


CREATE INDEX idx_book_actions ON actions(period, book_id);
