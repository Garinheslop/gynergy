# ADR 0004: AI Character System Architecture

## Status
Accepted

## Date
2024-02-01

## Context

Gynergy's 45-Day Awakening Challenge requires personalized AI coaching to help users on their gratitude journey. Users need supportive, context-aware conversations that understand their progress, mood trends, journal entries, and achievements.

Key requirements:
1. Two distinct AI personas with different coaching styles
2. Context-aware responses using user's journey data
3. Streaming responses for better UX
4. Conversation history persistence
5. Provider fallback (OpenAI primary, Anthropic backup)
6. Token budget management
7. Integration with existing Redux store patterns

## Decision

### Architecture Overview

We implemented a modular AI system with the following structure:

```
lib/ai/
├── character-config.ts    # Character personas and system prompts
├── context-manager.ts     # User context building and conversation storage
├── providers/
│   ├── types.ts          # AI provider type definitions
│   ├── openai.ts         # OpenAI GPT-4o integration
│   ├── anthropic.ts      # Claude 3.5 Sonnet fallback
│   └── index.ts          # Provider orchestration
└── index.ts              # Main API (chat, chatStream)
```

### Character Personas

Two characters with complementary coaching styles:

**Yesi (Nurturing Transformation Coach)**
- Warm, empathetic, intuitive approach
- Focus: emotional support, gratitude deepening, celebration
- Suggested when: mood declining, streaks broken, emotional support needed

**Garin (Strategic Accountability Coach)**
- Direct, analytical, action-oriented approach
- Focus: goal-setting, accountability, consistency
- Suggested when: stable mood, long streaks, goal-focused needs

### Context Management

User context is built from:
1. **User Profile**: Name, day in journey, current streaks
2. **Recent Journals**: Last 5 morning/evening journals with mood scores
3. **Recent DGAs**: Last 7 Daily Gratitude Actions with themes
4. **Badges**: Recently earned badges, total count
5. **Mood Trend**: Calculated from recent mood scores

Token budgets:
- System prompt: 1500 tokens
- User context: 1000 tokens
- Conversation history: 2000 tokens (last 10 messages, trimmed)
- Response: 800 tokens max

### Provider Strategy

1. **Primary**: OpenAI GPT-4o (model: `gpt-4o`)
2. **Fallback**: Anthropic Claude 3.5 Sonnet (model: `claude-3-5-sonnet-20241022`)

Provider selection:
- If OPENAI_API_KEY is set: Use OpenAI
- If only ANTHROPIC_API_KEY is set: Use Anthropic
- Both set: OpenAI primary with automatic fallback

### Streaming Implementation

SSE-based streaming for real-time responses:
- Content chunks sent as `data: {"type":"content","content":"..."}`
- Completion event: `data: {"type":"done","tokensUsed":{...}}`
- Error handling: `data: {"type":"error","error":"..."}`

### Redux Integration

Followed existing project patterns:
- `createSlice` for reducers
- Custom hook (`useAIChat`) for async operations
- State persisted except streaming content (blacklisted)

### Database Schema

```sql
-- ai_characters: Character definitions
-- ai_conversations: Message history
-- ai_user_context: Persistent user memory
-- ai_chat_sessions: Session tracking with ratings
```

## Consequences

### Positive
- Two distinct coaching styles cover different user needs
- Context-aware responses feel personalized
- Streaming provides responsive UX
- Provider fallback ensures reliability
- Token budgets prevent cost overruns
- Conversation history enables continuity

### Negative
- Two API integrations to maintain
- Context building adds latency (~200ms)
- Token budgets may truncate important history
- Character suggestions are rule-based, not ML

### Risks Mitigated
- **API failure**: Provider fallback
- **Cost**: Token budgets and rate limits
- **Poor UX**: Streaming responses
- **Data privacy**: RLS policies on all tables

## Alternatives Considered

### Single Character
Rejected: Users have different needs; two characters provide better coverage.

### Custom Fine-tuned Model
Rejected: Higher cost, complexity. GPT-4o with good prompts achieves quality results.

### RAG for Context
Considered for future: Current context building is sufficient for MVP. Vector embeddings could improve long-term memory.

### WebSocket for Streaming
Rejected: SSE is simpler, sufficient for unidirectional streaming, better browser support.

## Implementation Notes

### Files Created
- `/lib/ai/character-config.ts` - Character definitions
- `/lib/ai/context-manager.ts` - Context building
- `/lib/ai/providers/*.ts` - AI providers
- `/app/api/ai/[requestType]/route.ts` - REST API
- `/app/api/ai/chat-stream/route.ts` - Streaming endpoint
- `/store/modules/ai/reducers.ts` - Redux state
- `/modules/ai/components/*.tsx` - UI components
- `/modules/ai/hooks/useAIChat.ts` - React hook
- `/resources/types/ai.ts` - TypeScript types
- `/supabse/schema/ai-characters.sql` - Database schema

### Testing
- 33 unit tests passing
- Type checking passes
- Lint passes (AI files)
- Integration tested manually

### Environment Variables Required
```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...  # Optional fallback
```

## References
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic API Documentation](https://docs.anthropic.com)
- [Server-Sent Events Spec](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- LVL-5-LIFE Aria implementation (reference architecture)
