'use client'
import { Card, CardContent } from "@/components/ui/card";
import { Bot, ChevronDown, ChevronRight, CircleX, GraduationCap, Loader2, PenSquare, Send, SparklesIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { generativeStore } from "@/Stores/generativeStore";

const courseInterest = ['Accountancy', 'Accounting Information System', 'Entrepreneurship', 'Public Administration']

const suggestions = [
  "Suggest thesis ideas about financial technology",
  "Recommend topics on internal auditing",
  "Ideas combining sustainability and accounting",
  "What research topics are trending this year?",
]

const tagColors = [
  "bg-amber-500/10 text-amber-600 border-amber-200",
  "bg-blue-500/10 text-blue-600 border-blue-200",
  "bg-green-500/10 text-green-600 border-green-200",
  "bg-purple-500/10 text-purple-600 border-purple-200",
  "bg-rose-500/10 text-rose-600 border-rose-200",
];

const cardStyles = [
  { card: "border-amber-200 bg-amber-500/5", badge: "bg-amber-500/10 text-amber-600 border-amber-200" },
  { card: "border-blue-200 bg-blue-500/5", badge: "bg-blue-500/10 text-blue-600 border-blue-200" },
  { card: "border-green-200 bg-green-500/5", badge: "bg-green-500/10 text-green-600 border-green-200" },
  { card: "border-purple-200 bg-purple-500/5", badge: "bg-purple-500/10 text-purple-600 border-purple-200" },
  { card: "border-rose-200 bg-rose-500/5", badge: "bg-rose-500/10 text-rose-600 border-rose-200" },
];

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text?: string;
  course?: string;
  kind?: 'info' | 'warning' | 'error' | 'results' | 'course-switch';
  results?: any[];
};

const isValidationMsg = (msg: string) =>
  msg.includes("random or meaningless") ||
  msg.includes("too short") ||
  msg.includes("Image generation") ||
  msg.includes("not supported") ||
  msg.includes("Unsupported");

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
        <Bot className="h-4 w-4 text-black" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3 flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" />
      </div>
    </div>
  );
}

function AIrecommendation() {
  const [selectedInterest, setSelectedInterest] = useState("Accountancy");
  const [chatPrompt, setChatPrompt] = useState('');
  const [disabled, setDisabled] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isShow, setIsShow] = useState(true);


  const { RecommendedAI, loading } = generativeStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [chatPrompt]);


  useEffect(() => {
  const mediaQuery = window.matchMedia("(min-width: 640px)");

  const handleResize = (e: MediaQueryListEvent | MediaQueryList) => {
    if (e.matches) {
      setIsShow(true);
    }
  };

  // Initial check
  handleResize(mediaQuery);

  // Listen for changes
  mediaQuery.addEventListener("change", handleResize);

  return () => {
    mediaQuery.removeEventListener("change", handleResize);
  };
}, []);

  const sendMessage = async (promptText: string) => {
    if (!promptText.trim() || loading || disabled) return;

    setMessages(prev => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', text: promptText, course: selectedInterest },
    ]);
    setChatPrompt('');
    setDisabled(true);

    await RecommendedAI({ chatPrompt: promptText, course: selectedInterest });

    const state = generativeStore.getState();
    const latestResult = state.result ?? [];
    const latestMessage = state.message ?? "";

    let assistantMsg: ChatMessage;
    if (isValidationMsg(latestMessage)) {
      assistantMsg = { id: crypto.randomUUID(), role: 'assistant', kind: 'warning', text: latestMessage };
    } else if (latestMessage.includes("Unauthorized")) {
      assistantMsg = { id: crypto.randomUUID(), role: 'assistant', kind: 'error', text: "You need to log in to continue." };
    } else if (latestResult[0]?.error) {
      assistantMsg = { id: crypto.randomUUID(), role: 'assistant', kind: 'error', text: latestResult[0].error };
    } else if (latestResult.length > 0) {
      assistantMsg = { id: crypto.randomUUID(), role: 'assistant', kind: 'results', results: latestResult };
    } else {
      assistantMsg = { id: crypto.randomUUID(), role: 'assistant', kind: 'info', text: latestMessage || "Something went wrong. Please try again." };
    }

    setMessages(prev => [...prev, assistantMsg]);
    setDisabled(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(chatPrompt.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(chatPrompt.trim());
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setChatPrompt('');
  };

  // When the course changes, drop a small system note into the thread so the
  // user is always aware which course context their recommendations are using.
  const handleCourseChange = (value: string) => {
    if (value === selectedInterest) return;
    setSelectedInterest(value);

    if (hasStarted) {
      setMessages(prev => [
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

  const hasStarted = messages.length > 0;

  return (
    <div className="sm:h-[89vh] w-full flex flex-col bg-background">

      {/* Active course awareness strip */}
      {hasStarted && (
        <div className="shrink-0 flex items-center justify-center gap-1.5 border-b border-border/60 bg-amber-50/60 py-1.5">
          <GraduationCap className="h-3 w-3 text-amber-600" />
          <span className="text-[11px] text-amber-700">
            Recommending for <span className="font-semibold">{selectedInterest}</span>
          </span>
        </div>
      )}

      {/* Message area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {!hasStarted ? (
          <div className="h-full flex flex-col items-center justify-center px-4">
            <div className="h-12 w-12 rounded-full bg-amber-400 flex items-center justify-center mb-4">
              <SparklesIcon className="h-5 w-5 text-black" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-2 text-center">
              Thesis Recommendations
            </h1>
            <p className="font-body text-sm text-muted-foreground text-center max-w-sm mb-2">
              Tell me your course and a topic you're curious about, and I'll suggest related thesis titles.
            </p>
            <div className="font-body text-xs text-amber-600 text-center max-w-sm mb-5 flex items-center gap-1 ">
              <div className="flex sm:flex-row flex-col items-center gap-1">
                <span className="flex gap-2">
                  <GraduationCap className="h-3.5 w-3.5" /> Currently set to 
                </span>
              <span className="font-semibold">{selectedInterest}</span>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 max-w-lg w-full">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left text-xs sm:text-sm text-foreground border border-border rounded-xl px-4 py-3 hover:bg-muted/60 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.map((msg) => {
              if (msg.kind === 'course-switch') {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/70 rounded-full px-3 py-1">
                      <GraduationCap className="h-3 w-3" />
                      {msg.text}
                    </span>
                  </div>
                );
              }

              if (msg.role === 'user') {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-amber-400 text-black px-4 py-2.5">
                      <p className="text-[11px] font-semibold opacity-60 mb-0.5">{msg.course}</p>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-black" />
                  </div>
                  <div className="max-w-[85%] space-y-2 w-full">
                    {msg.kind === 'results' && (
                      <p className="text-sm text-foreground">Here's what I found for you:</p>
                    )}

                    {(msg.kind === 'info' || msg.kind === 'warning') && (
                      <div
                        className={`rounded-2xl rounded-tl-sm px-4 py-2.5 ${
                          msg.kind === 'warning'
                            ? "border border-amber-200 bg-amber-50"
                            : "bg-muted"
                        }`}
                      >
                        <p className={`text-sm ${msg.kind === 'warning' ? "text-amber-800" : ""}`}>{msg.text}</p>
                      </div>
                    )}

                    {msg.kind === 'error' && (
                      <div className="flex items-start gap-2 rounded-2xl rounded-tl-sm border border-red-200 bg-red-50 px-4 py-2.5">
                        <CircleX className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-red-700 font-medium">{msg.text}</p>
                      </div>
                    )}

                    {msg.kind === 'results' && msg.results?.map((item, index) => (
                      <Card key={index} className={`border ${cardStyles[index % cardStyles.length].card}`}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex sm:flex-row flex-col items-start gap-3">
                            <span className={`text-xs font-bold px-2 py-1 rounded-md min-w-7 text-center border ${cardStyles[index % cardStyles.length].badge}`}>
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <h4 className="sm:text-base text-sm font-semibold text-card-foreground leading-snug">
                              {item.title}
                            </h4>
                          </div>
                          <p className="font-body text-xs text-muted-foreground pl-2 sm:pl-9">
                            {item.summary}
                          </p>
                          <div className="flex flex-wrap gap-2 pl-2 sm:pl-9">
                            {item.tags?.map((tag: string, i: number) => (
                              <span
                                key={i}
                                className={`text-xs px-3 py-1 rounded-full border ${tagColors[index % tagColors.length]}`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}

            {loading && <TypingIndicator />}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-border/60 bg-background">
        <div className="max-w-3xl mx-auto px-4 pt-3">
            <div className="mb-2">
                <div className="flex items-center gap-2">
                    <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={startNewChat}
                    className="h-9 w-9 rounded-full hover:bg-amber-100 transition-colors"
                    title="New chat"
                    >
                    <PenSquare className="h-4 w-4" />
                    </Button>
                        <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsShow(prev => !prev)}
                        className="h-9 w-9 rounded-full cursor-pointer sm:hidden block"
                        >
                          {isShow ? <ChevronDown  className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" /> }
                    </Button>
                </div>

                {/* Course Buttons */}
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
                <div className="flex flex-wrap gap-2 rounded-xl bg-muted/40 p-2">
                    {courseInterest.map((item) => (
                    <Button
                        key={item}
                        type="button"
                        variant={selectedInterest === item ? "default" : "outline"}
                        onClick={() => handleCourseChange(item)}
                        className={`text-xs rounded-full transition-all duration-200 hover:scale-105 active:scale-95 ${
                        selectedInterest === item
                            ? "bg-amber-400 hover:bg-amber-300 text-black shadow-sm"
                            : "hover:bg-muted"
                        }`}
                    >
                        {item}
                    </Button>
                    ))}
                </div>
                </div>
            </div>
          <form onSubmit={handleSubmit} className="pb-4">
            <div className="flex items-end gap-2 rounded-3xl border border-border bg-background shadow-sm px-3 py-2 focus-within:ring-1 focus-within:ring-amber-300">
              <textarea
                ref={textareaRef}
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Thesis Assistant..."
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm leading-relaxed py-1.5 focus:outline-none max-h-[200px]"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!chatPrompt.trim() || loading || disabled}
                className="bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black shrink-0 h-9 w-9 rounded-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-center text-[11px] text-muted-foreground mt-2">
              Recommendations are AI-generated — verify details before citing.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AIrecommendation;