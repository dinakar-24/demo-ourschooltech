

## Phase 1: Build All 5 New Modules

Since these are large features, we'll implement them one at a time in priority order. Here's the full plan:

---

### 1. Online Classes

**Database**: `online_classes` table with columns: `school_id`, `title`, `description`, `platform` (Zoom/Google Meet/MS Teams/Custom), `meeting_url`, `meeting_id`, `password`, `class_name`, `section`, `subject`, `teacher_id`, `scheduled_at`, `duration_minutes`, `status` (scheduled/live/completed/cancelled). RLS scoped to school_id.

**Pages**:
- `src/pages/admin/OnlineClassesPage.tsx` -- Admin CRUD with table, create/edit dialog (title, platform picker, meeting URL, date-time, duration, class/section/teacher selectors)
- `src/pages/teacher/TeacherOnlineClasses.tsx` -- Teacher's classes with "Start Class" button
- `src/pages/student/StudentOnlineClasses.tsx` -- Student view with "Join" button
- `src/pages/parent/ParentOnlineClasses.tsx` -- Parent view with "Join" button

**Hook**: `src/hooks/useOnlineClasses.ts`

---

### 2. Transport Management

**Database**: Two tables:
- `transport_routes` -- `school_id`, `route_name`, `route_number`, `driver_name`, `driver_phone`, `vehicle_number`, `capacity`, `start_location`, `end_location`, `stops` (jsonb array), `is_active`
- `student_transport` -- `student_id`, `route_id`, `school_id`, `pickup_stop`, `drop_stop`, `boarding_type` (pickup/drop/both)

RLS scoped to school_id.

**Pages**:
- `src/pages/admin/TransportPage.tsx` -- Admin manages routes, assigns students to routes
- Student/Parent views showing their assigned route and bus details

**Hook**: `src/hooks/useTransport.ts`

---

### 3. Messages

**Database**: Two tables:
- `conversations` -- `school_id`, `participant_ids` (uuid array), `last_message_at`, `created_by`
- `messages` -- `conversation_id`, `sender_id`, `content`, `is_read`, `created_at`

Enable Supabase Realtime on `messages` for live chat.

**Pages**:
- `src/pages/admin/MessagesPage.tsx` -- Admin inbox
- `src/pages/teacher/TeacherMessages.tsx` -- Teacher can message parents
- `src/pages/parent/ParentMessages.tsx` -- Parent can message teachers/admin

**Hook**: `src/hooks/useMessages.ts`

---

### 4. Gallery Management

**Database**: Two tables:
- `gallery_albums` -- `school_id`, `title`, `description`, `cover_image_url`, `event_date`, `created_by`
- `gallery_photos` -- `album_id`, `school_id`, `image_url`, `caption`, `uploaded_by`

**Storage**: New `gallery` bucket (public).

**Pages**:
- `src/pages/admin/GalleryPage.tsx` -- Admin creates albums, uploads photos
- Student/Parent/Teacher views to browse albums

**Hook**: `src/hooks/useGallery.ts`

---

### 5. Feedback / Query

**Database**: `feedback` table -- `school_id`, `user_id`, `subject`, `message`, `status` (open/in-progress/resolved), `response`, `responded_by`, `responded_at`, `category` (general/complaint/suggestion/query)

**Pages**:
- `src/pages/admin/FeedbackPage.tsx` -- Admin views and responds to feedback
- Student/Parent/Teacher submit feedback from their portals

**Hook**: `src/hooks/useFeedback.ts`

---

### Navigation Updates (All Features)

**Sidebar** (`src/components/layout/Sidebar.tsx`): Add menu items for all roles:
- School Admin: Online Classes, Transport, Messages, Gallery, Feedback
- Teacher: Online Classes, Messages
- Student: Online Classes, Messages, Gallery, Feedback
- Parent: Online Classes, Messages, Gallery, Feedback

**Mobile Nav** (`src/components/layout/MobileNav.tsx` and `MobileLayout.tsx`): Update bottom nav for new items.

**Routes** (`src/App.tsx`): Add routes for all new pages.

---

### Implementation Order

Since building all 5 at once would be too large, we'll implement them sequentially:
1. Online Classes (most requested)
2. Transport Management
3. Messages (requires Realtime setup)
4. Gallery Management
5. Feedback

Each module includes: database migration, RLS policies, CRUD hook, admin page, role-specific pages, and navigation integration.

