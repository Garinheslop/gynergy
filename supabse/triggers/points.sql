CREATE OR REPLACE FUNCTION update_session_enrollments_stats()
RETURNS trigger AS $$
DECLARE
    last_date   date;
    current_week date;
    last_week   date;
BEGIN
    -- If the trigger is fired from the journals table
    IF TG_TABLE_NAME = 'journals' THEN
        IF NEW.journal_type = 'morning' THEN
            -- Get the last morning journal date for this user and session
            SELECT MAX(entry_date::date) 
              INTO last_date 
              FROM journals
             WHERE user_id = NEW.user_id
               AND session_id = NEW.session_id
               AND journal_type = 'morning'
               AND entry_date < NEW.entry_date;
               
            IF last_date IS NOT NULL AND NEW.entry_date::date = last_date + 1 THEN
                UPDATE session_enrollments
                SET morning_completion = morning_completion + 1,
                    morning_streak     = morning_streak + 1,
                    updated_at         = CURRENT_TIMESTAMP
                WHERE user_id = NEW.user_id AND session_id = NEW.session_id;
            ELSE
                UPDATE session_enrollments
                SET morning_completion = morning_completion + 1,
                    morning_streak     = 1,
                    updated_at         = CURRENT_TIMESTAMP
                WHERE user_id = NEW.user_id AND session_id = NEW.session_id;
            END IF;
            
        ELSIF NEW.journal_type = 'evening' THEN
            -- Get the last evening journal date for this user and session
            SELECT MAX(entry_date::date) 
              INTO last_date 
              FROM journals
             WHERE user_id = NEW.user_id
               AND session_id = NEW.session_id
               AND journal_type = 'evening'
               AND entry_date < NEW.entry_date;
               
            IF last_date IS NOT NULL AND NEW.entry_date::date = last_date + 1 THEN
                UPDATE session_enrollments
                SET evening_completion = evening_completion + 1,
                    evening_streak     = evening_streak + 1,
                    updated_at         = CURRENT_TIMESTAMP
                WHERE user_id = NEW.user_id AND session_id = NEW.session_id;
            ELSE
                UPDATE session_enrollments
                SET evening_completion = evening_completion + 1,
                    evening_streak     = 1,
                    updated_at         = CURRENT_TIMESTAMP
                WHERE user_id = NEW.user_id AND session_id = NEW.session_id;
            END IF;
            
        ELSIF NEW.journal_type = 'weekly' THEN
            -- For weekly journals, compare week blocks using date_trunc
            current_week := date_trunc('week', NEW.entry_date)::date;
            SELECT MAX(date_trunc('week', entry_date)::date)
              INTO last_week
              FROM journals
             WHERE user_id = NEW.user_id
               AND session_id = NEW.session_id
               AND journal_type = 'weekly'
               AND entry_date < NEW.entry_date;
               
            IF last_week IS NOT NULL AND current_week = last_week + 7 THEN
                UPDATE session_enrollments
                SET weekly_reflection_completion = weekly_reflection_completion + 1,
                    weekly_reflection_streak     = weekly_reflection_streak + 1,
                    updated_at                   = CURRENT_TIMESTAMP
                WHERE user_id = NEW.user_id AND session_id = NEW.session_id;
            ELSE
                UPDATE session_enrollments
                SET weekly_reflection_completion = weekly_reflection_completion + 1,
                    weekly_reflection_streak     = 1,
                    updated_at                   = CURRENT_TIMESTAMP
                WHERE user_id = NEW.user_id AND session_id = NEW.session_id;
            END IF;
        END IF;
        
    -- If the trigger is fired from the action_logs table
    ELSIF TG_TABLE_NAME = 'action_logs' THEN
        -- Gratitude: streak always updated per original logic; completion conditional on note/reflection
        IF NEW.action_type = 'gratitude' THEN
            -- Get the last gratitude action date for this user and session
            SELECT MAX(entry_date::date)
              INTO last_date
              FROM action_logs
             WHERE user_id = NEW.user_id
               AND session_id = NEW.session_id
               AND action_type = 'gratitude'
               AND entry_date < NEW.entry_date;
               
            IF last_date IS NOT NULL AND NEW.entry_date::date = last_date + 1 THEN
                UPDATE session_enrollments
                SET gratitude_completion = gratitude_completion + (
                                             CASE
                                               WHEN NEW.note IS NOT NULL
                                                 OR NEW.reflection IS NOT NULL
                                               THEN 1
                                               ELSE 0
                                             END
                                           ),
                    gratitude_streak     = gratitude_streak + 1,
                    updated_at           = CURRENT_TIMESTAMP
                WHERE user_id = NEW.user_id AND session_id = NEW.session_id;
            ELSE
                UPDATE session_enrollments
                SET gratitude_completion = gratitude_completion + (
                                             CASE
                                               WHEN NEW.note IS NOT NULL
                                                 OR NEW.reflection IS NOT NULL
                                               THEN 1
                                               ELSE 0
                                             END
                                           ),
                    gratitude_streak     = 1,
                    updated_at           = CURRENT_TIMESTAMP
                WHERE user_id = NEW.user_id AND session_id = NEW.session_id;
            END IF;
            
        ELSIF NEW.action_type = 'weekly-challenge' THEN
            -- For weekly challenges, always increment completion; use week comparison only for streak
            UPDATE session_enrollments
            SET weekly_challenge_completion = weekly_challenge_completion + (
                   CASE
                     WHEN NEW.reward IS NOT NULL
                       OR NEW.motivation IS NOT NULL
                       OR NEW.purpose IS NOT NULL
                       OR NEW.success IS NOT NULL
                       OR NEW.focus IS NOT NULL
                     THEN 1 ELSE 0 END
                 ),
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = NEW.user_id
              AND session_id = NEW.session_id;
            -- For weekly challenge actions, use week comparison
            current_week := date_trunc('week', NEW.entry_date)::date;
            SELECT MAX(date_trunc('week', entry_date)::date)
              INTO last_week
              FROM action_logs
             WHERE user_id = NEW.user_id
               AND session_id = NEW.session_id
               AND action_type = 'weekly-challenge'
               AND entry_date < NEW.entry_date;
               
            IF last_week IS NOT NULL AND current_week = last_week + 7 THEN
                UPDATE session_enrollments
                SET weekly_challenge_streak     = weekly_challenge_streak + 1,
                    updated_at                  = CURRENT_TIMESTAMP
                WHERE user_id = NEW.user_id AND session_id = NEW.session_id;
            ELSE
                UPDATE session_enrollments
                SET weekly_challenge_streak     = 1,
                    updated_at                  = CURRENT_TIMESTAMP
                WHERE user_id = NEW.user_id AND session_id = NEW.session_id;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Attach trigger to journals table
CREATE TRIGGER trg_update_session_enrollments_journals
AFTER INSERT ON journals
FOR EACH ROW
EXECUTE FUNCTION update_session_enrollments_stats();

-- Attach trigger to action_logs table
CREATE TRIGGER trg_update_session_enrollments_action_logs
AFTER INSERT ON action_logs
FOR EACH ROW
EXECUTE FUNCTION update_session_enrollments_stats();

