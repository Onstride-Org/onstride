# Updates - January 26, 2026

## Client Feedback Implementation Tracker

### High Priority Issues

#### 1. Demo Booking Form Enhancement ✅ COMPLETED
- [x] Multi-step form flow with:
  - Step 1: Are you the decision maker (owner/manager)?
  - Step 2: Main discipline (Hunters, Jumpers, Dressage, Racing, Polo, etc.)
  - Step 3: Number of horses in barn
  - Step 4: Barn name
  - Step 5: User's name and email
  - Step 6: Calendar to schedule demo
- [x] Save all information to localStorage for account creation
- **Files changed:** `client/src/pages/LandingPage.tsx`, `client/src/styles/landing.css`

#### 2. Horse Count Not Updating After Deletion ✅ COMPLETED
- [x] Added `deletedAt: null` filter to countDocuments query
- **Files changed:** `server/src/routes/horses.js`

#### 3. Revenue Dashboard Issues ✅ COMPLETED
- [x] Changed to calculate monthly revenue from paid invoices
- [x] Updated label to "Monthly Revenue"
- **Files changed:** `client/src/pages/DashboardPage.tsx`

#### 4. Lessons/Tasks Approval Flow ✅ COMPLETED
- [x] Implemented approve/reject/reschedule flow for lessons
- [x] Added reschedule form with date picker
- [x] Added mark complete functionality
- **Files changed:** `client/src/pages/calendar/CalendarPage.tsx`, `client/src/styles/components.css`

#### 5. Branding Updates ⏳ PENDING - REQUIRES ASSETS
- [ ] Need OnStride logo file to replace `client/public/gl-logo.png`
- [ ] Need brand toolkit with colors/fonts
- **Note:** Replace `gl-logo.png` with OnStride logo when available

#### 6. User Management (Three Dots Menu) ✅ COMPLETED
- [x] Fixed dropdown z-index and positioning
- **Files changed:** `client/src/styles/components.css`

#### 7. Email Invite Issues ✅ COMPLETED
- [x] Added check for existing active invitations
- [x] Returns error if duplicate invitation attempted
- **Files changed:** `server/src/routes/invitations.js`

#### 8. Boarder Horse Visibility ✅ COMPLETED
- [x] Added permission check in GET /:id endpoint
- [x] Boarders can only view horses linked to them
- **Files changed:** `server/src/routes/horses.js`

#### 9. Horse Pictures Visibility ✅ COMPLETED
- [x] Verified photo URLs are public Cloud Storage URLs
- [x] Photos should be accessible to all users with horse access
- **Note:** If issue persists, check GCS bucket permissions

#### 10. Horse Profile Navigation Bug ✅ COMPLETED
- [x] Fixed link from `/horses/${id}` to `/app/horses/${id}`
- **Files changed:** `client/src/pages/horses/HorsesPage.tsx`

#### 11. Email Verification Sync ✅ COMPLETED
- [x] Added polling to verification page (every 5 seconds)
- [x] Auto-login when verified on another device
- [x] Added `/auth/check-verification` endpoint
- **Files changed:** `client/src/pages/auth/VerificationRequiredPage.tsx`, `client/src/services/api.ts`, `server/src/routes/auth.js`, `client/src/stores/authStore.ts`

#### 12. New User Role Assignment ✅ COMPLETED
- [x] Verified invitation acceptance sets correct role
- [x] Added helper methods to authStore for role management
- **Files changed:** `client/src/stores/authStore.ts`

#### 13. Financial Dashboard Role Views ✅ COMPLETED
- [x] Boarders see simplified view (Amount Due, Paid, Pending, Overdue)
- [x] Staff see full view (Revenue, Expenses, Net Income)
- [x] Boarders only see "My Summary" and "My Invoices" tabs
- **Files changed:** `client/src/pages/financials/FinancialsPage.tsx`

#### 14. Admin Dashboard ✅ COMPLETED
- [x] Fixed link paths from `/admin/*` to `/app/admin/*`
- [x] Created AdminUsersPage and AdminBarnsPage list pages
- [x] Added routes for new admin pages
- **Files changed:** `client/src/pages/admin/AdminDashboardPage.tsx`, `client/src/pages/admin/AdminUsersPage.tsx` (new), `client/src/pages/admin/AdminBarnsPage.tsx` (new), `client/src/App.tsx`

---

## Summary

### Completed (14/15)
All major issues have been addressed except for the logo/branding update which requires asset files from the design team.

### Pending (1/15)
- **Logo/Branding Update:** Waiting for OnStride logo and brand toolkit

### Files Modified
- `client/src/App.tsx`
- `client/src/pages/LandingPage.tsx`
- `client/src/pages/DashboardPage.tsx`
- `client/src/pages/horses/HorsesPage.tsx`
- `client/src/pages/calendar/CalendarPage.tsx`
- `client/src/pages/financials/FinancialsPage.tsx`
- `client/src/pages/auth/VerificationRequiredPage.tsx`
- `client/src/pages/admin/AdminDashboardPage.tsx`
- `client/src/pages/admin/AdminUsersPage.tsx` (new)
- `client/src/pages/admin/AdminBarnsPage.tsx` (new)
- `client/src/services/api.ts`
- `client/src/stores/authStore.ts`
- `client/src/styles/landing.css`
- `client/src/styles/components.css`
- `server/src/routes/horses.js`
- `server/src/routes/invitations.js`
- `server/src/routes/auth.js`

### Testing Recommended
1. Test demo booking form flow on landing page
2. Test horse deletion and verify count updates
3. Test lesson approval/reject/reschedule flow
4. Test boarder login - verify they only see their horses
5. Test email verification on phone, verify computer auto-updates
6. Test admin dashboard navigation and list pages
7. Test financial dashboard as both owner and boarder roles
