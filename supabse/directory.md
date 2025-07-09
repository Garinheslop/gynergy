gynergy/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   ├── (dashboard)/
│   │   ├── page.tsx
│   │   └── components/
│   │       ├── JournalEditor.tsx
│   │       └── PhotoUploadOCR.tsx
│   ├── (leaderboard)/
│   │   └── page.tsx
│   ├── (history)/
│   │   ├── list/
│   │   │   └── page.tsx
│   │   ├── calendar/
│   │   │   └── page.tsx
│   ├── (profile)/
│   │   └── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/route.ts
│   │   ├── journal/
│   │   │   ├── save/route.ts
│   │   │   └── upload/route.ts
│   │   ├── leaderboard/
│   │   │   ├── streaks/route.ts
│   │   │   └── points/route.ts
│   │   ├── user/
│   │   │   └── profile/route.ts
│   │   └── ocr/route.ts (Optional if separate)
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── supabaseClient.ts
│   ├── authOptions.ts
│   └── ocrService.ts
├── prisma/
│   └── schema.prisma (Optional if using Prisma)
├── public/
│   └── placeholder.png (example)
├── .env.local (not committed)
├── next.config.js
├── package.json
├── tsconfig.json
├── README.md
└── requirements.txt