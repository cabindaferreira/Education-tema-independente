import { useState, type FormEvent } from 'react';
import { ArrowRight, Clock3, Mail, MapPin, Phone } from 'lucide-react';
import { PageIntro } from '@/components/site-layout';

export default function ContactsPage() {
  const [email, setEmail] = useState('');
  const [signupState, setSignupState] = useState<'idle' | 'submitting' | 'success' | 'duplicate' | 'invalid' | 'error'>('idle');

  async function joinNewsletter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSignupState('submitting');

    try {
      const response = await fetch('/api/newsletter-signups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await response.json() as { status?: string; error?: string };

      if (response.status === 201 && result.status === 'confirmation_sent') {
        setSignupState('success');
      } else if (response.status === 200 && result.status === 'already_subscribed') {
        setSignupState('duplicate');
      } else if (response.status === 400 && result.error === 'invalid_email') {
        setSignupState('invalid');
      } else {
        setSignupState('error');
      }
    } catch {
      setSignupState('error');
    }
  }
  return <>
    <PageIntro eyebrow="Fale connosco" title="Contactos" description="Estamos disponíveis para esclarecer dúvidas sobre formações e espaços." />
    <section className="section contact-details"><div className="container contact-grid">
      <article><span className="contact-icon"><Phone size={20} /></span><h2>Ligue-nos</h2><a href="tel:+244921001668">+244 921 001 668</a></article>
      <article><span className="contact-icon"><Mail size={20} /></span><h2>Escreva-nos</h2><a href="mailto:academia@procenter.co.ao">academia@procenter.co.ao</a></article>
      <article><span className="contact-icon"><Clock3 size={20} /></span><h2>Horário</h2><p>Segunda a sexta<br />08h00–20h00</p></article>
      <article><span className="contact-icon"><MapPin size={20} /></span><h2>Visite-nos</h2><p>Av. 21 de Janeiro, Cassequel<br />Edifício Procenter, em frente ao Banco BIC</p></article>
    </div></section>
    <section className="newsletter"><div className="container newsletter-inner">
      <div><div className="eyebrow">Inspiração, de vez em quando</div><h2>Abra espaço para o próximo passo.</h2><p>Receba cursos novos, ideias úteis e histórias dos nossos alunos.</p></div>
      <div>
        <form className="newsletter-form" onSubmit={joinNewsletter}>
          <label className="sr-only" htmlFor="newsletter-email">O seu endereço de e-mail</label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setSignupState('idle');
            }}
            placeholder="O seu endereço de e-mail"
            required
            maxLength={320}
            disabled={signupState === 'submitting'}
            aria-describedby="newsletter-status"
            aria-invalid={signupState === 'invalid'}
            data-testid="input-newsletter-email"
          />
          <button className="button button-teal" type="submit" disabled={signupState === 'submitting'} data-testid="button-newsletter-submit">
            {signupState === 'submitting' ? 'A ENVIAR…' : 'INSCREVER-ME'} <ArrowRight size={14} />
          </button>
        </form>
        <p className="form-note" id="newsletter-status" data-state={signupState} role="status" aria-live="polite">
          {signupState === 'success' && 'Obrigado! Enviámos uma confirmação para o seu e-mail.'}
          {signupState === 'duplicate' && 'Este endereço já está inscrito. Consulte o seu e-mail para encontrar a confirmação.'}
          {signupState === 'invalid' && 'Introduza um endereço de e-mail válido.'}
          {signupState === 'error' && 'Não foi possível concluir a inscrição agora. Tente novamente mais tarde.'}
          {signupState === 'submitting' && 'A enviar o seu pedido de inscrição…'}
          {signupState === 'idle' && 'Receberá um e-mail para confirmar a sua subscrição.'}
        </p>
      </div>
    </div></section>
  </>;
}
