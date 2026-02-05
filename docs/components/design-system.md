# Gynergy Design System

> A comprehensive guide to the Gynergy design language, tokens, and components.

## Table of Contents

- [Color System](#color-system)
- [Typography](#typography)
- [Spacing & Layout](#spacing--layout)
- [Components](#components)
- [Accessibility](#accessibility)
- [Usage Guidelines](#usage-guidelines)

---

## Color System

### Primary Palette

| Token | Value | CSS Variable | Usage |
|-------|-------|--------------|-------|
| **Action (Teal)** | `#99f6e0` | `--color-action` | Primary CTAs, interactive elements, links |
| **Primary (Orange)** | `#ffc878` | `--color-primary` | Highlights, achievements, streaks |
| **Purple** | `#a86cff` | `--color-purple` | Badges, accents, admin roles |

### Action Color Scale

```css
--color-action-25: #f1fefa;   /* Lightest - backgrounds */
--color-action-50: #d8fcf2;
--color-action-100: #9af6e1;
--color-action-200: #6eecd0;
--color-action-300: #41d9bb;
--color-action-400: #1ec2a3;
--color-action-500: #07a78a;   /* Default interactive */
--color-action-600: #008572;
--color-action-700: #006b5e;
--color-action-800: #00544c;
--color-action-900: #00453f;
--color-action-950: #002824;   /* Darkest */
```

### Semantic Colors

| Token | Value | Usage |
|-------|-------|-------|
| Success | `#7ef698` | Positive feedback, completed states |
| Danger | `#fd6a6a` | Errors, destructive actions |
| Warning | `#f69859` | Caution states, alerts |

### Background Colors

| Token | Value | Usage |
|-------|-------|-------|
| `bkg-dark` | `#131313` | Primary dark background |
| `bkg-dark-secondary` | `#27282a` | Card backgrounds, elevated surfaces |
| `bkg-dark-tertiary` | `#000000` | Deepest backgrounds |
| `bkg-light` | `#ffffff` | Light mode primary |
| `bkg-light-secondary` | `#f5f5f5` | Light mode cards |

### Content Colors

| Token | Usage |
|-------|-------|
| `content-dark` | Primary text on light backgrounds |
| `content-light` | Primary text on dark backgrounds |
| `grey-400` | Secondary text |
| `grey-500` | Muted text, placeholders |
| `grey-600` | Disabled states |

### Border Colors

| Token | Usage |
|-------|-------|
| `border-dark` | Borders on dark backgrounds |
| `border-light` | Borders on light backgrounds |

---

## Typography

### Font Family

**Work Sans** - A grotesque sans-serif typeface that balances professionalism with warmth.

```css
font-family: "Work Sans", system-ui, sans-serif;
```

### Type Scale

#### Headings

| Variant | Size | Weight | Element | Usage |
|---------|------|--------|---------|-------|
| `heading` | 48px | Bold | `<h1>` | Page titles |
| `section-heading` | 48px | Bold | `<h2>` | Section headers |
| `title-lg` | 36px | Semibold | `<h2>` | Large card titles |
| `card-heading` | 30px | Semibold | `<h3>` | Card headers |
| `title` | 24px | Semibold | `<h3>` | Small headings |

#### Paragraphs

| Variant | Size | Usage |
|---------|------|-------|
| `title-xlg` | 48px | Hero statements |
| `title-lg` | 30px | Section intros |
| `title` | 24px | Card titles |
| `regular` | 18px | Body text (default) |
| `meta` | 16px | Timestamps, labels, secondary info |

### Usage Example

```tsx
import { Heading } from "@modules/common/components/typography/Heading";
import { Paragraph } from "@modules/common/components/typography/Paragraph";
import { headingVariants, paragraphVariants } from "@resources/variants";

// Page title
<Heading variant={headingVariants.heading}>Welcome to Gynergy</Heading>

// Section header
<Heading variant={headingVariants.cardHeading}>Today's Progress</Heading>

// Body text
<Paragraph variant={paragraphVariants.regular} content="Your journey begins..." />

// Meta info
<Paragraph variant={paragraphVariants.meta} content="Posted 2h ago" sx="text-grey-500" />
```

---

## Spacing & Layout

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 5px | Small elements, badges |
| `rounded` | 10px | Cards, buttons, inputs |
| `rounded-large` | 20px | Large cards, modals |
| `rounded-full` | 9999px | Avatars, pills |

### Breakpoints

| Token | Value | Usage |
|-------|-------|-------|
| `xsm` | 450px | Small mobile |
| `sm` | 640px | Mobile |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1400px | Wide screens |
| `3xl` | 1600px | Ultra-wide |

### Touch Targets

- **Minimum size**: 44x44px for all interactive elements
- **Recommended**: 48px for primary actions
- Use `min-h-[44px]` and `min-w-[44px]` classes

---

## Components

### Interactive Components

| Component | Import | Description |
|-----------|--------|-------------|
| `ActionButton` | `@modules/common/components/ActionButton` | Primary button with variants |
| `Input` | `@modules/common/components/Input` | Text input with labels/errors |
| `TextArea` | `@modules/common/components/TextArea` | Multi-line input |

### Typography Components

| Component | Import | Description |
|-----------|--------|-------------|
| `Heading` | `@modules/common/components/typography/Heading` | Semantic headings |
| `Paragraph` | `@modules/common/components/typography/Paragraph` | Body text |

### Community Components

| Component | Import | Description |
|-----------|--------|-------------|
| `PostCard` | `@modules/community/components/PostCard` | Community feed post |
| `MemberCard` | `@modules/community/components/MemberCard` | Member profile card |
| `CommentSection` | `@modules/community/components/CommentSection` | Nested comments |

### View in Storybook

Run `npm run storybook` to see interactive examples of all components.

---

## Accessibility

### WCAG 2.1 AA Compliance

- **Color Contrast**: All text meets 4.5:1 minimum contrast ratio
- **Focus States**: All interactive elements have visible `focus-visible` rings
- **Touch Targets**: Minimum 44x44px for all interactive elements
- **Keyboard Navigation**: Full support for Tab, Arrow keys, Enter, Escape

### Focus Styles

```tsx
// Default focus-visible pattern
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2"
```

### ARIA Patterns

```tsx
// Buttons with state
<button aria-pressed={isActive} aria-label="Toggle setting">

// Expandable sections
<button aria-expanded={isOpen} aria-controls="panel-id">

// Tabs
<div role="tablist" aria-label="Section tabs">
  <button role="tab" aria-selected={isSelected} tabIndex={isSelected ? 0 : -1}>
```

---

## Usage Guidelines

### Do's

- ✅ Use `bg-action` for primary CTAs
- ✅ Use `bg-primary` for achievements and highlights
- ✅ Use `text-grey-500` for secondary/muted text
- ✅ Use `rounded` (10px) for cards and buttons
- ✅ Use semantic color tokens, not raw hex values
- ✅ Include `min-h-[44px]` on all interactive elements

### Don'ts

- ❌ Don't use `bg-indigo-*`, `bg-purple-*`, or `bg-gray-*` (use design tokens)
- ❌ Don't use `rounded-xl` (use `rounded` instead)
- ❌ Don't create custom button styles (use `ActionButton`)
- ❌ Don't use touch targets smaller than 44x44px
- ❌ Don't rely on color alone to convey meaning

### Color Usage Examples

```tsx
// Primary CTA
<button className="bg-action text-content-dark hover:bg-action-100">
  Get Started
</button>

// Secondary CTA
<button className="bg-bkg-dark-secondary border border-border-dark text-content-light hover:bg-bkg-dark-800">
  Cancel
</button>

// Success state
<div className="bg-success/20 text-success border border-success/30">
  Completed!
</div>

// Error state
<div className="bg-danger/10 text-danger border border-danger/30">
  Error message
</div>
```

---

## Related Resources

- [Storybook](http://localhost:6006) - Interactive component examples
- [Brand Guidelines](../BRAND_GUIDELINES.md) - Logo, voice, and imagery
- [Component Patterns](./component-patterns.md) - Common UI patterns
