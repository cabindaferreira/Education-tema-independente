import { useState, type FormEvent } from 'react';
import { Link } from 'wouter';

type UnsubscribeState = 'idle' | 'submitting' | 'done' | 'invalid' | 'error';

const apiBase = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`;

export default function NewsletterUnsubscribePage() {
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') ?? '');
  const [state, setState] = useState<UnsubscribeState>('idle');

  async function confirmUnsubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setState('invalid');
      return;
    }

    setState('submitting');
    try {
      const response = await fetch(`${apiBase}/newsletter-unsubscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const result = await response.json() as { status?: string };
      if (response.ok && (result.status === 'unsubscribed' || result.status === 'already_unsubscribed')) {
        setState('done');
      } else if (response.status === 400 || response.status === 404) {
        setState('invalid');
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  }

  return (
    <section className="newsletter-unsubscribe" aria-labelledby="unsubscribe-title">
      <div className="container newsletter-unsubscribe-card">
        <span className="eyebrow">Boletim informativo</span>
        {state === 'done' ? (
          <>
            <h1 id="unsubscribe-title">Subscrição cancelada</h1>
            <p role="status" aria-live="polite">Não receberá mais e-mails da newsletter Academia Procenter.</p>
            <Link className="button button-teal" href="/">Voltar ao início</Link>
          </>
        ) : (
          <>
            <h1 id="unsubscribe-title">Cancelar a subscrição?</h1>
            <p>Confirme abaixo se pretende deixar de receber a newsletter Academia Procenter.</p>
            <form onSubmit={confirmUnsubscribe}>
              <button className="button button-teal" type="submit" disabled={state === 'submitting'}>
                {state === 'submitting' ? 'A processar…' : 'Cancelar subscrição'}
              </button>
            </form>
            <p className="newsletter-unsubscribe-status" role={state === 'invalid' || state === 'error' ? 'alert' : 'status'} aria-live="polite">
              {state === 'invalid' && 'Este link já não é válido. Se já confirmou o cancelamento, não precisa de fazer mais nada.'}
              {state === 'error' && 'Não foi possível concluir o pedido agora. Tente novamente.'}
            </p>
            <Link className="newsletter-unsubscribe-keep" href="/">Não cancelar — voltar ao início</Link>
          </>
        )}
      </div>
    </section>
  );
}
