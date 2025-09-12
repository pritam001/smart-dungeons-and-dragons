# Copilot Instructions for DnD AI Platform

## Project Overview

-   This is a modern D&D web platform with AI assistance, featuring campaign management, character creation, dice rolling, and seat/permission systems.
-   The codebase is a monorepo with three main areas:
    -   `apps/api/`: Fastify backend (TypeScript, MongoDB)
    -   `apps/web/`: Next.js 14 frontend (TypeScript, App Router)
    -   `packages/types/`: Shared TypeScript types/interfaces

## Architecture & Data Flow

-   Backend (`apps/api/`) exposes REST endpoints for authentication, campaign, character, dice, and seat management. See `src/index.ts` and `src/repositories.ts`.
-   Frontend (`apps/web/`) uses Next.js App Router, with pages in `src/app/` and shared UI in `src/components/`.
-   All data models are defined in `packages/types/src/index.ts` and must be kept in sync between backend and frontend.
-   Real-time features (e.g., chat, turn tracking) are planned or in progress; use WebSockets or similar for live updates.

## Developer Workflows

-   Install dependencies and run both servers with `npm install && npm run dev` from the repo root.
-   API: http://localhost:13333 | Frontend: http://localhost:13000
-   Environment variables for the API go in `apps/api/.env` (see README for required keys).
-   Use `npm run typecheck` and `npm run format` for type safety and code style.
-   All new features should use TypeScript and follow the monorepo structure.

## Project-Specific Patterns

-   Campaigns, characters, and seats are permissioned: always check user roles (GM, player, owner) before allowing edits.
-   Turn tracking: Campaigns now include `turnOrder`, `currentTurnIndex`, and `roundNumber` (see types and backend logic).
-   Use Zod for request validation in API routes.
-   UI uses Tailwind CSS for all new styling; legacy CSS-in-JS is being migrated out.
-   All cross-component data (e.g., campaign state) should use the shared types package.

## Integration Points

-   MongoDB is used for all persistent data; see `apps/api/src/repositories.ts` for DB logic.
-   JWT is used for authentication; tokens are required for all protected API routes.
-   AI model integration is abstracted and can be extended in the backend.

## Examples

-   To add a new campaign feature, update the type in `packages/types`, backend logic in `apps/api/src/repositories.ts`, and expose via API in `apps/api/src/index.ts`.
-   For new UI pages, add to `apps/web/src/app/` and use Tailwind for styling.
-   For real-time features, coordinate backend (WebSocket events) and frontend (state updates).

## Key Files & Directories

-   `apps/api/src/index.ts`: API route definitions
-   `apps/api/src/repositories.ts`: DB and business logic
-   `apps/web/src/app/`: Next.js pages
-   `apps/web/src/components/`: Shared React components
-   `packages/types/src/index.ts`: Shared types/interfaces
-   `README.md`: High-level architecture, setup, and feature overview

---

If you are unsure about a pattern or integration, check the README and referenced files above. For new features, follow the established monorepo and type-sharing conventions.
