DROP FUNCTION get_journal_history;

CREATE OR REPLACE FUNCTION get_journal_history(
  p_user_id UUID,
  p_session_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS JSONB AS $$
  SELECT jsonb_agg(to_jsonb(x))
  FROM (
    SELECT * FROM (
      -- Fetch entries from journals
      SELECT 
        id,
        session_id,
        user_id,
        entry_date,
        journal_type::TEXT
      FROM journals
      WHERE entry_date BETWEEN p_start_date AND p_end_date
        AND user_id = p_user_id
        AND session_id = p_session_id
      
      UNION ALL
      
      -- Fetch entries from action_logs
      SELECT 
        id,
        session_id,
        user_id,
        entry_date,
        action_type::TEXT
      FROM action_logs
      WHERE entry_date BETWEEN p_start_date AND p_end_date
        AND user_id = p_user_id
        AND session_id = p_session_id
    ) combined
    ORDER BY entry_date
  ) x;
$$ LANGUAGE sql STABLE;
