# Gynergy

A Next.js application with video conferencing, content library, and community features.

## Features

### Video Conferencing (100ms)

- Real-time video calls with host/co-host/participant roles
- Recording support
- Room management via API

### Content Library (Bunny Stream)

- Video hosting with HLS streaming
- Course management with progress tracking
- Video player with quality selection

### Community

- Member profiles and connections
- Feed with posts and reactions

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Google OAuth + Email/Password)
- **Video Conferencing**: 100ms
- **Video Hosting**: Bunny Stream
- **Payments**: Stripe
- **State Management**: Redux Toolkit + Redux Persist
- **Styling**: Tailwind CSS
- **Testing**: Vitest + Testing Library

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Environment Setup

Copy `.env.template` to `.env.local` and fill in the values:

```bash
cp .env.template .env.local
```

Required environment variables:

| Variable                             | Description                  |
| ------------------------------------ | ---------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`           | Supabase project URL         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | Supabase anonymous key       |
| `SUPABASE_SERVICE_ROLE_KEY`          | Supabase service role key    |
| `DATABASE_URL`                       | PostgreSQL connection string |
| `HMS_ACCESS_KEY`                     | 100ms access key             |
| `HMS_SECRET`                         | 100ms secret                 |
| `HMS_TEMPLATE_ID`                    | 100ms template ID            |
| `NEXT_PUBLIC_100MS_APP_ID`           | 100ms app ID                 |
| `BUNNY_STREAM_API_KEY`               | Bunny Stream API key         |
| `BUNNY_STREAM_LIBRARY_ID`            | Bunny Stream library ID      |
| `BUNNY_STREAM_CDN_HOSTNAME`          | Bunny Stream CDN hostname    |
| `STRIPE_SECRET_KEY`                  | Stripe secret key            |
| `STRIPE_WEBHOOK_SECRET`              | Stripe webhook secret        |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key       |

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Testing

```bash
npm test           # Run tests in watch mode
npm test -- --run  # Run tests once
```

### Database Schema Deployment

Deploy SQL schemas to Supabase:

```bash
npx tsx scripts/deploy-schema.ts supabse/schema/content-library.sql
npx tsx scripts/deploy-schema.ts supabse/schema/video-calls.sql
```

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── courses/           # Course pages
│   ├── library/           # Content library
│   ├── community/         # Community features
│   └── video/             # Video room pages
├── lib/                   # Utilities and services
│   ├── services/          # External service integrations
│   └── utils/             # Helper functions
├── modules/               # Feature modules
│   ├── common/            # Shared components
│   ├── content/           # Content library components
│   ├── community/         # Community components
│   └── video/             # Video conferencing components
├── store/                 # Redux store configuration
├── contexts/              # React contexts
├── resources/             # Types, constants, images
├── supabse/               # Database schemas and migrations
└── __tests__/             # Test files
```

## API Routes

### Video Conferencing

- `POST /api/video/create-room` - Create a new video room
- `POST /api/video/join-room` - Join an existing room
- `POST /api/video/end-room` - End a room session

### Content Library

- `GET /api/content/courses` - List courses
- `GET /api/content/course/:id` - Get course details
- `POST /api/content/upload` - Upload video content

## Deployment

The application is deployed on Vercel. Environment variables are managed through Vercel's dashboard.

```bash
vercel env pull  # Pull environment variables from Vercel
```
