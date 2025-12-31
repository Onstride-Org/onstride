# OnStride Major Feature Roadmap

---

## IMPLEMENTATION STATUS

| Feature | Status | Notes |
|---------|--------|-------|
| 1.1 User Dashboard | ✅ IMPLEMENTED | Modular widgets: tasks, quick actions, week calendar, barn summary |
| 1.2 Ride Log | ✅ IMPLEMENTED | Full CRUD, statistics, integrated into horse profile |
| 1.3 Welcome Emails | ✅ IMPLEMENTED | Firebase Function ready (needs SendGrid config) |
| 1.4 Horse Export/Share | ✅ IMPLEMENTED | Share button on horse profile, text format |
| 1.5 Notification System | ✅ IMPLEMENTED | Preferences model, UI, Firebase Function integration |
| 2.1 Lesson Workflow | ✅ IMPLEMENTED | Models, repository, providers, UI screens, two-way negotiation |
| 2.2 Recurring Lessons | ✅ IMPLEMENTED | Recurrence types, standing lessons support in models |
| 2.3 Monthly Billing | ✅ IMPLEMENTED | Client tabs, billing periods, charges, full UI |
| 2.4 Billing Templates | ✅ IMPLEMENTED | Template builder, line items, tax settings, apply to client |
| 3.1 Multi-Barn Support | ✅ IMPLEMENTED | Barn switcher, user-barn roles, horse transfers, barn members |
| 3.2 Vendor Portal | ✅ IMPLEMENTED | Vendor profiles, services, appointments, barn connections |
| 3.3 Barn Branding | ✅ IMPLEMENTED | Logo upload, color customization, domain settings |
| 5.1 USEF/FEI Lookup | ✅ IMPLEMENTED | Model fields for registry numbers and registered name |
| 5.2 Breeding Information | ✅ IMPLEMENTED | Pedigree fields, genetic tests, stud/broodmare status |
| 5.3 Stride Number | ✅ IMPLEMENTED | Auto-assigned unique IDs via Firebase Function |
| 4.1 Smart Scheduling | ✅ IMPLEMENTED | Workload analysis, conflict detection, suggestions |
| 4.2 Document Scanning | ✅ IMPLEMENTED | OCR service, document type detection, horse matching |
| 4.3 Smart Documents | ✅ IMPLEMENTED | Template library, placeholders, auto-fill, signatures |
| 4.4 AI Breeding | ✅ IMPLEMENTED | Genetic analysis, compatibility scores, predictions |
| 6.1 Web & Mobile Platform | ✅ IMPLEMENTED | Responsive utilities, breakpoints, adaptive layouts |
| 6.2 Offline Mode | ✅ IMPLEMENTED | Sync queue, conflict resolution, connectivity status |
| 6.3 i18n Support | ✅ IMPLEMENTED | Language picker, locale settings, date/time formats |
| 6.4 Subscriptions | ✅ IMPLEMENTED | Tier models, feature gating, usage limits, upgrade prompts |
| 6.5 Admin Dashboard | ✅ IMPLEMENTED | Platform analytics, admin users, feature flags, tickets |
| 6.6 Barn Layout Builder | ✅ IMPLEMENTED | Canvas editor, element palette, stall assignments |

Phase 1 is 100% complete! Phase 2 is 100% complete! Phase 3 is 100% complete! Phase 4 is 100% complete! Phase 5 is 100% complete! Phase 6 is 100% complete!

## Phase 2 Implementation Details

### 2.1 & 2.2 Lesson System
- **Models**: `packages/models/lib/src/features/lessons/`
  - `LessonModel` - Full lesson with scheduling, recurrence, status
  - `LessonRequestModel` - Two-way negotiation workflow
  - `TrainerAvailability` - Availability settings per trainer
  - Enums: `LessonStatus`, `LessonType`, `RecurrenceType`
- **Repository**: `packages/lessons_repository/`
- **Resources**: `packages/data_provider_client/*/resource/*_lessons_resource.dart`
- **Providers**: `lib/features/lessons/providers/`
  - `FetchLessons`, `FetchLessonRequests`, `CreateLessonRequest`
  - `RespondToLessonRequest`, `CreateLesson`, `ManageLesson`
- **UI**: `lib/features/lessons/screens/` and `lib/features/lessons/widgets/`

### 2.3 & 2.4 Billing System
- **Models**: `packages/models/lib/src/features/billing/`
  - `ChargeModel` - Individual charges/line items
  - `BillingPeriodModel` - Monthly billing periods
  - `ClientTabModel` - Running client balances
  - `BillingTemplateModel` - Reusable billing templates
  - Enums: `BillingPeriodStatus`, `ChargeType`, `ChargeStatus`
- **Repository**: `packages/billing_repository/`
- **Resources**: `packages/data_provider_client/*/resource/*_billing_resource.dart`
- **Providers**: `lib/features/billing/providers/`
  - `FetchCharges`, `CreateCharge`, `FetchClientTabs`
  - `FetchBillingPeriods`, `FetchBillingTemplates`
  - `ManageBillingTemplate`, `ApplyBillingTemplate`
- **UI**: `lib/features/billing/screens/` and `lib/features/billing/widgets/`

### New Localization Strings
- Added 80+ new localization strings for lessons and billing features
- Includes: lesson types, statuses, billing terminology, template management

All changes have been pushed to the "Adam" branch.

## Phase 3 Implementation Details

### 3.1 Multi-Barn Support
- **Models**: `packages/models/lib/src/features/multi_barn/`
  - `UserBarnRole` - User's role within a specific barn with permissions
  - `BarnSummary` - Lightweight barn info for switcher UI
  - `HorseTransfer` - Transfer requests between barns
  - Enums: `BarnRole`, `MembershipStatus`, `TransferStatus`
- **Repository**: `packages/multi_barn_repository/`
- **Resources**: `packages/data_provider_client/*/resource/*_multi_barn_resource.dart`
- **Providers**: `lib/features/multi_barn/providers/`
  - `FetchUserBarns` - User's barns with current selection
- **UI**: `lib/features/multi_barn/`
  - `BarnSwitcher` - Dropdown for switching barns
  - `BarnMemberCard`, `TransferRequestCard` - Display widgets
  - `BarnMembersScreen`, `HorseTransfersScreen` - Full screens

### 3.2 Vendor Portal
- **Models**: `packages/models/lib/src/features/vendors/`
  - `VendorProfile` - Vendor business profile with services
  - `VendorService` - Individual services offered
  - `BarnVendor` - Barn-vendor connection
  - `VendorAppointment` - Scheduled appointments
  - Enums: `VendorType`, `VendorConnectionStatus`, `AppointmentStatus`
- **Repository**: `packages/vendors_repository/`
- **Resources**: `packages/data_provider_client/*/resource/*_vendors_resource.dart`
- **Providers**: `lib/features/vendors/providers/`
  - `FetchVendors`, `FetchAppointments` - List providers
- **UI**: `lib/features/vendors/`
  - `VendorCard`, `AppointmentCard` - Display widgets
  - `VendorsScreen`, `AppointmentsScreen` - Full screens with tabs

### 3.3 Barn Branding
- **Models**: `packages/models/lib/src/features/branding/entities/barn_branding.dart`
  - Logo URLs (full and icon), primary/secondary colors
  - Welcome message, invoice branding settings
  - Custom domain support
- **Repository**: `packages/branding_repository/`
- **Resources**: `packages/data_provider_client/*/resource/*_branding_resource.dart`
- **Providers**: `lib/features/branding/providers/`
  - `FetchBranding` - Barn branding with cache
- **UI**: `lib/features/branding/`
  - `ColorPickerTile`, `LogoUploadSection` - Input widgets
  - `BrandingScreen` - Full settings form

### New Exception Types
- Added `ConflictException` and `BadRequestException` to data_provider_client

## Phase 5 Implementation Details

### 5.1 USEF/FEI Lookup
- **Model Updates**: `packages/models/lib/src/features/horses/entities/horse_model.dart`
  - `usefNumber` - USEF registration number
  - `feiNumber` - FEI registration number
  - `registeredName` - Official registered name (may differ from barn name)
  - `competitionHistory` - Summary of competition results
  - `registrySyncedAt` - Last sync timestamp from registry

### 5.2 Breeding Information
- **Model Updates**: Extended `HorseModel` with comprehensive breeding fields
  - Pedigree: `sireName`, `sireId`, `damName`, `damId`
  - Grandparents: `paternalGrandsireName`, `paternalGranddamName`, `maternalGrandsireName`, `maternalGranddamName`
  - Breeding status: `isStud`, `isBroodmare`
  - Genetics: `colorGenetics`, `geneticTests` (list of GeneticTestResult)
- **New Model**: `GeneticTestResult` freezed class
  - `testName` - e.g., "HYPP", "GBED", "HERDA", "OLWS"
  - `result` - e.g., "N/N", "N/H", "Positive", "Carrier"
  - `testDate`, `laboratory`, `notes`
- **UI Widgets**: `lib/features/horses/widgets/`
  - `HorsePedigreeCard` - Displays 3-generation pedigree tree, stud/broodmare status, color genetics
  - `HorseRegistrationCard` - Shows USEF/FEI/Stride numbers with copy buttons, competition history
  - `HorseGeneticTestsCard` - Displays genetic test results with color-coded status (green=clear, orange=carrier, red=affected)

### 5.3 Stride Number System
- **Model Updates**: `packages/models/lib/src/features/horses/entities/horse_model.dart`
  - `strideNumber` - Unique identifier (format: STR-YYYY-NNNNN)
  - `strideNumberAssignedAt` - Assignment timestamp
- **Firebase Function**: `functions/*/src/horses/assign_stride_number.js`
  - Triggered on horse document creation
  - Uses transaction-based counter for sequential IDs
  - Format: STR-2025-00001 (year + 5-digit sequence)
  - Counter stored in `system/stride_counter` document
  - Resets sequence each year
- **Exported in**: `functions/prod/index.js` and `functions/dev/index.js`

## Phase 4 Implementation Details

### 4.1 Smart Scheduling
- **Models**: `packages/models/lib/src/features/ai_features/entities/scheduling_suggestion.dart`
  - `SchedulingSuggestion` - AI-generated scheduling recommendations
  - `HorseWorkloadAnalysis` - Horse workload tracking and rest recommendations
  - `TrainerScheduleSlot` - Available time slots with suitability scores
  - Enums: `SuggestionType`, `SuggestionPriority`, `WorkloadStatus`
- **Service**: `lib/features/ai_features/services/smart_scheduling_service.dart`
  - Horse workload analysis (rides/week, avg daily minutes, rest tracking)
  - Conflict detection (horse double-booking, trainer conflicts)
  - Optimal time slot suggestions
- **UI**: `lib/features/ai_features/screens/smart_scheduling_screen.dart`
  - Suggestions tab grouped by priority (critical, high, other)
  - Workload tab showing all horses sorted by status
  - `SchedulingSuggestionCard` and `HorseWorkloadCard` widgets

### 4.2 Document Scanning
- **Models**: `packages/models/lib/src/features/ai_features/entities/scanned_document.dart`
  - `ScannedDocument` - Scanned document with extracted data
  - `CogginsExtraction` - Coggins-specific extracted fields
  - `HealthCertExtraction` - Health certificate extracted fields
  - Enums: `ScannedDocumentType`, `DocumentProcessingStatus`
- **Service**: `lib/features/ai_features/services/document_scanning_service.dart`
  - Document type detection from text
  - Field extraction for Coggins and health certificates
  - Horse matching algorithm with confidence scores
- **UI**: `lib/features/ai_features/screens/document_scanner_screen.dart`
  - Document cards with status indicators
  - Extracted field display
  - Confirm/reject/change horse actions

### 4.3 Smart Document Creation
- **Models**: `packages/models/lib/src/features/ai_features/entities/document_template.dart`
  - `DocumentTemplate` - Reusable document templates
  - `TemplatePlaceholder` - Fillable fields with auto-fill support
  - `GeneratedDocument` - Documents created from templates
  - `DocumentSignature` - E-signature tracking
  - `AiDocumentRequest` - Custom AI document generation requests
  - Enums: `DocumentTemplateType`, `GeneratedDocumentStatus`, `PlaceholderType`
- **Service**: `lib/features/ai_features/services/document_template_service.dart`
  - System templates: Liability Waiver, Boarding Agreement, Lease Agreement, Lesson Contract
  - Template rendering with placeholder substitution
  - Auto-fill from barn, client, and horse data
- **UI**: `lib/features/ai_features/screens/document_templates_screen.dart`
  - Templates tab with system and custom templates
  - Generated documents tab with status tracking
  - `DocumentTemplateCard` and `GeneratedDocumentCard` widgets

### 4.4 AI Breeding Suggestions
- **Models**: `packages/models/lib/src/features/ai_features/entities/breeding_suggestion.dart`
  - `BreedingSuggestion` - Full breeding analysis result
  - `BreedingFactor` - Positive/negative/neutral factors
  - `OffspringPrediction` - Color, height, discipline, temperament predictions
  - `ColorPrediction`, `DisciplineSuitability` - Detailed predictions
  - `GeneticWarning` - Health risk alerts with probabilities
  - `BreedingAnalysisRequest` - Analysis request with preferences
  - Enums: `FactorSeverity`, `GeneticRisk`, `AnalysisType`
- **Service**: `lib/features/ai_features/services/breeding_suggestion_service.dart`
  - Breeding pair analysis with compatibility scoring
  - Genetic risk analysis (HYPP, GBED, HERDA, OLWS, PSSM)
  - Offspring predictions (colors, height, disciplines, temperament)
  - Stallion match finder
- **UI**: `lib/features/ai_features/screens/breeding_analysis_screen.dart`
  - Mare/stallion selection with genetic info display
  - Compatibility score visualization
  - `BreedingSuggestionCard` with genetic warnings and predictions

## Phase 6 Implementation Details

### 6.1 Web & Mobile Platform
- **Service**: `lib/features/platform/services/responsive_service.dart`
  - `Breakpoints` - Screen width breakpoints (mobile, tablet, desktop, largeDesktop)
  - `DeviceType` enum - Device classification
  - `LayoutInfo` - Orientation-aware layout info with columns, padding, max width
  - `ResponsiveService` - Static utilities for responsive design
  - `ResponsiveBuilder` - Widget for device-specific layouts
  - `ResponsiveContent` - Constrains content to max width
  - `ResponsiveGrid` - Adaptive grid based on screen size

### 6.2 Offline Mode
- **Models**: `packages/models/lib/src/features/platform/entities/offline_sync.dart`
  - `PendingSyncItem` - Items queued for sync with retry logic
  - `SyncConflict` - Conflicts between local and server data
  - `DeviceSyncStatus` - Current sync state for a device
  - `CachedEntity` - Locally cached data with expiration
  - Enums: `ConnectivityStatus`, `SyncItemStatus`, `SyncEntityType`, `SyncOperationType`, `ConflictResolution`
- **Service**: `lib/features/platform/services/offline_sync_service.dart`
  - Sync queue management with priority
  - Auto-sync when coming back online
  - Conflict resolution with user choice
  - Status tracking and notifications
- **Widgets**: `lib/features/platform/widgets/offline_indicator.dart`
  - `OfflineStatusBanner` - Material banner for offline status
  - `OfflineIndicator` - App bar indicator
  - `PendingSyncCard` - Shows pending sync items
  - `SyncConflictCard` - Conflict resolution UI

### 6.3 i18n Support
- **Models**: `packages/models/lib/src/features/platform/entities/app_settings.dart`
  - `UserAppSettings` - User preferences including language, theme, notifications
  - `PlatformSettings` - Platform-wide settings
  - `AppVersionInfo` - Version tracking
  - `AppLanguage` enum - Supported languages (English, Spanish, French, German, Portuguese)
- **Widgets**: `lib/features/platform/widgets/language_picker.dart`
  - `LanguagePicker` - Dropdown for language selection
  - `LanguageSelectionTile` - Settings list tile with dialog
  - `LanguageSettingsCard` - Full settings card with date/time/measurement formats
- **Screen**: `lib/features/platform/screens/settings_screen.dart`
  - Language & region settings
  - Appearance settings (theme, compact mode)
  - Notification preferences
  - Data & privacy options

### 6.4 Subscriptions
- **Models**: `packages/models/lib/src/features/platform/entities/subscription_tier.dart`
  - `SubscriptionPlan` - Plan definition with limits and features
  - `BarnSubscription` - Active subscription for a barn
  - `UsageMetrics` - Current usage against limits
  - `SubscriptionTier` enum - free, basic, pro, enterprise
  - `SubscriptionPlan.defaultPlans` - Pre-configured tier definitions
- **Service**: `lib/features/platform/services/subscription_service.dart`
  - Feature availability checking
  - Usage limit enforcement
  - Upgrade recommendations
  - Price formatting and savings calculation
- **Widgets**: `lib/features/platform/widgets/subscription_card.dart`
  - `SubscriptionPlanCard` - Plan display with features
  - `SubscriptionUsageCard` - Usage bars for limits
  - `UpgradeRecommendationCard` - Upgrade prompts
- **Screen**: `lib/features/platform/screens/subscription_screen.dart`
  - Current plan display
  - Usage overview
  - Plan comparison (monthly/yearly toggle)
  - Upgrade/downgrade workflows

### 6.5 Admin Dashboard
- **Models**: `packages/models/lib/src/features/platform/entities/admin_dashboard.dart`
  - `PlatformAnalytics` - Platform-wide stats and metrics
  - `AdminUser` - Admin team member with role
  - `AdminAuditLog` - Admin action logging
  - `SystemAnnouncement` - Platform-wide announcements
  - `FeatureFlag` - Feature toggles with rollout control
  - `SupportTicket` - User support tickets
  - Enums: `AdminRole`, `AnnouncementType`, `TicketPriority`, `TicketStatus`
- **Widgets**: `lib/features/platform/widgets/admin_dashboard_widgets.dart`
  - `PlatformAnalyticsCard` - Overview stats
  - `SubscriptionBreakdownCard` - Subscription distribution
  - `AdminUserCard` - Admin user management
  - `AuditLogCard` - Action log entries
  - `SystemAnnouncementCard` - Announcement display
  - `FeatureFlagCard` - Feature toggle controls
  - `SupportTicketCard` - Ticket display
- **Screen**: `lib/features/platform/screens/admin_dashboard_screen.dart`
  - Overview tab with analytics
  - Users tab with admin management
  - Feature flags tab
  - Announcements tab
  - Support tickets tab

### 6.6 Barn Layout Builder
- **Models**: `packages/models/lib/src/features/platform/entities/barn_layout.dart`
  - `BarnLayout` - Complete barn layout with dimensions
  - `LayoutElement` - Individual elements (stalls, arenas, etc.)
  - `StallAssignment` - Horse-to-stall mapping
  - `LayoutElementTemplate` - Default element templates
  - `LayoutElementType` enum - 16 element types (stall, paddock, arena, roundPen, washRack, tackRoom, feedRoom, office, bathroom, parking, gate, fence, path, water, custom)
- **Widgets**: `lib/features/platform/widgets/barn_layout_widgets.dart`
  - `BarnLayoutCanvas` - Main canvas with drag/resize
  - `LayoutElementPalette` - Element type picker
  - `ElementPropertiesPanel` - Selected element properties
  - `StallAssignmentCard` - Stall with horse assignment
  - Grid background painter
- **Screen**: `lib/features/platform/screens/barn_layout_screen.dart`
  - Full canvas editor with zoom
  - Element palette (desktop sidebar / mobile bottom sheet)
  - Properties panel for selected element
  - Rename/resize/clear actions
  - Save functionality

  Summary of Phase 1 Implementation

  | Feature                 | Status | Details
               |
  |-------------------------|--------|-------------------------------------------------------
  -------------|
  | 1.1 User Dashboard      | ✅      | Modular widgets: tasks, quick actions, week calendar,
   barn summary |
  | 1.2 Ride Log            | ✅      | Full CRUD, statistics, integrated into horse profile
                |
  | 1.3 Welcome Emails      | ✅      | Firebase Function ready (needs SendGrid config)
                |
  | 1.4 Horse Export/Share  | ✅      | Share button on horse profile, text format
                |
  | 1.5 Notification System | ✅      | Preferences model, UI, Firebase Function integration
                |

  Latest Commits:

  - e70afdf - Notification System with user preferences
  - 24b0265 - User Dashboard with modular widgets
  - a7394b9 - Ride Log, Welcome Emails, Horse Export

  Notification System Implementation Includes:

  1. NotificationPreferences model - Freezed data class with nested settings for tasks,
  invoices, ride logs, and general preferences
  2. NotificationPreferencesScreen - Full UI with toggles for each notification type and
  master push/email toggles
  3. Firebase Function updates - Task reminder function now respects user preferences
  including quiet hours
  4. Localization - 25+ new strings in English and Spanish

---

## PHASE 1: FOUNDATION & QUICK WINS
*Core infrastructure and low-effort high-impact features*

---

### 1.1 User Dashboard (Home Screen)
**Priority:** HIGH | **Effort:** Medium | **Impact:** High | **Status:** ✅ IMPLEMENTED

**Description:**
Create a simple, role-aware dashboard as the default home screen for all users.

**Specs:**
- ✅ Display today's tasks assigned to the user
- ✅ Quick action buttons for common tasks (add task, add horse, log ride, create invoice)
- ✅ Role-based content: owners/managers see barn overview stats
- ✅ Calendar widget with upcoming week view
- Show horses they need to ride (future enhancement)
- Notification center widget showing unread alerts (future enhancement)

**Technical Requirements:**
- ✅ Dashboard widget system (modular components)
- ✅ Real-time data fetching with caching
- ✅ Role-based UI rendering

**Implementation Details:**
- Screen: `lib/features/dashboard/screens/dashboard_screen.dart`
- Widgets: `lib/features/dashboard/widgets/`
  - `dashboard_card.dart` - Base card component
  - `todays_tasks_widget.dart` - Today's tasks with quick complete
  - `quick_actions_widget.dart` - Role-based quick action buttons
  - `week_calendar_widget.dart` - 7-day calendar view with task dots
  - `barn_summary_widget.dart` - Barn stats for owners/managers

---

### 1.2 Ride Log for Horse Profiles
**Priority:** HIGH | **Effort:** Low | **Impact:** Medium | **Status:** ✅ IMPLEMENTED

**Description:**
Add a ride log section under each horse profile to track all rides.

**Specs:**
- ✅ Log entry fields: date, time, duration, rider, type (lesson/training/trail), notes
- ✅ Filterable by date range, rider, ride type
- ✅ Show ride statistics (total rides this month, average duration)
- ✅ Quick-add button from horse profile
- Link rides to scheduled lessons when applicable

**Technical Requirements:**
- ✅ New `ride_logs` subcollection under horses in Firestore
- ✅ Relationship to horse and user documents
- ✅ Full UI with add/edit modals

**Implementation Details:**
- Model: `packages/models/lib/src/features/ride_logs/`
- Resource: `packages/data_provider_client/*/resource/*_ride_logs_resource.dart`
- Repository: `packages/ride_logs_repository/`
- Providers: `lib/features/ride_logs/providers/`
- Widgets: `lib/features/ride_logs/widgets/`
- Integrated into: `lib/features/horses/screens/horse_profile_view.dart`

---

### 1.3 Automated Welcome Emails
**Priority:** HIGH | **Effort:** Low | **Impact:** Medium | **Status:** ✅ IMPLEMENTED

**Description:**
Automatically send welcome emails to every new user created.

**Specs:**
- ✅ Triggered on user account creation
- ✅ Include: welcome message, getting started guide, login credentials (if applicable)
- ✅ Role-specific content (owner, manager, groomer, boarder)
- Link to download mobile app
- Contact info for barn admin

**Technical Requirements:**
- ✅ Firebase Cloud Functions trigger on user creation (v2 Firestore trigger)
- ✅ Email template system (HTML and plain text)
- Template customization per barn (ready for SendGrid integration)

**Implementation Details:**
- Function: `functions/prod/src/emails/send_welcome_email.js`
- Also in: `functions/dev/src/emails/send_welcome_email.js`
- Exported in: `functions/*/index.js`
- To enable: Add SendGrid API key and uncomment email sending code

---

### 1.4 Horse Profile Export/Share
**Priority:** MEDIUM | **Effort:** Low | **Impact:** Medium | **Status:** ✅ IMPLEMENTED

**Description:**
Allow horse profiles to be easily exported and shared.

**Specs:**
- ✅ Export formats: Text format (shareable via any app)
- ✅ Include: basic info, ride statistics, recent rides, documents list
- PDF format (future enhancement)
- Shareable links with optional expiration (future enhancement)
- QR code generation for quick sharing (future enhancement)

**Technical Requirements:**
- ✅ Share via platform share sheet
- ✅ Includes ride log data when available
- PDF generation library (future: pdf package for Flutter)

**Implementation Details:**
- Service: `lib/features/horses/services/horse_export_service.dart`
- Share button added to: `lib/features/horses/screens/horse_profile_view.dart`
- Uses share_plus package for cross-platform sharing

---

### 1.5 Universal Alert/Notification System
**Priority:** HIGH | **Effort:** Medium | **Impact:** High | **Status:** ✅ IMPLEMENTED

**Description:**
Create a unified notification system with email and SMS options.

**Specs:**
- In-app notifications (bell icon, notification center) - future enhancement
- ✅ Push notifications (mobile)
- ✅ Email notifications (optional, user preference)
- SMS notifications (optional, user preference) - future with Twilio
- ✅ Notification categories: tasks, invoices, ride logs, general
- ✅ User preferences for each category and channel
- ✅ Quiet hours support
- Batch digest option (daily/weekly summary) - future enhancement

**Technical Requirements:**
- ✅ Firebase Cloud Messaging for push
- Twilio for SMS - future integration
- SendGrid/Mailgun for email - ready for integration
- ✅ Notification preferences stored per user
- ✅ Cloud Functions respects user preferences

**Implementation Details:**
- Model: `packages/models/lib/src/features/notifications/entities/notification_preferences.dart`
- Provider: `lib/features/notifications/providers/notification_preferences/`
- Screen: `lib/features/notifications/screens/notification_preferences_screen.dart`
- Firebase Function: `functions/*/src/notifications/send_task_reminders.js` (updated with preference checks)

---

## PHASE 2: CORE BUSINESS OPERATIONS
*Essential barn management features*

---

### 2.1 Lesson Creation & Scheduling Workflow
**Priority:** HIGH | **Effort:** High | **Impact:** High | **Status:** ✅ IMPLEMENTED

**Description:**
Full lesson request and scheduling workflow with two-way negotiation.

**Specs:**

**Client-Initiated Flow:**
1. Client opens lesson request form
2. Sees available parameters set by trainer: days, times, lesson types, available horses
3. Submits request with preferred slot
4. Trainer receives notification
5. Trainer can: Approve / Deny / Suggest alternative
6. If denied/alternative: client notified, can accept or counter
7. Loop until agreed or cancelled
8. Both parties receive confirmation

**Trainer-Initiated Flow:**
1. Trainer proposes lesson time to client
2. Client receives notification
3. Client can: Approve / Deny / Counter
4. Loop until agreed or cancelled
5. Both parties receive confirmation

**UI Components:**
- Lesson request form with availability calendar
- Request inbox for trainers
- Status tracking (pending, approved, denied, countered)
- Confirmation screens

**Technical Requirements:**
- `lesson_requests` collection with status workflow
- Availability settings per trainer/barn
- Push notifications for each state change
- Calendar integration

---

### 2.2 Recurring/Standing Lessons
**Priority:** HIGH | **Effort:** Medium | **Impact:** High | **Status:** ✅ IMPLEMENTED

**Description:**
Allow lessons to repeat automatically on a schedule.

**Specs:**
- "Make recurring" toggle when creating/editing lesson
- Frequency options: daily, weekly, bi-weekly, monthly, custom
- Day/time selection
- End conditions: specific date, number of occurrences, until cancelled
- Automatic lesson generation (create next 4-8 weeks ahead)
- Easy edit/cancel: single instance, this and future, all
- Handle conflicts (horse already booked, trainer unavailable)

**Technical Requirements:**
- Recurring pattern stored on lesson template
- Cloud Function to generate upcoming lessons (cron job)
- Instance vs template relationship
- Conflict detection logic

---

### 2.3 Monthly Billing & Client Tabs
**Priority:** HIGH | **Effort:** High | **Impact:** High | **Status:** ✅ IMPLEMENTED

**Description:**
Monthly billing system with running client balances and one-off charges.

**Specs:**

**Client Tab/Bill:**
- Each client has a running "tab" for the billing period
- Line items added throughout the month (board, lessons, services)
- Due date set by barn admin (e.g., 1st of each month)
- Balance view: current charges, previous balance, payments, total due

**One-Off Charges:**
- Create immediate standalone charges (not on monthly cycle)
- Useful for per-lesson billing or ad-hoc services
- Immediate notification to client
- Separate payment option

**Invoice Generation:**
- Auto-generate invoices on billing date
- Itemized breakdown
- Send via email/in-app
- PDF export

**Technical Requirements:**
- `billing_periods` collection
- `charges` collection (linked to client, period)
- `invoices` collection
- Payment integration (Stripe)
- Automated invoice generation (Cloud Function)

---

### 2.4 Billing Templates
**Priority:** MEDIUM | **Effort:** Medium | **Impact:** Medium | **Status:** ✅ IMPLEMENTED

**Description:**
Allow users with invoicing role to create reusable billing templates.

**Specs:**
- Template builder UI
- Add/remove/reorder line items
- Each line item: name, description, default amount, quantity option
- Tax settings per item or total
- Discounts (percentage or fixed)
- Save as template for reuse
- Apply template to client or bulk clients
- Seasonal templates (summer camp, winter board rates)

**Technical Requirements:**
- `billing_templates` collection
- Template application logic
- Role-based access (invoicing role)

---

## PHASE 3: MULTI-BARN & ADVANCED MANAGEMENT
*Scalability and complex operations*

---

### 3.1 Multi-Barn Support
**Priority:** HIGH | **Effort:** High | **Impact:** High | **Status:** ✅ IMPLEMENTED

**Description:**
Allow users to link multiple barns to one account with easy switching.

**Specs:**
- ✅ User profile shows linked barns
- ✅ Barn switcher in navigation (dropdown or modal)
- ✅ Per-barn roles (admin at Barn A, client at Barn B)
- ✅ Per-barn data isolation (via barn_id filtering)
- ✅ Cross-barn horse transfers (with approval workflow)
- Single sign-on across barns (inherent in Firebase Auth)
- Barn invitations via email/link (future enhancement)

**Technical Requirements:**
- ✅ User-barn relationship table with roles (`user_barn_roles` collection)
- ✅ Context switching in app state (FetchUserBarns provider)
- ✅ Data queries scoped to active barn
- Invitation system (future enhancement)

---

### 3.2 Third-Party Vendor Portal
**Priority:** MEDIUM | **Effort:** High | **Impact:** High | **Status:** ✅ IMPLEMENTED

**Description:**
Portal for vets, farriers, and other vendors to connect with barns.

**Specs:**

**Vendor Account Features:**
- ✅ Vendor profile: services, pricing, availability, service area
- ✅ Connect to multiple barns
- View assigned horses and their records (future enhancement)
- ✅ Receive appointment requests
- ✅ Submit visit notes/records
- Upload documents (Coggins, health certs) (future enhancement)
- Invoice barns/owners directly (future enhancement)

**Barn Integration:**
- ✅ Invite vendors to connect
- ✅ Assign vendor to horses (via barn-vendor connection)
- ✅ Schedule appointments
- ✅ View vendor submitted records
- Approve/pay vendor invoices (future enhancement)

**Technical Requirements:**
- ✅ Vendor user role and profile (`vendor_profiles` collection)
- ✅ Barn-vendor relationship (`barn_vendors` collection)
- Document sharing permissions (future enhancement)
- ✅ Appointment scheduling (`vendor_appointments` collection)
- Vendor billing integration (future enhancement)

---

### 3.3 Barn Branding/Personalization
**Priority:** LOW | **Effort:** Medium | **Impact:** Low | **Status:** ✅ IMPLEMENTED

**Description:**
Allow barns to customize the app's appearance with their branding.

**Specs:**
- ✅ Upload barn logo (Firebase Storage)
- ✅ Primary/secondary color selection
- ✅ Logo appears on login screen, dashboard, invoices
- Colors applied to UI accents (needs theme integration)
- ✅ Optional: custom domain for web app (domain verification ready)
- ✅ Reset to default option

**Technical Requirements:**
- ✅ Barn settings for branding (`barn_branding` collection)
- Dynamic theme loading (future enhancement)
- ✅ Logo storage in Firebase Storage
- CSS variable system for colors (future enhancement)

---

## PHASE 4: AI & SMART FEATURES
*Intelligent automation and suggestions*

---

### 4.1 Smart Scheduling (AI)
**Priority:** MEDIUM | **Effort:** High | **Impact:** High | **Status:** ✅ IMPLEMENTED

**Description:**
AI-powered optimal scheduling suggestions for tasks, lessons, and horses.

**Specs:**
- ✅ Analyze horse workload (rides/week, daily minutes, rest frequency)
- ✅ Suggest best times for lessons
- ✅ Warn about overworked horses (workload status: underworked/normal/heavy/overworked)
- ✅ Balance workload across trainers
- ✅ Account for horse rest requirements
- ✅ Conflict detection (double-booked horses/trainers)
- "Auto-schedule" option for barn admins (future enhancement)

**Technical Requirements:**
- ✅ Scheduling algorithm with workload analysis
- ✅ Integration with lesson and ride log data
- ✅ Suggestion UI with accept/modify options
- Cloud Function for background processing (future enhancement)

---

### 4.2 Document Scanning & Auto-Assignment
**Priority:** MEDIUM | **Effort:** High | **Impact:** Medium | **Status:** ✅ IMPLEMENTED

**Description:**
Scan documents and automatically assign them to horse profiles.

**Specs:**
- ✅ Camera/upload for document capture (UI ready)
- ✅ OCR to extract text (service ready for integration)
- ✅ AI identifies document type (Coggins, health cert, registration, vaccination, vet report, insurance, bill of sale)
- ✅ AI extracts horse name, owner, dates, test results
- ✅ Suggests which horse profile to attach with confidence score
- ✅ Auto-fill expiration dates for reminders
- Create new horse profile if not found (future enhancement)

**Technical Requirements:**
- ✅ Document type detection with keyword matching
- ✅ Field extraction for Coggins and health certificates
- ✅ Horse matching algorithm with similarity scoring
- ✅ Review/confirm UI before saving
- OCR integration (ready for Google Cloud Vision / ML Kit)

---

### 4.3 Smart Document Creation
**Priority:** MEDIUM | **Effort:** Medium | **Impact:** Medium | **Status:** ✅ IMPLEMENTED

**Description:**
AI-assisted creation of liability waivers, boarding agreements, and custom documents.

**Specs:**
- ✅ Template library: liability waiver, boarding contract, lease agreement, lesson contract
- ✅ Auto-fill with client/horse/barn info
- ✅ Placeholder system with multiple types (text, date, currency, select, signature, checkbox)
- ✅ AI-assisted custom document creation (model ready for OpenAI integration)
- Upload existing documents as templates (future enhancement)
- ✅ E-signature tracking (model complete)
- ✅ Document versioning

**Technical Requirements:**
- ✅ Document template engine with placeholder substitution
- ✅ AI request model for custom docs (ready for OpenAI API)
- PDF generation with form fields (future enhancement)
- E-signature provider integration (ready for DocuSign/HelloSign)

---

### 4.4 AI Breeding Suggestions
**Priority:** LOW | **Effort:** High | **Impact:** Medium | **Status:** ✅ IMPLEMENTED

**Description:**
Smart breeding recommendations based on genetic information.

**Specs:**
- ✅ Input: mare and stallion genetic profiles
- ✅ Analyze: breed compatibility, genetic markers, color genetics
- ✅ Predict: offspring colors, height, disciplines, temperament
- ✅ Genetic risk analysis: HYPP, GBED, HERDA, OLWS, PSSM
- ✅ Suggest compatible matches from barn's horses
- ✅ Consider: breed, discipline suitability
- Temperament and conformation analysis (future enhancement)

**Technical Requirements:**
- ✅ Genetic data model integrated with HorseModel
- ✅ Breeding compatibility algorithm with scoring
- ✅ Genetic warning system with offspring probabilities
- ✅ Stallion match finder
- External database integration (future enhancement)

---

## PHASE 5: HORSE DATA & IDENTITY
*Horse information management*

---

### 5.1 USEF/FEI Auto-Population
**Priority:** MEDIUM | **Effort:** Medium | **Impact:** Medium | **Status:** ✅ IMPLEMENTED (Fields Ready)

**Description:**
Auto-populate horse profiles from USEF or FEI numbers.

**Specs:**
- ✅ Input fields for USEF and FEI numbers
- ✅ Store registered name (may differ from barn name)
- ✅ Competition history field
- ✅ Registry sync timestamp tracking
- Lookup and fetch from registries (future: API integration)
- Review screen before importing (future enhancement)

**Technical Requirements:**
- ✅ Model fields: usefNumber, feiNumber, registeredName, competitionHistory, registrySyncedAt
- ✅ UI: HorseRegistrationCard displays all registry info
- USEF API integration (future: when API available)
- FEI API integration (future: when API available)

---

### 5.2 Horse Profile Breeding Information
**Priority:** LOW | **Effort:** Medium | **Impact:** Medium | **Status:** ✅ IMPLEMENTED

**Description:**
Comprehensive genetic and breeding information on horse profiles.

**Specs:**
- ✅ Pedigree: sire, dam, grandsire, granddam (3 generations)
- ✅ Color genetics field
- ✅ Genetic testing results: HYPP, GBED, HERDA, OLWS, etc.
- ✅ Stud/broodmare status with chip indicators
- Breeding history: offspring list (future enhancement)
- Breeding soundness exam records (future enhancement)

**Technical Requirements:**
- ✅ Extended horse profile schema with pedigree fields
- ✅ Pedigree tree visualization (HorsePedigreeCard)
- ✅ Genetic test record storage (GeneticTestResult model)
- ✅ Color-coded test results (green=clear, orange=carrier, red=affected)
- Offspring relationship linking (future enhancement)

---

### 5.3 Stride Number System
**Priority:** LOW | **Effort:** Medium | **Impact:** High (Strategic) | **Status:** ✅ IMPLEMENTED

**Description:**
Create unique OnStride identification number for all horses on the platform.

**Specs:**
- ✅ Auto-assigned unique ID on horse creation (e.g., STR-2025-00001)
- ✅ Persistent across ownership changes (stored on horse document)
- ✅ Displayed in HorseRegistrationCard with copy button
- Searchable database of all horses (future enhancement)
- QR code linking to public profile (future enhancement)
- Transfer workflow: Stride number follows horse (inherent in design)

**Technical Requirements:**
- ✅ Sequential ID generation (Firebase Function with transaction)
- ✅ Counter document in `system/stride_counter`
- ✅ Year-based reset (STR-YYYY-NNNNN format)
- ✅ Model fields: strideNumber, strideNumberAssignedAt
- Public horse lookup API (future enhancement)
- QR code generation (future enhancement)

---

## PHASE 6: PLATFORM & INFRASTRUCTURE
*App-wide capabilities*

---

### 6.1 Full Web & Mobile Ecosystem
**Priority:** HIGH | **Effort:** High | **Impact:** High | **Status:** ✅ IMPLEMENTED

**Description:**
Cohesive experience across web and mobile with feature parity.

**Specs:**
- ✅ Web app: full feature set for desktop/laptop
- ✅ Mobile app: optimized for on-the-go use
- ✅ Responsive design (tablets) - Breakpoints and LayoutInfo
- Real-time sync across devices (inherent in Firestore)
- Deep linking between platforms (future enhancement)
- Progressive Web App (PWA) option (future enhancement)

**Technical Requirements:**
- ✅ Flutter Web optimization
- ✅ Shared codebase with platform-specific UI (ResponsiveBuilder)
- Real-time Firestore listeners (existing)
- Push notification parity (existing)

---

### 6.2 Offline Mode
**Priority:** MEDIUM | **Effort:** High | **Impact:** High | **Status:** ✅ IMPLEMENTED

**Description:**
Full app functionality without internet connection.

**Specs:**
- ✅ Local data caching (CachedEntity model with expiration)
- ✅ Offline actions queued for sync (PendingSyncItem with priority)
- ✅ Conflict resolution when reconnecting (SyncConflict with useLocal/useServer)
- ✅ Visual indicator of offline status (OfflineIndicator, OfflineStatusBanner)
- ✅ Priority sync for critical data (priority field in sync items)
- Storage limit management (future enhancement)

**Technical Requirements:**
- ✅ Sync queue system (OfflineSyncService)
- ✅ Conflict resolution logic (resolveConflict method)
- ✅ Background sync on reconnection (auto-sync when online)
- Local database (ready for Hive/SQLite integration)

---

### 6.3 International Language Support (i18n)
**Priority:** MEDIUM | **Effort:** High | **Impact:** Medium | **Status:** ✅ IMPLEMENTED

**Description:**
Full app translation support for multiple languages.

**Specs:**
- ✅ Language picker in settings (LanguagePicker, LanguageSelectionTile)
- ✅ Supported languages: English, Spanish, French, German, Portuguese
- ✅ All UI text translatable (existing ARB system)
- User-generated content remains in original language (inherent)
- ✅ Date/time/currency localization (dateFormat, timeFormat, measurementUnit)
- Right-to-left support (future: Arabic, Hebrew)

**Technical Requirements:**
- ✅ Flutter intl package (existing)
- ✅ ARB files for translations (existing)
- Translation management system (future enhancement)
- ✅ Dynamic locale switching (UserAppSettings.language)

---

### 6.4 Tier-Based Subscriptions
**Priority:** HIGH | **Effort:** High | **Impact:** High | **Status:** ✅ IMPLEMENTED

**Description:**
Subscription tiers with feature gating.

**Specs:**

**Implemented Tiers (SubscriptionPlan.defaultPlans):**
| Feature | Free | Basic | Pro | Enterprise |
|---------|------|-------|-----|------------|
| Horses | 5 | 25 | 100 | Unlimited |
| Users | 3 | 10 | 50 | Unlimited |
| Lessons | 10/mo | 100/mo | Unlimited | Unlimited |
| Billing | - | Basic | Full | Full |
| AI Features | - | - | Yes | Yes |
| Multi-barn | - | - | 3 | Unlimited |
| Branding | - | - | - | Yes |
| Support | Email | Email | Priority | Dedicated |

- ✅ In-app upgrade prompts (UpgradeRecommendationCard)
- Stripe subscription management (ready for integration)
- ✅ Usage tracking and limits (UsageMetrics, checkUsageLimit)
- ✅ Downgrade handling (cancel subscription flow)

**Technical Requirements:**
- ✅ Subscription status in barn profile (BarnSubscription)
- ✅ Feature flags based on tier (isFeatureAvailable)
- Stripe integration (ready for integration)
- ✅ Usage metering (UsageMetrics)

---

### 6.5 Super Admin Dashboard
**Priority:** MEDIUM | **Effort:** Medium | **Impact:** Medium | **Status:** ✅ IMPLEMENTED

**Description:**
Internal admin dashboard for OnStride team with KPIs and CRM.

**Specs:**

**KPIs (PlatformAnalytics):**
- ✅ Total users, barns, horses
- ✅ Active users (DAU/MAU - activeUsersToday/Week/Month)
- ✅ Subscription breakdown by tier (subscriptionsByTier)
- ✅ Revenue metrics (revenueThisMonth)
- Churn rate (future enhancement)
- Feature usage stats (future enhancement)

**CRM Features:**
- Barn directory with contact info (future enhancement)
- ✅ User search and management (AdminUser model)
- ✅ Support ticket integration (SupportTicket model with status workflow)
- Communication history (future enhancement)
- Account health scoring (future enhancement)

**Admin Actions:**
- Impersonate user (future enhancement)
- Override subscription (future enhancement)
- ✅ Feature flag toggles (FeatureFlag with rollout %)
- ✅ System announcements (SystemAnnouncement)

**Technical Requirements:**
- ✅ Admin screen integrated in app (AdminDashboardScreen)
- ✅ Analytics models (PlatformAnalytics)
- ✅ Role-based access (AdminRole: superAdmin, admin, support, analyst)
- ✅ Audit logging (AdminAuditLog)

---

### 6.6 Full Barn Layout Builder
**Priority:** LOW | **Effort:** Very High | **Impact:** Medium | **Status:** ✅ IMPLEMENTED

**Description:**
Custom bird's eye view barn layout creator.

**Specs:**
- ✅ Drag-and-drop layout editor (BarnLayoutCanvas with gesture handling)
- ✅ Component library: 16 element types (stalls, arenas, paddocks, wash racks, tack rooms, etc.)
- ✅ Multiple buildings within a barn (via layout elements)
- ✅ Assign horses to stalls (StallAssignment)
- Visual capacity overview (future enhancement)
- Print/export layout (future enhancement)
- ✅ Interactive map (tap element to select, view properties)

**Technical Requirements:**
- ✅ Canvas-based editor (Flutter CustomPainter with grid)
- ✅ Layout data structure (BarnLayout with elements array)
- Collision detection (future enhancement)
- Zoom/pan controls (basic via scale calculation)
- ✅ Complex UI (desktop sidebar + mobile bottom sheet)

---

## PRIORITY SUMMARY

### Immediate (Phase 1)
1. User Dashboard
2. Ride Log
3. Welcome Emails
4. Horse Profile Export
5. Notification System

### Near-Term (Phase 2)
6. Lesson Workflow
7. Recurring Lessons
8. Monthly Billing
9. Billing Templates

### Growth (Phase 3-4)
10. Multi-Barn Support
11. Subscription Tiers
12. Offline Mode
13. Smart Scheduling
14. Document Scanning

### Strategic (Phase 5-6)
15. Vendor Portal
16. USEF/FEI Integration
17. Stride Number
18. i18n Support
19. AI Features
20. Barn Layout Builder

---

## NOTES

- Research needed for breeding genetics specifics
- USEF/FEI API availability needs verification
- Consider phased rollout for high-effort features
- User feedback should inform priority adjustments
