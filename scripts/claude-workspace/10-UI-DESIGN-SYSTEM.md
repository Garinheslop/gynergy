# GYNERGY — UI Design System & Component Patterns

## Color System (CSS Custom Properties)

### Primary Action (Teal/Turquoise)

- `--color-action`: #99f6e0
- Range: 25 (lightest) → 950 (darkest)

### Accent Colors

| Token          | Hex              | Usage                          |
| -------------- | ---------------- | ------------------------------ |
| Primary yellow | #ffc878, #ff8b48 | Highlights, warmth             |
| Purple         | #a86cff, #ecdfff | Badges, special elements       |
| Success green  | #7ef698          | Confirmations, positive states |
| Danger red     | #fd6a6a          | Errors, destructive actions    |
| Warning orange | #f69859          | Alerts, caution states         |
| Gold           | #b8943e          | Assessment reports, premium    |
| Teal           | #7dd3c0          | Brand accent, CTAs             |

### Backgrounds

| Context | Light   | Dark    |
| ------- | ------- | ------- |
| Base    | #ffffff | #131313 |
| Surface | #f5f5f5 | #27282a |
| Content | #f5f9ff | #181d27 |

### Borders

| Context | Light   | Dark    |
| ------- | ------- | ------- |
| Default | #e9eaeb | #22252a |

---

## Typography

- **Font Family:** Work Sans (weights 100–900, Google Fonts)
- **Heading:** 3rem (`--text-heading`)
- **Subheading:** 1.5rem
- **Body:** 1rem
- **Small:** 0.875rem
- **Caption:** 0.875rem
- **Line Heights:** tight (1.2), normal (1.5), loose (1.8)

---

## Spacing & Layout

### Border Radius

| Token       | Value  |
| ----------- | ------ |
| Default     | 10px   |
| Small       | 5px    |
| Large       | 20px   |
| Full (pill) | 9999px |

### Breakpoints

| Token | Width  | Usage         |
| ----- | ------ | ------------- |
| xsm   | 450px  | Small phones  |
| sm    | 640px  | Phones        |
| md    | 768px  | Tablets       |
| xmd   | 900px  | Small laptops |
| lg    | 1024px | Laptops       |
| xl    | 1280px | Desktops      |
| 2xl   | 1536px | Large screens |
| 3xl   | 1600px | Ultra-wide    |

---

## Animation & Transitions

### Durations

| Token   | Value |
| ------- | ----- |
| instant | 0ms   |
| fast    | 150ms |
| normal  | 250ms |
| slow    | 400ms |
| slower  | 600ms |

### Easing Functions

- default, in, out, inOut, bounce

### Common Patterns

- `fadeNormal`: opacity with 250ms
- `scaleNormal`: transform with 250ms
- `allFast`: all properties with 150ms
- `allSlow`: all properties with 400ms

---

## Shared Component Library

**Location:** `modules/common/components/`

| Component        | Purpose                                   |
| ---------------- | ----------------------------------------- |
| Accordion        | Expandable content sections               |
| ActionButton     | Primary action buttons with variants      |
| Card             | Content container with consistent styling |
| ErrorBoundary    | React error boundary wrapper              |
| FileInput        | File upload with drag-and-drop            |
| Footer           | App footer                                |
| Image            | Optimized image component                 |
| Input            | Form text input (accessibility TODO)      |
| LazyLoad         | Intersection observer lazy loading        |
| Loader           | Full-page loading state                   |
| OfflineIndicator | Network status banner                     |
| SectionCard      | Titled card sections                      |
| SkeletonWrapper  | Loading skeleton placeholders             |
| Spinner          | Inline loading spinner                    |
| TextArea         | Multi-line text input                     |

**Pattern:** Components use Tailwind CSS, accept className overrides, some have `.stories.tsx` files for Storybook.

---

## Reaction Icons (Custom SVG — No Emoji)

| Type      | Color  | Label      |
| --------- | ------ | ---------- |
| Cheer     | Amber  | Nice!      |
| Fire      | Red    | On fire!   |
| Heart     | Pink   | Love this! |
| Celebrate | Purple | Celebrate! |
| Inspire   | Cyan   | Inspiring! |
| Support   | Green  | Support!   |

---

## Design Principles

- **Dark-first:** Primary UI is dark theme (#131313 base)
- **Teal accent:** Brand color used for CTAs, active states, progress
- **Gold for premium:** Assessment reports, certificates, achievements
- **Minimal decoration:** Let content breathe, avoid visual clutter
- **Mobile-first:** Responsive from 450px up
- **No emoji in brand copy:** Custom SVG icons for all reactions
