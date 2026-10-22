<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Multi-Tenant SaaS Project Agent Instructions

You are an AI agent working on a multi-tenant SaaS application. Your goal is to build a production-ready application following best practices and the architectural decisions documented in this repository.

## 1. Architecture & Conventions

- **Application Type**: Full-stack SaaS application using Next.js 14+ App Router.
- **Frontend Stack**:
  - UI Framework: React 18+
  - Styling: **Tailwind CSS**
  - Icons: `lucide-react`
  - Charts: `recharts`
  - Forms: `react-hook-form` + `zod`
  - Tables: `tanstack-table`
- **Data Layer**:
  - **Prisma** for ORM and database migrations.
  - Generate Prisma Client **only after** Prisma Schema is fully defined.
- **Authentication**:
  - **Clerk** for authentication.
  - Use Clerk's middleware to handle routing and tenant context.
- **Deployment**: **Vercel**.
- **Database**: **PostgreSQL** (default for Supabase).

## 2. Database Schema Design

Database design must strictly follow the **Prisma Schema**:

1.  **Tenant Model**: Always include a `Tenant` model with at least `id`, `name`, `slug`, and `ownerId`.
2.  **User Model**: Separate `User` model from Clerk's auth model, linked to `Tenant`.
3.  **Schema Updates**: Any schema change requires:
    ```bash
    npx prisma migrate dev --name <migration_name>
    ```
    And then regenerating the Prisma Client.

## 3. Component & UI Guidelines

- **Folder Structure**: Strict component organization under `app/`.
- **Dark Mode**: Default theme must be dark mode.
- **Responsive Design**: Design must be mobile-first.
- **Accessibility**: Adhere to WCAG 2.1 standards.

## 4. Development Workflow

1.  **Setup**: Ensure environment variables are correctly set (especially Clerk and database URLs).
2.  **Coding**: Write clean, modular, and well-documented code.
3.  **Testing**: Write unit tests for critical logic and components.
4.  **Linting**: Always pass `pnpm lint` before considering a task complete.

## 5. Security

- Never expose secrets in client-side code.
- Enforce tenant isolation at the database level (e.g., using Row Level Security with Prisma).
- Use Clerk's middleware for robust authentication and session management.

## 6. Git & Version Control

- **Branching Strategy**: Use feature branches (e.g., `feature/new-dashboard`).
- **Commits**: Write clear, concise commit messages.
- **Merging**: Use Pull Requests and code reviews.
