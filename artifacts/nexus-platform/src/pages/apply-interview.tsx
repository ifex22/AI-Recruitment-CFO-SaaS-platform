import { useState, useEffect, useRef } from "react";
import { useSearch } from "wouter";
import { Zap, Send, Loader2, CheckCircle2, Trophy, TrendingUp, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

type ScoreResult = {
  score: number;
  recommendation: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  message: string;
};

export default function ApplyInterviewPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const candidateId = params.get("cid") ?? "";
  const token = params.get("tok") ?? "";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Start interview with a greeting
    sendMessage(undefined, true);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const sendMessage = async (userText?: string, isInit = false) => {
    const newMessages: Message[] = isInit ? [] : [
      ...messages,
      { role: "user" as const, content: userText! },
    ];

    if (!isInit && userText) setMessages(newMessages);
    setSending(true);

    try {
      const res = await fetch("/api/public/interview/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: candidateId, token, messages: newMessages }),
      });

      const data = await res.json();
      if (!res.ok) { setSending(false); return; }

      const withReply: Message[] = [...newMessages, { role: "assistant", content: data.message }];
      setMessages(withReply);
      const uCount = withReply.filter(m => m.role === "user").length;
      setQuestionCount(uCount);

      if (data.done) {
        setDone(true);
        completeInterview(withReply);
      }
    } catch {
      setSending(false);
    }
    setSending(false);
  };

  const completeInterview = async (finalMessages: Message[]) => {
    setCompleting(true);
    try {
      const res = await fetch("/api/public/interview/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: candidateId, token, messages: finalMessages }),
      });
      const data = await res.json();
      if (res.ok) setResult(data);
    } catch {}
    setCompleting(false);
  };

  const handleSend = () => {
    if (!input.trim() || sending || done) return;
    const text = input.trim();
    setInput("");
    sendMessage(text);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const recColor = (r: string) => {
    if (r === "strong_hire") return "text-green-400";
    if (r === "hire") return "text-emerald-400";
    if (r === "maybe") return "text-amber-400";
    return "text-red-400";
  };

  const recLabel = (r: string) => {
    if (r === "strong_hire") return "Strong Hire";
    if (r === "hire") return "Hire";
    if (r === "maybe") return "Under Review";
    return "Not Selected";
  };

  const scoreColor = (s: number) => s >= 80 ? "text-green-400" : s >= 60 ? "text-amber-400" : "text-red-400";

  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Interview Complete!</h1>
            <p className="text-slate-400">Your AI assessment results</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4 text-center">
            <div className={`text-6xl font-bold mb-1 ${scoreColor(result.score)}`}>{result.score}</div>
            <div className="text-slate-400 text-sm mb-3">out of 100</div>
            <div className={`text-lg font-semibold ${recColor(result.recommendation)}`}>
              {recLabel(result.recommendation)}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-4">
            <p className="text-slate-300 text-sm leading-relaxed">{result.summary}</p>
          </div>

          {result.strengths?.length > 0 && (
            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-semibold">Strengths</span>
              </div>
              <ul className="space-y-1">
                {result.strengths.map((s, i) => (
                  <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" /> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.improvements?.length > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 text-sm font-semibold">Areas to grow</span>
              </div>
              <ul className="space-y-1">
                {result.improvements.map((s, i) => (
                  <li key={i} className="text-slate-300 text-sm">• {s}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4 text-center">
            <p className="text-slate-300 text-sm">✉️ Your results have been recorded. Our team will review your application and reach out via email.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-bold">AI Interview</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm">{questionCount}/5 questions answered</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={cn("w-2 h-2 rounded-full", i <= questionCount ? "bg-blue-500" : "bg-white/10")} />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">
          {messages.length === 0 && sending && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-3 items-start", msg.role === "user" ? "flex-row-reverse" : "")}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={cn(
                "rounded-2xl px-4 py-3 max-w-[80%] text-sm leading-relaxed",
                msg.role === "assistant"
                  ? "bg-white/5 border border-white/10 text-slate-200 rounded-tl-sm"
                  : "bg-blue-600 text-white rounded-tr-sm"
              )}>
                {msg.content}
              </div>
            </div>
          ))}

          {sending && messages.length > 0 && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
              </div>
            </div>
          )}

          {completing && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 text-slate-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Calculating your score...
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      {!done && (
        <div className="border-t border-white/10 bg-black/20 backdrop-blur-sm p-4">
          <div className="max-w-2xl mx-auto flex gap-3 items-end">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type your answer... (Enter to send)"
              disabled={sending || done}
              rows={2}
              className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-slate-500 resize-none rounded-xl"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sending || done}
              className="bg-blue-600 hover:bg-blue-700 h-12 w-12 p-0 rounded-xl shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-slate-600 text-xs text-center mt-2">Your responses are analyzed by AI to assess your fit for the role</p>
        </div>
      )}
    </div>
  );
}
