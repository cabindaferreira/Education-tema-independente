import { useState, type FormEvent } from 'react';
import { ArrowRight, Clock3, Mail, MapPin, Phone } from 'lucide-react';
import { PageIntro } from '@/components/site-layout';

export default function ContactsPage() {
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);
  function joinNewsletter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email.trim()) setJoined(true);
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
      <div>{joined ? <p className="form-status" role="status">Obrigado pelo interesse. Esta pré-visualização não guarda endereços de e-mail.</p> : <form className="newsletter-form" onSubmit={joinNewsletter}>
        <label className="sr-only" htmlFor="newsletter-email">O seu endereço de e-mail</label><input id="newsletter-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="O seu endereço de e-mail" required data-testid="input-newsletter-email" />
        <button className="button button-teal" type="submit" data-testid="button-newsletter-submit">INSCREVER-ME <ArrowRight size={14} /></button>
      </form>}{!joined && <p className="form-note">Pré-visualização — os endereços de e-mail não são guardados.</p>}</div>
    </div></section>
  </>;
}
