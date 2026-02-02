# Contributing to Gynergy

Thank you for your interest in contributing to Gynergy! This document provides guidelines and workflows for contributing.

## Development Setup

### Prerequisites
- Node.js 20+
- npm or yarn
- Git
- Supabase CLI (for local development)

### Getting Started

1. Clone the repository:
```bash
git clone https://github.com/your-org/gynergy.git
cd gynergy
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

4. Run the development server:
```bash
npm run dev
```

## Code Standards

### TypeScript
- Use strict mode (enabled in tsconfig.json)
- Prefer explicit types over `any`
- Use interfaces for object shapes
- Export types from dedicated files

### React
- Use functional components with hooks
- Follow the component pattern in `/modules/common/components/`
- Use `cn()` utility for conditional classNames
- Props interface with `sx?: string` for style overrides

### Styling
- Use Tailwind CSS classes
- Follow the 8pt grid system
- Maintain Apple HIG touch targets (44x44pt minimum)
- Support dark mode and reduced motion

### Redux
- Use Redux Toolkit slices
- Follow the pattern in `/store/modules/`
- Use async thunks for API calls
- Keep state normalized

### API Routes
- Follow the pattern in `/app/api/*/[requestType]/route.ts`
- Always authenticate requests
- Use Zod for validation
- Return consistent error shapes

## Commit Guidelines

### Commit Message Format
```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```
feat(gamification): add badge unlock animation
fix(journal): correct streak calculation for timezone
docs(api): add endpoint documentation for badges
```

## Pull Request Process

1. **Create a branch** from `develop`:
```bash
git checkout -b feat/your-feature-name
```

2. **Make your changes** following code standards

3. **Run quality checks**:
```bash
npm run lint          # Check linting
npm run type-check    # Check types
npm run test          # Run tests
npm run build         # Verify build
```

4. **Commit your changes** with descriptive messages

5. **Push and create PR** against `develop`:
```bash
git push -u origin feat/your-feature-name
```

6. **Fill out the PR template** with:
   - Description of changes
   - Related issues
   - Testing performed
   - Screenshots (if UI changes)

7. **Request review** from a team member

8. **Address feedback** and update PR

9. **Merge** after approval and passing CI

## Testing

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Writing Tests
- Place tests in `/__tests__/` mirroring the source structure
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external services appropriately

## Documentation

### When to Document
- New features or APIs
- Complex logic or algorithms
- Breaking changes
- Environment setup changes

### Where to Document
- Code comments: Complex logic only
- `/docs/api/`: API endpoints
- `/docs/guides/`: How-to guides
- `/docs/adr/`: Architecture decisions

## Questions?

- Check existing documentation
- Search closed issues
- Open a new issue for discussion
- Contact the maintainers
