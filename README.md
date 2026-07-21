# VTT MVP - Complete Build Summary

**Project**: Multiplayer D&D Virtual Tabletop (Next.js 16, React 19, Supabase, react-konva)  

## Stack & Key Libraries

**Frontend**: Next.js 16, React 19, react-konva (Konva.js canvas library)  
**Backend**: Supabase (Postgres, Realtime, Storage, Auth)  
**Auth**: Anonymous (guest-first)  
**3D Dice**: @3d-dice/dice-box-threejs (server-authoritative rolls)  
**Image Compression**: browser-image-compression  
**Colors**: #061d3f (navy), #f7cb9c (highlight), #e8e8e8 (text)  

## Core Features (All Complete)

**Guest-first room flow**: Create room → get share link → cold-visit join via slug  
**Presence + GM logic**: Online player tracking, GM auto-transfer on disconnect, owner reclaim on return  
**Board**: Pan/zoom (mouse wheel + pinch), white grid background, 5000×5000 Konva stage  
**Drawing**: Freehand strokes (black, width 3), multiplayer sync, undo/clear actions  
**Images**: Upload (with compression), move/resize/rotate, GM lock/unlock (with live drag-hide at 500ms delay), multiplayer sync  
**Dice**: Server-authoritative rolls (Postgres random()), 3D animation via dice-box-threejs, selection UI (quantity +/− + die-type picker), history drawer  
**Hard limits**: 8 participants, 25 images, 2000 strokes (enforced via RPCs with FOR UPDATE row locks)  
**Room TTL**: 24h inactivity expiry (lazy check on join + hourly pg_cron cleanup)  
**UI**: Bottom toolbar (select/draw toggle, dice icon, GM-only upload/more), top-right undo/trash (draw-mode only), player list (top-left), dice panel   (floats above toolbar), history drawer (right side)
**Keyboard shortcuts**: D=draw, V=select, Space=1d20 roll, H=history  

## Database Schema

**Tables**: rooms, participants, strokes, images, dice_rolls, storage.buckets  
**RLS**: All tables protected, user/GM checks via helper functions  
**Storage bucket**: room-images (public, 5MiB limit, auto-created via migration)  
**Key RPCs** (Server-Authoritative):
- `toggle_image_lock(image_id, locked)` → GM-only via `is_room_gm()` check  
- `reassign_gm(online_user_ids)` → called on presence sync, atomically transfers GM  

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL=http://<LAN-IP>:54321`  
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`  
- `SUPABASE_URL=http://127.0.0.1:54321`  

## Local Dev Commands

- `bash supabase start`              # Start local Supabase  
- `supabase db reset`           # Replay all migrations  
- `supabase stop`               # Stop containers  
- `npm run dev`                 # Start Next.js dev server (port 3000)
