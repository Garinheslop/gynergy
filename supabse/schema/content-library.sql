-- Content Library Schema
-- Supports: Videos, Documents, Audio, Courses, Progress Tracking
-- Video hosting: Bunny Stream (HLS streaming)
-- Document/Audio storage: Supabase Storage

-- Content type enum
DO $$ BEGIN
    CREATE TYPE content_type AS ENUM (
        'video',
        'document',
        'audio',
        'image'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Content status enum
DO $$ BEGIN
    CREATE TYPE content_status AS ENUM (
        'processing',
        'ready',
        'error',
        'archived'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Content visibility enum
DO $$ BEGIN
    CREATE TYPE content_visibility AS ENUM (
        'public',
        'cohort',
        'private',
        'unlisted'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- CONTENT ITEMS - Main table for all content types
-- =============================================================================
CREATE TABLE IF NOT EXISTS "content_items" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Basic info
    title TEXT NOT NULL,
    description TEXT,
    content_type content_type NOT NULL,
    status content_status DEFAULT 'processing',
    visibility content_visibility DEFAULT 'private',

    -- Video-specific (Bunny Stream)
    video_id TEXT,                          -- Bunny Stream video GUID
    stream_url TEXT,                        -- HLS playlist URL
    thumbnail_url TEXT,                     -- Video thumbnail

    -- Document/Audio-specific (Supabase Storage)
    storage_path TEXT,                      -- Supabase storage path
    storage_url TEXT,                       -- Public URL for documents/audio

    -- Metadata
    duration_seconds INTEGER,               -- For video/audio
    file_size_bytes BIGINT,
    mime_type TEXT,
    original_filename TEXT,

    -- Transcription/captions (future feature)
    transcript TEXT,
    captions_url TEXT,

    -- Organization
    created_by UUID REFERENCES users(id) NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMPTZ,

    -- Soft delete
    deleted_at TIMESTAMPTZ
);

-- =============================================================================
-- COURSES - Structured learning paths
-- =============================================================================
CREATE TABLE IF NOT EXISTS "courses" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Basic info
    title TEXT NOT NULL,
    description TEXT,
    short_description TEXT,                 -- For cards/previews
    thumbnail_url TEXT,

    -- Settings
    is_published BOOLEAN DEFAULT FALSE,
    is_free BOOLEAN DEFAULT FALSE,
    requires_enrollment BOOLEAN DEFAULT TRUE,

    -- Access control
    visibility content_visibility DEFAULT 'private',
    allowed_cohort_ids UUID[],              -- Restrict to specific cohorts

    -- Metadata
    estimated_duration_minutes INTEGER,
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),

    -- Author
    created_by UUID REFERENCES users(id) NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMPTZ,

    -- Soft delete
    deleted_at TIMESTAMPTZ
);

-- =============================================================================
-- COURSE MODULES - Sections within a course
-- =============================================================================
CREATE TABLE IF NOT EXISTS "course_modules" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,

    -- Basic info
    title TEXT NOT NULL,
    description TEXT,

    -- Ordering
    sort_order INTEGER DEFAULT 0,

    -- Drip content (unlock after previous module or date)
    unlock_after_module_id UUID REFERENCES course_modules(id),
    unlock_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- COURSE LESSONS - Individual pieces of content within modules
-- =============================================================================
CREATE TABLE IF NOT EXISTS "course_lessons" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    module_id UUID REFERENCES course_modules(id) ON DELETE CASCADE NOT NULL,
    content_id UUID REFERENCES content_items(id) ON DELETE SET NULL,

    -- Basic info (can override content_item title)
    title TEXT NOT NULL,
    description TEXT,

    -- Ordering
    sort_order INTEGER DEFAULT 0,

    -- Settings
    is_preview BOOLEAN DEFAULT FALSE,       -- Free preview even if course is paid
    is_required BOOLEAN DEFAULT TRUE,       -- Required for course completion

    -- Drip content
    unlock_after_lesson_id UUID REFERENCES course_lessons(id),
    unlock_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- COURSE ENROLLMENTS - Track who's enrolled in courses
-- =============================================================================
CREATE TABLE IF NOT EXISTS "course_enrollments" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'expired')),

    -- Progress
    progress_percent INTEGER DEFAULT 0,
    completed_lessons_count INTEGER DEFAULT 0,

    -- Timestamps
    enrolled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ,

    -- Access control
    expires_at TIMESTAMPTZ,

    UNIQUE(course_id, user_id)
);

-- =============================================================================
-- USER CONTENT PROGRESS - Track progress on individual content items
-- =============================================================================
CREATE TABLE IF NOT EXISTS "user_content_progress" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    content_id UUID REFERENCES content_items(id) ON DELETE CASCADE NOT NULL,

    -- Progress tracking
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    last_position_seconds INTEGER DEFAULT 0,    -- Resume playback position

    -- Completion
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,

    -- Engagement
    view_count INTEGER DEFAULT 0,
    total_watch_time_seconds INTEGER DEFAULT 0,

    -- Timestamps
    first_viewed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_viewed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, content_id)
);

-- =============================================================================
-- COHORT RESOURCES - Content tied to specific cohorts
-- =============================================================================
CREATE TABLE IF NOT EXISTS "cohort_resources" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE NOT NULL,
    content_id UUID REFERENCES content_items(id) ON DELETE CASCADE NOT NULL,

    -- Drip scheduling
    available_from TIMESTAMPTZ,             -- When content becomes available
    available_until TIMESTAMPTZ,            -- When content expires (optional)

    -- Ordering
    sort_order INTEGER DEFAULT 0,

    -- Settings
    is_required BOOLEAN DEFAULT FALSE,      -- Required for cohort completion
    is_pinned BOOLEAN DEFAULT FALSE,        -- Pin to top of list

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(cohort_id, content_id)
);

-- =============================================================================
-- CONTENT TAGS - For organization and filtering
-- =============================================================================
CREATE TABLE IF NOT EXISTS "content_tags" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_id UUID REFERENCES content_items(id) ON DELETE CASCADE NOT NULL,
    tag TEXT NOT NULL,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(content_id, tag)
);

-- =============================================================================
-- CONTENT CATEGORIES - Hierarchical organization
-- =============================================================================
CREATE TABLE IF NOT EXISTS "content_categories" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES content_categories(id),
    sort_order INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "content_item_categories" (
    content_id UUID REFERENCES content_items(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES content_categories(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (content_id, category_id)
);

-- =============================================================================
-- CONTENT BOOKMARKS - User saved content
-- =============================================================================
CREATE TABLE IF NOT EXISTS "content_bookmarks" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    content_id UUID REFERENCES content_items(id) ON DELETE CASCADE NOT NULL,

    -- Optional note
    note TEXT,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, content_id)
);

-- =============================================================================
-- CONTENT NOTES - User notes on content
-- =============================================================================
CREATE TABLE IF NOT EXISTS "content_notes" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    content_id UUID REFERENCES content_items(id) ON DELETE CASCADE NOT NULL,

    -- Note content
    content TEXT NOT NULL,
    timestamp_seconds INTEGER,              -- Link note to specific time in video

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Content items
CREATE INDEX IF NOT EXISTS idx_content_items_type ON content_items(content_type, status);
CREATE INDEX IF NOT EXISTS idx_content_items_created_by ON content_items(created_by);
CREATE INDEX IF NOT EXISTS idx_content_items_visibility ON content_items(visibility) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items(status) WHERE deleted_at IS NULL;

-- Courses
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_courses_created_by ON courses(created_by);

-- Course structure
CREATE INDEX IF NOT EXISTS idx_course_modules_course ON course_modules(course_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module ON course_lessons(module_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_course_lessons_content ON course_lessons(content_id);

-- Enrollments
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_status ON course_enrollments(status);

-- Progress
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_content_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_content ON user_content_progress(content_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON user_content_progress(is_completed) WHERE is_completed = TRUE;

-- Cohort resources
CREATE INDEX IF NOT EXISTS idx_cohort_resources_cohort ON cohort_resources(cohort_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_cohort_resources_available ON cohort_resources(cohort_id, available_from);

-- Tags
CREATE INDEX IF NOT EXISTS idx_content_tags_tag ON content_tags(tag);
CREATE INDEX IF NOT EXISTS idx_content_tags_content ON content_tags(content_id);

-- Bookmarks & Notes
CREATE INDEX IF NOT EXISTS idx_content_bookmarks_user ON content_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_content_notes_user ON content_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_content_notes_content ON content_notes(content_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_content_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_notes ENABLE ROW LEVEL SECURITY;

-- Content items policies
CREATE POLICY "Public content viewable by all" ON content_items
    FOR SELECT USING (
        visibility = 'public'
        AND status = 'ready'
        AND deleted_at IS NULL
    );

CREATE POLICY "Unlisted content viewable with link" ON content_items
    FOR SELECT USING (
        visibility = 'unlisted'
        AND status = 'ready'
        AND deleted_at IS NULL
    );

CREATE POLICY "Creators can view own content" ON content_items
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Creators can manage own content" ON content_items
    FOR ALL USING (created_by = auth.uid());

CREATE POLICY "Cohort members can view cohort content" ON content_items
    FOR SELECT USING (
        visibility = 'cohort'
        AND status = 'ready'
        AND deleted_at IS NULL
        AND EXISTS (
            SELECT 1 FROM cohort_resources cr
            JOIN cohort_memberships cm ON cr.cohort_id = cm.cohort_id
            WHERE cr.content_id = content_items.id
            AND cm.user_id = auth.uid()
            AND (cr.available_from IS NULL OR cr.available_from <= CURRENT_TIMESTAMP)
        )
    );

-- Courses policies
CREATE POLICY "Published courses viewable by all" ON courses
    FOR SELECT USING (
        is_published = TRUE
        AND visibility = 'public'
        AND deleted_at IS NULL
    );

CREATE POLICY "Creators can manage own courses" ON courses
    FOR ALL USING (created_by = auth.uid());

CREATE POLICY "Enrolled users can view course" ON courses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM course_enrollments
            WHERE course_id = courses.id
            AND user_id = auth.uid()
            AND status = 'active'
        )
    );

-- Course modules policies
CREATE POLICY "Users can view modules of accessible courses" ON course_modules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE id = course_modules.course_id
            AND (
                created_by = auth.uid()
                OR (is_published = TRUE AND visibility = 'public' AND deleted_at IS NULL)
                OR EXISTS (
                    SELECT 1 FROM course_enrollments
                    WHERE course_id = courses.id
                    AND user_id = auth.uid()
                    AND status = 'active'
                )
            )
        )
    );

CREATE POLICY "Creators can manage modules" ON course_modules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE id = course_modules.course_id
            AND created_by = auth.uid()
        )
    );

-- Course lessons policies
CREATE POLICY "Users can view lessons of accessible modules" ON course_lessons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM course_modules cm
            JOIN courses c ON c.id = cm.course_id
            WHERE cm.id = course_lessons.module_id
            AND (
                c.created_by = auth.uid()
                OR course_lessons.is_preview = TRUE
                OR EXISTS (
                    SELECT 1 FROM course_enrollments
                    WHERE course_id = c.id
                    AND user_id = auth.uid()
                    AND status = 'active'
                )
            )
        )
    );

CREATE POLICY "Creators can manage lessons" ON course_lessons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM course_modules cm
            JOIN courses c ON c.id = cm.course_id
            WHERE cm.id = course_lessons.module_id
            AND c.created_by = auth.uid()
        )
    );

-- Enrollments policies
CREATE POLICY "Users can view own enrollments" ON course_enrollments
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Course creators can view enrollments" ON course_enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE id = course_enrollments.course_id
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can enroll themselves" ON course_enrollments
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own enrollment" ON course_enrollments
    FOR UPDATE USING (user_id = auth.uid());

-- Progress policies
CREATE POLICY "Users can manage own progress" ON user_content_progress
    FOR ALL USING (user_id = auth.uid());

-- Cohort resources policies
CREATE POLICY "Cohort members can view resources" ON cohort_resources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cohort_memberships
            WHERE cohort_id = cohort_resources.cohort_id
            AND user_id = auth.uid()
        )
        AND (available_from IS NULL OR available_from <= CURRENT_TIMESTAMP)
    );

-- Tags policies (public read)
CREATE POLICY "Anyone can view tags" ON content_tags
    FOR SELECT USING (TRUE);

CREATE POLICY "Creators can manage tags" ON content_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM content_items
            WHERE id = content_tags.content_id
            AND created_by = auth.uid()
        )
    );

-- Bookmarks policies
CREATE POLICY "Users can manage own bookmarks" ON content_bookmarks
    FOR ALL USING (user_id = auth.uid());

-- Notes policies
CREATE POLICY "Users can manage own notes" ON content_notes
    FOR ALL USING (user_id = auth.uid());

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Updated at trigger for content items
CREATE OR REPLACE FUNCTION update_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_content_items_updated_at ON content_items;
CREATE TRIGGER update_content_items_updated_at
    BEFORE UPDATE ON content_items
    FOR EACH ROW
    EXECUTE FUNCTION update_content_updated_at();

DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_content_updated_at();

DROP TRIGGER IF EXISTS update_course_modules_updated_at ON course_modules;
CREATE TRIGGER update_course_modules_updated_at
    BEFORE UPDATE ON course_modules
    FOR EACH ROW
    EXECUTE FUNCTION update_content_updated_at();

DROP TRIGGER IF EXISTS update_course_lessons_updated_at ON course_lessons;
CREATE TRIGGER update_course_lessons_updated_at
    BEFORE UPDATE ON course_lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_content_updated_at();

DROP TRIGGER IF EXISTS update_content_notes_updated_at ON content_notes;
CREATE TRIGGER update_content_notes_updated_at
    BEFORE UPDATE ON content_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_content_updated_at();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Get course progress for a user
CREATE OR REPLACE FUNCTION get_course_progress(p_course_id UUID, p_user_id UUID)
RETURNS TABLE (
    total_lessons INTEGER,
    completed_lessons INTEGER,
    progress_percent INTEGER,
    is_completed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(cl.id)::INTEGER as total_lessons,
        COUNT(ucp.id) FILTER (WHERE ucp.is_completed = TRUE)::INTEGER as completed_lessons,
        CASE
            WHEN COUNT(cl.id) = 0 THEN 0
            ELSE (COUNT(ucp.id) FILTER (WHERE ucp.is_completed = TRUE) * 100 / COUNT(cl.id))::INTEGER
        END as progress_percent,
        COUNT(cl.id) = COUNT(ucp.id) FILTER (WHERE ucp.is_completed = TRUE) as is_completed
    FROM course_lessons cl
    JOIN course_modules cm ON cl.module_id = cm.id
    LEFT JOIN user_content_progress ucp ON cl.content_id = ucp.content_id AND ucp.user_id = p_user_id
    WHERE cm.course_id = p_course_id
    AND cl.is_required = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's library (all accessible content)
CREATE OR REPLACE FUNCTION get_user_library(
    p_user_id UUID,
    p_content_type content_type DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    content_type content_type,
    thumbnail_url TEXT,
    duration_seconds INTEGER,
    progress_percent INTEGER,
    is_bookmarked BOOLEAN,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ci.id,
        ci.title,
        ci.description,
        ci.content_type,
        ci.thumbnail_url,
        ci.duration_seconds,
        COALESCE(ucp.progress_percent, 0) as progress_percent,
        cb.id IS NOT NULL as is_bookmarked,
        ci.created_at
    FROM content_items ci
    LEFT JOIN user_content_progress ucp ON ci.id = ucp.content_id AND ucp.user_id = p_user_id
    LEFT JOIN content_bookmarks cb ON ci.id = cb.content_id AND cb.user_id = p_user_id
    WHERE ci.deleted_at IS NULL
    AND ci.status = 'ready'
    AND (
        ci.visibility = 'public'
        OR ci.created_by = p_user_id
        OR EXISTS (
            SELECT 1 FROM cohort_resources cr
            JOIN cohort_memberships cm ON cr.cohort_id = cm.cohort_id
            WHERE cr.content_id = ci.id
            AND cm.user_id = p_user_id
            AND (cr.available_from IS NULL OR cr.available_from <= CURRENT_TIMESTAMP)
        )
    )
    AND (p_content_type IS NULL OR ci.content_type = p_content_type)
    ORDER BY ci.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update course enrollment progress
CREATE OR REPLACE FUNCTION update_enrollment_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_course_id UUID;
    v_progress RECORD;
BEGIN
    -- Find the course for this content
    SELECT c.id INTO v_course_id
    FROM courses c
    JOIN course_modules cm ON cm.course_id = c.id
    JOIN course_lessons cl ON cl.module_id = cm.id
    WHERE cl.content_id = NEW.content_id
    LIMIT 1;

    IF v_course_id IS NOT NULL THEN
        -- Calculate progress
        SELECT * INTO v_progress FROM get_course_progress(v_course_id, NEW.user_id);

        -- Update enrollment
        UPDATE course_enrollments
        SET
            progress_percent = v_progress.progress_percent,
            completed_lessons_count = v_progress.completed_lessons,
            completed_at = CASE WHEN v_progress.is_completed THEN CURRENT_TIMESTAMP ELSE NULL END,
            status = CASE WHEN v_progress.is_completed THEN 'completed' ELSE status END,
            last_accessed_at = CURRENT_TIMESTAMP
        WHERE course_id = v_course_id
        AND user_id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_enrollment_progress ON user_content_progress;
CREATE TRIGGER trigger_update_enrollment_progress
    AFTER INSERT OR UPDATE OF is_completed ON user_content_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_enrollment_progress();

-- =============================================================================
-- CONTENT PLAYLISTS - User-created collections of content
-- =============================================================================
CREATE TABLE IF NOT EXISTS "content_playlists" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "playlist_items" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    playlist_id UUID REFERENCES content_playlists(id) ON DELETE CASCADE NOT NULL,
    content_id UUID REFERENCES content_items(id) ON DELETE CASCADE NOT NULL,
    sort_order INTEGER DEFAULT 0,
    added_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(playlist_id, content_id)
);

-- =============================================================================
-- CONTENT RATINGS - User reviews and ratings
-- =============================================================================
CREATE TABLE IF NOT EXISTS "content_ratings" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    content_id UUID REFERENCES content_items(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, content_id)
);

-- Indexes for playlists and ratings
CREATE INDEX IF NOT EXISTS idx_playlists_user ON content_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_public ON content_playlists(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist ON playlist_items(playlist_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_content_ratings_content ON content_ratings(content_id);
CREATE INDEX IF NOT EXISTS idx_content_ratings_user ON content_ratings(user_id);

-- RLS for playlists
ALTER TABLE content_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ratings ENABLE ROW LEVEL SECURITY;

-- Playlists: owners can manage, public playlists are viewable
CREATE POLICY "Users can manage own playlists" ON content_playlists
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Public playlists are viewable" ON content_playlists
    FOR SELECT USING (is_public = TRUE);

-- Playlist items: owner can manage, viewable if playlist is accessible
CREATE POLICY "Users can manage own playlist items" ON playlist_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM content_playlists
            WHERE id = playlist_items.playlist_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Viewable if playlist is accessible" ON playlist_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM content_playlists
            WHERE id = playlist_items.playlist_id
            AND (user_id = auth.uid() OR is_public = TRUE)
        )
    );

-- Ratings: users can manage own, all can view
CREATE POLICY "Users can manage own ratings" ON content_ratings
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "All authenticated users can view ratings" ON content_ratings
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_content_playlists_updated_at ON content_playlists;
CREATE TRIGGER update_content_playlists_updated_at
    BEFORE UPDATE ON content_playlists
    FOR EACH ROW
    EXECUTE FUNCTION update_content_updated_at();

DROP TRIGGER IF EXISTS update_content_ratings_updated_at ON content_ratings;
CREATE TRIGGER update_content_ratings_updated_at
    BEFORE UPDATE ON content_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_content_updated_at();

-- Helper: Get average rating for content
CREATE OR REPLACE FUNCTION get_content_avg_rating(p_content_id UUID)
RETURNS TABLE (
    avg_rating DECIMAL,
    rating_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ROUND(AVG(cr.rating)::DECIMAL, 1) as avg_rating,
        COUNT(cr.id)::INTEGER as rating_count
    FROM content_ratings cr
    WHERE cr.content_id = p_content_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
