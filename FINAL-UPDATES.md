# Final Updates - Pre-Launch Checklist

This document tracks the final updates needed before market launch.

## Status Legend
- [ ] Not started
- [x] Completed
- [~] In progress / Partial

---

## 1. Horse Profile Fixes

### 1.1 Owner Assignment in Horse Profile Editing
- [x] Missing owner assignment when editing existing horse profile
- Fixed: Added owner/responsible user dropdown to EditHorseModal in HorseDetailPage.tsx

### 1.2 Display Owner in Horse Profile Dashboard
- [x] Horse owner displayed next to the horse's age in the profile header
- Fixed: Updated detail-subtitle in HorseDetailPage.tsx to include owner name

---

## 2. Navigation/Menu Updates

### 2.1 Remove Stable Tab
- [x] Stable tab hidden from menu (commented out in AppLayout.tsx)
- Route still accessible at `/stable` for development purposes

### 2.2 Reorder Menu Tabs
- [x] Calendar tab moved right below Horses tab
- [x] Invoices tab moved beneath Calendar
- New order: Dashboard, Horses, Calendar, Invoices, Vendors, Users, Settings

---

## 3. Calendar & Tasks

### 3.1 Pending Tasks Display
- [x] Fixed: Tasks now show "pending" instead of "notStarted" in the calendar modal

### 3.2 Task Creation Notifications
- [x] Added: Notifications are now sent to assigned users when a task is created
- Implementation: server/src/routes/tasks.js creates Notification records for each assignee

### 3.3 Task Assignment UI
- [x] Improved: Checkbox labels now styled as toggleable buttons with borders
- Visual feedback on hover and when selected

### 3.4 Lessons Display
- [x] Horse names now included in calendar lesson titles
- Format: "Client Name - Lesson Type on Horse Name"

---

## 4. Lessons

### 4.1 Accept/Deny/Reschedule Flow
- [ ] Flow is not currently active - lessons get auto-approved
- **Note:** This is a known limitation for initial launch (documented, not blocking)

---

## 5. Vendors

### 5.1 Work in Progress Popup
- [x] Added WIP notice popup when users first open the Vendors tab
- Explains intended functionality (vendor search, connections, appointments)
- Dismissible and uses sessionStorage to avoid showing repeatedly

---

## Implementation Summary

### Files Modified

**Client:**
- `client/src/pages/horses/HorseDetailPage.tsx` - Owner field in edit modal, owner display in header
- `client/src/layouts/AppLayout.tsx` - Menu reordering, stable tab commented out
- `client/src/pages/calendar/CalendarPage.tsx` - Fixed status display, added horse names to lessons
- `client/src/pages/vendors/VendorsPage.tsx` - Added WIP notice popup
- `client/src/styles/components.css` - Improved checkbox-label styling

**Server:**
- `server/src/routes/tasks.js` - Added notification creation on task assignment

### Completed Items
1. Owner assignment in horse profile editing
2. Owner display in horse profile header
3. Stable tab hidden
4. Menu reordering (Calendar, then Invoices)
5. Fixed "notStarted" -> "pending" display
6. Task creation notifications
7. Improved task assignment UI styling
8. Horse names in calendar lessons
9. Vendors WIP popup

### Deferred Items (Post-Launch)
1. Accept/deny/reschedule flow for lessons (auto-approved for now)
2. Full stable management feature

---

*Last Updated: January 2026*
