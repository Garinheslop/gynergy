# AI Character System Guide

## Overview

The Gynergy AI system provides personalized coaching through two AI characters: **Yesi** (nurturing coach) and **Garin** (accountability coach). The system is context-aware, using the user's journal entries, streaks, badges, and mood data to provide relevant, personalized responses.

---

## Quick Start

### 1. Environment Setup

Add the following to your `.env.local`:

```bash
# Required: At least one AI provider
OPENAI_API_KEY=sk-your-openai-key

# Optional: Fallback provider
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
```

### 2. Database Migration

Run the AI characters schema:

```bash
# In Supabase SQL Editor, run:
# supabse/schema/ai-characters.sql
```

### 3. Using the Chat Component

```tsx
import ChatContainer from "@modules/ai/components/ChatContainer";

function MyPage() {
  const [showChat, setShowChat] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChat(true)}>Open Chat</button>

      {showChat && (
        <ChatContainer
          onClose={() => setShowChat(false)}
          showHeader={true}
          sx="h-[500px] w-[400px]"
        />
      )}
    </div>
  );
}
```

---

## Architecture

### System Flow

```
User Message
    ↓
API Route (/api/ai/chat-stream)
    ↓
Build User Context (journals, streaks, badges, mood)
    ↓
Build Character System Prompt
    ↓
AI Provider (OpenAI → Anthropic fallback)
    ↓
Stream Response (SSE)
    ↓
Save to Conversation History
    ↓
Display in UI
```

### Directory Structure

```
/lib/ai/
├── index.ts              # Main exports: chat(), chatStream()
├── character-config.ts   # Yesi & Garin persona definitions
├── context-manager.ts    # User context building
└── providers/
    ├── types.ts         # TypeScript interfaces
    ├── openai.ts        # OpenAI GPT-4o
    ├── anthropic.ts     # Claude 3.5 Sonnet
    └── index.ts         # Provider orchestration

/app/api/ai/
├── [requestType]/route.ts   # GET/POST endpoints
└── chat-stream/route.ts     # SSE streaming endpoint

/store/modules/ai/
├── reducers.ts    # Redux slice
└── index.ts       # Actions & thunks

/modules/ai/
├── components/
│   ├── CharacterAvatar.tsx
│   ├── CharacterSelector.tsx
│   ├── ChatMessage.tsx
│   ├── ChatInput.tsx
│   ├── ChatContainer.tsx
│   └── FloatingChatButton.tsx
└── hooks/
    └── useAIChat.ts
```

---

## Characters

### Yesi - Nurturing Transformation Coach

**Personality:**
- Warm, empathetic, intuitive
- Celebratory of small wins
- Uses gentle, reflective questions

**Focus Areas:**
- Emotional support
- Gratitude deepening
- Inner transformation
- Self-compassion
- Mindfulness

**Signature Expressions:**
- "I see you, and I'm so proud of the work you're doing."
- "Every step forward, no matter how small, is a victory worth celebrating."
- "Your heart knows the way - let's listen together."

**When Suggested:**
- Mood is declining
- Streak was recently broken
- User seems to need emotional support

### Garin - Strategic Accountability Coach

**Personality:**
- Direct, analytical, action-oriented
- Challenging but supportive
- Data-driven approach

**Focus Areas:**
- Goal-setting
- Accountability
- Consistency building
- Strategic planning
- Habit formation

**Signature Expressions:**
- "Let's look at the data - your streaks tell a story."
- "Consistency isn't about perfection, it's about commitment to showing up."
- "What's the ONE thing that would make everything else easier?"

**When Suggested:**
- Mood is stable or improving
- Strong streak maintained
- User seems goal-focused

---

## Context System

### What's Included

The AI receives context about the user:

1. **Profile Data**
   - User's name
   - Day in their 45-day journey
   - Current streaks (morning, evening, gratitude)

2. **Recent Journals** (last 5)
   - Journal type (morning/evening)
   - Mood score (1-10)
   - Key content highlights

3. **Recent DGAs** (last 7)
   - Gratitude reflection text
   - Identified themes

4. **Achievements**
   - Recently earned badges
   - Total badge count

5. **Mood Trend**
   - Calculated from recent mood scores
   - Values: improving, stable, declining

### Token Budgets

To manage costs and context window limits:

| Component | Max Tokens |
|-----------|------------|
| System prompt | 1500 |
| User context | 1000 |
| Conversation history | 2000 |
| AI response | 800 |

### Customizing Context

Edit `/lib/ai/context-manager.ts`:

```typescript
// Add new context fields
export async function fetchUserContext(userId: string): Promise<UserContext | null> {
  // ... existing code ...

  // Add your custom data
  const { data: customData } = await supabase
    .from("your_table")
    .select("*")
    .eq("user_id", userId);

  return {
    // ... existing fields ...
    customData,
  };
}

// Update context string builder
export function buildUserContextString(context: UserContext): string {
  // ... existing code ...

  // Add custom data to context string
  if (context.customData) {
    contextParts.push(`Custom info: ${context.customData}`);
  }

  return contextParts.join("\n\n");
}
```

---

## API Usage

### REST Endpoints

```typescript
// Get all characters
GET /api/ai/characters

// Get single character
GET /api/ai/character?key=yesi

// Get chat history
GET /api/ai/history?characterId={uuid}&limit=20

// Get user context (debug)
GET /api/ai/user-context

// Get suggested character
GET /api/ai/suggest-character

// Send message (non-streaming)
POST /api/ai/chat
{
  "message": "How am I doing?",
  "characterKey": "yesi"
}

// End session
POST /api/ai/end-session
{
  "chatSessionId": "uuid"
}

// Rate session
POST /api/ai/rate-session
{
  "chatSessionId": "uuid",
  "rating": 5,
  "feedback": "Great conversation!"
}
```

### Streaming Endpoint

```typescript
POST /api/ai/chat-stream
{
  "message": "I need motivation",
  "characterKey": "garin"
}

// Response: Server-Sent Events
data: {"type":"content","content":"Let's"}
data: {"type":"content","content":" look..."}
data: {"type":"done","characterName":"Garin","tokensUsed":{"total":250}}
```

### Using the Hook

```typescript
import { useAIChat } from "@modules/ai/hooks/useAIChat";

function MyChatComponent() {
  const {
    // State
    characters,
    activeCharacter,
    messages,
    isStreaming,
    streamingContent,
    loading,
    error,

    // Actions
    fetchCharacters,
    setActiveCharacter,
    sendMessageStream,
    clearChat,
  } = useAIChat();

  // Fetch characters on mount
  useEffect(() => {
    if (!characters.fetched) {
      fetchCharacters();
    }
  }, []);

  // Send a message
  const handleSend = async (text: string) => {
    await sendMessageStream(text);
  };

  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i}>{msg.content}</div>
      ))}
      {isStreaming && <div>{streamingContent}</div>}
    </div>
  );
}
```

---

## Adding a New Character

### 1. Update Character Config

Edit `/lib/ai/character-config.ts`:

```typescript
export const CHARACTERS: Record<CharacterKey, CharacterConfig> = {
  yesi: { /* existing */ },
  garin: { /* existing */ },

  // Add new character
  newcharacter: {
    key: "newcharacter",
    name: "New Character",
    role: "Specialist Coach",
    personality: {
      traits: ["trait1", "trait2"],
      communicationStyle: "description",
      approachToGuidance: "description",
      energyType: "description",
    },
    voiceTone: ["tone1", "tone2"],
    focusAreas: ["area1", "area2"],
    signatureExpressions: [
      "Quote 1",
      "Quote 2",
    ],
    systemPromptAddition: `
      Your character-specific system prompt here.
      Describe how this character should behave.
    `,
  },
};
```

### 2. Update Types

Edit `/resources/types/ai.ts`:

```typescript
export type CharacterKey = "yesi" | "garin" | "newcharacter";
```

### 3. Add Database Record

```sql
INSERT INTO ai_characters (key, name, role, personality, system_prompt, voice_tone, focus_areas, signature_expressions)
VALUES (
  'newcharacter',
  'New Character',
  'Specialist Coach',
  '{"traits": ["trait1", "trait2"]}',
  'System prompt text...',
  ARRAY['tone1', 'tone2'],
  ARRAY['area1', 'area2'],
  ARRAY['Quote 1', 'Quote 2']
);
```

### 4. Add Avatar Image

Place avatar image in `/public/images/ai/newcharacter.png`

Update `CharacterAvatar.tsx` if needed.

---

## Provider Configuration

### OpenAI (Primary)

```typescript
// lib/ai/providers/openai.ts
const response = await openai.chat.completions.create({
  model: "gpt-4o",           // Model
  messages: [...],
  max_tokens: 800,           // Max response length
  temperature: 0.8,          // Creativity (0-2)
  stream: true,              // Enable streaming
});
```

### Anthropic (Fallback)

```typescript
// lib/ai/providers/anthropic.ts
const response = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  messages: [...],
  max_tokens: 800,
  system: systemPrompt,
  stream: true,
});
```

### Switching Providers

The system automatically uses OpenAI if available, falling back to Anthropic:

```typescript
// lib/ai/providers/index.ts
export function isAIConfigured(): boolean {
  return !!openaiApiKey || !!anthropicApiKey;
}

// Provider priority
const providers = [openaiProvider, anthropicProvider];
```

To force a specific provider, modify the providers array order.

---

## Troubleshooting

### "No AI provider configured"

Ensure you have at least one API key in `.env.local`:
```bash
OPENAI_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-ant-...
```

### Streaming not working

1. Check browser console for errors
2. Verify SSE endpoint is accessible
3. Check for CORS issues

### Context not appearing in responses

1. Verify user has journal data
2. Check `fetchUserContext` is returning data
3. Review token budget limits

### Rate limit errors

Implement request throttling or upgrade API plan:

```typescript
// Example: Simple rate limiting
const lastRequest = useRef<number>(0);

const sendWithRateLimit = async (message: string) => {
  const now = Date.now();
  if (now - lastRequest.current < 1000) {
    throw new Error("Please wait before sending another message");
  }
  lastRequest.current = now;
  await sendMessageStream(message);
};
```

---

## Testing

### Unit Tests

Run the AI unit tests:

```bash
npm test -- --grep "ai"
```

### Manual Testing

1. Start dev server: `npm run dev`
2. Navigate to a page with chat
3. Open developer tools (Network tab)
4. Send a message and verify:
   - SSE events are received
   - Response displays progressively
   - Conversation is saved

### Testing Without API Keys

Use the mock provider for testing:

```typescript
// Create a mock provider
const mockProvider: AIProvider = {
  name: "mock",
  isConfigured: () => true,
  complete: async () => ({
    content: "Mock response",
    tokensUsed: { prompt: 0, completion: 0, total: 0 },
  }),
  stream: async function* () {
    yield { type: "content", content: "Mock " };
    yield { type: "content", content: "response" };
    yield { type: "done", tokensUsed: { prompt: 0, completion: 0, total: 0 } };
  },
};
```

---

## Security Considerations

1. **API Keys**: Never expose in client-side code
2. **Rate Limiting**: Implement per-user limits
3. **Input Validation**: Sanitize user messages
4. **RLS Policies**: All tables have row-level security
5. **Token Limits**: Prevent excessive context injection

---

## Performance Optimization

1. **Context Caching**: Cache user context for 5 minutes
2. **History Pagination**: Load only recent messages
3. **Streaming**: Use SSE for responsive UX
4. **Debounce**: Prevent rapid-fire messages

---

## Monitoring

Track these metrics:

1. **API Usage**: Tokens consumed per provider
2. **Response Time**: Time to first token
3. **Error Rate**: Failed requests
4. **User Engagement**: Messages per session
5. **Satisfaction**: Session ratings

Implement logging:

```typescript
// In chat function
console.log({
  event: "ai_chat",
  userId,
  characterKey,
  tokensUsed: result.tokensUsed,
  responseTime: Date.now() - startTime,
});
```
