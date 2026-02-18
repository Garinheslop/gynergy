"use client";

import { FC, useState, useEffect, useRef, KeyboardEvent } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { useSession } from "@contexts/UseSession";
import { useDirectMessages, Conversation, DirectMessage } from "@lib/hooks/useDirectMessages";
import { formatTimeAgo } from "@lib/utils/date";
import { cn } from "@lib/utils/style";
import { Avatar } from "@modules/common/components/ui";

const MessagesPage: FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, authenticating } = useSession();
  const userId = session?.user?.id;

  const initialPartnerId = searchParams.get("userId");

  const {
    conversations,
    totalUnread,
    conversationsLoading,
    messages,
    messagesLoading,
    hasMoreMessages,
    loadMoreMessages,
    sendMessage,
    openThread,
    activePartnerId,
  } = useDirectMessages(userId);

  const [showInbox, setShowInbox] = useState(true); // Mobile toggle

  // Redirect if not logged in
  useEffect(() => {
    if (!authenticating && !session?.user) {
      router.push("/login");
    }
  }, [session, authenticating, router]);

  // Open initial thread from URL param
  useEffect(() => {
    if (initialPartnerId && userId) {
      openThread(initialPartnerId);
      setShowInbox(false);
    }
  }, [initialPartnerId, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectConversation = (partnerId: string) => {
    openThread(partnerId);
    setShowInbox(false);

    const params = new URLSearchParams();
    params.set("userId", partnerId);
    router.replace(`/community/messages?${params}`, { scroll: false });
  };

  const handleBackToInbox = () => {
    setShowInbox(true);
    router.replace("/community/messages", { scroll: false });
  };

  const activeConversation = conversations.find((c) => c.partnerId === activePartnerId);
  const partnerName = activeConversation?.partner
    ? activeConversation.partner.firstName + " " + activeConversation.partner.lastName
    : "Loading...";

  if (authenticating) {
    return (
      <div className="bg-bkg-dark flex min-h-screen items-center justify-center">
        <div className="border-action-100 border-t-action h-12 w-12 animate-spin rounded-full border-4" />
      </div>
    );
  }

  return (
    <div className="bg-bkg-dark flex min-h-screen flex-col">
      {/* Header */}
      <div className="border-border-dark border-b">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
          <button
            onClick={() => router.push("/community")}
            className="text-grey-400 hover:text-content-light focus-visible:ring-action min-h-[44px] min-w-[44px] rounded-lg p-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            aria-label="Back to community"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-content-light text-lg font-bold">Messages</h1>
            {totalUnread > 0 && (
              <p className="text-action text-xs font-medium">{totalUnread} unread</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 overflow-hidden">
        {/* Conversation List */}
        <div
          className={cn(
            "border-border-dark flex-shrink-0 overflow-y-auto border-r",
            "w-full md:w-80 lg:w-96",
            !showInbox && "hidden md:block"
          )}
        >
          <ConversationList
            conversations={conversations}
            loading={conversationsLoading}
            activePartnerId={activePartnerId}
            currentUserId={userId}
            onSelect={handleSelectConversation}
            onBrowseMembers={() => router.push("/community?tab=members")}
          />
        </div>

        {/* Thread View */}
        <div className={cn("flex flex-1 flex-col", showInbox && "hidden md:flex")}>
          {activePartnerId ? (
            <ThreadView
              activePartnerId={activePartnerId}
              activeConversation={activeConversation}
              partnerName={partnerName}
              messages={messages}
              messagesLoading={messagesLoading}
              hasMoreMessages={hasMoreMessages}
              loadMoreMessages={loadMoreMessages}
              userId={userId}
              onBack={handleBackToInbox}
              onSend={sendMessage}
            />
          ) : (
            <EmptyThreadPlaceholder />
          )}
        </div>
      </div>
    </div>
  );
};

// --- Sub-components ---

interface ConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  activePartnerId: string | null;
  currentUserId: string;
  onSelect: (partnerId: string) => void;
  onBrowseMembers: () => void;
}

const ConversationList: FC<ConversationListProps> = ({
  conversations,
  loading,
  activePartnerId,
  currentUserId,
  onSelect,
  onBrowseMembers,
}) => {
  if (loading && conversations.length === 0) {
    return (
      <div className="space-y-1 p-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="bg-bkg-dark-800 h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="bg-bkg-dark-800 h-4 w-24 rounded" />
                <div className="bg-bkg-dark-800 h-3 w-40 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
        <div className="bg-action/20 mb-4 flex h-14 w-14 items-center justify-center rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="text-action h-7 w-7"
            aria-hidden="true"
          >
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </div>
        <h3 className="text-content-light font-semibold">No messages yet</h3>
        <p className="text-grey-500 mt-1 text-sm">
          Send a message to a cohort member from their profile
        </p>
        <button
          onClick={onBrowseMembers}
          className="bg-action text-content-dark hover:bg-action-100 focus-visible:ring-action mt-4 min-h-[44px] rounded-lg px-6 py-2 font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          Browse Members
        </button>
      </div>
    );
  }

  return (
    <div className="divide-border-dark divide-y">
      {conversations.map((conv) => (
        <ConversationRow
          key={conv.partnerId}
          conversation={conv}
          isActive={activePartnerId === conv.partnerId}
          currentUserId={currentUserId}
          onClick={onSelect}
        />
      ))}
    </div>
  );
};

interface ConversationRowProps {
  conversation: Conversation;
  isActive: boolean;
  currentUserId: string;
  onClick: (partnerId: string) => void;
}

const ConversationRow: FC<ConversationRowProps> = ({
  conversation,
  isActive,
  currentUserId,
  onClick,
}) => {
  const partnerName = conversation.partner
    ? conversation.partner.firstName + " " + conversation.partner.lastName
    : "Unknown User";

  const isOwnMessage = conversation.lastMessage.senderId === currentUserId;
  const previewText = isOwnMessage
    ? "You: " + conversation.lastMessage.content
    : conversation.lastMessage.content;

  return (
    <button
      onClick={() => onClick(conversation.partnerId)}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
        isActive ? "bg-action/10" : "hover:bg-bkg-dark-800"
      )}
    >
      <Avatar src={conversation.partner?.profileImage} name={partnerName} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              "text-content-light truncate text-sm",
              conversation.unreadCount > 0 ? "font-bold" : "font-medium"
            )}
          >
            {partnerName}
          </p>
          <span className="text-grey-500 flex-shrink-0 text-[11px]">
            {formatTimeAgo(conversation.lastMessage.createdAt, { compact: true })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "truncate text-xs",
              conversation.unreadCount > 0 ? "text-content-light font-medium" : "text-grey-500"
            )}
          >
            {previewText}
          </p>
          {conversation.unreadCount > 0 && (
            <span className="bg-action text-content-dark flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-bold">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

interface ThreadViewProps {
  activePartnerId: string;
  activeConversation: Conversation | undefined;
  partnerName: string;
  messages: DirectMessage[];
  messagesLoading: boolean;
  hasMoreMessages: boolean;
  loadMoreMessages: () => Promise<void>;
  userId: string | undefined;
  onBack: () => void;
  onSend: (recipientId: string, content: string) => Promise<{ success: boolean; error?: string }>;
}

const ThreadView: FC<ThreadViewProps> = ({
  activePartnerId,
  activeConversation,
  partnerName,
  messages,
  messagesLoading,
  hasMoreMessages,
  loadMoreMessages,
  userId,
  onBack,
  onSend,
}) => {
  const router = useRouter();
  const [composeText, setComposeText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    if (!composeText.trim() || isSending) return;
    setIsSending(true);
    const result = await onSend(activePartnerId, composeText.trim());
    if (result.success) {
      setComposeText("");
      textareaRef.current?.focus();
    }
    setIsSending(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Thread Header */}
      <div className="border-border-dark flex items-center gap-3 border-b px-4 py-3">
        <button
          onClick={onBack}
          className="text-grey-400 hover:text-content-light min-h-[44px] min-w-[44px] rounded-lg p-2 transition-colors md:hidden"
          aria-label="Back to conversations"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </button>
        <Avatar src={activeConversation?.partner?.profileImage} name={partnerName} size="sm" />
        <button
          onClick={() => router.push("/community/member/" + activePartnerId)}
          className="text-content-light hover:text-action text-sm font-semibold transition-colors"
        >
          {partnerName}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {hasMoreMessages && (
          <div className="mb-4 text-center">
            <button
              onClick={loadMoreMessages}
              disabled={messagesLoading}
              className="text-action hover:text-action-100 text-xs font-medium disabled:opacity-50"
            >
              {messagesLoading ? "Loading..." : "Load earlier messages"}
            </button>
          </div>
        )}

        <MessageList
          messages={messages}
          messagesLoading={messagesLoading}
          partnerName={partnerName}
          userId={userId}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Compose */}
      <div className="border-border-dark border-t p-4">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={composeText}
            onChange={(e) => setComposeText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className={cn(
              "border-border-dark bg-bkg-dark text-content-light placeholder:text-grey-600",
              "focus:border-action focus:ring-action flex-1 resize-none rounded-lg border px-4 py-2.5 text-sm",
              "focus:ring-1 focus:outline-none"
            )}
            aria-label="Message input"
            style={{ maxHeight: "120px" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={handleSend}
            disabled={!composeText.trim() || isSending}
            className={cn(
              "focus-visible:ring-action min-h-[44px] min-w-[44px] rounded-lg p-2.5 transition-colors",
              "focus-visible:ring-2 focus-visible:outline-none",
              composeText.trim()
                ? "bg-action text-content-dark hover:bg-action-100"
                : "bg-bkg-dark-secondary text-grey-600"
            )}
            aria-label="Send message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-grey-600 text-[11px]">Press Enter to send, Shift+Enter for new line</p>
          <CharCount length={composeText.length} />
        </div>
      </div>
    </>
  );
};

interface MessageListProps {
  messages: DirectMessage[];
  messagesLoading: boolean;
  partnerName: string;
  userId: string | undefined;
}

const MessageList: FC<MessageListProps> = ({ messages, messagesLoading, partnerName, userId }) => {
  if (messagesLoading && messages.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="border-action h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-grey-500 text-sm">Start a conversation with {partnerName}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {messages.map((msg, i) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isMine={msg.senderId === userId}
          showTimestamp={shouldShowTimestamp(messages, i)}
        />
      ))}
    </div>
  );
};

const EmptyThreadPlaceholder: FC = () => (
  <div className="hidden flex-1 flex-col items-center justify-center md:flex">
    <div className="bg-bkg-dark-secondary mb-4 flex h-16 w-16 items-center justify-center rounded-full">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="text-grey-500 h-8 w-8"
        aria-hidden="true"
      >
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    </div>
    <p className="text-grey-500 text-sm">Select a conversation to start messaging</p>
  </div>
);

interface MessageBubbleProps {
  message: DirectMessage;
  isMine: boolean;
  showTimestamp: boolean;
}

const MessageBubble: FC<MessageBubbleProps> = ({ message, isMine, showTimestamp }) => {
  return (
    <div className={cn("flex flex-col", isMine ? "items-end" : "items-start")}>
      {showTimestamp && (
        <p className="text-grey-600 my-2 text-center text-[11px]">
          {formatTimeAgo(message.createdAt)}
        </p>
      )}
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2",
          isMine
            ? "bg-action text-content-dark rounded-br-md"
            : "bg-bkg-dark-secondary text-content-light rounded-bl-md"
        )}
      >
        <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
      </div>
      {isMine && (
        <p className="text-grey-600 mt-0.5 text-[10px]">{message.isRead ? "Read" : "Sent"}</p>
      )}
    </div>
  );
};

/** Character count indicator for compose box */
const CharCount: FC<{ length: number }> = ({ length }) => {
  let colorClass = "text-grey-600";
  if (length > 2000) colorClass = "text-danger font-medium";
  else if (length > 1800) colorClass = "text-primary";

  return <p className={cn("text-[11px]", colorClass)}>{length}/2000</p>;
};

// Show timestamp if >5 minutes gap between messages
function shouldShowTimestamp(messages: DirectMessage[], index: number): boolean {
  if (index === 0) return true;
  const prev = messages[index - 1];
  const curr = messages[index];
  const diff = new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime();
  return diff > 5 * 60 * 1000; // 5 minutes
}

export default MessagesPage;
