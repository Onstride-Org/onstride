# 2026-02-03 Feedback Notes

## Signup + Onboarding Flow
- Prospective users complete the signup form, receive a confirmation email, and are redirected back to the site.
- After payment, show a three-step “How it works / First steps” modal to guide them into the product.

## Windcave + Billing
- Ensure Windcave transactions support decimal precision for charges and fees.
- Build the SaaS subscription workflow with Windcave so paid users immediately receive a subscription record on their profile.

## Payment Processing Fees
- Debit/ACH: apply 0.5% processing fee, capped at $5 per transaction.
- Credit: apply a flat 3% processing fee.

## Scheduling Workflow
- When tasks, lessons, or similar events are scheduled, the assigned user must explicitly approve, deny, or request a reschedule.
- Send reminders 24 hours before the event (or as soon as possible if scheduled within that window).

## Groomer Permissions
- Groomer role should be limited to Horses, Tasks, and Todo List views only.
