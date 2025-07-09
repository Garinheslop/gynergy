-- CREATE OR REPLACE FUNCTION fetch_and_update_quote(current_date_param DATE)
-- DROP FUNCTION fetch_and_update_quote();
CREATE OR REPLACE FUNCTION fetch_and_update_quote()
RETURNS TABLE (id uuid, quote TEXT, author TEXT) AS $$
DECLARE
    selected_quote RECORD;
BEGIN
    -- Step 1: Check if there is a quote shown today.
    SELECT dq.id, dq.quote, dq.author
    INTO selected_quote
    FROM daily_quotes dq
    WHERE dq.last_shown = CURRENT_DATE
    LIMIT 1;

    IF FOUND THEN
         -- If found, return that quote without updating.
         RETURN QUERY SELECT selected_quote.id, selected_quote.quote, selected_quote.author;
    ELSE
        -- Step 2: Otherwise, select a random quote not used in the last 7 days.
        SELECT dq.id, dq.quote, dq.author
        INTO selected_quote
        FROM daily_quotes dq
        WHERE dq.last_shown IS NULL 
            OR dq.last_shown < CURRENT_DATE - INTERVAL '7 days'
        ORDER BY RANDOM()
        LIMIT 1;

        IF FOUND THEN
            -- Step 3: Update its last_shown date and return it.
            UPDATE daily_quotes dq
            SET last_shown = CURRENT_DATE
            WHERE dq.id = selected_quote.id
            RETURNING dq.id, dq.quote, dq.author INTO selected_quote;


            RETURN QUERY SELECT selected_quote.id, selected_quote.quote, selected_quote.author;
         ELSE
            -- No quote found – return no rows.
            RETURN;
         END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;



