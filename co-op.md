┌───────────────┐
│   MEMBERS     │
├───────────────┤
│ id (PK)       │
│ status        │
│ name(s)       │
│ email         │
│ address       │
│ flags/notes   │
│ start_date    │
└───────┬───────┘
        │
        │ 1-to-many
        ▼
┌─────────────────────┐
│  MEMBER_PHONES      │
├─────────────────────┤
│ id (PK)             │
│ member_id (FK)      │
│ type (home/work)    │
│ phone_number        │
│ extension           │
└─────────────────────┘

┌───────────────┐
│   MEMBERS     │
└───────┬───────┘
        │
        │ many-to-many
        ▼
┌─────────────────────┐
│ MEMBER_COMPANIES    │
├─────────────────────┤
│ id (PK)             │
│ member_id (FK)      │
│ company_id (FK)     │
│ role (oil/propane)  │
└─────────┬───────────┘
          │
          ▼
   ┌───────────────┐
   │  COMPANIES    │
   ├───────────────┤
   │ id (PK)       │
   │ name          │
   │ type           │
   └───────────────┘

┌───────────────┐
│   MEMBERS     │
└───────┬───────┘
        │
        │ 1-to-many (per year)
        ▼
┌─────────────────────┐
│ MEMBER_PROGRAMS     │
├─────────────────────┤
│ id (PK)             │
│ member_id (FK)      │
│ heating_year        │
│ program_type        │
│ est_gallons         │
│ rate                │
└─────────────────────┘

┌───────────────┐
│   MEMBERS     │
└───────┬───────┘
        │
        │ 1-to-many
        ▼
┌────────────────────────┐
│ MEMBERSHIP_PAYMENTS    │
├────────────────────────┤
│ id (PK)                │
│ member_id (FK)         │
│ year                   │
│ type (annual/reg)      │
│ status (paid/waived)   │
│ amount                 │
│ method                 │
│ received_date          │
└────────────────────────┘

┌───────────────┐
│   MEMBERS     │
└───────┬───────┘
        │
        │ optional
        ▼
┌─────────────────────┐
│ PAYMENT_PROFILES    │
├─────────────────────┤
│ id (PK)             │
│ member_id (FK)      │
│ provider             │
│ token (no card data)│
│ last4               │
│ expires              │
└─────────────────────┘
