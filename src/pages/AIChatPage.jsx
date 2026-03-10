import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Sparkles, RotateCcw, Copy, BookOpen, Zap, Brain, Search, Cpu, Globe, Dna, Droplets } from 'lucide-react';
import { streamChatWithAI } from '../services/aiService';
import './AIChatPage.css';

const SUGGESTED_PROMPTS = [
  { icon: Sparkles, text: 'Give me some tips for a student social life' },
  { icon: Brain, text: 'How to manage study-life balance effectively?' },
  { icon: Cpu, text: 'What are the coolest tech trends for students in 2025?' },
  { icon: Globe, text: 'Top travel destinations for a student budget' },
  { icon: Dna, text: 'How to stay healthy and fit between classes?' },
  { icon: Zap, text: 'What are some great conversation starters?' },
];

function MessageBubble({ msg, isStreaming }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isUser = msg.role === 'user';

  return (
    <div className={`ai-message ${isUser ? 'ai-message--user' : 'ai-message--ai'}`}>
      {!isUser && (
        <div className="ai-avatar">
          <Zap size={16} fill="white" />
        </div>
      )}
      <div className={`ai-bubble ${isUser ? 'ai-bubble--user' : 'ai-bubble--ai'}`}>
        <p className="ai-bubble__text">
          {msg.content}
          {isStreaming && <span className="ai-cursor" />}
        </p>
        {!isUser && !isStreaming && msg.content && (
          <button className="ai-copy-btn" onClick={copy} title="Copy">
            {copied ? '✓ Copied' : <><Copy size={12} /> Copy</>}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AIChatPage() {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const topicSent = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Auto-send topic if passed via URL ?topic=...
  useEffect(() => {
    const topic = searchParams.get('topic');
    if (topic && !topicSent.current) {
      topicSent.current = true;
      // Small delay to let component mount
      setTimeout(() => sendMessage(`Explain this topic: ${topic}`), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = useCallback(async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    setInput('');
    setError('');

    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setLoading(true);
    setStreamingText('');

    let fullResponse = '';

    try {
      await streamChatWithAI(
        newMessages.map(m => ({ role: m.role, content: m.content })),
        (chunk) => {
          fullResponse += chunk;
          setStreamingText(prev => prev + chunk);
        }
      );

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: fullResponse }
      ]);
    } catch (err) {
      setError('AI is unavailable right now. Please check your connection or API key.');
      console.error(err);
    } finally {
      setLoading(false);
      setStreamingText('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, input, loading]);

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function reset() {
    setMessages([]);
    setStreamingText('');
    setError('');
    setInput('');
  }

  const isEmpty = messages.length === 0 && !streamingText;

  return (
    <div className="ai-chat-page">
      {/* Header */}
      <div className="ai-header">
        <div className="ai-header__left">
          <div className="ai-header__icon">
            <Brain size={20} />
          </div>
          <div>
            <h1 className="font-display font-bold" style={{ fontSize: 20 }}>Lexora AI</h1>
            <p className="text-xs text-muted">Powered by Claude via OpenRouter</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-cyan" style={{ gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            Online
          </span>
          {messages.length > 0 && (
            <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px', gap: 4 }} onClick={reset}>
              <RotateCcw size={13} /> New Chat
            </button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="ai-messages-area">
        {isEmpty ? (
          <div className="ai-welcome animate-fadeIn">
            <div className="ai-welcome__icon">
              <Sparkles size={32} />
            </div>
            <h2 className="font-display font-bold ai-welcome__title">
              Hello! I'm <span className="text-gradient">Lexora AI</span>
            </h2>
            <p className="text-secondary ai-welcome__sub">
              Ask me anything — student life, tech, travel, science, philosophy, or just for a chat.
              I'm here to help you explore the world and connect with your community.
            </p>

            <div className="ai-suggestions">
              {SUGGESTED_PROMPTS.map(p => (
                <button
                  key={p.text}
                  className="ai-suggestion-pill"
                  onClick={() => sendMessage(p.text)}
                >
                  <span><p.icon size={16} /></span>
                  <span>{p.text}</span>
                </button>
              ))}
            </div>

            <div className="ai-powered-by">
              <div className="ai-model-badge">
                <Zap size={12} style={{ color: '#06b6d4' }} />
                <span>Claude 3 Haiku</span>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>via</span>
              <div className="ai-model-badge">
                <Search size={12} style={{ color: '#a78bfa' }} />
                <span>OpenRouter</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="ai-messages-list">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} isStreaming={false} />
            ))}
            {loading && streamingText && (
              <MessageBubble
                msg={{ role: 'assistant', content: streamingText }}
                isStreaming={true}
              />
            )}
            {loading && !streamingText && (
              <div className="ai-message ai-message--ai">
                <div className="ai-avatar"><Zap size={16} fill="white" /></div>
                <div className="ai-bubble ai-bubble--ai ai-thinking">
                  <span className="dot" style={{ animationDelay: '0s' }} />
                  <span className="dot" style={{ animationDelay: '0.2s' }} />
                  <span className="dot" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="ai-error animate-fadeIn">
            <span>⚠️</span> {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="ai-input-area">
        <div className="ai-input-wrap">
          <textarea
            ref={inputRef}
            id="ai-chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask anything… (Shift+Enter for new line)"
            className="ai-textarea"
            rows={1}
          />
          <button
            className="ai-send-btn"
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            id="ai-send-btn"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="ai-disclaimer">
          <BookOpen size={11} /> AI responses may be inaccurate. Always verify important information.
        </p>
      </div>
    </div>
  );
}
