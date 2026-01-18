# OnStride V2 Updates - API Integrations

## Overview
This document tracks the setup and testing of external API integrations for V2.

---

## Integration Status

| Service | Purpose | Local Testing | Production |
|---------|---------|---------------|------------|
| **Twilio Verify** | 2FA SMS verification | ⏳ Account Under Twilio Review (Error 60238) | ⬜ Pending |
| **Windcave** | Payment processing | ❌ Invalid credentials - Contact Windcave | ⬜ Pending |
| **Google Cloud Storage** | Document/file uploads | ✅ Tested & Working | ⬜ Pending |

---

## 1. Twilio Verify (2FA SMS)

### What It Does
- Sends OTP codes via SMS for two-factor authentication
- Verifies phone numbers during 2FA setup
- Handles login verification when 2FA is enabled

### API Keys Needed

You need to get these from [Twilio Console](https://console.twilio.com/):

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### How to Get the Keys

1. **Create Twilio Account** (if you don't have one)
   - Go to https://www.twilio.com/try-twilio
   - Sign up and verify your email

2. **Get Account SID and Auth Token**
   - Go to Twilio Console Dashboard
   - Account SID and Auth Token are displayed on the main page
   - Click "Show" to reveal the Auth Token

3. **Create a Verify Service**
   - Go to: Console → Verify → Services
   - Click "Create new Service"
   - Name it: "OnStride" or "OnStride 2FA"
   - Copy the Service SID (starts with VA)

4. **Add a Phone Number** (for sending SMS)
   - Go to: Console → Phone Numbers → Manage → Buy a number
   - Buy a number with SMS capability
   - Note: Trial accounts can only send to verified numbers

### Local Testing Status
- [x] Keys obtained from Twilio
- [x] Added to server/.env
- [ ] **NEXT:** Verify your phone number in Twilio console (trial account requirement)
- [ ] Test sending verification code
- [ ] Test verifying code
- [ ] Test 2FA login flow

### Account Review Status (Error 60238)
**Current Status:** Your Twilio account is upgraded ($20 balance) but under compliance review.

**Error:** `60238 - Verification Creation Attempt blocked by Twilio`

**Resolution:**
- Wait up to 72 hours for auto-approval
- Check email for any verification requests from Twilio
- If not resolved, contact Twilio Support: https://help.twilio.com/

Once approved, 2FA will work automatically with no code changes.

---

## 2. Windcave (Payment Processing)

### What It Does
- Processes credit/debit card payments for invoices
- Hosted Payment Page (HPP) for secure card entry
- Handles refunds and payment status

### API Keys Needed

You need to get these from Windcave (contact your Windcave representative):

```
WINDCAVE_API_URL=https://sec.windcave.com/api/v1
WINDCAVE_API_USER=your_api_username
WINDCAVE_API_KEY=your_api_key
WINDCAVE_WEBHOOK_SECRET=your_webhook_secret (optional)
```

### How to Get the Keys

1. **Contact Windcave**
   - Website: https://www.windcave.com
   - Request API credentials for integration

2. **Test vs Production**
   - Windcave provides separate test and production credentials
   - Use test credentials for local development
   - Test URL: https://uat.windcave.com/api/v1 (if available)
   - Production URL: https://sec.windcave.com/api/v1

3. **Required Information for Windcave**
   - Your business details
   - Integration type: REST API with HPP
   - Currency: NZD (or your preferred currency)

### Local Testing Status
- [x] Credentials added to server/.env
- [ ] **BLOCKED:** Credentials rejected with "Invalid username or key"
- [ ] Test creating payment session
- [ ] Test payment flow with test card
- [ ] Test payment status callback

### Credential Issue
**Error:** `Invalid username or key` on both production and UAT environments

**Credentials provided:**
- User: `OnStride_dev`
- Key: `13ecdae6c2...` (64 chars)

**Possible causes:**
1. Credentials not yet activated by Windcave
2. Credentials are for a different environment/portal
3. Account not fully set up

**Action needed:** Contact Windcave support to verify:
- Are these credentials activated?
- What API URL should they be used with?
- Is the merchant account fully configured?

---

## 3. Google Cloud Storage (Already Configured)

### What It Does
- Stores horse documents (registrations, health records, etc.)
- Stores user avatars
- Stores barn logos

### API Keys Currently in .env

```
GCS_PROJECT_ID=gl-horses-prod
GCS_CLIENT_EMAIL=onstride-storage@gl-horses-prod.iam.gserviceaccount.com
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GCS_BUCKET_NAME=onstride-storage
```

### Local Testing Status
- [x] Service account created
- [x] Keys added to server/.env
- [x] Storage service implemented
- [x] Test uploading a document ✅
- [x] Test file deletion ✅
- [ ] Test via UI (upload document to horse profile)

### Correct Bucket Name
**Important:** The bucket name is `gl-horses-prod.firebasestorage.app` (not `onstride-storage`)

---

## Testing Checklist

### Phase 1: Twilio Verify
1. Get API keys from Twilio Console
2. Add to server/.env
3. Test locally:
   - Enable 2FA in settings
   - Receive SMS code
   - Verify code works
   - Login with 2FA

### Phase 2: Windcave
1. Get test API credentials from Windcave
2. Add to server/.env
3. Test locally:
   - Create an invoice
   - Click "Pay with Card"
   - Complete payment on Windcave HPP
   - Verify invoice marked as paid

### Phase 3: Google Cloud Storage
1. Already configured
2. Test locally:
   - Upload document to horse profile
   - Upload user avatar
   - Upload barn logo
   - Verify files appear in GCS bucket

### Phase 4: Production Deployment
1. Add all environment variables to Railway
2. Test each integration in production
3. Monitor for errors

---

## Progress Log

| Date | Update |
|------|--------|
| 2026-01-18 | Created V2-UPDATES.md, GCS already configured locally |
| 2026-01-18 | Twilio keys added, hit account review block (error 60238) |
| 2026-01-18 | GCS tested successfully - bucket is `gl-horses-prod.firebasestorage.app` |
| 2026-01-18 | Windcave credentials added but rejected - need to contact Windcave |

---

## Next Steps

**Start with: Twilio Verify**

Do you have a Twilio account? If not, create one at https://www.twilio.com/try-twilio

Once you have the account, get these 3 values:
1. Account SID (from dashboard)
2. Auth Token (from dashboard)
3. Verify Service SID (create a Verify service)

Then provide them and we'll test the 2FA flow locally.
