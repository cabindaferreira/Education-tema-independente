import { ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import { PageIntro } from '@/components/site-layout';

export default function EventsPage() {
  return <>
    <PageIntro eyebrow="Aprender em conjunto" title="Eventos da Academia" description="Oficinas, aulas abertas e encontros com especialistas. As datas serão anunciadas em breve." />
    <section className="section journal"><div className="container"><div className="journal-grid">
      <article className="journal-card"><div className="journal-art journal-one"><span>Oficina</span></div><div className="journal-body"><div className="journal-meta">ONLINE · DATA A ANUNCIAR</div><h3>Design UX: da ideia ao protótipo</h3><p>Uma sessão prática para transformar uma ideia numa experiência digital clara.</p><Link className="read-more" href="/contactos">SABER MAIS <ArrowRight size={12} /></Link></div></article>
      <article className="journal-card"><div className="journal-art journal-two"><span>Aula aberta</span></div><div className="journal-body"><div className="journal-meta">ONLINE · DATA A ANUNCIAR</div><h3>Os primeiros passos na programação</h3><p>Descubra os fundamentos da web numa aula acessível a quem está a começar.</p><Link className="read-more" href="/contactos">SABER MAIS <ArrowRight size={12} /></Link></div></article>
      <article className="journal-card"><div className="journal-art journal-three"><span>Conversa</span></div><div className="journal-body"><div className="journal-meta">ONLINE · DATA A ANUNCIAR</div><h3>Conversa com docentes da Academia</h3><p>Conheça os nossos especialistas e coloque as suas questões sobre os cursos.</p><Link className="read-more" href="/contactos">SABER MAIS <ArrowRight size={12} /></Link></div></article>
    </div></div></section>
  </>;
}
