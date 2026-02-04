# AI Components Documentation

## Overview

The AI module provides a complete chat interface for interacting with AI coaching characters (Yesi and Garin). Components are located in `/modules/ai/components/`.

---

## Component Architecture

```
modules/ai/
├── components/
│   ├── CharacterAvatar.tsx      # Character profile image
│   ├── CharacterSelector.tsx    # Character selection UI
│   ├── ChatMessage.tsx          # Individual chat message
│   ├── ChatInput.tsx            # Message input with send button
│   ├── ChatContainer.tsx        # Main chat container
│   └── FloatingChatButton.tsx   # Floating action button
└── hooks/
    └── useAIChat.ts             # Chat state management hook
```

---

## Components

### CharacterAvatar

Displays the character's avatar image.

**File:** `modules/ai/components/CharacterAvatar.tsx`

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| characterKey | CharacterKey | Yes | - | Character identifier |
| size | 'small' \| 'medium' \| 'large' | No | 'medium' | Avatar size |
| sx | string | No | - | Additional CSS classes |

**Sizes:**

- `small`: 32x32px
- `medium`: 48x48px
- `large`: 80x80px

**Usage:**

```tsx
<CharacterAvatar characterKey="yesi" size="large" />
```

---

### CharacterSelector

Allows users to select which AI character to chat with.

**File:** `modules/ai/components/CharacterSelector.tsx`

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| selectedCharacter | CharacterKey \| null | No | null | Currently selected character |
| suggestedCharacter | CharacterKey \| null | No | null | System-suggested character |
| onSelect | (key: CharacterKey) => void | Yes | - | Selection callback |
| variant | 'cards' \| 'pills' | No | 'cards' | Display style |

**Features:**

- Shows character name, role, and avatar
- Highlights suggested character with badge
- Cards variant for full display, pills for compact

**Usage:**

```tsx
<CharacterSelector
  selectedCharacter={activeCharacter}
  suggestedCharacter={suggestedCharacter}
  onSelect={handleSelectCharacter}
  variant="cards"
/>
```

---

### ChatMessage

Renders a single chat message (user or assistant).

**File:** `modules/ai/components/ChatMessage.tsx`

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| role | 'user' \| 'assistant' | Yes | - | Message sender |
| content | string | Yes | - | Message text |
| characterKey | CharacterKey | No | - | Character (for assistant messages) |
| characterName | string | No | - | Display name |
| timestamp | string | No | - | ISO timestamp |
| isStreaming | boolean | No | false | Shows typing indicator |

**Styling:**

- User messages: Right-aligned, action color background
- Assistant messages: Left-aligned, with avatar, light background
- Streaming: Pulsing cursor animation

**Usage:**

```tsx
<ChatMessage
  role="assistant"
  content="Hello! How can I help you today?"
  characterKey="yesi"
  characterName="Yesi"
  timestamp={new Date().toISOString()}
/>
```

---

### ChatInput

Message input field with send functionality.

**File:** `modules/ai/components/ChatInput.tsx`

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| onSend | (message: string) => void | Yes | - | Send callback |
| isLoading | boolean | No | false | Disables input while loading |
| placeholder | string | No | 'Type a message...' | Input placeholder |

**Features:**

- Auto-expanding textarea
- Send on Enter (Shift+Enter for newline)
- Disabled state during streaming
- Character count (optional)

**Usage:**

```tsx
<ChatInput onSend={handleSendMessage} isLoading={isStreaming} placeholder="Message Yesi..." />
```

---

### ChatContainer

Main container that orchestrates the complete chat experience.

**File:** `modules/ai/components/ChatContainer.tsx`

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| onClose | () => void | No | - | Close callback (shows X button) |
| showHeader | boolean | No | true | Show header with character info |
| sx | string | No | - | Additional CSS classes |

**States:**

1. **Character Selection**: Shows CharacterSelector when no character is active
2. **Empty Chat**: Shows welcome message and suggested prompts
3. **Active Chat**: Shows message history, streaming response, input

**Features:**

- Auto-scroll to bottom on new messages
- Character switching button
- Clear chat button
- Loading indicator with bouncing dots
- Error display
- Suggested prompts for empty state

**Usage:**

```tsx
<ChatContainer onClose={() => setShowChat(false)} showHeader={true} sx="h-[600px]" />
```

---

### FloatingChatButton

Floating action button to open chat interface.

**File:** `modules/ai/components/FloatingChatButton.tsx`

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| onClick | () => void | Yes | - | Click handler |
| position | 'bottom-right' \| 'bottom-left' | No | 'bottom-right' | Screen position |
| unreadCount | number | No | 0 | Notification badge count |

**Features:**

- Fixed position on screen
- Pulse animation for notifications
- Accessible button with aria-label

**Usage:**

```tsx
<FloatingChatButton onClick={() => setShowChat(true)} position="bottom-right" unreadCount={0} />
```

---

## Hook: useAIChat

Custom hook for managing AI chat state and interactions.

**File:** `modules/ai/hooks/useAIChat.ts`

**Returns:**

```typescript
interface UseAIChatReturn {
  // State
  characters: {
    data: CharacterInfo[];
    loading: boolean;
    fetched: boolean;
    error: string;
  };
  activeCharacter: CharacterKey | null;
  suggestedCharacter: CharacterKey | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  loading: boolean;
  error: string;

  // Actions
  fetchCharacters: () => Promise<void>;
  fetchSuggestedCharacter: () => Promise<void>;
  setActiveCharacter: (key: CharacterKey) => void;
  sendMessage: (message: string) => Promise<void>;
  sendMessageStream: (message: string) => Promise<void>;
  clearChat: () => void;
}
```

**Usage:**

```tsx
function MyComponent() {
  const {
    characters,
    activeCharacter,
    messages,
    isStreaming,
    streamingContent,
    sendMessageStream,
    setActiveCharacter,
    fetchCharacters,
  } = useAIChat();

  useEffect(() => {
    if (!characters.fetched && !characters.loading) {
      fetchCharacters();
    }
  }, [characters.fetched, characters.loading, fetchCharacters]);

  const handleSend = (text: string) => {
    sendMessageStream(text);
  };

  return (
    <div>
      {messages.map((msg, i) => (
        <ChatMessage key={i} {...msg} />
      ))}
      {isStreaming && <p>{streamingContent}</p>}
    </div>
  );
}
```

---

## Redux State

The AI module uses Redux for state management.

**State Structure:**

```typescript
interface AIState {
  characters: {
    data: CharacterInfo[];
    loading: boolean;
    fetched: boolean;
    error: string;
  };
  activeCharacter: CharacterKey | null;
  suggestedCharacter: CharacterKey | null;
  chat: {
    messages: ChatMessage[];
    isStreaming: boolean;
    streamingContent: string;
    loading: boolean;
    error: string;
    currentSessionId: string | null;
  };
  history: {
    [characterKey: string]: ChatMessage[];
  };
}
```

**Actions:**
| Action | Description |
|--------|-------------|
| charactersRequested | Start loading characters |
| charactersFetched | Characters loaded successfully |
| charactersFailed | Characters loading failed |
| setActiveCharacter | Set the active chat character |
| setSuggestedCharacter | Set system-suggested character |
| chatRequested | Start chat request |
| chatMessageAdded | Add message to history |
| chatResponseReceived | Received AI response |
| chatFailed | Chat request failed |
| streamStarted | Begin streaming response |
| streamChunkReceived | Receive streaming chunk |
| streamCompleted | Streaming finished |
| streamFailed | Streaming error |
| clearChat | Clear message history |
| historyLoaded | Load conversation history |

---

## Styling Guidelines

### Color Tokens

- User messages: `bg-action` (primary action color)
- Assistant messages: `bg-bkg-light`
- Character name: `text-content-dark`
- Timestamps: `text-content-dark-secondary`
- Errors: `text-danger`, `bg-danger/10`

### Spacing

- Message gap: `space-y-4` (16px)
- Container padding: `p-4` (16px)
- Avatar to text gap: `gap-3` (12px)

### Typography

- Messages: `paragraphVariants.regular`
- Character name: `paragraphVariants.regular` + `font-bold`
- Timestamps: `paragraphVariants.meta`

---

## Accessibility

- All buttons have `aria-label` attributes
- Focus states with visible outlines
- Screen reader announcements for new messages
- Keyboard navigation support
- Loading states communicated via `aria-busy`
