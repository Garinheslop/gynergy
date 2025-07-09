-- Daily quotes table
CREATE TABLE quotes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,

    day INTEGER NOT NULL,
    content TEXT NOT NULL,
    author TEXT,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;


-- Public content policies
CREATE POLICY "Anyone can read quotes" ON quotes FOR SELECT to authenticated USING (true);
CREATE POLICY "Authenticated user can update quotes" ON quotes FOR UPDATE to authenticated USING (true) WITH CHECK (true);


CREATE INDEX idx_book_quote ON quotes(day, book_id);
