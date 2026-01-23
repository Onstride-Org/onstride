# Client Feedback Updates - January 23, 2026

## Task List

### Invoicing
- [x] Make description for line items optional (not required)
- [x] Prevent users from billing themselves when creating an invoice
- [x] Reorder fields: Item, Price, Description, Quantity

### Invoice Display
- [x] Replace "unknown" tag with the person's name who paid/was billed

### Calendar & Tasks
- [x] Combine tasks and lessons into a singular tab with interactive calendar
- [x] Dashboard should display total due tasks & lessons for everyone

### User Management
- [x] Format phone numbers with area code: +1 xxx xxx xxx
- [x] Fix: New users default to owner instead of selected role (VERIFIED - code is correct)
- [x] Fix: Self-deleting account gives internal server error
- [x] Fix: Owner view - 3 buttons on right for users don't work (delete/remove/interact)

### Horse Profiles
- [x] Update horse profiles to match wireframes
- [x] Enable adding horse pictures
- [x] Display tasks/lessons assigned to horse inside profile

### Admin Dashboard
- [ ] Update admin dashboard to match "super admin dashboard" in Figma (BLOCKED: Need Figma access)

### Authentication & Onboarding
- [x] Email verification should auto-push user into app (no re-login required)
- [x] Add welcome emails after user verifies email

---

## Progress Notes

### Jan 23 - Invoicing Updates (Completed)
1. **Description optional**: Removed `required: true` from description field in Invoice, BillingTemplate, and BillingPeriod models. Updated frontend to show "(optional)" placeholder.
2. **No self-billing**: Filtered current user from the "Bill To" dropdown in CreateInvoiceModal using authStore.
3. **Field reorder**: Changed charge row order to: Type > Price > Description > Quantity

### Jan 23 - Invoice Display Fix (Completed)
4. **Unknown tag fix**: Added `transformInvoice` helper in api.ts to properly map `boarderId` (populated) to `boarder` object. Now invoice cards show the actual person's name.

### Jan 23 - Calendar Integration (Completed)
5. **Combined Calendar**: Created new CalendarPage at `/calendar` combining tasks and lessons
   - Installed `react-big-calendar` for interactive calendar view
   - Calendar shows tasks (color-coded by status: pending/overdue/completed)
   - Calendar shows lessons (color-coded by status: requested/approved/completed)
   - Month, Week, Day, and Agenda views available
   - Click event to view details and take actions
   - Staff can add tasks or schedule lessons directly from calendar
   - Legend shows color codes for different event types
   - Updated navigation to single "Calendar" item (replaced Tasks/Lessons)
   - Old routes `/tasks` and `/lessons` redirect to `/calendar`

### Jan 23 - Dashboard Updates (Completed)
6. **Dashboard task/lesson counts**: Added lessons count stat, "Today's Schedule" section showing both tasks and lessons

### Jan 23 - Phone Number Formatting (Completed)
7. **Phone formatting**: Created `formatPhoneNumber` utility in `/utils/formatters.ts`. Format: +1 xxx xxx xxxx. Applied to:
   - UsersPage (mobile card & desktop table)
   - ProfilePage
   - AdminUserDetailPage
   - AdminBarnDetailPage
   - DashboardPage (staff cards)
   - VendorsPage (card & modal)

### Jan 23 - User Role Assignment (Verified)
8. **Role assignment verified**: The invitation flow correctly passes `accountType` from the UI through to user creation. Both `InviteUserModal` and `BulkInviteModal` pass the selected role. The backend stores this in both the User model and UserBarnRole. Code paths verified:
   - `/client/src/pages/users/UsersPage.tsx` - Both modals pass `accountType: role`
   - `/server/src/routes/invitations.js` - Creates invitation with `accountType` and assigns it to new users

### Jan 23 - Self-Delete Account Fix (Completed)
9. **Account deletion fix**: Fixed internal server error when users tried to delete their account. The issue was in `/server/src/routes/auth.js` at the DELETE `/account` endpoint. The User model has password field set with `select: false` for security, but the route wasn't including `.select('+password')` when fetching the user. This caused `comparePassword()` to fail since the password field was undefined. Fixed by adding `.select('+password')` to the findById query.

### Jan 23 - User Action Buttons Fix (Completed)
10. **User dropdown actions fix**: Fixed the user action buttons (Edit Role, Remove from Barn) not working in the users table. Two issues were addressed:
    - CSS: Added `overflow-y: visible` to `.table-container` and adjusted dropdown positioning to prevent dropdowns from being clipped by the table's `overflow-x: auto`
    - JS: Added `e.stopPropagation()` to all dropdown item click handlers to prevent the document click handler (which closes the dropdown) from interfering with button clicks
    - Updated both mobile card view and desktop table view dropdown menus

### Jan 23 - Horse Profile Photo Upload (Completed)
11. **Horse photo feature**: Implemented horse photo upload functionality:
    - Backend: Added `photoUrl` field to Horse model (`/server/src/models/Horse.js`)
    - Backend: Added photo upload endpoint `POST /horses/:id/photo` and delete endpoint `DELETE /horses/:id/photo` in `/server/src/routes/horses.js`
    - Frontend: Added `uploadPhoto` and `deletePhoto` methods to horsesApi in `/client/src/services/api.ts`
    - Frontend: Updated HorseDetailPage with photo display, upload button (camera icon), and delete button
    - CSS: Added horse photo styles (responsive sizing, hover effects for delete button)
    - Types: Added `photoUrl` field to Horse interface

### Jan 23 - Horse Schedule Tab (Completed)
12. **Tasks/Lessons on horse profile**: Added a "Tasks & Lessons" tab to horse profiles:
    - Backend: Added `GET /horses/:id/tasks` and `GET /horses/:id/lessons` endpoints to fetch schedule items for a specific horse
    - Frontend: Added `getTasks` and `getLessons` API methods to horsesApi
    - Frontend: Created new `ScheduleTab` component showing:
      - Tasks assigned to the horse with due date, status, assignees
      - Lessons scheduled with the horse including time, type, client, trainer
    - CSS: Added schedule tab styles with date cards, status badges, and responsive layout
    - Added link to calendar for full schedule view

### Jan 23 - Email Verification Auto-Login (Completed)
13. **Auto-push to app after email verification**: Users are now automatically logged in after verifying their email:
    - Backend: Updated `/auth/verify-email` endpoint to return access/refresh tokens, user data, and barn info after successful verification
    - Frontend: Updated VerifyEmailPage to handle the token response, set auth state, and redirect to dashboard instead of login page
    - Users no longer need to re-enter credentials after clicking the verification link

### Jan 23 - Welcome Email (Completed)
14. **Welcome email after verification**: After a user verifies their email, a welcome email is automatically sent:
    - Utilizes existing `sendWelcomeEmail` function in `/server/src/services/email.js`
    - Called asynchronously from the verify-email endpoint (doesn't block the response)
    - Includes personalized greeting with user's name and barn name (if available)
    - Contains links to dashboard and highlights key features of OnStride

---

## Lessons Workflow - January 23, 2026

### Task List
- [x] Fix: Lessons don't show when created
- [x] Refine entire lesson workflow (create, display, manage)
- [x] Implement notification system for lessons (approval, reschedule, etc.)
- [x] Add recurring lessons feature

### Progress Notes

### Jan 23 - Lesson Display Fix (Completed)
15. **Lessons not showing when created**: Fixed data structure mismatch between backend and frontend:
    - Backend returns `{ lessons, pagination }` but frontend was reading `lessonsRes.data`
    - Fixed CalendarPage.tsx to read `lessonsRes.lessons` correctly
    - Added `transformLesson` helper in `/client/src/services/api.ts` to map populated Mongoose fields:
      - `trainerId` (populated object) -> `trainer`
      - `clientId` (populated object) -> `client`
      - `horseId` (populated object) -> `horse`
    - Applied transform to all lessonsApi methods (getAll, getById, create, update, approve, reject, counter, complete, cancel)
    - Fixed `durationMinutes` property reference in HorseDetailPage schedule tab

### Jan 23 - Lesson Email Notifications (Completed)
16. **Lesson notification system**: Implemented email notifications for lesson status changes:
    - Added `sendLessonNotificationEmail` function in `/server/src/services/email.js`
    - Supports notification types: requested, approved, rejected, countered, cancelled
    - Professional HTML email templates with lesson details (date/time, duration, type, trainer, client, horse, location)
    - Color-coded status badges (purple for requested, green for approved, red for rejected, amber for countered, gray for cancelled)
    - Updated `/server/src/routes/lessons.js` to send notifications:
      - When client requests a lesson -> notify trainer
      - When trainer approves/rejects/counter-proposes -> notify client
      - When lesson is cancelled -> notify the other party

### Jan 23 - Recurring Lessons UI (Completed)
17. **Recurring lessons feature**: Added UI for creating recurring lessons in AddLessonModal:
    - Recurrence options: Does not repeat, Daily, Weekly, Bi-weekly, Monthly, Custom (specific days)
    - Custom day selector with checkboxes for each day of the week
    - End options: number of lessons (1-52) or end by date
    - Helpful hint text explaining the recurrence pattern
    - Backend already had `generateRecurringLessons` helper function that creates recurring lesson instances
    - Added CSS styles for form sections and day selector in `/client/src/styles/components.css`

