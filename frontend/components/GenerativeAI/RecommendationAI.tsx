'use client';

import {
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  CircleX,
  Clock,
  ClipboardPaste,
  GraduationCap,
  History,
  Loader2,
  MessageSquare,
  PenSquare,
  Send,
  SparklesIcon,
  User,
  X,
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import {
  generativeStore,
  ThesisChatMessage,
  ThesisChatSession,
} from "@/Stores/generativeStore";

const courseInterest = [
  'Accountancy',
  'Accounting Information System',
  'Entrepreneurship',
  'Public Administration',
];

const suggestions = [
  {
    text: "Suggest thesis ideas for Accountancy",
    course: "Accountancy",
  },
  {
    text: "Suggest thesis ideas for BSAIS",
    course: "Accounting Information System",
  },
  {
    text: "Suggest thesis ideas for Public Administration",
    course: "Public Administration",
  },
  {
    text: "Suggest thesis ideas for Entrepreneurship",
    course: "Entrepreneurship",
  },
];

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text?: string;
  course?: string;
  kind?:
    | 'info'
    | 'warning'
    | 'error'
    | 'results'
    | 'course-switch'
    | 'limit'
    | 'course-mismatch';
  results?: any[];
  suggestedCourse?: string;
};

/**
 * Safely extracts a string from a possible backend/store message.
 * Supports string messages and common object-based error responses.
 */
function normalizeMessage(msg: unknown): string {
  if (typeof msg === "string") {
    return msg;
  }

  if (msg && typeof msg === "object") {
    const value = msg as Record<string, unknown>;

    for (const key of ["message", "error", "detail", "text"]) {
      if (typeof value[key] === "string") {
        return value[key] as string;
      }
    }
  }

  return "";
}

const isValidationMsg = (msg: unknown): boolean => {
  const text = normalizeMessage(msg);

  return (
    text.includes("random or meaningless") ||
    text.includes("too short") ||
    text.includes("or any visual content") ||
    text.includes("Unsupported") ||
    text.includes("I can only help with thesis title") ||
    text.includes("I can only generate") ||
    text.includes("only for thesis and research")
  );
};

const isDailyLimitMsg = (msg: unknown): boolean => {
  const text = normalizeMessage(msg);

  return (
    text.includes("Daily limit reached") ||
    text.includes("daily limit of")
  );
};

const isCourseMismatchMsg = (msg: unknown): boolean => {
  const text = normalizeMessage(msg);

  return text.includes("but your prompt mentions");
};

function extractSuggestedCourse(msg: unknown): string | null {
  const text = normalizeMessage(msg);
  const match = text.match(/but your prompt mentions "([^"]+)"/);

  return match ? match[1] : null;
}

// Reset happens at local midnight, matching the backend's per-day window.
function getMsUntilMidnight() {
  const now = new Date();
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );

  return midnight.getTime() - now.getTime();
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  return `${h.toString().padStart(2, '0')}:${m
    .toString()
    .padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Relative time for the history list.
function formatRelativeTime(ts: number) {
  const diffMs = Date.now() - ts;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'Just now';

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

// Converts a saved server session into the component's message format.
function sessionToMessages(
  session: ThesisChatSession
): ChatMessage[] {
  return session.messages.map((m: ThesisChatMessage) => {
    if (m.role === 'user') {
      return {
        id: m.id,
        role: 'user',
        text: m.text,
        course: m.course,
      };
    }

    return {
      id: m.id,
      role: 'assistant',
      kind: 'results',
      results: m.results,
    };
  });
}

function AssistantAvatar() {
  return (
    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shrink-0 shadow-sm ring-1 ring-amber-500/30">
      <Bot className="h-4 w-4 text-black" />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="w-full py-3 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto flex items-end gap-3">
        <AssistantAvatar />

        <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-muted/70 px-4 py-3.5">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
        </div>
      </div>
    </div>
  );
}

type CalloutTone = 'info' | 'warning' | 'error';

function Callout({
  tone,
  icon,
  children,
}: {
  tone: CalloutTone;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const styles: Record<CalloutTone, string> = {
    info: "bg-muted/60 border-border text-foreground",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
    error: "bg-red-50 border-red-200 text-red-800",
  };

  return (
    <div
      className={`flex items-start gap-2.5 rounded-2xl rounded-tl-md border px-4 py-3 ${styles[tone]}`}
    >
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="text-sm leading-relaxed min-w-0 break-words">
        {children}
      </div>
    </div>
  );
}

function AIrecommendation() {
  const [selectedInterest, setSelectedInterest] =
    useState("Accountancy");

  const [chatPrompt, setChatPrompt] = useState('');
  const [disabled, setDisabled] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isShow, setIsShow] = useState(true);
  const [limitedUntil, setLimitedUntil] = useState<number | null>(null);
  const [countdown, setCountdown] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [historyEntered, setHistoryEntered] = useState(false);
  const [deletingSessionId, setDeletingSessionId] =
    useState<string | null>(null);
  const [pastedKey, setPastedKey] = useState<string | null>(null);

  const {
    RecommendedAI,
    loading,
    thesisSessions,
    thesisHistoryLoading,
    currentThesisSessionId,
    GetThesisHistory,
    StartNewThesisChat,
    SelectThesisSession,
    DeleteThesisHistory,
    SetPendingTopic,
  } = generativeStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const historyFetched = useRef(false);

  const hasStarted = messages.length > 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, loading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [chatPrompt]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 640px)");

    const handleResize = (
      e: MediaQueryListEvent | MediaQueryList
    ) => {
      if (e.matches) {
        setIsShow(true);
      }
    };

    handleResize(mediaQuery);
    mediaQuery.addEventListener("change", handleResize);

    return () => {
      mediaQuery.removeEventListener("change", handleResize);
    };
  }, []);

  // Fetch chat history once when the component mounts.
  useEffect(() => {
    if (historyFetched.current) return;

    historyFetched.current = true;
    GetThesisHistory();
  }, [GetThesisHistory]);

  // Countdown ticker for the daily limit.
  useEffect(() => {
    if (!limitedUntil) return;

    const tick = () => {
      const remaining = limitedUntil - Date.now();

      if (remaining <= 0) {
        setLimitedUntil(null);
        setCountdown('');
      } else {
        setCountdown(formatCountdown(remaining));
      }
    };

    tick();

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [limitedUntil]);

  // History drawer entrance animation.
  useEffect(() => {
    if (showHistory) {
      const raf = requestAnimationFrame(() =>
        setHistoryEntered(true)
      );

      return () => cancelAnimationFrame(raf);
    }

    setHistoryEntered(false);
  }, [showHistory]);

  const closeHistory = () => {
    setHistoryEntered(false);
    setTimeout(() => setShowHistory(false), 200);
  };

  const sendMessage = async (
    promptText: string,
    courseOverride?: string
  ) => {
    if (
      !promptText.trim() ||
      loading ||
      disabled ||
      limitedUntil
    ) {
      return;
    }

    const courseForThisMessage =
      courseOverride ?? selectedInterest;

    if (
      courseOverride &&
      courseOverride !== selectedInterest
    ) {
      setSelectedInterest(courseOverride);
    }

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'user',
        text: promptText,
        course: courseForThisMessage,
      },
    ]);

    setChatPrompt('');
    setDisabled(true);

    try {
      await RecommendedAI({
        chatPrompt: promptText,
        course: courseForThisMessage,
        session_id: currentThesisSessionId ?? undefined,
      });

      const state = generativeStore.getState();

      // Normalize the store message before using string methods.
      const latestMessage = normalizeMessage(state.message);

      // Ensure results are an array before accessing them.
      const latestResult = Array.isArray(state.result)
        ? state.result
        : [];

      let assistantMsg: ChatMessage;

      if (isDailyLimitMsg(latestMessage)) {
        assistantMsg = {
          id: crypto.randomUUID(),
          role: 'assistant',
          kind: 'limit',
          text: latestMessage,
        };

        setLimitedUntil(
          Date.now() + getMsUntilMidnight()
        );
      } else if (isCourseMismatchMsg(latestMessage)) {
        assistantMsg = {
          id: crypto.randomUUID(),
          role: 'assistant',
          kind: 'course-mismatch',
          text: latestMessage,
          suggestedCourse:
            extractSuggestedCourse(latestMessage) ?? undefined,
        };
      } else if (isValidationMsg(latestMessage)) {
        assistantMsg = {
          id: crypto.randomUUID(),
          role: 'assistant',
          kind: 'warning',
          text: latestMessage,
        };
      } else if (
        latestMessage.toLowerCase().includes("unauthorized")
      ) {
        assistantMsg = {
          id: crypto.randomUUID(),
          role: 'assistant',
          kind: 'error',
          text: "You need to log in to continue.",
        };
      } else if (latestResult[0]?.error) {
        assistantMsg = {
          id: crypto.randomUUID(),
          role: 'assistant',
          kind: 'error',
          text: normalizeMessage(latestResult[0].error),
        };
      } else if (latestResult.length > 0) {
        assistantMsg = {
          id: crypto.randomUUID(),
          role: 'assistant',
          kind: 'results',
          results: latestResult,
        };
      } else {
        assistantMsg = {
          id: crypto.randomUUID(),
          role: 'assistant',
          kind: 'info',
          text:
            latestMessage ||
            "Something went wrong. Please try again.",
        };
      }

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Failed to send thesis recommendation:", error);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          kind: 'error',
          text: "Unable to get recommendations right now. Please try again.",
        },
      ]);
    } finally {
      setDisabled(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(chatPrompt.trim());
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(chatPrompt.trim());
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setChatPrompt('');
    StartNewThesisChat();
    closeHistory();
  };

  const loadChat = (session: ThesisChatSession) => {
    setMessages(sessionToMessages(session));
    setSelectedInterest(session.course);
    SelectThesisSession(session.id);
    setChatPrompt('');
    closeHistory();
  };

  const handleDeleteSession = async (
    e: React.MouseEvent,
    session: ThesisChatSession
  ) => {
    e.stopPropagation();

    if (deletingSessionId) return;

    setDeletingSessionId(session.id);

    try {
      await DeleteThesisHistory(session.id);

      if (session.id === currentThesisSessionId) {
        setMessages([]);
        setChatPrompt('');
      }
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleCourseChange = (value: string) => {
    if (value === selectedInterest) return;

    setSelectedInterest(value);

    if (hasStarted) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'system',
          kind: 'course-switch',
          text: `Course switched to ${value}. New recommendations will be tailored to this course.`,
        },
      ]);
    }
  };

  const pasteToTrail = (
    msgId: string,
    index: number,
    title: string
  ) => {
    if (!title?.trim()) return;

    SetPendingTopic(title.trim());

    const key = `${msgId}-${index}`;
    setPastedKey(key);

    setTimeout(() => {
      setPastedKey((k) => (k === key ? null : k));
    }, 2000);
  };

  return (
    <div className="h-dvh sm:h-auto sm:flex-1 sm:min-h-0 w-full flex flex-col bg-background relative overflow-hidden">

      {/* History panel */}
      {showHistory && (
        <div className="fixed inset-0 z-[100] flex sm:absolute sm:z-50">
          <div
            className={`absolute inset-0 bg-black/30 backdrop-blur-[1px] transition-opacity duration-200 ease-out ${
              historyEntered ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeHistory}
          />

          <div
            className={`relative w-[290px] sm:w-80 sm:max-w-[85%] h-full bg-background sm:border-r border-border shadow-2xl flex flex-col transition-transform duration-200 ease-out ${
              historyEntered
                ? "translate-x-0"
                : "-translate-x-full"
            }`}
          >
            <div className="shrink-0 flex items-center justify-between px-4 py-3.5 border-b border-border/60">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-amber-600" />
                <h2 className="font-display text-sm font-semibold text-foreground">
                  Chat history
                </h2>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closeHistory}
                className="h-7 w-7 rounded-full cursor-pointer"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="shrink-0 px-3 py-2.5 border-b border-border/60">
              <Button
                type="button"
                variant="outline"
                onClick={startNewChat}
                className="w-full justify-start gap-2 text-xs rounded-xl cursor-pointer hover:bg-amber-50 hover:border-amber-300"
              >
                <PenSquare className="h-3.5 w-3.5" />
                New chat
              </Button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto py-2">
              {thesisHistoryLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : thesisSessions.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                  <MessageSquare className="h-6 w-6 text-muted-foreground/50" />
                  <p className="text-xs text-muted-foreground">
                    No previous chats yet. Start a conversation and it'll show up here.
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5 px-2">
                  {thesisSessions.map((session) => {
                    const isCurrent =
                      session.id === currentThesisSessionId;

                    return (
                      <div
                        key={session.id}
                        className={`group relative w-full rounded-xl transition-colors ${
                          isCurrent
                            ? "bg-amber-50 ring-1 ring-amber-200"
                            : "hover:bg-muted/60"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => loadChat(session)}
                          className="w-full text-left flex items-start gap-2.5 rounded-xl pl-3 pr-8 py-2.5 cursor-pointer"
                        >
                          <MessageSquare
                            className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${
                              isCurrent
                                ? "text-amber-600"
                                : "text-muted-foreground"
                            }`}
                          />

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-foreground truncate">
                              {session.title}
                            </p>

                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-muted-foreground truncate">
                                {session.course}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                ·
                              </span>
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {formatRelativeTime(session.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={(e) =>
                            handleDeleteSession(e, session)
                          }
                          disabled={deletingSessionId === session.id}
                          className="absolute top-2 right-2 h-5 w-5 rounded-full flex items-center justify-center text-muted-foreground hover:bg-red-100 hover:text-red-600 transition-colors cursor-pointer disabled:cursor-not-allowed"
                          title="Delete chat"
                        >
                          {deletingSessionId === session.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active course indicator */}
      {hasStarted && (
        <div className="shrink-0 flex items-center justify-center gap-1.5 border-b border-amber-100 bg-amber-50/70 py-1.5">
          <GraduationCap className="h-3 w-3 text-amber-600" />

          <span className="text-[11px] text-amber-700">
            Recommending for{" "}
            <span className="font-semibold">
              {selectedInterest}
            </span>
          </span>
        </div>
      )}

      {/* Message area */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto scroll-smooth"
      >
        {!hasStarted ? (
          // FIX: min-h-full (not h-full) lets the wrapper grow past the container,
          // and my-auto on the inner div centers only when there is spare room,
          // so the top is never clipped on short viewports.
          <div className="min-h-full flex flex-col items-center px-4 py-6">
            <div className="my-auto flex flex-col items-center w-full">
              <div className="relative mb-5">
                <div className="absolute inset-0 rounded-2xl bg-amber-400/30 blur-xl" />
                <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-md ring-1 ring-amber-500/30">
                  <SparklesIcon className="h-6 w-6 text-black" />
                </div>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2 text-center">
                Thesis Recommendations
              </h1>

              <p className="font-body text-sm text-muted-foreground text-center max-w-sm mb-4">
                Tell me your course and a thesis or research topic you're curious about, and I'll suggest related thesis titles.
              </p>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-body text-xs text-amber-700 mb-5">
                <GraduationCap className="h-3.5 w-3.5" />
                <span>Currently set to</span>
                <span className="font-semibold">
                  {selectedInterest}
                </span>
              </div>

              {(thesisHistoryLoading ||
                thesisSessions.length > 0) && (
                <button
                  type="button"
                  onClick={() => setShowHistory(true)}
                  className="cursor-pointer flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-5 underline underline-offset-4 decoration-border"
                >
                  <History className="h-3.5 w-3.5" />

                  {thesisHistoryLoading
                    ? "Loading previous chats…"
                    : `View ${thesisSessions.length} previous chat${
                        thesisSessions.length > 1 ? 's' : ''
                      }`}
                </button>
              )}

              <div className="grid sm:grid-cols-2 gap-2.5 max-w-lg w-full">
                {suggestions.map((s) => (
                  <button
                    type="button"
                    key={s.text}
                    onClick={() => sendMessage(s.text, s.course)}
                    disabled={!!limitedUntil || loading || disabled}
                    className="group cursor-pointer flex items-center gap-3 text-left text-xs sm:text-sm text-foreground border border-border rounded-2xl px-4 py-3 hover:border-amber-300 hover:bg-amber-50/60 hover:shadow-sm transition-all disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-border disabled:hover:shadow-none"
                  >
                    <span className="h-8 w-8 shrink-0 rounded-lg bg-muted group-hover:bg-amber-100 flex items-center justify-center transition-colors">
                      <GraduationCap className="h-4 w-4 text-muted-foreground group-hover:text-amber-700" />
                    </span>
                    <span className="min-w-0 leading-snug">
                      {s.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-2 pb-4">
            {messages.map((msg) => {
              if (msg.kind === 'course-switch') {
                return (
                  <div
                    key={msg.id}
                    className="flex justify-center px-4 py-3"
                  >
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/70 rounded-full px-3 py-1 text-center">
                      <GraduationCap className="h-3 w-3 shrink-0" />
                      {msg.text}
                    </span>
                  </div>
                );
              }

              // User message.
              if (msg.role === 'user') {
                return (
                  <div
                    key={msg.id}
                    className="w-full py-3 px-4 sm:px-6"
                  >
                    <div className="max-w-3xl mx-auto flex items-end justify-end gap-2.5">
                      <div className="min-w-0 max-w-[85%] sm:max-w-[75%] flex flex-col items-end gap-1.5">
                        {msg.course && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                            <GraduationCap className="h-2.5 w-2.5" />
                            {msg.course}
                          </span>
                        )}

                        <div className="rounded-2xl rounded-br-md bg-gradient-to-br from-amber-300 to-amber-400 text-black px-4 py-2.5 shadow-sm">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {msg.text}
                          </p>
                        </div>
                      </div>

                      <div className="h-8 w-8 rounded-xl bg-foreground flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-background" />
                      </div>
                    </div>
                  </div>
                );
              }

              // Assistant message.
              return (
                <div
                  key={msg.id}
                  className="w-full py-3 px-4 sm:px-6"
                >
                  <div className="max-w-3xl mx-auto flex items-start gap-2.5">
                    <AssistantAvatar />

                    <div className="min-w-0 flex-1 space-y-3">
                      {msg.kind === 'results' && (
                        <div className="inline-block rounded-2xl rounded-tl-md bg-muted/70 px-4 py-2.5">
                          <p className="text-sm text-foreground">
                            Here's what I found for you:
                          </p>
                        </div>
                      )}

                      {msg.kind === 'info' && (
                        <Callout tone="info">{msg.text}</Callout>
                      )}

                      {msg.kind === 'warning' && (
                        <Callout
                          tone="warning"
                          icon={
                            <GraduationCap className="h-4 w-4 text-amber-600" />
                          }
                        >
                          {msg.text}
                        </Callout>
                      )}

                      {msg.kind === 'limit' && (
                        <Callout
                          tone="warning"
                          icon={
                            <Clock className="h-4 w-4 text-amber-600" />
                          }
                        >
                          {msg.text}
                        </Callout>
                      )}

                      {msg.kind === 'course-mismatch' && (
                        <div className="space-y-2.5">
                          <Callout
                            tone="warning"
                            icon={
                              <GraduationCap className="h-4 w-4 text-amber-600" />
                            }
                          >
                            {msg.text}
                          </Callout>

                          {msg.suggestedCourse && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleCourseChange(
                                  msg.suggestedCourse!
                                )
                              }
                              className="rounded-full text-xs cursor-pointer hover:bg-amber-50 hover:border-amber-300"
                            >
                              Switch to {msg.suggestedCourse}
                            </Button>
                          )}
                        </div>
                      )}

                      {msg.kind === 'error' && (
                        <Callout
                          tone="error"
                          icon={
                            <CircleX className="h-4 w-4 text-red-500" />
                          }
                        >
                          {msg.text}
                        </Callout>
                      )}

                      {msg.kind === 'results' && (
                        <div className="space-y-3">
                          {msg.results?.map((item, index) => {
                            const key = `${msg.id}-${index}`;
                            const isPasted = pastedKey === key;
                            const evolvedFrom =
                              item.original_title &&
                              item.original_title !== 'New'
                                ? item.original_title
                                : null;

                            return (
                              <article
                                key={index}
                                className="rounded-2xl border border-border bg-background p-4 shadow-sm hover:shadow-md hover:border-amber-200 transition-all"
                              >
                                <div className="flex items-start gap-3">
                                  <span className="h-7 w-7 shrink-0 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
                                    {index + 1}
                                  </span>

                                  <div className="min-w-0 flex-1 space-y-2">
                                    <h4 className="text-sm sm:text-[15px] font-semibold text-foreground leading-snug">
                                      {item.title}
                                    </h4>

                                    {evolvedFrom && (
                                      <p className="text-[11px] text-muted-foreground leading-snug">
                                        Evolved from:{" "}
                                        <span className="italic">
                                          {evolvedFrom}
                                        </span>
                                      </p>
                                    )}

                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                      {item.summary}
                                    </p>

                                    {Array.isArray(item.new_features) &&
                                      item.new_features.length > 0 && (
                                        <ul className="space-y-1 rounded-xl bg-amber-50/60 border border-amber-100 px-3 py-2">
                                          {item.new_features.map(
                                            (f: string, i: number) => (
                                              <li
                                                key={i}
                                                className="flex items-start gap-2 text-xs text-amber-900 leading-snug"
                                              >
                                                <SparklesIcon className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                                                <span>{f}</span>
                                              </li>
                                            )
                                          )}
                                        </ul>
                                      )}

                                    {item.tags?.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5">
                                        {item.tags.map(
                                          (tag: string, i: number) => (
                                            <span
                                              key={i}
                                              className="text-[11px] px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                                            >
                                              {tag}
                                            </span>
                                          )
                                        )}
                                      </div>
                                    )}

                                    {/* Send the title to Progressive Trail. */}
                                    <div className="pt-1">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          pasteToTrail(
                                            msg.id,
                                            index,
                                            item.title
                                          )
                                        }
                                        className={`h-8 rounded-full text-[11px] gap-1.5 cursor-pointer transition-colors ${
                                          isPasted
                                            ? "border-green-300 bg-green-50 text-green-700"
                                            : "hover:bg-amber-50 hover:border-amber-300"
                                        }`}
                                      >
                                        {isPasted ? (
                                          <>
                                            <Check className="h-3 w-3 text-green-600" />
                                            Sent to Research Flow
                                          </>
                                        ) : (
                                          <>
                                            <ClipboardPaste className="h-3 w-3" />
                                            Paste to Research Flow
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && <TypingIndicator />}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-border/60 bg-background/95 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 pt-3">
          {/* Toolbar */}
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowHistory(true)}
              className="h-9 w-9 rounded-full hover:bg-amber-100 transition-colors cursor-pointer"
              title="Chat history"
            >
              <History className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={startNewChat}
              className="h-9 w-9 rounded-full hover:bg-amber-100 transition-colors cursor-pointer"
              title="New chat"
            >
              <PenSquare className="h-4 w-4" />
            </Button>

            {/* Mobile: show the active course + toggle for the course list */}
            <button
              type="button"
              onClick={() => setIsShow((prev) => !prev)}
              className="sm:hidden ml-auto flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] text-muted-foreground cursor-pointer"
              title="Toggle courses"
            >
              <GraduationCap className="h-3.5 w-3.5 text-amber-600" />
              <span className="max-w-[140px] truncate">
                {selectedInterest}
              </span>
              {isShow ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {/* Course chips */}
          <div
            className={`
              overflow-hidden transition-all duration-300 ease-in-out
              sm:max-h-none sm:opacity-100 sm:mt-2
              ${
                isShow
                  ? "max-h-[300px] opacity-100 mt-2"
                  : "max-h-0 opacity-0 mt-0"
              }
            `}
          >
            <div className="flex flex-wrap gap-1.5">
              {courseInterest.map((item) => {
                const isActive = selectedInterest === item;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleCourseChange(item)}
                    aria-pressed={isActive}
                    className={`cursor-pointer text-xs rounded-full px-3.5 py-1.5 border transition-all duration-200 active:scale-95 ${
                      isActive
                        ? "bg-amber-400 border-amber-400 text-black font-medium shadow-sm"
                        : "bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3">
            {limitedUntil ? (
              <div className="flex items-center justify-center gap-2 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 mb-4">
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />

                <p className="text-sm text-amber-800">
                  Daily limit reached — try again in{" "}
                  <span className="font-mono font-semibold">
                    {countdown}
                  </span>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="pb-4">
                <div className="flex items-end gap-2 rounded-3xl border border-border bg-background shadow-lg px-4 py-2 transition-shadow focus-within:border-amber-300 focus-within:ring-2 focus-within:ring-amber-200/60">
                  <textarea
                    ref={textareaRef}
                    value={chatPrompt}
                    onChange={(e) =>
                      setChatPrompt(e.target.value)
                    }
                    onKeyDown={handleKeyDown}
                    placeholder="Ask for thesis titles, e.g. “inventory systems for small businesses”"
                    rows={1}
                    className="flex-1 resize-none bg-transparent text-sm leading-relaxed py-2 placeholder:text-muted-foreground/70 focus:outline-none max-h-[200px]"
                  />

                  <Button
                    type="submit"
                    size="icon"
                    disabled={
                      !chatPrompt.trim() ||
                      loading ||
                      disabled
                    }
                    className="bg-amber-400 hover:bg-amber-300 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 text-black shrink-0 h-9 w-9 rounded-full mb-0.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <p className="text-center text-[11px] text-muted-foreground mt-2">
                  Recommendations are AI-generated — verify details before citing.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIrecommendation;