CREATE OR REPLACE FUNCTION check_user_streak(
    p_session_id UUID,
    p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update morning journal streak:
  IF NOT EXISTS (
    SELECT 1 
    FROM journals
    WHERE session_id = p_session_id
      AND user_id = p_user_id
      AND journal_type = 'morning'
      AND date_trunc('day', entry_date) = date_trunc('day', current_date - INTERVAL '1 day')
  ) THEN
    UPDATE session_enrollments
    SET morning_streak = CASE 
         WHEN EXISTS (
           SELECT 1 
           FROM journals
           WHERE session_id = p_session_id
             AND user_id = p_user_id
             AND journal_type = 'morning'
             AND date_trunc('day', entry_date) = date_trunc('day', current_date)
         ) THEN 1
         ELSE 0
       END
    WHERE session_id = p_session_id AND user_id = p_user_id;
  END IF;

  -- Update evening journal streak:
  IF NOT EXISTS (
    SELECT 1 
    FROM journals
    WHERE session_id = p_session_id
      AND user_id = p_user_id
      AND journal_type = 'evening'
      AND date_trunc('day', entry_date) = date_trunc('day', current_date - INTERVAL '1 day')
  ) THEN
    UPDATE session_enrollments
    SET evening_streak = CASE 
         WHEN EXISTS (
           SELECT 1 
           FROM journals
           WHERE session_id = p_session_id
             AND user_id = p_user_id
             AND journal_type = 'evening'
             AND date_trunc('day', entry_date) = date_trunc('day', current_date)
         ) THEN 1
         ELSE 0
       END
    WHERE session_id = p_session_id AND user_id = p_user_id;
  END IF;

  -- Update gratitude streak (using action_logs):
  IF NOT EXISTS (
    SELECT 1 
    FROM action_logs
    WHERE session_id = p_session_id
      AND user_id = p_user_id
      AND action_type = 'gratitude'
      AND date_trunc('day', entry_date) = date_trunc('day', current_date - INTERVAL '1 day')
  ) THEN
    UPDATE session_enrollments
    SET gratitude_streak = CASE 
         WHEN EXISTS (
           SELECT 1 
           FROM action_logs
           WHERE session_id = p_session_id
             AND user_id = p_user_id
             AND action_type = 'gratitude'
             AND date_trunc('day', entry_date) = date_trunc('day', current_date)
         ) THEN 1
         ELSE 0
       END
    WHERE session_id = p_session_id AND user_id = p_user_id;
  END IF;
END;
$$;
