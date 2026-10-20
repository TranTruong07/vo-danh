"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { PublicCharacter } from "@/server/domain/character";
import { isChatSessionId, type ChatRequestInput, type ChatResponse, type ChatSuggestion, type OpenChatSessionAction } from "@/server/domain/chat";
import { ChatClientError, chatResponseText, requestChat, requestChatSession } from "./chat-client";
import { useChatViewport } from "./use-chat-viewport";
import "./character-chat.css";

const subscribeOnline = (listener: () => void) => { window.addEventListener("online", listener); window.addEventListener("offline", listener); return () => { window.removeEventListener("online", listener); window.removeEventListener("offline", listener); }; };
type ChatInput = ChatRequestInput;
interface FailedRequest { id: number; text: string; input: ChatInput }
interface Message { id: number; role: "user" | "assistant"; text: string; response?: ChatResponse; failed?: boolean }
interface CharacterChatProps {
  character: Pick<PublicCharacter, "name" | "image" | "openingLine">; quizSessionId?: string; openChatSessionAction?: OpenChatSessionAction;
}
export default function CharacterChat({ canOpenChatbot, roundId, ...props }: CharacterChatProps & { canOpenChatbot: boolean; roundId?: string }) {
  // Do not mount handlers or request state until this round is complete. Revoking
  // access unmounts the conversation and aborts its pending request immediately.
  if (!canOpenChatbot || !roundId) return <div className="character-chat-widget">
    <button type="button" className="character-chat-launcher" disabled aria-expanded={false}
      aria-label={`Mở trò chuyện với ${props.character.name}. Hãy trả lời câu hỏi trước khi trò chuyện với nhân vật.`}
      title="Hãy trả lời câu hỏi trước khi trò chuyện với nhân vật.">
      <svg aria-hidden="true" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2v-10a9 9 0 0 1 18 0Z" /><path d="M7 11h.01M12 11h.01M17 11h.01" strokeWidth="3" strokeLinecap="round" /></svg>
      <span>Trò chuyện cùng nhân vật</span><small>Đã khóa</small>
    </button>
  </div>;
  return <UnlockedCharacterChat key={roundId} {...props} />;
}
function UnlockedCharacterChat({ character, quizSessionId, openChatSessionAction }: CharacterChatProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<ChatSuggestion[]>([]);
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false);
  const [error, setError] = useState(""), [expired, setExpired] = useState(false), [retryDelay, setRetryDelay] = useState(0);
  const [failed, setFailed] = useState<FailedRequest | null>(null);
  const [startersOpen, setStartersOpen] = useState(true);
  const [atBottom, setAtBottom] = useState(true), [seenCount, setSeenCount] = useState(0);
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const session = useRef(isChatSessionId(quizSessionId) ? quizSessionId : "");
  const requestId = useRef(""), locked = useRef(false), mounted = useRef(true), sequence = useRef(0);
  const controller = useRef<AbortController | null>(null), log = useRef<HTMLDivElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const widget = useRef<HTMLDivElement>(null), composing = useRef(false);
  const pinned = useRef(true), scrollPosition = useRef(0);
  const mobile = useChatViewport(open, widget);
  const id = useId();
  useEffect(() => { if (open) closeButton.current?.focus({ preventScroll: true }); }, [open]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); }; }, []);
  useLayoutEffect(() => {
    const element = log.current;
    if (open && element) element.scrollTop = pinned.current ? element.scrollHeight : scrollPosition.current;
  }, [messages, busy, open, suggestions]);
  useEffect(() => {
    if (!open || !log.current) return;
    const element = log.current;
    const observer = new ResizeObserver(() => { if (pinned.current) element.scrollTop = element.scrollHeight; });
    observer.observe(element);
    return () => observer.disconnect();
  }, [open]);
  useEffect(() => { if (!retryDelay) return; const timer = setTimeout(() => setRetryDelay(0), retryDelay * 1000); return () => clearTimeout(timer); }, [retryDelay]);
  function close() {
    setOpen(false);
    requestAnimationFrame(() => launcher.current?.focus({ preventScroll: true }));
  }
  function scrollToEnd() {
    pinned.current = true; setAtBottom(true); setSeenCount(messages.length);
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }
  function failure(cause: unknown) {
    const problem = cause instanceof ChatClientError ? cause : new ChatClientError("NETWORK", "Chưa kết nối được trò chuyện. Hãy kiểm tra mạng và thử lại.");
    setError(problem.message);
    if (problem.code === "INVALID_SESSION") setExpired(true);
    if (problem.retryAfter) setRetryDelay(problem.retryAfter);
  }
  async function api(input: ChatInput | null) {
    const abort = new AbortController(); controller.current = abort;
    const timer = setTimeout(() => abort.abort(), 20000);
    try { return await requestChat(session.current, input, abort.signal); }
    finally { clearTimeout(timer); if (controller.current === abort) controller.current = null; }
  }
  async function initialize() {
    if (!mounted.current || locked.current || ready || !online || expired || retryDelay) return;
    locked.current = true; setBusy(true); setError("");
    try {
      if (!session.current) {
        if (!openChatSessionAction) throw new ChatClientError("RELOAD", "Hãy kết nối mạng và tải lại trang nhân vật để mở trò chuyện. Bạn vẫn có thể tiếp tục chơi câu hỏi hiện tại.");
        requestId.current ||= crypto.randomUUID();
        const result = await requestChatSession(openChatSessionAction, requestId.current);
        if (!mounted.current) return;
        if (!result.ok) throw new ChatClientError(result.code, result.message, result.retryAfter);
        session.current = result.sessionId;
      }
      const result = await api(null);
      if (!mounted.current) return;
      if (result.status === "suggest") setSuggestions(result.suggestions.slice(0, 3));
      setReady(true);
    } catch (cause) { if (mounted.current) failure(cause); }
    finally { locked.current = false; if (mounted.current) setBusy(false); }
  }
  async function send(suggestion?: ChatSuggestion, retry?: FailedRequest) {
    const text = retry?.text || suggestion?.question || draft.trim();
    if (!mounted.current || !text || text.length > 500 || locked.current || !ready || !online || expired || retryDelay) return;
    const attempt = retry || { id: ++sequence.current, text, input: { requestId: crypto.randomUUID(),
      ...(suggestion ? { questionId: suggestion.questionId, offerToken: suggestion.offerToken } : { message: text }) } };
    locked.current = true; setBusy(true); setError("");
    setFailed(null); setStartersOpen(false); scrollToEnd();
    setMessages(items => retry ? items.map(item => item.id === retry.id ? { ...item, failed: false } : item) : [...items.slice(-98), { id: attempt.id, role: "user", text }]);
    if (!suggestion && !retry) setDraft("");
    try {
      const result = await api(attempt.input);
      if (!mounted.current) return;
      setMessages(items => [...items, { id: ++sequence.current, role: "assistant", text: chatResponseText(result), response: result }]);
    } catch (cause) { if (mounted.current) {
      failure(cause); setFailed(attempt);
      setMessages(items => items.map(item => item.id === attempt.id ? { ...item, failed: true } : item));
    } }
    finally { locked.current = false; if (mounted.current) setBusy(false); }
  }
  const unavailable = !ready || !online || expired || !!retryDelay;
  const disabled = busy || unavailable;
  const choices = (items: ChatSuggestion[]) => <div className="chat-suggestions">{items.map(item => <button key={item.questionId} type="button" disabled={disabled} onClick={() => void send(item)}>{item.question}</button>)}</div>;

  return <div ref={widget} className={`character-chat-widget${open ? " is-open" : ""}`}>
    {open && <section id={id} className="character-chat-panel" role="dialog" aria-modal={mobile || undefined} aria-label={`Trò chuyện với ${character.name}`} onKeyDown={event => {
      if (event.key === "Escape" && !composing.current && !event.nativeEvent.isComposing) { event.stopPropagation(); close(); }
      if (mobile && event.key === "Tab") {
        const elements = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], textarea:not(:disabled), summary')).filter(element => element.getClientRects().length > 0);
        const first = elements[0], last = elements.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }}>
      <header>
        <span className="chat-avatar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={character.image} alt="" referrerPolicy="no-referrer" />
        </span>
        <div><h2>{character.name}</h2><small>Nhân vật mô phỏng giáo dục</small></div>
        <button ref={closeButton} type="button" aria-label="Đóng trò chuyện" onClick={close}>×</button>
      </header>
      <div className="chat-conversation">
      <div ref={log} className="character-chat-log" role="log" aria-label="Nội dung trò chuyện" aria-live="polite" aria-relevant="additions text" tabIndex={0} onScroll={event => {
        const element = event.currentTarget;
        const bottom = element.scrollHeight - element.scrollTop - element.clientHeight < 48;
        pinned.current = bottom; scrollPosition.current = element.scrollTop; setAtBottom(bottom);
        if (bottom) setSeenCount(messages.length);
      }}>
        <p className="chat-message assistant">{character.openingLine || `Xin chào! Cùng khám phá lịch sử với ${character.name} nhé.`}</p>
        {suggestions.length > 0 && <div className="chat-starters">
          <button className="chat-starters-toggle" type="button" aria-expanded={startersOpen} aria-controls={`${id}-starters`} onClick={() => setStartersOpen(value => !value)}>Gợi ý câu hỏi <span aria-hidden="true">{startersOpen ? "−" : "+"}</span></button>
          <div id={`${id}-starters`} hidden={!startersOpen}>{choices(suggestions)}</div>
        </div>}
        {messages.map(message => <div key={message.id} className={`chat-message ${message.role}`}>
          <span className="chat-message-author">{message.role === "user" ? "Bạn" : character.name}</span>
          <div className="chat-message-text">{message.text}</div>
          {message.failed && <small className="chat-send-failed">Chưa nhận được phản hồi</small>}
          {message.response?.status === "out_of_scope" && <small className="chat-source">Ngoài phạm vi tư liệu đã công bố</small>}
          {message.response?.status === "suggest" && choices(message.response.suggestions)}
        </div>)}
        {busy && <p className="chat-message assistant chat-loading" role="status"><span className="chat-loading-dots" aria-hidden="true"><i /><i /><i /></span>{ready ? "Đang tìm trong tư liệu…" : "Đang mở cuộc trò chuyện…"}</p>}
      </div>
      {!atBottom && <button className="chat-jump" type="button" onClick={scrollToEnd}>{messages.length > seenCount ? "Tin nhắn mới" : "Xuống cuối"} <span aria-hidden="true">↓</span></button>}
      </div>
      <p className="chat-disclaimer">Lời đáp mô phỏng từ tư liệu đã duyệt, không phải lời nói nguyên văn của nhân vật.</p>
      {(!online || error || (!ready && !busy)) && <div id={`${id}-status`} className="character-chat-notice" role="status">
        {!online ? "Trò chuyện cần kết nối mạng. Bạn vẫn có thể tiếp tục chơi trắc nghiệm offline." : error || "Mở kết nối để hỏi nhân vật về tư liệu lịch sử."}
        {online && !ready && !busy && !expired && !retryDelay && <button type="button" onClick={() => void initialize()}>Thử kết nối lại</button>}
        {failed && ready && !expired && <button type="button" disabled={disabled} onClick={() => void send(undefined, failed)}>Thử gửi lại</button>}
        {expired && <Link href="/play">Quét lại mã QR</Link>}
      </div>}
      <form className="character-chat-composer" onSubmit={event => { event.preventDefault(); void send(); }}>
        <label className="sr-only" htmlFor={`${id}-input`}>Tin nhắn cho {character.name}</label>
        <textarea id={`${id}-input`} rows={2} maxLength={500} value={draft} onChange={event => setDraft(event.target.value)} placeholder="Hỏi nhân vật điều bạn tò mò…" disabled={unavailable} readOnly={busy} onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }} onKeyDown={event => {
          if (event.key === "Enter" && !event.shiftKey && !composing.current && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); void send(); }
        }} />
        <button type="submit" disabled={disabled || !draft.trim()} aria-label="Gửi tin nhắn">↑</button>
      </form>
    </section>}
    <button ref={launcher} type="button" className="character-chat-launcher" aria-expanded={open} aria-controls={open ? id : undefined} aria-label={`${open ? "Đóng" : "Mở"} trò chuyện với ${character.name}`} onClick={() => { if (open) close(); else { setOpen(true); void initialize(); } }}>
      <svg aria-hidden="true" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2v-10a9 9 0 0 1 18 0Z" /><path d="M7 11h.01M12 11h.01M17 11h.01" strokeWidth="3" strokeLinecap="round" /></svg>
      <span>{open ? "Đóng trò chuyện" : "Trò chuyện cùng nhân vật"}</span><small>Hỏi đáp</small>
    </button>
  </div>;
}
