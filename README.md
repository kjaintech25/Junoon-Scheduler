# Junoon Instructor Scheduler

A clean, functional web app for managing instructor slots and bookings.

**Stack:** Next.js 14 (App Router) • Supabase • Tailwind CSS

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment variables are already set** in `.env.local`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - http://localhost:3000

## Features

### Admin Dashboard (`/`)
- View all slots in a color-coded grid
- **Green** = Open
- **Yellow** = Claimed
- **Blue** = Confirmed

### Create Slot (`/admin/create-slot`)
- Date picker, time picker, and duration selector (1h/2h/3h)
- Creates new open slots ready for instructor bookings

### Instructor Booking (`/book/[token]`)
- Instructors access via unique token link
- See only open slots
- Click to claim a slot
- Slot automatically marked as "claimed" with their assignment

## Database

All tables are already created in Supabase:
- **instructors** — name, email, unique_token
- **slots** — date, time, duration, status, instructor_id
- **classes** — slot_id, instructor_id, class_title, notes

## Deployment

Ready to deploy on Vercel:
1. Push to GitHub (already connected)
2. Vercel auto-deploys on git push
3. Environment variables are pre-configured

## Next Steps
- Add confirmation workflow (admin confirms claimed slots)
- Email notifications to instructors
- Class details form (title, notes) before final confirmation
- Design polish when ready
