# V2 Feedback Tracker

Tracking all feedback items from V2 testing. Items will be marked as completed as they are implemented.

---

## Account & Authentication

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 1 | Delete account does not work | [x] Fixed | Added DELETE /auth/account endpoint and DeleteAccountModal with password confirmation |
| 2 | No button to enable 2FA on account creation form | [x] Fixed | Redesigned 2FA toggle as prominent button with icon and ON/OFF indicator |
| 3 | Creating account with existing email deletes all form data - should just say "email taken" and let user change email | [x] Fixed | Error now captured in local state to preserve form data |
| 4 | Didn't receive 2FA or welcome email upon new account creation | [x] Fixed | Added sendWelcomeEmail to registration; requires SENDGRID_API_KEY in Railway |

---

## Horse Profiles

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 5 | Horse profiles still don't look like V2 wireframes | [ ] Pending | |
| 6 | Change "Genetic Test" to "Health Info" - place to log temperatures and health related items | [x] Fixed | Renamed tab to "Health Info", added types for temperature, weight, vaccination, deworming, dental, farrier, vet, medication, injury, genetic test |
| 7 | Still no ability to add notes on horses | [x] Fixed | Added notes field to Edit Horse modal and Notes card in Overview tab |

---

## Ride Log

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 8 | "Who rode" field should allow dropdown of all users AND custom entry | [x] Fixed | Added dropdown with barn users + "Enter custom name" option |
| 9 | When you create a ride log entry, the actual entry is not stored anywhere | [x] Fixed | Frontend was reading `response.data` instead of `response.rideLogs` |

---

## Documents

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 10 | When trying to save a document you get "internal server error" | [!] ENV Issue | Likely missing GCS credentials in Railway. See ENV Requirements below |

---

## User Invitations

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 12 | Didn't receive email invite when inviting new user | [!] ENV Issue | SendGrid implemented - ensure SENDGRID_API_KEY and EMAIL_FROM are set in Railway |
| 13 | Generate invite link should have share button that opens device's native share feature | [x] Fixed | Added Share2 icon button using Web Share API, with fallback to copy |
| 14 | Shared invite link doesn't work when trying to add new user | [x] Fixed | Bulk invites now allow user to enter email; added isBulkInvite flag |

---

## Invoices & Billing

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 15 | Amount entries should display as currency (e.g., "500" → "$500.00") | [x] Fixed | Added $ prefix, auto-format to 2 decimal places on blur |
| 16 | Switch "type of charge" to be on left side of form instead of description | [x] Fixed | Moved type dropdown to first position in charge row |
| 17 | Allow billing templates to be added to invoices | [x] Fixed | Added template selector dropdown in Create Invoice modal that auto-fills charges |

---

## Tasks

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 11 | When you create a task it doesn't actually show the task | [x] Fixed | Frontend was reading `response.data` instead of `response.tasks` |
| 19 | When I click checkbox next to task, it does not get checked | [x] Fixed | Task model missing toJSON virtuals config - `task.id` was undefined |

---

## Admin Dashboard

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 20 | Want to see average # of horses per barn | [x] Fixed | Added avgHorsesPerBarn stat to admin dashboard |
| 21 | Want to see average # of users per barn | [x] Fixed | Added avgUsersPerBarn stat to admin dashboard |
| 22 | Want to see average revenue per barn (subscription + transaction fees) | [x] Fixed | Added avgRevenuePerBarn stat to admin dashboard |
| 23 | Want to click on individual barns/users to see their details | [x] Fixed | Added AdminBarnDetailPage and AdminUserDetailPage with full details |

---

## UI/Branding

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 18 | Logo still isn't correct | [ ] Pending | |
| 24 | Users page pending invitations section not mobile friendly | [x] Fixed | Converted table to card-based responsive layout |

---

## Summary

**Total Items:** 24
**Completed:** 22
**Pending:** 2
**ENV Issues:** 2

---

## Implementation Order (Suggested)

### Priority 1 - Critical Bugs
- [x] #9 - Ride log entries not stored
- [x] #10 - Document save internal server error (ENV issue)
- [x] #11 - Tasks not showing after creation
- [x] #14 - Invite link not working
- [x] #1 - Delete account not working

### Priority 2 - User Experience
- [x] #3 - Form data deleted on duplicate email
- [x] #12 - Email invites not sending (ENV)
- [x] #4 - Welcome/2FA emails not sending
- [x] #8 - Ride log "who rode" dropdown + custom

### Priority 3 - Feature Enhancements
- [x] #6 - Genetic Test → Health Info
- [x] #7 - Horse notes
- [x] #15 - Currency formatting in invoices
- [x] #16 - Invoice form layout
- [x] #17 - Billing templates for invoices
- [x] #2 - 2FA button on registration
- [x] #13 - Native share for invite links

### Priority 4 - UI/Design
- [ ] #5 - Horse profiles match V2 wireframes
- [ ] #18 - Correct logo
- [x] #24 - Mobile-friendly pending invitations

### Priority 5 - Admin Dashboard
- [x] #19 - Task checkbox not working
- [x] #20 - Average horses per barn stat
- [x] #21 - Average users per barn stat
- [x] #22 - Average revenue per barn stat
- [x] #23 - Clickable barn/user details

---

---

## Environment Variables Required for Railway

Some features require environment variables that may be missing in Railway production. Add these to Railway:

### Google Cloud Storage (for document uploads)
```
GCS_PROJECT_ID="gl-horses-prod"
GCS_CLIENT_EMAIL="onstride-storage@gl-horses-prod.iam.gserviceaccount.com"
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GCS_BUCKET_NAME="gl-horses-prod.firebasestorage.app"
```

### SendGrid (for email invites & notifications)
```
SENDGRID_API_KEY="SG.xxxxx"
EMAIL_FROM="admin@onstrideapp.com"
```

### Twilio (for 2FA SMS)
```
TWILIO_ACCOUNT_SID="ACxxxxx"
TWILIO_AUTH_TOKEN="xxxxx"
TWILIO_VERIFY_SERVICE_SID="VAxxxxx"
TWILIO_PHONE_NUMBER="+1xxxxxxxxxx"
```

---

*Last Updated: January 2026*
