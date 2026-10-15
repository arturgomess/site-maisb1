'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Link2 } from 'lucide-react';

type ShareNetwork = 'whatsapp' | 'linkedin' | 'x' | 'facebook';

function SocialMark({ network }: { network: ShareNetwork }) {
  if (network === 'whatsapp') return <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="#25D366" /><path fill="#fff" d="M34.7 28.9c-.6-.3-3.4-1.7-3.9-1.9-.5-.2-.9-.3-1.2.3-.4.6-1.5 1.9-1.8 2.2-.3.4-.6.4-1.2.1-.6-.3-2.5-.9-4.8-3-1.8-1.6-3-3.6-3.3-4.2-.3-.6 0-.9.2-1.1.3-.3.6-.7.9-1 .3-.3.4-.6.6-1 .2-.4.1-.7 0-1-.1-.3-1.2-3-1.7-4.1-.4-1.1-.9-.9-1.2-.9h-1c-.4 0-1 .1-1.5.7-.5.6-2 2-2 4.8s2.1 5.5 2.4 5.9c.3.4 4.1 6.2 9.9 8.7 1.4.6 2.5 1 3.3 1.2 1.4.4 2.7.3 3.7.2 1.1-.2 3.4-1.4 3.9-2.8.5-1.4.5-2.6.4-2.8-.2-.2-.6-.4-1.2-.7Z" /></svg>;
  if (network === 'linkedin') return <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="#0A66C2" /><path fill="#fff" d="M15.2 19.3h4.3v13.5h-4.3V19.3Zm2.2-6.7a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm4.9 6.7h4.1v1.8h.1c.6-1.1 2-2.2 4.1-2.2 4.4 0 5.2 2.9 5.2 6.6v7.3h-4.3v-6.5c0-1.6 0-3.7-2.3-3.7s-2.7 1.8-2.7 3.6v6.6h-4.3V19.3Z" /></svg>;
  if (network === 'facebook') return <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="#1877F2" /><path fill="#fff" d="M27.2 40V25.8h4.8l.7-5.5h-5.5v-3.5c0-1.6.5-2.7 2.8-2.7H33V9.2c-.5-.1-2.2-.2-4.2-.2-4.2 0-7.1 2.6-7.1 7.3v4h-4.8v5.5h4.8V40h5.5Z" /></svg>;
  return <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="#F0EFED" /><path fill="#111" d="M29.1 13h4.3l-9.4 10.8L35 35h-8.6l-6.7-8.8L12 35H7.7l10.1-11.6L8.1 13h8.8l6 8 6.2-8Zm-1.5 19.8H30L15.6 15.1h-2.5l14.5 17.7Z" /></svg>;
}

function copyWithFallback(value: string) {
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.setAttribute('aria-hidden', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  document.body.appendChild(textarea);
  let copied = false;
  try {
    textarea.select();
    copied = document.execCommand?.('copy') ?? false;
  } finally {
    textarea.remove();
  }
  if (!copied) throw new Error('Clipboard unavailable');
}

export function ArticleShare({ title, shareUrl }: { title: string; shareUrl: string }) {
  const [feedback, setFeedback] = useState<'copied' | 'error' | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const shares: { network: ShareNetwork; label: string; href: string }[] = [
    { network: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`${title} ${shareUrl}`)}` },
    { network: 'linkedin', label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { network: 'x', label: 'X / Twitter', href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}` },
    { network: 'facebook', label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
  ];

  useEffect(() => () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
  }, []);

  const copyLink = async () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    try {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(shareUrl);
        } catch {
          copyWithFallback(shareUrl);
        }
      } else {
        copyWithFallback(shareUrl);
      }
      setFeedback('copied');
    } catch {
      setFeedback('error');
    }
    feedbackTimer.current = setTimeout(() => setFeedback(null), 2400);
  };

  return (
    <section className="article-share-section" aria-labelledby="article-share-label">
      <div className="article-share-main">
        <div className="article-share-intro">
          <div className="article-share-copy">
            <p className="article-share-eyebrow" id="article-share-label">Compartilhar matéria</p>
            <h2 className="article-share-heading">Gostou deste conteúdo?</h2>
            <p className="article-share-description">Compartilhe esta matéria com a sua rede e ajude a levar essa informação ainda mais longe.</p>
          </div>
        </div>

        <span className="article-share-divider" aria-hidden="true" />
        <div className="article-share-options" role="group" aria-label="Compartilhar esta matéria">
          {shares.map(({ network, label, href }) => (
            <a className="article-share-option" href={href} key={network} target="_blank" rel="noopener noreferrer" aria-label={label}>
              <span className={`article-share-icon article-share-icon-${network}`}><SocialMark network={network} /></span>
            </a>
          ))}
        </div>

        <span className="article-share-divider" aria-hidden="true" />
        <button
          className="article-share-copy-button"
          type="button"
          onClick={copyLink}
          aria-label="Copiar link"
          title="Copiar link"
        >
          {feedback === 'copied' ? <Check size={25} aria-hidden="true" /> : <Link2 size={27} aria-hidden="true" />}
        </button>
      </div>
      {feedback === 'error' && (
        <p className="article-share-feedback is-error" role="alert">
          Não foi possível copiar automaticamente. Copie este endereço: <a href={shareUrl}>{shareUrl}</a>
        </p>
      )}
      <p className="article-share-feedback-sr" role="status" aria-live="polite">
        {feedback === 'copied' ? 'Link copiado!' : ''}
      </p>
    </section>
  );
}
