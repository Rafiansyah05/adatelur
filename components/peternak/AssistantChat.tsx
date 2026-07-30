'use client';

import * as React from 'react';
import { Bot, Send, Sparkles, Volume2, Pause, Play } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const suggestions = [
  {
    title: 'Trend & Saran',
    subtitle: 'Analisis penjualan & saran bisnis toko',
    question: 'Bagaimana tren penjualan saya dan saran untuk toko saya?',
  },
  {
    title: 'Keuangan Toko',
    subtitle: 'Saldo kas dompet & transaksi',
    question: 'Berapa saldo dompet dan ringkasan keuangan toko saya?',
  },
  {
    title: 'Stok & Penjualan',
    subtitle: 'Cek sisa stok rak & total terjual',
    question: 'Berapa sisa stok rak yang tersedia dan total rak terjual?',
  },
  {
    title: 'Rating & Ulasan',
    subtitle: 'Reputasi toko & ulasan pembeli',
    question: 'Bagaimana ulasan pembeli dan cara meningkatkan rating toko saya?',
  },
];

function cleanTextForSpeech(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^[-*_]{3,}\s*$/gm, '')
    .replace(/^[ \t]*[*•-]\s+/gm, '')
    .replace(/[\r\n]+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getBestIndonesianVoice(voicesList: SpeechSynthesisVoice[]) {
  if (!voicesList || voicesList.length === 0) {
    return null;
  }

  const exactLang = voicesList.find((v) => {
    const l = v.lang.toLowerCase().replace('_', '-');
    return l === 'id-id' || l === 'id';
  });
  if (exactLang) {
    return exactLang;
  }

  const prefixLang = voicesList.find((v) => {
    const l = v.lang.toLowerCase().replace('_', '-');
    return l.startsWith('id-') || l.startsWith('id_');
  });
  if (prefixLang) {
    return prefixLang;
  }

  const nameMatch = voicesList.find((v) => {
    const n = v.name.toLowerCase();
    return n.includes('indonesia') || n.includes('bahasa') || n.includes('gadis') || n.includes('aris');
  });
  if (nameMatch) {
    return nameMatch;
  }

  const malayMatch = voicesList.find((v) => {
    const l = v.lang.toLowerCase();
    return l.startsWith('ms');
  });
  if (malayMatch) {
    return malayMatch;
  }

  return null;
}

function renderReply(text: string) {
  const cleanedText = text
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^[-*_]{3,}\s*$/gm, '')
    .replace(/^[ \t]*[*]\s+/gm, '• ');

  const paragraphs = cleanedText.split('\n');

  return (
    <div className="space-y-2">
      {paragraphs.map((paragraph, pIndex) => {
        const trimmed = paragraph.trim();
        if (!trimmed) {
          return null;
        }

        const isBullet = trimmed.startsWith('• ');
        const content = isBullet ? trimmed.slice(2) : trimmed;

        const parts = content.split(/\*\*(.+?)\*\*/g).map((segment, sIndex) =>
          sIndex % 2 === 1 ? (
            <strong key={sIndex} className="font-bold text-text-main">
              {segment}
            </strong>
          ) : (
            segment
          )
        );

        if (isBullet) {
          return (
            <div key={pIndex} className="flex items-start gap-2 pl-1">
              <span className="text-primary-600 font-bold select-none">•</span>
              <div className="flex-1 leading-relaxed">{parts}</div>
            </div>
          );
        }

        return (
          <p key={pIndex} className="leading-relaxed">
            {parts}
          </p>
        );
      })}
    </div>
  );
}

export function AssistantChat({ firstName }: { firstName?: string }) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [thinking, setThinking] = React.useState(false);
  const [error, setError] = React.useState('');
  const [speakingIndex, setSpeakingIndex] = React.useState<number | null>(null);
  const [isPaused, setIsPaused] = React.useState(false);
  const [voices, setVoices] = React.useState<SpeechSynthesisVoice[]>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const chunkIndexRef = React.useRef(0);
  const sentenceChunksRef = React.useRef<string[]>([]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleToggleSpeech = (index: number, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const synth = window.speechSynthesis;

    if (speakingIndex === index) {
      if (synth.speaking && !synth.paused) {
        synth.pause();
        setIsPaused(true);
        return;
      }
      if (synth.paused) {
        synth.resume();
        setIsPaused(false);
        return;
      }
    }

    synth.cancel();

    const sanitized = cleanTextForSpeech(text);
    if (!sanitized) {
      return;
    }

    const chunks = sanitized
      .split(/(?<=[.!?])\s+/)
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (chunks.length === 0) {
      return;
    }

    sentenceChunksRef.current = chunks;
    chunkIndexRef.current = 0;
    setSpeakingIndex(index);
    setIsPaused(false);

    const availableVoices = voices.length > 0 ? voices : synth.getVoices();
    const idVoice = getBestIndonesianVoice(availableVoices);

    const speakNextChunk = () => {
      if (chunkIndexRef.current >= sentenceChunksRef.current.length) {
        setSpeakingIndex(null);
        setIsPaused(false);
        return;
      }

      const currentChunk = sentenceChunksRef.current[chunkIndexRef.current];
      chunkIndexRef.current += 1;

      const utterance = new SpeechSynthesisUtterance(currentChunk);
      utterance.lang = 'id-ID';
      utterance.rate = 1.0;

      if (idVoice) {
        utterance.voice = idVoice;
        utterance.lang = idVoice.lang;
      }

      utterance.onend = () => {
        speakNextChunk();
      };

      utterance.onerror = () => {
        setSpeakingIndex(null);
        setIsPaused(false);
      };

      synth.speak(utterance);
      if (synth.paused) {
        synth.resume();
      }
    };

    setTimeout(() => {
      speakNextChunk();
    }, 50);
  };

  const send = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isSending) {
      return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      setIsPaused(false);
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
    <div className="flex flex-col flex-1 h-full min-h-0 w-full relative overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 flex flex-col pr-1">
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

            <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          <div className="space-y-6 py-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={
                  message.role === 'user'
                    ? 'flex justify-end'
                    : 'flex items-start justify-start gap-3'
                }
              >
                {message.role === 'assistant' ? (
                  <>
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                      <Bot className="h-4 w-4" />
                    </span>
                    <div className="max-w-[85%] text-body leading-relaxed text-text-main">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleSpeech(index, message.content)}
                          className="inline-flex items-center gap-2 rounded-xl border border-primary-300 bg-primary-50 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-primary-950 transition-all hover:bg-primary-100 active:scale-95 shadow-xs"
                        >
                          {speakingIndex === index ? (
                            isPaused ? (
                              <>
                                <Play className="h-4 w-4 text-primary-700" />
                                <span>Lanjutkan Suara</span>
                              </>
                            ) : (
                              <>
                                <Pause className="h-4 w-4 text-primary-700 animate-pulse" />
                                <span>Jeda Suara</span>
                              </>
                            )
                          ) : (
                            <>
                              <Volume2 className="h-4 w-4 text-primary-700" />
                              <span>Dengarkan Suara</span>
                            </>
                          )}
                        </button>
                      </div>
                      {renderReply(message.content)}
                    </div>
                  </>
                ) : (
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary-400 px-4 py-3 text-body text-primary-950">
                    {message.content}
                  </div>
                )}
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

      <form onSubmit={handleSubmit} className="shrink-0 pt-3 pb-2 bg-bg-base border-t border-border sticky bottom-0 z-20">
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
