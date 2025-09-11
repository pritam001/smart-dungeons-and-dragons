# DnD AI Monorepo (Scaffold)

Initial scaffold focusing on campaign creation, room join, and optional AI seat configuration.

## Packages

-   `@dnd-ai/types` shared TypeScript contracts

## Apps (to be added)

-   `@dnd-ai/api` backend service
-   `@dnd-ai/web` Next.js frontend

## Planned Flow

1. User selects Create Room or Join Room.
2. Create Room: choose campaign name, number of player seats, whether GM is human or AI (pick model), default AI enable.
3. Join Room: enter room code + display name; assign to an open seat (human) or spectate until chosen.
4. Each seat can toggle AI control (if whitelisted) and choose model + persona.
5. Character configuration after seat assignment.

## Next Steps

-   Implement model registry + factory pattern skeleton
-   Basic in-memory repository for campaigns
-   Simple API endpoints for create/join/update seat
-   Frontend minimal pages for create/join forms
