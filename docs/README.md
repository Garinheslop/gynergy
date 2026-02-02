# Gynergy Member Portal Documentation

Welcome to the Gynergy documentation. This guide will help you understand, develop, and maintain the Gynergy 45-Day Awakening Challenge platform.

## Quick Links

- [Getting Started](./guides/getting-started.md) - Set up your development environment
- [Architecture Overview](./ARCHITECTURE.md) - Understand the system design
- [API Reference](./api/overview.md) - API endpoint documentation
- [Contributing](./CONTRIBUTING.md) - How to contribute to the project

## Documentation Structure

```
/docs
├── ARCHITECTURE.md          # System architecture overview
├── CONTRIBUTING.md          # Contribution guidelines
├── DEPLOYMENT.md            # Deployment runbook
│
├── /adr                     # Architecture Decision Records
│   ├── 0001-use-nextjs-14.md
│   ├── 0002-supabase-auth.md
│   └── ...
│
├── /api                     # API Documentation
│   ├── overview.md
│   ├── authentication.md
│   └── /endpoints
│       ├── journals.md
│       ├── gamification.md
│       └── ...
│
├── /components              # Component documentation
│   ├── design-system.md
│   └── component-patterns.md
│
├── /guides                  # Developer guides
│   ├── getting-started.md
│   ├── environment-setup.md
│   ├── testing-guide.md
│   └── database-migrations.md
│
└── /runbooks               # Operational runbooks
    ├── incident-response.md
    └── database-recovery.md
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TypeScript 5 |
| Styling | Tailwind CSS 4.0 |
| State | Redux Toolkit, Redux Persist |
| Backend | Next.js API Routes, Supabase |
| Database | PostgreSQL (via Supabase) |
| Auth | NextAuth + Supabase Auth |
| AI | OpenAI GPT-4o, Anthropic Claude |
| Video | 100ms |
| Testing | Vitest, Playwright |

## Key Features

1. **45-Day Awakening Challenge** - Guided gratitude journaling journey
2. **AI Characters (Yesi & Garin)** - Interactive coaching assistants
3. **Gamification** - Badges, streaks, multipliers, leaderboards
4. **Cohort System** - Group-based challenges with community features
5. **Video Calls** - 100ms integration for coaching and community calls
6. **Social Sharing** - Shareable DGA cards for social media

## Support

For questions or issues:
- Check the [Troubleshooting Guide](./guides/debugging.md)
- Open an issue on GitHub
- Contact the development team
