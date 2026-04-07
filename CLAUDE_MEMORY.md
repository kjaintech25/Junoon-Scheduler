# Junoon Instructor Scheduler — CLAUDE_MEMORY.md

**Last updated:** 2026-04-04

## Current Status
Live on Vercel: https://junoon-scheduler.vercel.app
Stack: Next.js 14 App Router · Supabase · Vercel · Tailwind CSS
GitHub: kjaintech25/Junoon-Scheduler

### Just Completed (2026-04-04)
1. **Stream tab restored + liveId fix** — VdoCipher player showed "Error: 400 Live Id missing" because iframe URL only had `?token=`. Fixed API to return `liveId`, updated iframe to `?liveId=X&token=Y`. Pushed + deployed.
2. **Waitlisted slots visual fix** — Slots disappeared from instructor calendar after joining waitlist. Fixed to keep visible with amber WAITLISTED styling (green for open, amber for claimed). Detail panel shows conditional action (Join Waitlist vs status message). Pushed + deployed.

### Completed (2026-04-06)
- `confirm-and-sync` API route deployed — fires POST to website on class confirm
- VdoCipher token endpoint has CORS for website domain
- `image_url` + `is_published` fields added to slot creation
- Milestone 1 deployed and live
- Handoff doc created for Bhargava (`~/Desktop/HANDOFF-MILESTONE-2.md`)
- Instructor Quick Start Guide created in Notion (under Scheduler PRD)
- Beehiiv sync Edge Function deployed for pre-launch signups → Beehiiv (Website Supabase project)

### Next Steps
1. Bhargava completes Milestone 2 (website streaming integration)
2. Milestone 3: Auto-create VdoCipher stream IDs, handle slot status change syncs
3. Phase 2: Email notifications via Resend

### Known Issues / Blockers
- `classes` table exists in Supabase but is unused (0 rows)
- Confirmation workflow not built — admin can only manually change status dropdown in edit mode
- No reassign/slot-swap UI

### Dead Ends
- PRD Build Log table block couldn't be directly edited via Notion MCP API — session update appended as separate heading instead

## Project Links
- PRD: https://www.notion.so/3361837053f081339e3af501ddcd4638
- Kanban: https://www.notion.so/386894eedbbf42588fc0d7c744369b4d
- Supabase: gjwnewqiminmyusmrihy (us-east-1)

## VdoCipher Notes
- Live stream ID: `2f0b755a35c74028b4c379d8c462c304`
- JWT signed server-side in `/api/vdo-token` using `jsonwebtoken`
- No external API calls needed (no OTP endpoint for live streams)
- Iframe format: `https://player.vdocipher.com/live-v2?liveId=X&token=Y`
