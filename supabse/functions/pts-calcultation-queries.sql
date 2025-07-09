SELECT
  u.id                    AS user_id,
  u.first_name,
  u.email,

  /* Journal counts */
  COALESCE(j.morning_count, 0)          AS morning_count,
  COALESCE(j.evening_count, 0)          AS evening_count,
  COALESCE(j.reflection_count, 0)       AS weekly_reflection_count,

  /* Action‐log counts */
  COALESCE(a.gratitude_count, 0)        AS gratitude_count,
  COALESCE(a.challenge_count, 0)        AS weekly_challenge_count,

  /* Total points */
  ( COALESCE(j.morning_count, 0)    *  5
  + COALESCE(j.evening_count, 0)    *  5
  + COALESCE(j.reflection_count, 0) * 10
  + COALESCE(a.gratitude_count, 0)  * 10
  + COALESCE(a.challenge_count, 0)  * 70
  ) AS total_points

FROM users u

/* Aggregate journals by user */
LEFT JOIN (
  SELECT
    user_id,
    SUM(CASE WHEN journal_type = 'morning'           THEN 1 ELSE 0 END) AS morning_count,
    SUM(CASE WHEN journal_type = 'evening'           THEN 1 ELSE 0 END) AS evening_count,
    SUM(CASE WHEN journal_type = 'weekly' THEN 1 ELSE 0 END) AS reflection_count
  FROM journals
  GROUP BY user_id
) j ON u.id = j.user_id

/* Aggregate action_logs by user */
LEFT JOIN (
  SELECT
    user_id,
    SUM(CASE WHEN action_type = 'gratitude'        THEN 1 ELSE 0 END) AS gratitude_count,
    SUM(CASE WHEN action_type = 'weekly-challenge' THEN 1 ELSE 0 END) AS challenge_count
  FROM action_logs
  GROUP BY user_id
) a ON u.id = a.user_id

WHERE u.id IN (
    'c4f75b5f-f0d1-440a-9b22-ac62661c47f1',
    'c5e6f0aa-f5d5-49ff-878e-1f9b927ea100',
    '22758408-de27-4e26-a234-55fafded8169',
    '8d998781-6ab4-4c1a-9c71-02dd19f254d5'
)
ORDER BY total_points desc;


SELECT
  u.id                    AS user_id,
  u.first_name,
  u.email,

  /* Journal counts */
  COALESCE(j.morning_count, 0)          AS morning_count,
  COALESCE(j.evening_count, 0)          AS evening_count,
  COALESCE(j.reflection_count, 0)       AS weekly_reflection_count,

  /* Action‐log counts */
  COALESCE(a.gratitude_count, 0)        AS gratitude_count,
  COALESCE(a.challenge_count, 0)        AS weekly_challenge_count,

  /* Total points */
  ( COALESCE(j.morning_count, 0)    *  5
  + COALESCE(j.evening_count, 0)    *  5
  + COALESCE(j.reflection_count, 0) * 10
  + COALESCE(a.gratitude_count, 0)  * 10
  + COALESCE(a.challenge_count, 0)  * 70
  ) AS total_points

FROM users u

/* Aggregate journals by user */
LEFT JOIN (
  SELECT
    user_id,
    SUM(CASE WHEN journal_type = 'morning'           THEN 1 ELSE 0 END) AS morning_count,
    SUM(CASE WHEN journal_type = 'evening'           THEN 1 ELSE 0 END) AS evening_count,
    SUM(CASE WHEN journal_type = 'weekly' THEN 1 ELSE 0 END) AS reflection_count
  FROM journals
  GROUP BY user_id
) j ON u.id = j.user_id

/* Aggregate action_logs by user */
LEFT JOIN (
  SELECT
    user_id,
    SUM(CASE WHEN action_type = 'gratitude'        THEN 1 ELSE 0 END) AS gratitude_count,
    SUM(CASE WHEN action_type = 'weekly-challenge' THEN 1 ELSE 0 END) AS challenge_count
  FROM action_logs
  GROUP BY user_id
) a ON u.id = a.user_id

WHERE u.id IN (
    'c4f75b5f-f0d1-440a-9b22-ac62661c47f1',
    'c5e6f0aa-f5d5-49ff-878e-1f9b927ea100',
    '22758408-de27-4e26-a234-55fafded8169',
    '8d998781-6ab4-4c1a-9c71-02dd19f254d5'
)
ORDER BY total_points desc;
