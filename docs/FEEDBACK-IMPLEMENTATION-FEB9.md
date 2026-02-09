# Feedback Implementation – Feb 9, 2026

Outline of requested changes and implementation status.

---

## 1. Terms of Service & Privacy Policy links

**Issue:** The Terms of Service and Privacy Policy text next to the signup checkbox is not properly linked. Clicking the links takes users to the landing page instead of the actual documents.

**Cause:** App had no routes for `/terms` or `/privacy`; the catch-all redirected to `/`. Links were also inside a `<label>` so clicking could toggle the checkbox instead of opening the doc.

**Implementation:**
- Terms and Privacy are in **`public/OnStride_Full_Privacy_Policy.pdf`**. Both links now point to `/OnStride_Full_Privacy_Policy.pdf` (served from the client’s public folder) and open in a new tab.
- Added `onClick={(e) => e.stopPropagation()}` on both links in Register and Setup Account so clicking the link doesn’t toggle the checkbox.

---

## 2. Starter plan limits: 10 horses, 5 users

**Issue:** Starter plan should be 10 horses and 5 users so small barns (e.g. under 15 horses) can use the $15/month plan.

**Implementation:**
- Updated `server/src/routes/subscriptions.js` default Starter plan: `maxHorses: 10`, `maxUsers: 5`.
- Updated `client/src/components/PaymentPromptModal.tsx` fallback copy to "Up to 10 horses" and "Up to 5 users".
- Any other UI that displays Starter limits (e.g. Subscription page) will reflect the plan from the API.

---

## 3. Financials “Apply for account” popup

**Issue:**
- Formatting: some text doesn’t sit correctly on the screen.
- Only one primary action is desired: **Apply for account**. OnStride will handle onboarding (API keys, etc.); no “I have credentials” or “Remind me later” in this modal.

**Implementation:**
- In the Financials payment-processing prompt modal:
  - Fix layout/CSS so copy doesn’t overflow (e.g. word-wrap, spacing).
  - Remove “Remind Me Later” and “I Have Credentials” buttons.
  - Keep a single primary button: **Apply for account** (opens the Windcave application wizard).

---

## 4. Tasks tab as a to-do board (tasks + lessons)

**Issue:** The Tasks tab should act as a single to-do board: all items assigned to the user, including both **tasks** and **lessons**, with the ability to complete (or otherwise act on) them.

**Implementation:**
- Renamed page header to "To-Do" (staff) / "My To-Do" (boarders).
- Tasks page now fetches both tasks and lessons in parallel.
- Lessons are filtered to show those where user is trainer, client, or staff with statuses: `requested`, `approved`, `countered`, or `completed`.
- Combined into one list sorted by date.
- Each card shows:
  - Type badge (Task / Lesson)
  - Title, description, date/time, horses, and assignees
  - Status badge (Pending, Completed, Overdue, Due Today, Requested, etc.)
- Actions per item type:
  - **Tasks**: Complete/uncomplete toggle, approve/deny/reschedule (if pending approval), delete
  - **Lessons**: Approve/reject (if requested), complete/cancel (if approved), delete
- Two filter rows: Status (All / Pending / Completed) and Type (All Types / Tasks / Lessons).

---

## 5. Application submission not received

**Issue:** A submitted application was not received by the team (e.g. Aashil); submissions don't appear to be notifying anyone.

**Cause:** Submit endpoint only updates status to `submitted` and saves; there is no email or other notification to admin.

**Implementation:**
- Added `sendMerchantApplicationNotification()` to `server/src/services/email.js`
- On successful submit of the Windcave merchant application in `server/src/routes/windcave.js`:
  - Sends an email to `admin@onstrideapp.com` with: barn name, barn id, legal name, and submission timestamp.
- Application is stored in the database so admin can view it in the admin panel.

---

## 6. Fully delete lessons (not just cancel)

**Issue:** Users should be able to fully delete lessons, not only cancel them.

**Implementation:**
- Backend already has `DELETE /lessons/:id` (soft delete via `deletedAt`).
- Added `lessonsApi.delete(id)` in `client/src/services/api.ts` that calls `DELETE /lessons/:id`.
- Added "Delete" action in the To-Do page for staff (trash icon). Differentiate clearly: **Cancel** = lesson is cancelled but still visible in history; **Delete** = remove from normal lists (soft delete).

---

## Summary

| # | Item | Status |
|---|------|--------|
| 1 | Terms & Privacy links + routes | Implemented |
| 2 | Starter plan 10 horses, 5 users | Implemented |
| 3 | Financials popup: formatting + single “Apply for account” | Implemented |
| 4 | Tasks tab as to-do (tasks + lessons) | Implemented |
| 5 | Notify admin on application submit | Implemented |
| 6 | Full delete for lessons (client + UI) | Implemented |
