# GL Horses

Comprehensive barn management platform for equestrian facilities.

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Authentication**: JWT

## Project Structure

```
gl-horses-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── context/        # React context providers
│   │   ├── services/       # API service functions
│   │   ├── styles/         # CSS and design tokens
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   └── public/
├── server/                 # Express backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   └── uploads/            # File uploads
└── package.json            # Root package.json (workspaces)
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env

# Start development servers
npm run dev
```

### Environment Variables

#### Server (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gl-horses
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
STRIPE_SECRET_KEY=your-stripe-key
```

#### Client (.env)
```
VITE_API_URL=http://localhost:5000/api
```

## Features

- Horse Management (profiles, documents, genetics, breeding)
- Barn Management (stalls, layouts, branding)
- Invoicing & Payments (Stripe integration)
- Task Management
- Lesson Scheduling
- Ride Log Tracking
- Vendor Portal
- Multi-Barn Support
- AI Features (breeding analysis, smart scheduling, document OCR)
- Subscription Management

## License

Private - All rights reserved
