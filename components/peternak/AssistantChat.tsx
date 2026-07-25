'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Bot, Send } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

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

export function AssistantChat() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [error, setError] = React.useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();

    const question = input.trim();
    if (!question || isSending) {
      return;
    }

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: question }];
    setMessages(nextMessages);
    setInput('');
    setError('');
    setIsSending(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengirim pesan');
      }

      setMessages((current) => [...current, { role: 'assistant', content: data.reply }]);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Terjadi kesalahan');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="flex h-[70vh] flex-col p-0">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
          <Bot className="h-5 w-5 text-primary-700" />
        </span>
        <div>
          <p className="text-h3 text-text-main">Asisten Peternak</p>
          <p className="text-caption text-text-desc">Tanya seputar operasional ternak Anda</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
              <Bot className="h-6 w-6 text-primary-700" />
            </span>
            <p className="text-body-medium text-text-main">Ada yang bisa dibantu?</p>
            <p className="mt-1 max-w-xs text-body text-text-desc">
              Tanyakan soal pakan, perawatan ayam, penyimpanan telur, atau tips harga jual.
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
            >
              <div
                className={
                  message.role === 'user'
                    ? 'max-w-[85%] whitespace-pre-wrap rounded-lg bg-primary-400 px-4 py-3 text-body text-primary-950'
                    : 'max-w-[85%] whitespace-pre-wrap rounded-lg border border-border bg-white px-4 py-3 text-body text-text-main'
                }
              >
                {message.role === 'assistant' ? renderReply(message.content) : message.content}
              </div>
            </div>
          ))
        )}

        {isSending ? (
          <div className="flex justify-start">
            <div className="rounded-lg border border-border bg-white px-4 py-3 text-body text-text-desc">
              Asisten sedang mengetik...
            </div>
          </div>
        ) : null}
      </div>

      {error ? <p className="px-5 text-caption text-danger-text">{error}</p> : null}

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border px-5 py-4">
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Tulis pertanyaan Anda..."
          disabled={isSending}
        />
        <Button type="submit" disabled={isSending || input.trim() === ''} className="shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
}
