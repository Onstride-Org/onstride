# OnStride V1 Feedback Tracker

## Overview
This document tracks all feedback items from V1 testing and their implementation status.

---

## API Keys Required

| Service | Purpose | Status |
|---------|---------|--------|
| **Twilio** | 2FA via SMS/Phone verification | Needed - User to provide |
| **Google Cloud Storage** | Document/file uploads (recommended over local storage) | Recommended - User to provide |
| **SendGrid** | Already configured for emails | Existing |
| **Windcave** | Payment processing (replaced Stripe) | ✅ Implemented - User to provide API keys |

---

## Feature Requests & Bug Fixes

### 1. Horse Profile Enhancements

| # | Issue | Priority | Status | Notes |
|---|-------|----------|--------|-------|
| 1.1 | No ability to add notes/details to horse profiles | High | ✅ DONE | Added notes field to Horse model and UI |
| 1.2 | Should ask for date of birth, not age | High | ✅ DONE | UI now uses birthday and calculates age automatically |
| 1.3 | Date of birth should default to 1/1/current year | Medium | ✅ DONE | Default value set in form and model |
| 1.4 | Documents cannot be uploaded to horse profiles | High | ✅ DONE | Added full upload modal and functionality |
| 1.5 | Genetics cannot be uploaded | High | ✅ DONE | Added genetic test modal with common tests |
| 1.6 | Add owner/responsible user assignment to horse | High | ✅ DONE | Added `ownerId` field to Horse model with user dropdown |
| 1.7 | Display assigned owner in horse profile card | Medium | ✅ DONE | Updated HorseCard to show owner |

### 2. Invoice System

| # | Issue | Priority | Status | Notes |
|---|-------|----------|--------|-------|
| 2.1 | User dropdown instead of User ID input | High | ✅ DONE | Added user dropdown in create invoice modal |
| 2.2 | Missing billing template creation | High | ✅ DONE | Full billing templates UI at /settings/billing-templates |

### 3. Task System

| # | Issue | Priority | Status | Notes |
|---|-------|----------|--------|-------|
| 3.1 | Tasks should assign to user(s) AND horse(s) | High | ✅ DONE | Added user and horse checkboxes to task modal |
| 3.2 | Task notification reminder button missing/not working | High | ✅ DONE | Added reminder dropdown with time options |
| 3.3 | Task due date should include time | Medium | ✅ DONE | Added time picker to due date |
| 3.4 | Creating a task does nothing | Critical | ✅ DONE | Fixed - was sending wrong field names |

### 4. Lesson System

| # | Issue | Priority | Status | Notes |
|---|-------|----------|--------|-------|
| 4.1 | Need user dropdown for clients and trainers | High | ✅ DONE | Added user dropdowns filtered by role |
| 4.2 | Should allow assigning horse(s) to lessons | High | ✅ DONE | Added horse dropdown to lesson modal |
| 4.3 | "Validation failed" when creating lesson | Critical | ✅ DONE | Fixed by using proper user selection |

### 5. Vendor Portal

| # | Issue | Priority | Status | Notes |
|---|-------|----------|--------|-------|
| 5.1 | Vendor portal doesn't work at all | Critical | ✅ DONE | Full UI: directory, connections, appointments, booking |

### 6. User Management

| # | Issue | Priority | Status | Notes |
|---|-------|----------|--------|-------|
| 6.1 | Adding new user says "validation failed" | Critical | ✅ DONE | Fixed - was sending `role` instead of `accountType` |
| 6.2 | Bulk user invitation system missing | High | ✅ DONE | Added bulk invite with shareable links and 24hr expiry |
| 6.3 | No 2FA for email or phone | High | ✅ DONE | Implemented with Twilio Verify + Settings UI + Registration option |
| 6.4 | Phone number should be required in account creation | Medium | ✅ DONE | Made phone required in registration |

### 7. Barn/Account Setup

| # | Issue | Priority | Status | Notes |
|---|-------|----------|--------|-------|
| 7.1 | Should ask for barn name during registration | High | ✅ DONE | Added barn name field to registration form |
| 7.2 | Display barn name instead of "user's barn" | Medium | ✅ DONE | Registration now saves custom barn name |

### 8. Admin Dashboard

| # | Issue | Priority | Status | Notes |
|---|-------|----------|--------|-------|
| 8.1 | Missing super admin dashboard at /admin | High | ✅ DONE | Created full admin dashboard with stats

---

## Implementation Plan

### Phase 1: Critical Bug Fixes (Blocking Issues)
1. Fix task creation (does nothing)
2. Fix lesson creation (validation failed)
3. Fix user creation (validation failed)
4. Fix vendor portal basic functionality

### Phase 2: Core Feature Improvements
1. Horse profile enhancements (notes, DOB, owner assignment)
2. Document/genetics upload functionality
3. Task and lesson user/horse dropdowns
4. Invoice user dropdown

### Phase 3: New Features
1. Billing template creation
2. Bulk user invitation system
3. 2FA implementation (requires Twilio API key)
4. Super admin dashboard

### Phase 4: UX Improvements
1. Barn name in registration
2. Task due date with time
3. Task notification reminders
4. UI polish and consistency

---

## Technical Notes

### Current Architecture
- **Backend:** Express.js + MongoDB (Mongoose)
- **Frontend:** React 18 + TypeScript + Vite
- **State:** Zustand
- **File Storage:** Currently local (`/uploads`), recommend Google Cloud Storage
- **Auth:** JWT with refresh tokens

### Database Changes Needed
1. `Horse` model: Add `notes` field, ensure `ownerId`/`assignedUserId` field
2. `User` model: Add 2FA fields (verified phone, 2FA enabled, backup codes)
3. `Invitation` model: Add bulk invitation link support
4. `BillingTemplate` model: New model for recurring billing templates

### File Storage Recommendation
Current implementation uses local disk storage which won't scale. Recommend:
- Google Cloud Storage for production
- Signed URLs for secure document access
- CDN for static assets

---

## Progress Log

| Date | Updates |
|------|---------|
| 2026-01-16 | Initial feedback documented, analysis complete |
| 2026-01-16 | Starting implementation of all fixes |
| 2026-01-16 | Fixed task creation (was sending wrong field names) |
| 2026-01-16 | Fixed lesson creation with user dropdowns |
| 2026-01-16 | Fixed user invitation (was sending role instead of accountType) |
| 2026-01-16 | Added horse profile enhancements (notes, DOB, owner) |
| 2026-01-16 | Added document and genetics upload functionality |
| 2026-01-16 | Added user dropdowns to invoices |
| 2026-01-16 | Added bulk invitation system with shareable links |
| 2026-01-16 | Updated registration to require barn name and phone |
| 2026-01-16 | Created super admin dashboard at /admin |
| 2026-01-16 | Fixed TypeScript errors for production build |
| 2026-01-16 | Implemented Windcave payment gateway integration |
| 2026-01-16 | Implemented Twilio Verify 2FA for SMS verification |
| 2026-01-17 | Added 2FA settings UI (/settings/security) and 2FA option during registration |
| 2026-01-17 | Implemented full vendor portal UI (directory, connections, appointments, booking) |
| 2026-01-17 | Implemented billing templates UI at /settings/billing-templates |

---

## Twilio Verify 2FA Integration

### Environment Variables Required
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid
```

### Features Implemented
- **SMS Verification** - OTP codes sent via Twilio Verify
- **Login with 2FA** - After password, user enters SMS code
- **Enable/Disable 2FA** - Users can manage in settings
- **Phone Verification** - Phone verified during 2FA setup
- **Resend Code** - With cooldown to prevent abuse

### API Endpoints
- `POST /auth/verify-2fa` - Verify code during login
- `POST /auth/resend-2fa` - Resend verification code
- `GET /auth/2fa/status` - Get 2FA status
- `POST /auth/2fa/send-code` - Send code to enable 2FA
- `POST /auth/2fa/enable` - Verify and enable 2FA
- `POST /auth/2fa/disable` - Disable 2FA (requires password)

---

## Windcave Payment Integration

### Environment Variables Required
```
WINDCAVE_API_URL=https://sec.windcave.com/api/v1
WINDCAVE_API_USER=your_api_username
WINDCAVE_API_KEY=your_api_key
WINDCAVE_WEBHOOK_SECRET=your_webhook_secret (optional)
```

### Features Implemented
- **Hosted Payment Page (HPP)** - Secure redirect to Windcave for card payments
- **Payment Session Management** - Create and query payment sessions
- **Webhook/Callback Support** - Automatic invoice status updates
- **Refund Processing** - Full refund support for paid invoices
- **Manual Payment Recording** - Staff can record cash/check payments

### Payment Flow
1. User clicks "Pay with Card" on invoice
2. Backend creates Windcave session via `/invoices/:id/payment`
3. User redirected to Windcave HPP
4. After payment, user returns to invoice page
5. Frontend polls `/invoices/:id/payment-status` to get result
6. Windcave sends callback to `/api/invoices/windcave-callback`

---

## Status Legend
- ⬜ TODO - Not started
- 🔄 IN PROGRESS - Currently being worked on
- ✅ DONE - Completed
- ⚠️ BLOCKED - Waiting on external dependency (API key, etc.)


# KEYS NEEDED (some already added)
See .env.example for required environment variables. Do not commit actual secrets to this file.

Required services:
- Google Cloud Storage (GCS_PROJECT_ID, GCS_CLIENT_EMAIL, GCS_PRIVATE_KEY, GCS_BUCKET_NAME)
- Twilio (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID, TWILIO_PHONE_NUMBER)
- Windcave (WINDCAVE_API_URL, WINDCAVE_API_USER, WINDCAVE_API_KEY, WINDCAVE_WEBHOOK_SECRET)
- Frontend/API URLs (FRONTEND_URL, API_URL)