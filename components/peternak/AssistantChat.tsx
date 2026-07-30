'use client';

import * as React from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const suggestions = [
  {
    title: 'Pakan Ayam',
    subtitle: 'Tips pakan biar produksi optimal',
    question: 'Tips pakan biar produksi telur optimal?',
  },
  {
    title: 'Simpan Telur',
    subtitle: 'Cara menyimpan telur biar awet',
    question: 'Bagaimana cara menyimpan telur biar awet?',
  },
  {
    title: 'Harga Jual',
    subtitle: 'Tips menentukan harga jual',
    question: 'Tips menentukan harga jual telur yang pas?',
  },
];

function renderReply(text: string) {
  return text.split(/\*\*(.+?)\*\*/g).map((segment, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="font-semibold">
        {segment}
      </strong>
    ) : (
      segment
    )
  );
}

export function AssistantChat({ firstName }: { firstName?: string }) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [thinking, setThinking] = React.useState(false);
  const [error, setError] = React.useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  const send = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isSending) {
      return;
    }

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setError('');
    setIsSending(true);
    setThinking(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Gagal mengirim pesan');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let reply = '';
      let started = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        reply += decoder.decode(value, { stream: true });
        if (!reply.trim()) continue;

        if (!started) {
          started = true;
          setThinking(false);
          setMessages((current) => [...current, { role: 'assistant', content: reply }]);
        } else {
          setMessages((current) => {
            const copy = [...current];
            copy[copy.length - 1] = { role: 'assistant', content: reply };
            return copy;
          });
        }
      }

      if (!started) {
        setMessages((current) => [
          ...current,
          { role: 'assistant', content: 'Maaf, asisten tidak dapat menjawab saat ini.' },
        ]);
      }
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Terjadi kesalahan');
    } finally {
      setThinking(false);
      setIsSending(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    send(input);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 w-full relative">
      <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col">
        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center px-2 text-center pb-8">
            <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-700">
              <Sparkles className="h-8 w-8" />
            </span>
            <p className="text-body-medium text-text-desc">
              {firstName ? `Halo, ${firstName}` : 'Halo'}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-text-main md:text-3xl">
              Ada yang bisa saya bantu?
            </h2>

            <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
              {suggestions.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => send(item.question)}
                  className="rounded-xl border border-border bg-white p-4 text-left transition-all hover:border-primary-400 hover:shadow-sm"
                >
                  <p className="text-body-medium font-bold text-text-main">{item.title}</p>
                  <p className="mt-1 text-caption text-text-desc">{item.subtitle}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {messages.map((message, index) => (
              <div
                key={index}
                className={
                  message.role === 'user'
                    ? 'flex justify-end'
                    : 'flex items-start justify-start gap-2.5'
                }
              >
                {message.role === 'assistant' ? (
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                    <Bot className="h-4 w-4" />
                  </span>
                ) : null}
                <div
                  className={
                    message.role === 'user'
                      ? 'max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary-400 px-4 py-3 text-body text-primary-950'
                      : 'max-w-[85%] whitespace-pre-wrap text-body leading-relaxed text-text-main'
                  }
                >
                  {message.role === 'assistant' ? renderReply(message.content) : message.content}
                </div>
              </div>
            ))}

            {thinking ? (
              <div className="flex justify-start">
                <p className="animate-pulse text-body text-text-desc">Sedang mengetik...</p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {error ? <p className="pt-2 text-caption text-danger-text">{error}</p> : null}

      <form onSubmit={handleSubmit} className="pt-3 pb-2">
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-neutral-50 px-3 py-2 shadow-sm transition-colors focus-within:border-primary-400">
          <textarea
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              event.target.style.height = 'auto';
              event.target.style.height = `${event.target.scrollHeight}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
            rows={1}
            placeholder="Tulis pertanyaan Anda..."
            disabled={isSending}
            className="flex-1 resize-none bg-transparent px-1 py-2 text-body text-text-main placeholder:text-text-muted focus:outline-none disabled:opacity-60 max-h-32"
            style={{ minHeight: '40px' }}
          />
          <button
            type="submit"
            disabled={isSending || input.trim() === ''}
            aria-label="Kirim"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-400 text-primary-950 transition-colors hover:bg-primary-500 disabled:bg-primary-100 disabled:text-text-muted"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
