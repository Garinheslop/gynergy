# AI Chat API Documentation

## Overview

The AI Chat system provides interactive conversations with two AI characters (Yesi and Garin) that offer personalized coaching based on the user's gratitude journey data.

## Base URL

```
/api/ai/[requestType]
```

## Authentication

All endpoints require authentication. The user must be logged in with a valid Supabase session.

---

## GET Endpoints

### Get All Characters

Returns all available AI characters.

```
GET /api/ai/characters
```

**Response:**
```json
{
  "characters": [
    {
      "key": "yesi",
      "name": "Yesi",
      "role": "Nurturing Transformation Coach",
      "personality": {
        "traits": ["warm", "empathetic", "intuitive", "celebratory", "patient"],
        "communicationStyle": "supportive and encouraging",
        "approachToGuidance": "gentle questions and affirmations",
        "energyType": "nurturing feminine energy"
      },
      "voiceTone": ["warm", "encouraging", "gentle", "celebratory", "understanding"],
      "focusAreas": ["emotional support", "gratitude deepening", "inner transformation", "celebration of wins", "self-compassion", "mindfulness"]
    },
    {
      "key": "garin",
      "name": "Garin",
      "role": "Strategic Accountability Coach",
      "personality": {...},
      "voiceTone": [...],
      "focusAreas": [...]
    }
  ]
}
```

---

### Get Single Character

Returns details for a specific character.

```
GET /api/ai/character?key=yesi
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| key | string | Yes | Character key (`yesi` or `garin`) |

**Response:**
```json
{
  "character": {
    "key": "yesi",
    "name": "Yesi",
    "role": "Nurturing Transformation Coach",
    "personality": {...},
    "voiceTone": [...],
    "focusAreas": [...],
    "signatureExpressions": [
      "I see you, and I'm so proud of the work you're doing.",
      "Every step forward, no matter how small, is a victory worth celebrating.",
      "Your heart knows the way - let's listen together.",
      "Gratitude isn't just a practice, it's a portal to transformation."
    ]
  }
}
```

---

### Get Chat History

Returns conversation history for a specific character.

```
GET /api/ai/history?characterId={uuid}&limit=20
```

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| characterId | uuid | Yes | - | Character database ID |
| limit | number | No | 20 | Max messages to return |

**Response:**
```json
{
  "history": [
    {
      "id": "uuid",
      "role": "user",
      "content": "How am I doing on my journey?",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "You're doing wonderfully! Your 7-day streak shows real dedication...",
      "created_at": "2024-01-15T10:30:05Z",
      "tokens_used": 150
    }
  ]
}
```

---

### Get User Context (Debug)

Returns the user context used for AI conversations.

```
GET /api/ai/user-context
```

**Response:**
```json
{
  "context": {
    "user": {
      "name": "John",
      "dayInJourney": 15,
      "currentStreak": {
        "morning": 7,
        "evening": 5,
        "gratitude": 7
      }
    },
    "recentJournals": [...],
    "recentDGAs": [...],
    "badges": {
      "recent": [...],
      "total": 5
    },
    "moodTrend": "improving"
  },
  "contextString": "User: John (Day 15 of journey)\nCurrent streaks: Morning 7, Evening 5, Gratitude 7\n..."
}
```

---

### Suggest Character

Suggests the best character based on user's current state.

```
GET /api/ai/suggest-character
```

**Response:**
```json
{
  "suggestedCharacter": "yesi"
}
```

**Suggestion Logic:**
- **Yesi** suggested when: declining mood, broken streak, emotional support needed
- **Garin** suggested when: stable/improving mood, long streaks, goal-focused

---

## POST Endpoints

### Send Chat Message (Non-Streaming)

Sends a message and receives a complete response.

```
POST /api/ai/chat
```

**Request Body:**
```json
{
  "message": "How am I doing on my journey?",
  "characterKey": "yesi",
  "sessionId": "book-session-uuid" // optional
}
```

**Response:**
```json
{
  "message": "I see you've been showing up consistently for 7 days now! That's wonderful dedication...",
  "characterName": "Yesi",
  "characterKey": "yesi",
  "chatSessionId": "uuid",
  "tokensUsed": 180
}
```

---

### Send Chat Message (Streaming)

Sends a message and receives a streaming response via Server-Sent Events.

```
POST /api/ai/chat-stream
```

**Request Body:**
```json
{
  "message": "I need some motivation today",
  "characterKey": "garin"
}
```

**Response (SSE Stream):**
```
data: {"type":"content","content":"Let's"}
data: {"type":"content","content":" look"}
data: {"type":"content","content":" at"}
data: {"type":"content","content":" the"}
data: {"type":"content","content":" data"}
data: {"type":"content","content":"..."}
data: {"type":"done","characterName":"Garin","characterKey":"garin","tokensUsed":{"prompt":500,"completion":180,"total":680}}
```

**Event Types:**
| Type | Fields | Description |
|------|--------|-------------|
| content | content | Text chunk |
| done | characterName, characterKey, tokensUsed | Stream complete |
| error | error | Error message |

---

### End Chat Session

Marks a chat session as ended.

```
POST /api/ai/end-session
```

**Request Body:**
```json
{
  "chatSessionId": "uuid"
}
```

**Response:**
```json
{
  "success": true
}
```

---

### Rate Chat Session

Allows users to rate their chat experience.

```
POST /api/ai/rate-session
```

**Request Body:**
```json
{
  "chatSessionId": "uuid",
  "rating": 5,
  "feedback": "Very helpful conversation!"
}
```

**Response:**
```json
{
  "success": true
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message description"
}
```

| Status Code | Description |
|-------------|-------------|
| 400 | Bad request (missing required fields) |
| 401 | Unauthorized (not logged in) |
| 500 | Internal server error |

---

## Rate Limits

| Limit Type | Value | Window |
|------------|-------|--------|
| Requests per minute | 20 | 1 minute |
| Messages per day | 100 | 24 hours |

---

## Token Budgets

| Context Type | Max Tokens |
|--------------|------------|
| System prompt | 1500 |
| User context | 1000 |
| Conversation history | 2000 |
| Response | 800 |

---

## Integration Example

### React Hook Usage

```typescript
import { useAIChat } from "@modules/ai/hooks/useAIChat";

function ChatComponent() {
  const {
    characters,
    activeCharacter,
    messages,
    isStreaming,
    streamingContent,
    sendMessageStream,
    setActiveCharacter,
  } = useAIChat();

  // Select character
  setActiveCharacter("yesi");

  // Send message with streaming
  await sendMessageStream("How am I doing on my journey?");
}
```

### Direct API Call

```typescript
// Streaming with fetch
const response = await fetch("/api/ai/chat-stream", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "I need motivation",
    characterKey: "garin",
  }),
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = decoder.decode(value);
  const lines = text.split("\n");

  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const data = JSON.parse(line.slice(6));
      if (data.type === "content") {
        console.log(data.content);
      }
    }
  }
}
```
