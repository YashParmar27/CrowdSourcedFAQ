# FAQ Generator - Developer Guide

**For team members who need to understand, modify, and extend this project.**

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Project Overview](#project-overview)
3. [How Authentication Works](#how-authentication-works)
4. [FAQ Approval Workflow](#faq-approval-workflow)
5. [Adding New Features](#adding-new-features)
6. [API Development](#api-development)
7. [Frontend Development](#frontend-development)
8. [Common Issues & Solutions](#common-issues--solutions)
9. [Testing](#testing)
10. [Code Style](#code-style)

---

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/FiscalMindset/FAQ.git
cd FAQ

# Install all dependencies (root + server + client)
npm run install:all
```

### 2. Configure Environment

```bash
# Copy example env files
cp server/.env.example server/.env
cp client/.env.example client/.env

# Edit server/.env with your credentials:
# - MONGODB_URI (get from MongoDB Atlas)
# - JWT_SECRET (generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
# - GEMINI_API_KEY (get from Google AI Studio)
```

### 3. Run Development Servers

```bash
# Terminal 1: Backend API (http://localhost:5000)
cd server && npm run dev

# Terminal 2: Frontend (http://localhost:5173)
cd client && npm run dev
```

### 4. Create Admin Account

Register with the email set in `ADMIN_EMAIL` (default: `algsoch@gmail.com`) to automatically get ADMIN role.

---

## Project Overview

### What This App Does

1. **Users submit questions** - Anyone (logged in or guest) can submit a question
2. **Admins manage questions** - Group similar questions, review them
3. **AI generates FAQs** - Admin selects questions → Gemini AI suggests an FAQ
4. **Admins publish FAQs** - Approved FAQs become visible to everyone on homepage

### System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FAQ GENERATOR SYSTEM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                  │
│   │   USERS     │     │  QUESTIONS  │     │    FAQS     │                  │
│   │             │     │             │     │             │                  │
│   │ • Submit Q  │────►│ • new       │────►│ • draft     │                  │
│   │ • View FAQ  │     │ • grouped   │     │ • approved  │                  │
│   │             │     │ • reviewed  │     │ • published │                  │
│   └─────────────┘     │ • converted │     │             │                  │
│                       └─────────────┘     └─────────────┘                  │
│                              │                     │                        │
│                              ▼                     │                        │
│                       ┌─────────────┐              │                        │
│                       │   GEMINI    │              │                        │
│                       │   AI        │──────────────┘                        │
│                       │             │                                       │
│                       └─────────────┘                                       │
│                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## How Authentication Works

### JWT Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AUTHENTICATION FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

1. REGISTER/LOGIN
   ┌─────────┐       POST /api/auth/login        ┌─────────┐
   │ Client  │ ────────────────────────────────► │  Server │
   └─────────┘                                    └────┬────┘
        │                                               │
        │                                               ▼
        │                                    ┌─────────────────────┐
        │                                    │ 1. Verify password  │
        │                                    │ 2. Create JWT token │
        │                                    │ 3. Return user data │
        │                                    └─────────────────────┘
        │                                               │
        ▼                                               ▼
   ┌─────────┐       Store in localStorage       ┌─────────┐
   │ Client  │ ◄─────────────────────────────── │ Response│
   └─────────┘                                    └─────────┘

2. EVERY REQUEST
   ┌─────────┐       Authorization: Bearer <token>   ┌─────────┐
   │ Client  │ ────────────────────────────────────► │  Server │
   └─────────┘                                        └────┬────┘
                                                           │
                                                           ▼
                                                 ┌─────────────────────┐
                                                 │ auth.js middleware  │
                                                 │ • Extract token     │
                                                 │ • Verify JWT        │
                                                 │ • Attach user to    │
                                                 │   request object    │
                                                 └─────────────────────┘
```

### Role-Based Access

| Route | USER | ADMIN |
|-------|------|-------|
| Submit question | Yes | Yes |
| View published FAQs | Yes | Yes |
| View all questions | No | Yes |
| Manage questions | No | Yes |
| Manage FAQs | No | Yes |
| Manage users | No | Yes |

### How to Protect Routes (Backend)

```javascript
// In routes/question.routes.js
import { authenticate, requireAdmin } from '../middleware/auth.js';

router.post('/', authenticate, submitQuestion);        // Any logged in user
router.delete('/:id', authenticate, requireAdmin, deleteQuestion);  // Admin only
```

### How to Protect Routes (Frontend)

```jsx
// In App.jsx
<Route path="/admin/questions" element={
  <ProtectedRoute adminOnly><AdminQuestions /></ProtectedRoute>
} />
```

### Making Someone Admin

**Option 1:** Register with `ADMIN_EMAIL` (default: `admin@samagama.in`)

**Option 2:** Manually update in MongoDB Atlas:
1. Collections → users → find user → edit document
2. Change `role` from `"USER"` to `"ADMIN"`

---

## FAQ Approval Workflow

```
STEP 1: Question Submitted (status: new)
═══════════════════════════════════════════
User/Guest submits → Question saved with status "new"
                            │
                            ▼
STEP 2: Admin Groups (status: grouped)
═══════════════════════════════════════════
Admin selects multiple questions → Groups them
                            │
                            ▼
STEP 3: AI Suggestion (status: draft)
═══════════════════════════════════════════
Admin selects grouped questions → 
Gemini AI generates question+answer →
FAQ saved as "draft"
                            │
                            ▼
STEP 4: Admin Review
═══════════════════════════════════════════
         │
         ├─────► Edit → Save → still "draft"
         │
         ├─────► Approve → status "approved"
         │
         └─────► Reject → status "rejected"
                            │
                            ▼
STEP 5: Publish
═══════════════════════════════════════════
Admin clicks "Publish" → status "published"
                            │
                            ▼
STEP 6: Public Visibility
═══════════════════════════════════════════
Everyone sees FAQ on homepage
GET /api/faqs/published
```

---

## Adding New Features

### Adding a New API Endpoint

**1. Create Controller** (server/src/controllers/example.controller.js)

```javascript
export const exampleHandler = async (req, res) => {
  try {
    // Your logic here
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**2. Create Route** (server/src/routes/example.routes.js)

```javascript
import { Router } from 'express';
import { exampleHandler } from '../controllers/example.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, exampleHandler);

export default router;
```

**3. Register Route** (server/src/app.js)

```javascript
import exampleRoutes from './routes/example.routes.js';
app.use('/api/example', exampleRoutes);
```

### Adding a New Page

**1. Create Component** (client/src/pages/NewPage.jsx)

```jsx
import { useState } from 'react';
import api from '../services/api';

const NewPage = () => {
  const [data, setData] = useState(null);

  const fetchData = async () => {
    try {
      const response = await api.get('/api/some-endpoint');
      setData(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      {/* Your JSX here */}
    </div>
  );
};

export default NewPage;
```

**2. Add Route** (client/src/App.jsx)

```jsx
import NewPage from './pages/NewPage';

// Add to routes:
<Route path="/new-page" element={<NewPage />} />
// Or for protected route:
<Route path="/admin/new-page" element={
  <ProtectedRoute adminOnly><NewPage /></ProtectedRoute>
} />
```

### Adding a New Model Field

**1. Update Schema** (server/src/models/Example.js)

```javascript
const exampleSchema = new mongoose.Schema({
  existingField: String,
  newField: { type: String, default: 'default' }  // Add here
});
```

**2. Update Controller** - Handle the new field in create/update

**3. Update Frontend** - Add form input for the new field

---

## API Development

### Request/Response Format

All API requests use JSON:
```json
// Request body
{ "username": "john", "email": "john@example.com" }

// Response
{ "success": true, "data": {...} }

// Error
{ "error": "Something went wrong" }
```

### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (no token/invalid) |
| 403 | Forbidden (not admin) |
| 404 | Not Found |
| 500 | Server Error |

### Testing APIs with cURL

```bash
# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@samagama.in","password":"yourpassword"}'

# Use token
curl -X GET http://localhost:5001/api/questions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Frontend Development

### Component Structure

```
client/src/
├── components/     # Shared components (Layout, Navbar, etc.)
├── pages/          # Page components (Home, Login, Dashboard, etc.)
├── context/        # React Context (AuthContext for auth state)
├── services/       # API service (api.js with Axios)
├── App.jsx         # Routes
└── main.jsx        # Entry point
```

### Using the API Service

```jsx
import api from '../services/api';

// GET request
const response = await api.get('/api/faqs');

// POST request with auth
const response = await api.post('/api/questions', { text: 'My question' });

// Auth token is automatically added via interceptor
```

### Protected Route Pattern

```jsx
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/" />;

  return children;
};
```

---

## Common Issues & Solutions

### "Cannot connect to MongoDB"

```bash
# Check MONGODB_URI format
# Should be: mongodb+srv://user:pass@cluster.mongodb.net/dbname

# Test connection locally
cd server && node -e "require('./src/config/db.js')"
```

### "Invalid Token" errors

1. Clear localStorage: `localStorage.clear()`
2. Login again to get fresh token

### "CORS error"

Check `CLIENT_URL` in server/.env matches your frontend URL (including port)

### "Gemini API not working"

1. Check `GEMINI_API_KEY` is valid
2. Check billing is enabled at Google AI Studio
3. Check API key has permissions

### Port already in use

```bash
# Find process using port
lsof -i:5000

# Kill it
kill -9 PID
```

---

## Testing

### Manual Testing Checklist

**User Flow:**
- [ ] Register new account
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should fail)
- [ ] Submit question
- [ ] View published FAQs on homepage
- [ ] Logout

**Admin Flow:**
- [ ] View questions dashboard
- [ ] Group questions
- [ ] Generate AI FAQ suggestion
- [ ] Edit draft FAQ
- [ ] Approve and publish FAQ
- [ ] Verify published on homepage
- [ ] View users list
- [ ] Change user role

### API Testing with Postman

1. Import collection
2. Set environment variables:
   - `baseUrl`: http://localhost:5001
   - `token`: (login to get)
3. Test endpoints in order:
   - POST /api/auth/login → save token
   - GET /api/questions (with token)
   - POST /api/questions (with token)

---

## Code Style

### JavaScript/Node.js

- Use ES6+ modules (`import/export`)
- Use `async/await` over `.then()`
- Use meaningful variable names
- Add error handling with try/catch
- One export per file

### React

- Functional components with hooks
- Use `useState` for local state
- Use `useContext` for shared state
- Use `useEffect` for side effects
- Prefer composition over prop drilling

### Git Commits

```
feat: add new FAQ approval workflow
fix: resolve CORS issue with production URL
docs: update API documentation
refactor: simplify auth middleware
```

---

## Quick Reference

### Useful Commands

```bash
# Server
cd server
npm run dev          # Start with nodemon
npm start            # Production start
node src/seed.js     # Seed database

# Client
cd client
npm run dev          # Vite dev server
npm run build        # Production build
npm run preview      # Preview production build

# Root
npm run install:all  # Install all dependencies
```

### Key Files

| File | Purpose |
|------|---------|
| server/src/app.js | Express app setup + routes |
| server/src/server.js | Entry point + DB connection |
| server/src/middleware/auth.js | JWT verification |
| client/src/context/AuthContext.jsx | Auth state management |
| client/src/services/api.js | Axios instance |

### Environment Variables

| Variable | Description |
|----------|-------------|
| MONGODB_URI | MongoDB connection string |
| JWT_SECRET | Secret for JWT signing (64+ chars) |
| GEMINI_API_KEY | Google Gemini API key |
| CLIENT_URL | Frontend URL for CORS |
| ADMIN_EMAIL | Email that auto-promotes to admin |

---

## Questions?

Open an issue at https://github.com/FiscalMindset/FAQ/issues