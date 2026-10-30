<h1 align="center">cdingin API ❄️</h1>

<p align="center">
  <b>Backend for cdingin, an AC (air conditioner) service booking platform.</b><br/>
  <i>"Servis AC jadi gampang, tinggal ngeklik doang!"</i>
</p>

<p align="center">
  <img alt="NestJS" src="https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-TypeORM-4169E1?logo=postgresql&logoColor=white" />
  <img alt="Midtrans" src="https://img.shields.io/badge/Payments-Midtrans-002855" />
  <img alt="Deploy" src="https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white" />
</p>

This service is the REST API consumed by the cdingin PWA ([`../cdingin-app`](../cdingin-app)) and the mobile client ([`../cdingin-mobile`](../cdingin-mobile)). It connects **customers** who need AC maintenance with **technicians**, and covers the full lifecycle of a service order: authentication, scheduling, live status tracking, invoicing, payment, and notifications.

- **Monorepo root:** https://github.com/FarhanDH/cdingin

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
    - [Project Structure](#project-structure)
    - [Order Lifecycle](#order-lifecycle)
    - [Payment Flow](#payment-flow)
    - [Database Schema](#database-schema)
- [Business Rules](#business-rules)
- [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Environment Variables](#environment-variables)
    - [Database Migrations and Seeding](#database-migrations-and-seeding)
    - [Running the Server](#running-the-server)
- [API Reference](#api-reference)
    - [Conventions](#conventions)
    - [Endpoints](#endpoints)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [Deployment](#deployment)
- [Further Documentation](#further-documentation)
- [Roadmap](#roadmap)
- [Author](#author)
- [License](#license)

---

## Overview

The API is a modular NestJS monolith with a role-based access model:

| Role         | What they can do                                                                                                       |
| ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `customer`   | Sign in with email OTP, book and cancel service orders, track status in real time, pay invoices, download invoices.    |
| `technician` | Sign in with email OTP, view scheduled jobs, update order status, issue invoices, confirm cash payments, see earnings. |

Everything is served under the global prefix **`/api`** (for example `GET /api/ping`).

## Key Features

**Authentication and users**

- Passwordless **email OTP** login (4-digit code, valid for 5 minutes) delivered through an SMTP mailer with a Handlebars template.
- New users complete a customer profile after their first OTP verification.
- **JWT access and refresh tokens** delivered as `httpOnly` cookies (`Secure` and `SameSite=None` in production).
- Route protection with `JwtGuard`, `RolesGuard` (`@Roles()` decorator) and a `CronGuard` for scheduled endpoints.

**Ordering and scheduling**

- Multi-unit orders: AC problems, service location (coordinates), property type and floor, and one or more AC units (type, capacity in PK, brand, quantity).
- **Daily capacity check** that prevents overbooking, plus a schedule availability endpoint for the booking calendar.
- **Reverse geocoding** of the service location through OpenStreetMap Nominatim.
- Technicians get a job list filtered by `today`, `tomorrow` and `upcoming`.
- **Geofence check**: a technician can only start work (`on_working`) within 200 m of the service location (Haversine distance).
- Order cancellation by either party, with a reason, and a notification to the other side.

**Invoicing and payments**

- Technicians issue itemised invoices after the work is done (this moves the order to `waiting_payment`); customers can **download a PDF invoice** (Handlebars template rendered to PDF via Browserless).
- Payments via **Midtrans**: Snap, and Core API with QRIS and bank virtual accounts (BCA, BNI, BRI, Mandiri, Permata).
- **Cash payments** confirmed by the technician.
- **Webhook** with idempotency handling and server-to-server verification against the Midtrans status API.

**Notifications and real time**

- In-app notification centre with read tracking and unread counter.
- **Web Push** (VAPID) notifications for the PWA.
- **Pusher** channels for live order status updates.
- Daily **service reminder** cron job (3 months after a completed service).

**Technician tools**

- Earnings summary (daily, weekly and monthly) based on paid invoices.

## Tech Stack

| Area          | Technology                                                                       |
| ------------- | -------------------------------------------------------------------------------- |
| Framework     | NestJS 10, Express 5                                                             |
| Language      | TypeScript 5 (SWC builder)                                                       |
| Database      | PostgreSQL with TypeORM 0.3 (migrations, seeding via `typeorm-extension`)        |
| Validation    | `class-validator`, `class-transformer` (global `ValidationPipe`, whitelist mode) |
| Auth          | `@nestjs/jwt`, `cookie-parser`                                                   |
| Payments      | Midtrans (`midtrans-client` Snap and Core API)                                   |
| Email         | `@nestjs-modules/mailer` (SMTP) with Handlebars templates                        |
| Real time     | Pusher, Web Push (`web-push`)                                                    |
| External APIs | OpenStreetMap Nominatim (geocoding), Browserless (PDF rendering)                 |
| Utilities     | `date-fns`, `haversine-distance`, `short-unique-id`, `axios`                     |
| Testing       | Jest, Supertest                                                                  |
| Tooling       | pnpm, ESLint, Prettier, `typeorm-uml`                                            |
| Hosting       | Vercel (`@vercel/node`, region `sin1`) with Vercel Cron                          |

## Architecture

### Project Structure

```text
api/
├── docs/                      # Endpoint documentation (AUTH.md, ORDERS.md)
├── src/
│   ├── main.ts                # Bootstrap: pipes, CORS, cookies, /api prefix
│   ├── app.module.ts          # Root module
│   ├── common/                # Config, enums, decorators, logger middleware, utils
│   └── core/
│       ├── auth/              # OTP verification, JWT issuing, guards (jwt, roles, cron)
│       ├── user/              # Users, profiles, seeder
│       ├── email/             # OTP email delivery (Handlebars template)
│       ├── order/             # Order lifecycle, cancellation, technician job lists
│       ├── ac-unit/           # AC units attached to an order
│       ├── schedule/          # Daily booking availability
│       ├── invoice/           # Invoices, line items, PDF download
│       ├── payment/           # Midtrans Snap/Core API, cash payment, webhook
│       ├── earning/           # Technician earnings summary
│       ├── notification/      # In-app notifications
│       ├── notification-read/ # Per-user read receipts
│       ├── push-subscription/ # Web Push subscriptions and delivery
│       ├── pusher/            # Real-time channel events
│       ├── geocoding/         # Nominatim reverse geocoding
│       ├── scheduled-task/    # Cron-triggered service reminders
│       └── database/          # Data source, migrations
├── test/                      # E2E tests
├── diagram.png                # Generated ER diagram
├── ormconfig.js               # TypeORM CLI config (compiled output)
├── nest-cli.json
└── vercel.json                # Vercel build, routes and cron configuration
```

Each feature folder follows the same convention: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`, `entities/` and `tests/`.

### Order Lifecycle

```mermaid
stateDiagram-v2
    [*] --> pending: Customer creates order
    pending --> confirmed: Technician accepts
    confirmed --> technician_on_the_way
    technician_on_the_way --> on_working: Within 200 m of the location
    on_working --> waiting_payment: Invoice issued
    waiting_payment --> completed: Invoice paid (Midtrans or cash)
    pending --> cancelled: Customer cancels
    confirmed --> cancelled: Assigned technician cancels
    completed --> [*]
    cancelled --> [*]
```

Each status change creates a notification, sends a Web Push message and triggers a Pusher event on the channel `order-<orderId>-customer`.

### Payment Flow

```mermaid
sequenceDiagram
    participant C as Customer (PWA)
    participant A as cdingin API
    participant M as Midtrans
    C->>A: POST /payments/invoices/:id/core-api (or /midtrans)
    A->>M: Create transaction (QRIS / VA / Snap)
    M-->>A: Payment details (QR string, VA number, token)
    A-->>C: Payment instructions
    C->>M: Pays
    M->>A: POST /payments/midtrans-webhook
    A->>M: GET transaction status (verification)
    M-->>A: Authoritative status
    A->>A: Update payment and invoice (idempotent)
    A-->>C: Push + Pusher notification
```

### Database Schema

![Entity relationship diagram](./diagram.png)

| Table                | Purpose                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `users`              | Customers and technicians (`role`, profile completion flag)             |
| `otp_token`          | One-time codes with expiry and `is_used` flag                           |
| `orders`             | Service orders (location, schedule, status, cancellation details)       |
| `ac_units`           | AC units per order (type, capacity, brand, quantity)                    |
| `invoices`           | Invoice header (number, status, total, issue and paid dates)            |
| `invoice_items`      | Invoice line items                                                      |
| `payments`           | Payment attempts and gateway data (VA number, QR, expiry, raw response) |
| `notifications`      | In-app notifications                                                    |
| `notification_reads` | Read receipts per user                                                  |
| `push_subscriptions` | Web Push endpoints per user                                             |

Regenerate the diagram with `pnpm db:diagram`.

## Business Rules

| Rule                | Value                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| Daily capacity      | Maximum of **10 AC units** per service date (cancelled and completed orders are not counted)              |
| Service days        | No service on **Sundays**                                                                                 |
| Work-start geofence | Technician must be within **200 m** of the service location to set `on_working`                           |
| OTP validity        | **5 minutes**, single use; a new OTP invalidates previous unused ones                                     |
| Payment expiry      | QRIS: 15 minutes; bank virtual accounts: 120 minutes                                                      |
| Service reminder    | Sent once an order has been completed for **3 months or more**                                            |
| Cancellation        | Customers can cancel while the order is `pending`; the assigned technician can cancel a job with a reason |
| AC capacities       | 0.5, 1, 1.5, 2, 2.5, 3 and 5 PK                                                                           |
| Supported AC brands | Panasonic, LG, Daikin, Samsung, Sharp, Polytron, Gree, TCL, Mitsubishi, Aqua                              |

## Getting Started

### Prerequisites

- **Node.js** 20 or later
- **pnpm** (`npm i -g pnpm`)
- **PostgreSQL** (local install or a Docker container)
- Accounts and credentials for the integrations you want to exercise locally: an SMTP provider, Midtrans sandbox, Pusher, and Browserless (for PDF invoices)

> Tip: a throwaway Postgres for development:
>
> ```bash
> docker run --name cdingin-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=cdingin \
>   -p 5432:5432 -d postgres:16
> ```

### Installation

```bash
git clone https://github.com/FarhanDH/cdingin.git
cd cdingin/api
pnpm install
```

### Environment Variables

Create a `.env` file in `api/`. All variables are read in [`src/common/configuration.ts`](./src/common/configuration.ts).

```dotenv
# --- App ---
NODE_ENV=development
PORT=3002
FRONTEND_URL=http://localhost:5173
DOMAIN=localhost

# --- Database (use DATABASE_URL, or the individual fields) ---
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cdingin
DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=cdingin
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres

# --- JWT (expiration values are in seconds) ---
JWT_SECRET_ACCESS_TOKEN=change-me-access
JWT_SECRET_REFRESH_TOKEN=change-me-refresh
JWT_ACCESS_TOKEN_EXPIRATION_TIME=900
JWT_REFRESH_TOKEN_EXPIRATION_TIME=604800
JWT_ISSUER=cdingin

# --- Email (SMTP) ---
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USERNAME=
EMAIL_PASSWORD=

# --- Web Push (generate with: npx web-push generate-vapid-keys) ---
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:you@example.com

# --- Cron ---
CRON_SECRET=change-me-cron

# --- Midtrans ---
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_SANDBOX_CORE_URL=        # Core API charge endpoint
MIDTRANS_SANDBOX_SNAP_URL=        # Base URL used to check transaction status in the webhook
MIDTRANS_USERNAME=                # Basic-auth credentials for the status check
MIDTRANS_PASSWORD=

# --- PDF rendering ---
BROWSERLESS_API_KEY=

# --- Pusher ---
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
USE_TLS=true
```

### Database Migrations and Seeding

The TypeORM CLI is configured in [`src/core/database/data-source.ts`](./src/core/database/data-source.ts). It points at compiled files in `dist/` by default, so build first (or switch to the commented `src/` globs when running with `ts-node`).

```bash
# 1. Compile so entities and migrations exist in dist/
pnpm build

# 2. Apply all migrations
pnpm migration:run

# 3. (Optional) Seed the first technician account
pnpm seed
```

> **Heads-up:** the user seeder in `src/core/user/seed/user.seed.ts` runs `TRUNCATE "users"` before inserting. Only run it on a fresh database, and replace the seeded email with your own so you can log in as a technician.

Creating and managing migrations:

```bash
pnpm migration:generate --name=add_something   # generate from entity changes
pnpm migration:create   --name=add_something   # empty migration
pnpm migration:show                            # list applied/pending
pnpm migration:revert                          # undo the last migration
```

### Running the Server

```bash
# development (watch mode)
pnpm start:dev

# production
pnpm build
pnpm start:prod
```

The API listens on `http://localhost:3002` by default. Quick check:

```bash
curl http://localhost:3002/api/ping
# {"hello":"world"}
```

## API Reference

### Conventions

- **Base URL:** `http://localhost:3002/api`
- **Authentication:** a successful OTP verification sets `accessToken` and `refreshToken` as `httpOnly` cookies. Send requests with credentials (`fetch(..., { credentials: "include" })`). Protected routes read the `accessToken` cookie.
- **Response envelope:** most endpoints return `{ "message": string, "data"?: T }`.
- **Validation:** request bodies are validated with `class-validator`; unknown properties are rejected (`400 Bad Request`).
- **Errors:** standard NestJS error body: `{ "message": ..., "error": "...", "statusCode": 4xx }`.

### Endpoints

**Legend:** 🔓 public · 🔑 any authenticated user · 🧑 customer only · 🔧 technician only · ⏰ cron secret

#### System

| Method | Path    | Access | Description  |
| ------ | ------- | ------ | ------------ |
| GET    | `/ping` | 🔓     | Health check |

#### Authentication and users

| Method | Path                              | Access | Description                                                             |
| ------ | --------------------------------- | ------ | ----------------------------------------------------------------------- |
| POST   | `/email/send-otp`                 | 🔓     | Generate an OTP and email it to the user (creates the user if new)      |
| POST   | `/auth/verify-otp`                | 🔓     | Verify the OTP. Sets auth cookies; returns `isNewUser` and user data    |
| POST   | `/auth/register-customer-profile` | 🔓     | Complete a new customer's profile (full name, phone). Sets auth cookies |
| DELETE | `/auth/logout`                    | 🔑     | Clear auth cookies and remove the device's push subscription            |
| GET    | `/users/me`                       | 🔑     | Current user profile                                                    |

See [`docs/AUTH.md`](./docs/AUTH.md) for request and response examples.

#### Orders

| Method | Path                            | Access | Description                                                                                        |
| ------ | ------------------------------- | ------ | -------------------------------------------------------------------------------------------------- |
| POST   | `/orders`                       | 🧑     | Create an order (capacity and Sunday checks, reverse geocoding, notifies technicians)              |
| GET    | `/orders`                       | 🧑     | List own orders. Query: `status` (tab filter), `countOnly`                                         |
| GET    | `/orders/:id`                   | 🧑     | Order details                                                                                      |
| PATCH  | `/orders/:id/cancel`            | 🧑     | Cancel an order with a reason                                                                      |
| GET    | `/orders/technician`            | 🔧     | Job list. Query: `service-date` (`today`, `tomorrow`, `upcoming`), `status`, `period`, `countOnly` |
| GET    | `/orders/technician/:id`        | 🔧     | Job details                                                                                        |
| PATCH  | `/orders/:id/status`            | 🔧     | Update order status (geofence enforced for `on_working`; notifies the customer)                    |
| PATCH  | `/orders/technician/:id/cancel` | 🔧     | Cancel a job with a reason (notifies the customer)                                                 |
| GET    | `/orders/:id/invoice`           | 🔑     | Invoice attached to an order                                                                       |

#### Invoices

| Method | Path                     | Access | Description                             |
| ------ | ------------------------ | ------ | --------------------------------------- |
| POST   | `/invoices/:orderId`     | 🔧     | Create an itemised invoice for an order |
| GET    | `/invoices/:invoiceId`   | 🔑     | Invoice details                         |
| GET    | `/invoices/:id/download` | 🧑     | Download the invoice as a PDF           |

Invoice creation body:

```json
{
    "items": [
        {
            "description": "AC cleaning (1 PK)",
            "quantity": 2,
            "unitPrice": 75000
        }
    ]
}
```

#### Payments

| Method | Path                                                 | Access | Description                                                                                                         |
| ------ | ---------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------- |
| POST   | `/payments/invoices/:invoiceId/midtrans`             | 🧑     | Create a Midtrans Snap transaction (returns token and redirect URL)                                                 |
| POST   | `/payments/invoices/:invoiceId/core-api`             | 🧑     | Create a Core API payment. Body: `{ "paymentMethod": "qris" \| "bca" \| "bni" \| "bri" \| "mandiri" \| "permata" }` |
| POST   | `/payments/invoices/:invoiceId/confirm-cash-payment` | 🔧     | Confirm that the customer paid in cash                                                                              |
| GET    | `/payments/:id`                                      | 🧑     | Payment details (VA number, QR string, expiry, status)                                                              |
| POST   | `/payments/midtrans-webhook`                         | 🔓     | Midtrans notification receiver. Re-verifies the status with Midtrans before updating records                        |

#### Scheduling, geocoding and earnings

| Method | Path                      | Access | Description                                                              |
| ------ | ------------------------- | ------ | ------------------------------------------------------------------------ |
| GET    | `/schedules/availability` | 🔑     | Booked AC units per day. Query: `start-date`, `end-date`                 |
| GET    | `/geocoding/reverse`      | 🔑     | Reverse geocode. Query: `lat`, `lon`                                     |
| GET    | `/earnings/summary`       | 🔧     | Earnings summary. Query: `date`, `period` (`daily`, `weekly`, `monthly`) |

#### Notifications

| Method | Path                          | Access | Description                      |
| ------ | ----------------------------- | ------ | -------------------------------- |
| GET    | `/notifications`              | 🔑     | List notifications               |
| GET    | `/notifications/unread-count` | 🔑     | Number of unread notifications   |
| POST   | `/notifications/:id/read`     | 🔑     | Mark a notification as read      |
| POST   | `/push-subscriptions`         | 🔑     | Register a Web Push subscription |

#### Scheduled tasks

| Method | Path                         | Access | Description                                                            |
| ------ | ---------------------------- | ------ | ---------------------------------------------------------------------- |
| GET    | `/scheduled-tasks/reminders` | ⏰     | Send service reminders. Requires `Authorization: Bearer <CRON_SECRET>` |

## Available Scripts

| Script                    | Description                                 |
| ------------------------- | ------------------------------------------- |
| `pnpm start:dev`          | Start in watch mode                         |
| `pnpm start:debug`        | Start with the Node inspector in watch mode |
| `pnpm build`              | Compile with Nest CLI (SWC) into `dist/`    |
| `pnpm start:prod`         | Run the compiled app (`node dist/main`)     |
| `pnpm lint`               | Lint and auto-fix with ESLint               |
| `pnpm format`             | Format with Prettier                        |
| `pnpm test`               | Run unit tests                              |
| `pnpm test:watch`         | Run unit tests in watch mode                |
| `pnpm test:cov`           | Run unit tests with coverage                |
| `pnpm test:e2e`           | Run end-to-end tests                        |
| `pnpm migration:run`      | Apply pending migrations                    |
| `pnpm migration:generate` | Generate a migration from entity changes    |
| `pnpm migration:create`   | Create an empty migration                   |
| `pnpm migration:revert`   | Revert the last migration                   |
| `pnpm migration:show`     | Show migration status                       |
| `pnpm seed`               | Run database seeders                        |
| `pnpm db:diagram`         | Regenerate `diagram.png` from the entities  |

## Testing

The project uses **Jest** with colocated `*.spec.ts` files for controllers and services (auth, order, invoice, payment, earning, notification, push-subscription, pusher, schedule, scheduled-task, user and email), plus an e2e suite in [`test/`](./test).

```bash
pnpm test        # unit tests
pnpm test:cov    # coverage report in ./coverage
pnpm test:e2e    # end-to-end tests
```

## Deployment

The API is deployed to **Vercel** using [`vercel.json`](./vercel.json):

- Build target: `dist/main.js` with `@vercel/node`, region `sin1` (Singapore).
- All routes are forwarded to the NestJS app; CORS is limited to the PWA origin.
- A **Vercel Cron** job calls `GET /api/scheduled-tasks/reminders` every day at `02:00 UTC`. Define `CRON_SECRET` in the project environment so the endpoint's `CronGuard` accepts the request.

Deployment checklist:

1. Set every variable from [Environment Variables](#environment-variables) in the Vercel project (with `NODE_ENV=production` and `FRONTEND_URL` set to the PWA origin).
2. Point `DATABASE_URL` at a managed PostgreSQL instance and run migrations against it (`pnpm migration:run`).
3. Configure the Midtrans notification URL to `https://<your-api-domain>/api/payments/midtrans-webhook`.
4. Make sure the PWA and API are served over HTTPS; production cookies are `Secure` with `SameSite=None`.

## Further Documentation

- [`docs/AUTH.md`](./docs/AUTH.md): authentication and OTP endpoints
- [`docs/ORDERS.md`](./docs/ORDERS.md): order creation endpoint
- [NestJS documentation](https://docs.nestjs.com), [TypeORM documentation](https://typeorm.io), [Midtrans documentation](https://docs.midtrans.com)

## Roadmap

- [ ] Rate limiting and attempt limits for OTP requests and verification
- [ ] Refresh-token endpoint and token rotation
- [ ] Explicit order status transition rules enforced on the server
- [ ] Row-level locking for schedule capacity under concurrent bookings
- [ ] OpenAPI / Swagger documentation
- [ ] Dockerfile and `docker-compose.yml` for one-command local setup
- [ ] CI pipeline (lint, test, build) with GitHub Actions
- [ ] Health endpoint that checks database connectivity

## Author

**Farhan Dwi Hartanto** · [@FarhanDH](https://github.com/FarhanDH)

## License

This project is currently **UNLICENSED** (all rights reserved), as declared in [`package.json`](./package.json).
