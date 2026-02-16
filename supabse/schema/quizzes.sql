-- Quiz System Schema
-- Adds quiz and assessment functionality to course modules

-- Course Quizzes Table
CREATE TABLE IF NOT EXISTS course_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 100),
  max_attempts INTEGER DEFAULT 3 CHECK (max_attempts > 0),
  time_limit_minutes INTEGER CHECK (time_limit_minutes IS NULL OR time_limit_minutes > 0),
  shuffle_questions BOOLEAN DEFAULT false,
  shuffle_answers BOOLEAN DEFAULT false,
  show_correct_answers BOOLEAN DEFAULT true,
  is_required BOOLEAN DEFAULT true,
  points_reward INTEGER DEFAULT 50,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz Questions Table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES course_quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'multi_select')),
  explanation TEXT, -- Shown after answering
  points INTEGER DEFAULT 1 CHECK (points > 0),
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz Answers Table (for multiple choice and multi-select)
CREATE TABLE IF NOT EXISTS quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Quiz Attempts Table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES course_quizzes(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  score INTEGER,
  total_points INTEGER,
  percentage DECIMAL(5,2),
  passed BOOLEAN,
  time_taken_seconds INTEGER,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Quiz Responses Table (individual question responses)
CREATE TABLE IF NOT EXISTS quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  selected_answer_ids UUID[], -- For multiple choice / multi-select
  text_answer TEXT, -- For short answer
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(attempt_id, question_id) -- Allow upsert on same question in attempt
);

-- Course Certificates Table
CREATE TABLE IF NOT EXISTS course_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  certificate_number TEXT UNIQUE NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  pdf_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_question_id ON quiz_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz ON quiz_attempts(user_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_completed ON quiz_attempts(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quiz_responses_attempt_id ON quiz_responses(attempt_id);
CREATE INDEX IF NOT EXISTS idx_course_certificates_user ON course_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_course_certificates_course ON course_certificates(course_id);

-- RLS Policies
ALTER TABLE course_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_certificates ENABLE ROW LEVEL SECURITY;

-- Quiz viewing (anyone enrolled in course)
CREATE POLICY "Users can view quizzes for enrolled courses" ON course_quizzes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_course_enrollments uce
      WHERE uce.user_id = auth.uid()
      AND uce.course_id = course_quizzes.course_id
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

-- Quiz questions viewing
CREATE POLICY "Users can view questions for enrolled courses" ON quiz_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM course_quizzes cq
      JOIN user_course_enrollments uce ON uce.course_id = cq.course_id
      WHERE cq.id = quiz_questions.quiz_id
      AND uce.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

-- Quiz answers viewing (only after attempt or for admins)
CREATE POLICY "Users can view answers after attempting" ON quiz_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quiz_attempts qa
      JOIN quiz_questions qq ON qq.quiz_id = qa.quiz_id
      WHERE qq.id = quiz_answers.question_id
      AND qa.user_id = auth.uid()
      AND qa.completed_at IS NOT NULL
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

-- Attempts - users can view/create their own
CREATE POLICY "Users can view own quiz attempts" ON quiz_attempts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create quiz attempts" ON quiz_attempts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own quiz attempts" ON quiz_attempts
  FOR UPDATE USING (user_id = auth.uid());

-- Responses - users can view/create their own
CREATE POLICY "Users can view own quiz responses" ON quiz_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quiz_attempts qa
      WHERE qa.id = quiz_responses.attempt_id
      AND qa.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create quiz responses" ON quiz_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM quiz_attempts qa
      WHERE qa.id = quiz_responses.attempt_id
      AND qa.user_id = auth.uid()
    )
  );

-- Certificates - users can view their own
CREATE POLICY "Users can view own certificates" ON course_certificates
  FOR SELECT USING (user_id = auth.uid());

-- Admin policies for management
CREATE POLICY "Admins can manage quizzes" ON course_quizzes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage quiz questions" ON quiz_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage quiz answers" ON quiz_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage certificates" ON course_certificates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

-- Function to calculate quiz score
CREATE OR REPLACE FUNCTION calculate_quiz_score(p_attempt_id UUID)
RETURNS TABLE(score INTEGER, total_points INTEGER, percentage DECIMAL, passed BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quiz_id UUID;
  v_passing_score INTEGER;
BEGIN
  -- Get quiz info
  SELECT qa.quiz_id, cq.passing_score
  INTO v_quiz_id, v_passing_score
  FROM quiz_attempts qa
  JOIN course_quizzes cq ON cq.id = qa.quiz_id
  WHERE qa.id = p_attempt_id;

  RETURN QUERY
  SELECT
    COALESCE(SUM(qr.points_earned), 0)::INTEGER as score,
    COALESCE(SUM(qq.points), 0)::INTEGER as total_points,
    CASE
      WHEN COALESCE(SUM(qq.points), 0) = 0 THEN 0
      ELSE ROUND((COALESCE(SUM(qr.points_earned), 0)::DECIMAL / SUM(qq.points)) * 100, 2)
    END as percentage,
    CASE
      WHEN COALESCE(SUM(qq.points), 0) = 0 THEN false
      ELSE ROUND((COALESCE(SUM(qr.points_earned), 0)::DECIMAL / SUM(qq.points)) * 100, 2) >= v_passing_score
    END as passed
  FROM quiz_questions qq
  LEFT JOIN quiz_responses qr ON qr.question_id = qq.id AND qr.attempt_id = p_attempt_id
  WHERE qq.quiz_id = v_quiz_id AND qq.is_active = true;
END;
$$;

-- Function to finalize quiz attempt
CREATE OR REPLACE FUNCTION finalize_quiz_attempt(p_attempt_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result RECORD;
  v_started_at TIMESTAMPTZ;
BEGIN
  -- Calculate score
  SELECT * INTO v_result FROM calculate_quiz_score(p_attempt_id);

  -- Get start time
  SELECT started_at INTO v_started_at FROM quiz_attempts WHERE id = p_attempt_id;

  -- Update attempt with results
  UPDATE quiz_attempts
  SET
    completed_at = NOW(),
    score = v_result.score,
    total_points = v_result.total_points,
    percentage = v_result.percentage,
    passed = v_result.passed,
    time_taken_seconds = EXTRACT(EPOCH FROM (NOW() - v_started_at))::INTEGER
  WHERE id = p_attempt_id;
END;
$$;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_quiz_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quiz_updated_at
  BEFORE UPDATE ON course_quizzes
  FOR EACH ROW EXECUTE FUNCTION update_quiz_updated_at();

CREATE TRIGGER quiz_questions_updated_at
  BEFORE UPDATE ON quiz_questions
  FOR EACH ROW EXECUTE FUNCTION update_quiz_updated_at();
