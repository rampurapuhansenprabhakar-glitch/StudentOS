"use client";

import React, { useState, useRef, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { AssistantChatResponse } from "@/types";
import { Card, CardContent } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import {
  Brain,
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  RotateCcw,
  Info,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  source?: string;
  suggestedActions?: string[];
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue("");
    setLoading(true);

    try {
      const response = await apiClient<AssistantChatResponse>("/assistant/chat", {
        method: "POST",
        body: JSON.stringify({ message: text }),
      });

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        source: response.source,
        suggestedActions: response.suggested_actions,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: "Sorry, I encountered an issue retrieving your academic state. Please check backend connection.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        source: "system-error",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const starterPrompts = [
    "How is my academic performance and current CGPA projection?",
    "What are my primary academic risk factors right now?",
    "How can I increase my attendance to avoid debarment?",
    "Summarize my digital twin state and behavioral consistency.",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              AI Academic Advisory Assistant
            </h1>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
              Local Grounded
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Rule-grounded educational advisor querying your live attendance, assessment, and digital twin metrics.
          </p>
        </div>
        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMessages([])}
            className="text-xs"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Clear Chat
          </Button>
        )}
      </div>

      {/* AI Transparency Disclaimer */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-brand-600 shrink-0" />
          <span>
            Responses are formulated by deterministic heuristics grounded in your personal database records (or local Ollama if active).
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shadow-sm border border-brand-100">
              <Bot className="h-8 w-8" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-base font-semibold text-slate-900">
                Welcome to StudentOS Advisory Chat
              </h3>
              <p className="text-xs text-slate-500">
                Ask questions about your subjects, attendance warnings, study plans, or simulated predictions.
              </p>
            </div>

            {/* Quick Starters */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-w-xl w-full">
              {starterPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="rounded-xl border border-slate-200 bg-white p-3 text-left text-xs text-slate-700 hover:border-brand-500 hover:bg-brand-50/30 transition-all flex items-center justify-between group shadow-sm"
                >
                  <span>{prompt}</span>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-brand-600 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                  msg.sender === "user"
                    ? "bg-brand-600 text-white"
                    : "bg-slate-800 text-white"
                }`}
              >
                {msg.sender === "user" ? (
                  <UserIcon className="h-4 w-4" />
                ) : (
                  <Brain className="h-4 w-4" />
                )}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-4 space-y-2 text-sm shadow-sm ${
                  msg.sender === "user"
                    ? "bg-brand-600 text-white rounded-tr-none"
                    : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>

                <div
                  className={`flex items-center justify-between text-[10px] pt-1 ${
                    msg.sender === "user" ? "text-brand-200" : "text-slate-400 border-t border-slate-100"
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {msg.source && (
                    <span className="font-mono">
                      Source: {msg.source}
                    </span>
                  )}
                </div>

                {/* Suggested Actions Chips */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {msg.suggestedActions.map((action, aIdx) => (
                      <button
                        key={aIdx}
                        onClick={() => handleSendMessage(action)}
                        className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-brand-700 hover:bg-brand-50 hover:border-brand-300 transition-colors"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-white shrink-0">
              <Brain className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-none border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 animate-bounce rounded-full bg-brand-600" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-brand-600 [animation-delay:0.2s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-brand-600 [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Field Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 border-t border-slate-200 pt-3"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask a question about your academic standing, study plans, or risks..."
          className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          disabled={loading}
        />
        <Button type="submit" disabled={!inputValue.trim() || loading} size="lg">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
