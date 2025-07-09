CREATE OR REPLACE FUNCTION fetch_leaderboard_data(
  p_session_id UUID,
  p_filter TEXT,  -- 'weekly', 'monthly', or 'session'
  p_start_date TIMESTAMPTZ,  -- used only when no filter is provided
  p_end_date TIMESTAMPTZ,    -- used only when no filter is provided
  p_daily_action_points INTEGER,
  p_daily_journal_points INTEGER,
  p_weekly_journal_points INTEGER,
  p_weekly_action_points INTEGER,
  p_limit INTEGER,
  p_offset INTEGER
)
RETURNS TABLE(
  user_id UUID,
  total_points INTEGER,
  user_data jsonb,
  enrollment_date TIMESTAMPTZ
) AS $$
BEGIN
  IF p_filter = 'session' THEN
    RETURN QUERY
      SELECT 
        se.user_id,
        (
          ((COALESCE(se.morning_completion, 0) + COALESCE(se.evening_completion, 0)) * p_daily_journal_points) +
          (COALESCE(se.gratitude_completion, 0) * p_daily_action_points) +
          (COALESCE(se.weekly_reflection_completion, 0) * p_weekly_journal_points) +
          (COALESCE(se.weekly_challenge_completion, 0) * p_weekly_action_points)
        ) AS total_points,
        (to_jsonb(u) - 'is_anonymous') - 'supabase_id' AS user_data,
        se.enrollment_date
      FROM session_enrollments AS se
      JOIN users AS u ON se.user_id = u.id
      WHERE se.session_id = p_session_id
        AND se.enrollment_date BETWEEN p_start_date AND p_end_date
      ORDER BY total_points DESC
      LIMIT p_limit OFFSET p_offset;
  ELSE
    RETURN QUERY
      WITH date_filter AS (
        SELECT 
          CASE 
            WHEN p_filter = 'weekly' THEN (CURRENT_DATE - interval '7 days')
            WHEN p_filter = 'monthly' THEN (CURRENT_DATE - interval '1 month')
            ELSE NULL
          END AS start_date
      ),
      journal_points AS (
        SELECT
          j.user_id,
          SUM(
            CASE 
              WHEN j.journal_type IN ('morning', 'evening') THEN p_daily_journal_points
              WHEN j.journal_type = 'weekly' THEN p_weekly_journal_points
              ELSE 0
            END
          ) AS points
        FROM journals j, date_filter
        WHERE j.session_id = p_session_id
          AND (date_filter.start_date IS NULL OR j.entry_date >= date_filter.start_date)
          AND j.is_completed = TRUE
        GROUP BY j.user_id
      ),
      action_points AS (
        SELECT
          a.user_id,
          SUM(
            CASE
              WHEN a.action_type = 'gratitude' THEN p_daily_action_points
              WHEN a.action_type = 'weekly-challenge' THEN p_weekly_action_points
              ELSE 0
            END
          ) AS points
        FROM action_logs a, date_filter
        WHERE a.session_id = p_session_id
          AND (date_filter.start_date IS NULL OR a.entry_date >= date_filter.start_date)
          AND a.is_completed = TRUE
        GROUP BY a.user_id
      ),
      combined AS (
        SELECT
          COALESCE(j.user_id, a.user_id) AS user_id,
          COALESCE(j.points, 0) + COALESCE(a.points, 0) AS total_points
        FROM journal_points j
        FULL OUTER JOIN action_points a ON j.user_id = a.user_id
      )
      SELECT
        u.id AS user_id,
        c.total_points::INTEGER AS total_points,
        (to_jsonb(u) - 'is_anonymous' - 'supabase_id') AS user_data,
        se.enrollment_date
      FROM combined c
      JOIN users u ON u.id = c.user_id
      JOIN session_enrollments se ON se.user_id = c.user_id AND se.session_id = p_session_id
      ORDER BY c.total_points DESC
      LIMIT p_limit OFFSET p_offset;
  END IF;
END;
$$ LANGUAGE plpgsql;




CREATE OR REPLACE FUNCTION get_user_position(
  p_session_id UUID,
  p_user_id UUID,
  p_filter TEXT,  -- 'weekly', 'monthly', or 'session'
  p_start_date TIMESTAMPTZ,  -- used only when no filter is provided
  p_end_date TIMESTAMPTZ,    -- used only when no filter is provided
  p_daily_action_points INTEGER,
  p_daily_journal_points INTEGER,
  p_weekly_journal_points INTEGER,
  p_weekly_action_points INTEGER
)
RETURNS TABLE(
  user_id UUID,
  total_points INTEGER,
  user_data jsonb,
  enrollment_date TIMESTAMPTZ,
  user_rank INTEGER
) AS $$
BEGIN
  IF p_filter = 'session' THEN
    RETURN QUERY
      WITH leaderboard AS (
        SELECT 
          se.user_id,
          (
            ((COALESCE(se.morning_completion, 0) + COALESCE(se.evening_completion, 0)) * p_daily_journal_points) +
            (COALESCE(se.gratitude_completion, 0) * p_daily_action_points) +
            (COALESCE(se.weekly_reflection_completion, 0) * p_weekly_journal_points) +
            (COALESCE(se.weekly_challenge_completion, 0) * p_weekly_action_points)
          )::integer AS total_points,
          (to_jsonb(u) - 'is_anonymous' - 'supabase_id') AS user_data,
          se.enrollment_date,
          row_number() OVER (
            ORDER BY (
              ((COALESCE(se.morning_completion, 0) + COALESCE(se.evening_completion, 0)) * p_daily_journal_points) +
              (COALESCE(se.gratitude_completion, 0) * p_daily_action_points) +
              (COALESCE(se.weekly_reflection_completion, 0) * p_weekly_journal_points) +
              (COALESCE(se.weekly_challenge_completion, 0) * p_weekly_action_points)
            )::integer DESC
          )::integer AS user_rank
        FROM session_enrollments se
        JOIN users u ON se.user_id = u.id
        WHERE se.session_id = p_session_id
          AND se.enrollment_date BETWEEN p_start_date AND p_end_date
      )
      SELECT *
      FROM leaderboard
      WHERE leaderboard.user_id = p_user_id;

  ELSE
    RETURN QUERY
      WITH date_filter AS (
        SELECT 
          CASE 
            WHEN p_filter = 'weekly' THEN (CURRENT_DATE - interval '7 days')
            WHEN p_filter = 'monthly' THEN (CURRENT_DATE - interval '1 month')
            ELSE NULL
          END AS start_date
      ),
      journal_points AS (
        SELECT
          j.user_id,
          SUM(
            CASE 
              WHEN j.journal_type IN ('morning', 'evening') THEN p_daily_journal_points
              WHEN j.journal_type = 'weekly' THEN p_weekly_journal_points
              ELSE 0
            END
          ) AS points
        FROM journals j, date_filter
        WHERE j.session_id = p_session_id
          AND (date_filter.start_date IS NULL OR j.entry_date >= date_filter.start_date)
          AND j.is_completed = TRUE
        GROUP BY j.user_id
      ),
      action_points AS (
        SELECT
          a.user_id,
          SUM(
            CASE
              WHEN a.action_type = 'gratitude' THEN p_daily_action_points
              WHEN a.action_type = 'weekly-challenge' THEN p_weekly_action_points
              ELSE 0
            END
          ) AS points
        FROM action_logs a, date_filter
        WHERE a.session_id = p_session_id
          AND (date_filter.start_date IS NULL OR a.entry_date >= date_filter.start_date)
          AND a.is_completed = TRUE
        GROUP BY a.user_id
      ),
      combined AS (
        SELECT
          COALESCE(j.user_id, a.user_id) AS user_id,
          (COALESCE(j.points, 0) + COALESCE(a.points, 0))::integer AS total_points
        FROM journal_points j
        FULL OUTER JOIN action_points a ON j.user_id = a.user_id
      ),
      leaderboard AS (
        SELECT
          u.id AS user_id,
          c.total_points,
          (to_jsonb(u) - 'is_anonymous' - 'supabase_id') AS user_data,
          se.enrollment_date,
          row_number() OVER (ORDER BY c.total_points DESC)::integer AS user_rank
        FROM combined c
        JOIN users u ON u.id = c.user_id
        JOIN session_enrollments se ON se.user_id = c.user_id AND se.session_id = p_session_id
      )
      SELECT *
      FROM leaderboard
      WHERE leaderboard.user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;