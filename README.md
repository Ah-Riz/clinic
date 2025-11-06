# Clinic EMR System

**Sistem Informasi Klinik** - Single-site EMR for rural clinics in Indonesia

## Overview

A secure, minimal, and extensible web-based Electronic Medical Record (EMR) system built for a single-site rural clinic in Indonesia. Designed with SATUSEHAT-ready data structure and strong privacy controls.

**Tech Stack:**
- **Frontend**: Next.js 16 (App Router, TypeScript, Tailwind CSS)
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Functions)
- **Security**: RLS + Device Gating (Option B) + NIK Hashing + Address Encryption

**Key Features:**
- Patient registration with hashed NIK (SHA-256 + pepper + salt)
- Address encryption at rest (AES-GCM via Edge Functions)
- Device-gated access (kiosk, doctor, pharmacy, admin)
- Doctor & pharmacy queues with 2-hour auto-expiry
- Structured clinical notes (vitals, allergies, anamnesis, ICD-10, therapy, prescriptions)
- Pharmacy dispensing with FEFO batch tracking
- Cash-only payments (no receipts in MVP)
- Manual daily closing and date-based reports
- Audit logging for all key actions
- Realtime updates via Supabase

## Project Structure

```
/clinic
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── kiosk/        # Patient registration
│   │   ├── doctor/       # Queue & consultation
│   │   ├── pharmacy/     # Dispensing & payment
│   │   └── admin/        # Management & reports
│   ├── components/       # Reusable UI components
│   └── lib/
│       ├── supabaseClient.ts  # Supabase client
│       └── auth/              # Auth context & hooks
├── db/
│   ├── sql/              # Migration files (001-008)
│   └── README.md         # Database setup guide
├── blueprint.md          # Full project specification
├── schema.md             # Database schema & RLS policies
└── TODO.md               # Development tracker

```

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account with project created
- Supabase project: **Ah-Riz's Project** (ap-southeast-2)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.local.example` to `.env.local` (already configured):

```env
NEXT_PUBLIC_SUPABASE_URL=https://sibbcrcvsmujobfdivps.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Apply Database Migrations

Follow the guide in `db/README.md` to:
1. Run SQL migrations (001-008) via Supabase SQL Editor
2. Create test users in Auth Dashboard
3. Insert staff/roles and devices

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Current Status (MVP in Progress)

### ✅ Completed (M0 - M1 partial)
- [x] Next.js app scaffolded with TypeScript, Tailwind, ESLint
- [x] Supabase client configured
- [x] Auth context & login flow
- [x] Homepage with navigation
- [x] Kiosk UI (login, registration form, success screen)
- [x] SQL migrations created (extensions, enums, tables, indexes, RLS helpers, policies, seed data)
- [x] Database README with setup instructions

### 🚧 In Progress
- [ ] Apply SQL migrations to Supabase
- [ ] Create test users and devices
- [ ] Implement Edge Functions (NIK hashing, address encryption)
- [ ] Implement RPC functions for kiosk registration
- [ ] Build Doctor UI
- [ ] Build Pharmacy UI
- [ ] Build Admin UI

### 📋 TODO
See [`TODO.md`](./TODO.md) for full development tracker.

## Documentation

- [`blueprint.md`](./blueprint.md) - Full project blueprint (roles, workflows, security, MVP scope)
- [`schema.md`](./schema.md) - Database schema, RLS policies, RPC contracts, validation rules
- [`TODO.md`](./TODO.md) - Development tracker with milestones and acceptance criteria
- [`db/README.md`](./db/README.md) - Database setup and migration guide

## Key Concepts

### Device Gating (Option B)
- All requests include `x-device-id` header
- RPC functions set transaction variable `app.device_id`
- RLS policies validate device approval and role alignment

### NIK Privacy
- Never stored in plaintext
- SHA-256 hash with per-record salt + server-side pepper
- Pepper stored in Edge Function env vars

### Address Privacy
- Encrypted at rest using AES-GCM
- Encryption/decryption in Edge Functions only
- Never exposed to client

### Roles & Permissions
- **Kiosk**: Register patients only (service account)
- **Doctor**: View queues, conduct consultations, send to pharmacy
- **Pharmacist**: Dispense medicines, process cash payments
- **Admin**: Manage users, devices, inventory, reports, daily closing

## Development Workflow

1. Make changes to UI/components
2. Update TODO.md when completing tasks
3. Add bugs to TODO.md "Known Issues" section
4. Test RLS policies before deploying
5. Follow best practices (TypeScript strict, proper error handling)

## Deployment

### Vercel (Frontend)
- Connect GitHub repo
- Set environment variables
- Deploy

### Supabase (Backend)
- Already configured (project: Ah-Riz's Project)
- Apply migrations via SQL Editor
- Set Edge Function secrets (EMR_NIK_PEPPER, EMR_ADDRESS_KEY)
- Enable Realtime for queues/visits/batches tables

## Support

For questions or issues, refer to:
- [`blueprint.md`](./blueprint.md) for feature specs
- [`schema.md`](./schema.md) for technical details
- [`TODO.md`](./TODO.md) for current status

---

**License**: Proprietary
**Last Updated**: Nov 2025
