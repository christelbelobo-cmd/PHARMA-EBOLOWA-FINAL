# 🚀 Phase 1: Multi-User Backend Setup Guide

## ✨ What's New in Phase 1

### Infrastructure Improvements
✅ **PostgreSQL** - Replaced SQLite with PostgreSQL for multi-user concurrency  
✅ **Connection Pooling** - Built-in with pg client  
✅ **Rate Limiting** - Express rate limiter with configurable windows  
✅ **CORS Security** - Whitelist-based origin validation  
✅ **User Management** - Users table with roles (Admin, Pharmacist)  
✅ **Logging** - Structured logging middleware  
✅ **Error Handling** - Centralized error handling  

---

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 12+ (or use Docker)
- npm or yarn

---

## 🔧 Setup Instructions

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://pharma:password@localhost:5432/pharma_ebolowa
DATABASE_SSL=false
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRY=7d
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8080
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

### Step 3: Setup PostgreSQL

#### Option A: Using Docker (Recommended)

```bash
docker run --name pharma-postgres \
  -e POSTGRES_USER=pharma \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=pharma_ebolowa \
  -p 5432:5432 \
  -d postgres:15
```

#### Option B: Local PostgreSQL

```bash
psql -U postgres
CREATE DATABASE pharma_ebolowa;
CREATE USER pharma WITH PASSWORD 'password';
ALTER ROLE pharma WITH SUPERUSER;
\q
```

### Step 4: Run Server

```bash
npm run dev
```

You should see:
```
✅ Database initialized
✅ Pharmacies seeded
✅ Medications seeded
✅ Seeded 8 users (1 admin + 7 pharmacists)
✅ Stock entries seeded (294 entries)
🚀 Server running on http://localhost:5000
```

---

## 🔐 Default Credentials

### Admin User
- **Username**: `admin`
- **Password**: `admin` (⚠️ Change in production!)

### Pharmacist Users
- **Username**: Pharmacy ID (e.g., `equasep`, `samba`)
- **Password**: Same as pharmacy ID

---

## 🧪 Testing the API

### Health Check
```bash
curl http://localhost:5000/health
```

### Login (Admin)
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'
```

### Update Stock (Protected)
```bash
TOKEN="your-jwt-token-here"
curl -X PATCH http://localhost:5000/api/stock/med-001/equasep \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status": "available", "price": 5000}'
```

---

## 📊 Key Features

### Multi-User Support
- **Admin**: Can manage all pharmacies and users
- **Pharmacist**: Can only modify their own pharmacy stock

### Security
- JWT-based authentication
- Rate limiting (5 login attempts per 15 min)
- CORS whitelist validation
- Password hashing with bcryptjs

### Logging
- Structured JSON logs
- Request/response tracking
- User activity monitoring

---

## 📈 Next Steps (Phase 2)

- [ ] Add WebSockets for real-time sync
- [ ] Implement caching layer
- [ ] Add pagination
- [ ] Audit logs
- [ ] Email notifications

---

## 🚨 Troubleshooting

### "Database connection failed"
```bash
psql -U pharma -d pharma_ebolowa
```

### "CORS error in frontend"
Update `ALLOWED_ORIGINS` in `.env` and restart server

### "Token invalid/expired"
Tokens expire after 7 days. User must login again.

