'use client';
import { useState } from 'react';
import { Twitter, Linkedin, Facebook, MessageCircle, Link as LinkIcon, Check } from 'lucide-react';

export function ShareButtons({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const encUrl = encodeURIComponent(url);
  const encText = encodeURIComponent(text);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  const btn = 'inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={`https://twitter.com/intent/tweet?text=${encText}&url=${encUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
      >
        <Twitter className="h-3.5 w-3.5" /> X / Twitter
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
      >
        <Linkedin className="h-3.5 w-3.5" /> LinkedIn
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
      >
        <Facebook className="h-3.5 w-3.5" /> Facebook
      </a>
      <a
        href={`https://wa.me/?text=${encText}%20${encUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
      >
        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
      </a>
      <button type="button" onClick={copy} className={btn}>
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <LinkIcon className="h-3.5 w-3.5" />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  );
}
