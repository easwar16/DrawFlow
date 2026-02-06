# DrawFlow

DrawFlow is a modern, web-based drawing app for visualizing ideas with an infinite
canvas, hand-drawn styling, and real-time collaboration via WebSockets.

## Repository layout (Turborepo)

- `apps/web` - Next.js web client
- `apps/websocket` - WebSocket collaboration server
- `packages/*` - Shared configs/packages

## Prerequisites

- Node.js >= 18
- `pnpm` (repo uses `pnpm@9.0.0`)
- Redis (optional but recommended for collaborative persistence)

## Getting started

1. Go to the repository root:
   - `cd DrawFlow`
2. Install dependencies:
   - `pnpm install`
3. Configure environment:
   - Copy `sampleENV.text` to `.env` and set values as needed.
   - Defaults typically work for local dev:
     - `NEXT_PUBLIC_WS_URL=ws://localhost:8080`
     - `NEXT_PUBLIC_HTTP_URL=http://localhost:3000`
     - `REDIS_URL=redis://localhost:6379`
4. Start all apps (web + websocket):
   - `pnpm dev`

## Useful scripts

From the repository root:

- `pnpm dev` - Run all apps in development mode
- `pnpm build` - Build all apps
- `pnpm lint` - Lint all apps
- `pnpm check-types` - Typecheck all apps

## Running apps individually

You can run apps directly if you want separate terminals:

- Web client:
  - `pnpm --filter web dev`
- WebSocket server:
  - `pnpm --filter websocket dev`

## Notes

- If Redis is not running, the WebSocket server will still start but collaborative
  shape persistence will be disabled.
- The web client expects the WebSocket server to be running at
  `NEXT_PUBLIC_WS_URL`.
