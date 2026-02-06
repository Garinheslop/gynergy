// Content Library Types

// =============================================================================
// ENUMS
// =============================================================================

export type ContentType = "video" | "document" | "audio" | "image";

export type ContentStatus = "processing" | "ready" | "error" | "archived";

export type ContentVisibility = "public" | "cohort" | "private" | "unlisted";

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export type EnrollmentStatus = "active" | "completed" | "paused" | "expired";

// =============================================================================
// CONTENT ITEMS
// =============================================================================

export interface ContentItem {
  id: string;
  title: string;
  description?: string;
  contentType: ContentType;
  status: ContentStatus;
  visibility: ContentVisibility;

  // Video-specific (Bunny Stream)
  videoId?: string;
  streamUrl?: string;
  thumbnailUrl?: string;

  // Document/Audio-specific (Supabase Storage)
  storagePath?: string;
  storageUrl?: string;

  // Metadata
  durationSeconds?: number;
  fileSizeBytes?: number;
  mimeType?: string;
  originalFilename?: string;

  // Transcription
  transcript?: string;
  captionsUrl?: string;

  // Organization
  createdBy: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  deletedAt?: string;
}

export interface ContentItemWithProgress extends ContentItem {
  progressPercent: number;
  lastPositionSeconds: number;
  isCompleted: boolean;
  isBookmarked: boolean;
}

// =============================================================================
// COURSES
// =============================================================================

export interface Course {
  id: string;
  title: string;
  description?: string;
  shortDescription?: string;
  thumbnailUrl?: string;

  // Settings
  isPublished: boolean;
  isFree: boolean;
  requiresEnrollment: boolean;

  // Access control
  visibility: ContentVisibility;
  allowedCohortIds?: string[];

  // Metadata
  estimatedDurationMinutes?: number;
  difficultyLevel?: DifficultyLevel;

  // Author
  createdBy: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  deletedAt?: string;
}

export interface CourseWithDetails extends Course {
  modules: CourseModuleWithLessons[];
  totalLessons: number;
  totalDurationMinutes: number;
  enrollmentCount?: number;
}

export interface CourseWithProgress extends CourseWithDetails {
  enrollment?: CourseEnrollment;
  progressPercent: number;
  completedLessonsCount: number;
}

// =============================================================================
// COURSE MODULES
// =============================================================================

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  sortOrder: number;

  // Drip content
  unlockAfterModuleId?: string;
  unlockAt?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface CourseModuleWithLessons extends CourseModule {
  lessons: CourseLessonWithContent[];
  isUnlocked: boolean;
}

// =============================================================================
// COURSE LESSONS
// =============================================================================

export interface CourseLesson {
  id: string;
  moduleId: string;
  contentId?: string;
  title: string;
  description?: string;
  sortOrder: number;

  // Settings
  isPreview: boolean;
  isRequired: boolean;

  // Drip content
  unlockAfterLessonId?: string;
  unlockAt?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface CourseLessonWithContent extends CourseLesson {
  content?: ContentItem;
  isUnlocked: boolean;
  isCompleted: boolean;
  progressPercent: number;
}

// =============================================================================
// ENROLLMENTS
// =============================================================================

export interface CourseEnrollment {
  id: string;
  courseId: string;
  userId: string;
  status: EnrollmentStatus;

  // Progress
  progressPercent: number;
  completedLessonsCount: number;

  // Timestamps
  enrolledAt: string;
  startedAt?: string;
  completedAt?: string;
  lastAccessedAt?: string;
  expiresAt?: string;
}

// =============================================================================
// PROGRESS TRACKING
// =============================================================================

export interface UserContentProgress {
  id: string;
  userId: string;
  contentId: string;

  // Progress
  progressPercent: number;
  lastPositionSeconds: number;

  // Completion
  isCompleted: boolean;
  completedAt?: string;

  // Engagement
  viewCount: number;
  totalWatchTimeSeconds: number;

  // Timestamps
  firstViewedAt: string;
  lastViewedAt: string;
}

// =============================================================================
// COHORT RESOURCES
// =============================================================================

export interface CohortResource {
  id: string;
  cohortId: string;
  contentId: string;

  // Scheduling
  availableFrom?: string;
  availableUntil?: string;

  // Settings
  sortOrder: number;
  isRequired: boolean;
  isPinned: boolean;

  // Timestamps
  createdAt: string;
}

export interface CohortResourceWithContent extends CohortResource {
  content: ContentItem;
  isAvailable: boolean;
}

// =============================================================================
// TAGS & CATEGORIES
// =============================================================================

export interface ContentTag {
  id: string;
  contentId: string;
  tag: string;
  createdAt: string;
}

export interface ContentCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  sortOrder: number;
  createdAt: string;
}

// =============================================================================
// BOOKMARKS & NOTES
// =============================================================================

export interface ContentBookmark {
  id: string;
  userId: string;
  contentId: string;
  note?: string;
  createdAt: string;
}

export interface ContentNote {
  id: string;
  userId: string;
  contentId: string;
  content: string;
  timestampSeconds?: number;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// API TYPES
// =============================================================================

// Upload request
export interface ContentUploadRequest {
  title: string;
  description?: string;
  contentType: ContentType;
  visibility?: ContentVisibility;
  tags?: string[];
  cohortId?: string; // If uploading as cohort resource
}

// Create course request
export interface CreateCourseRequest {
  title: string;
  description?: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  visibility?: ContentVisibility;
  difficultyLevel?: DifficultyLevel;
  estimatedDurationMinutes?: number;
  isFree?: boolean;
}

// Update progress request
export interface UpdateProgressRequest {
  contentId: string;
  progressPercent: number;
  lastPositionSeconds?: number;
  isCompleted?: boolean;
}

// Library filter options
export interface LibraryFilterOptions {
  contentType?: ContentType;
  status?: ContentStatus;
  visibility?: ContentVisibility;
  tags?: string[];
  search?: string;
  sortBy?: "created_at" | "title" | "duration";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

// =============================================================================
// API REQUEST TYPES (for dynamic routes)
// =============================================================================

export const contentRequestTypes = {
  // Content items
  upload: "upload",
  "get-content": "get-content",
  "list-content": "list-content",
  "update-content": "update-content",
  "delete-content": "delete-content",

  // Progress
  "update-progress": "update-progress",
  "get-progress": "get-progress",

  // Courses
  "create-course": "create-course",
  "get-course": "get-course",
  "list-courses": "list-courses",
  "update-course": "update-course",
  "delete-course": "delete-course",

  // Course structure
  "add-module": "add-module",
  "update-module": "update-module",
  "delete-module": "delete-module",
  "reorder-modules": "reorder-modules",

  "add-lesson": "add-lesson",
  "update-lesson": "update-lesson",
  "delete-lesson": "delete-lesson",
  "reorder-lessons": "reorder-lessons",

  // Enrollment
  enroll: "enroll",
  unenroll: "unenroll",
  "get-enrollment": "get-enrollment",

  // Bookmarks & Notes
  "add-bookmark": "add-bookmark",
  "remove-bookmark": "remove-bookmark",
  "get-bookmarks": "get-bookmarks",

  "add-note": "add-note",
  "update-note": "update-note",
  "delete-note": "delete-note",
  "get-notes": "get-notes",

  // Cohort resources
  "add-cohort-resource": "add-cohort-resource",
  "remove-cohort-resource": "remove-cohort-resource",
  "get-cohort-resources": "get-cohort-resources",

  // Video status
  "get-video-status": "get-video-status",

  // Legacy aliases (for backwards compatibility with camelCase usage)
  getContent: "get-content",
  listContent: "list-content",
  updateContent: "update-content",
  deleteContent: "delete-content",
  updateProgress: "update-progress",
  getProgress: "get-progress",
  createCourse: "create-course",
  getCourse: "get-course",
  listCourses: "list-courses",
  updateCourse: "update-course",
  deleteCourse: "delete-course",
  addModule: "add-module",
  updateModule: "update-module",
  deleteModule: "delete-module",
  reorderModules: "reorder-modules",
  addLesson: "add-lesson",
  updateLesson: "update-lesson",
  deleteLesson: "delete-lesson",
  reorderLessons: "reorder-lessons",
  getEnrollment: "get-enrollment",
  addBookmark: "add-bookmark",
  removeBookmark: "remove-bookmark",
  getBookmarks: "get-bookmarks",
  addNote: "add-note",
  updateNote: "update-note",
  deleteNote: "delete-note",
  getNotes: "get-notes",
  addCohortResource: "add-cohort-resource",
  removeCohortResource: "remove-cohort-resource",
  getCohortResources: "get-cohort-resources",
  getVideoStatus: "get-video-status",
} as const;

export type ContentRequestType = (typeof contentRequestTypes)[keyof typeof contentRequestTypes];

// =============================================================================
// RESPONSE TYPES
// =============================================================================

export interface ContentListResponse {
  items: ContentItemWithProgress[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CourseListResponse {
  items: CourseWithProgress[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface UploadResponse {
  success: boolean;
  content: ContentItem;
  uploadUrl?: string; // For chunked uploads
}

export interface VideoStatusResponse {
  status: "processing" | "ready" | "error" | "uploading";
  progress: number;
  message: string;
  streamUrl?: string;
  thumbnailUrl?: string;
}
