import { BookOpen, GraduationCap, UsersRound } from 'lucide-react';
import { PageIntro } from '@/components/site-layout';

export default function AboutPage() {
  return <>
    <PageIntro eyebrow="Sobre a Academia" title="Competências úteis para o dia a dia." description="Aprenda algo útil com quem conhece o tema. Integre novas ideias no seu dia a dia e aproxime-se dos seus próximos objetivos." />
    <section className="benefits"><div className="container">
      <div className="benefit-grid">
        <article className="benefit"><div className="benefit-icon"><BookOpen size={22} /></div><h3>Aprenda competências práticas</h3><p>Todos os cursos ajudam a pôr em prática aquilo que aprendeu.</p></article>
        <article className="benefit"><div className="benefit-icon"><UsersRound size={22} /></div><h3>Aprenda com especialistas</h3><p>Receba orientação de profissionais que usam estas competências no dia a dia.</p></article>
        <article className="benefit"><div className="benefit-icon"><GraduationCap size={23} /></div><h3>Obtenha um certificado</h3><p>Assinale o seu progresso com um certificado que reconhece o que alcançou.</p></article>
      </div>
      <div className="stats" aria-label="A Academia em números"><div className="stat"><strong>12 480+</strong><span>Alunos satisfeitos</span></div><div className="stat"><strong>86</strong><span>Docentes especialistas</span></div><div className="stat"><strong>240+</strong><span>Cursos online</span></div><div className="stat"><strong>4,8/5</strong><span>Avaliação dos alunos</span></div></div>
    </div></section>
    <section className="section testimonials"><div className="container"><div className="section-heading compact"><div className="eyebrow">Uma comunidade que aprende em conjunto</div><h2>Continuar a aprender abre novas possibilidades.</h2></div>
      <div className="testimonial-grid"><article className="quote-main"><div className="quote-mark">“</div><div className="stars" aria-label="5 de 5 estrelas">★★★★★</div><blockquote>Cheguei à Academia para mudar de carreira e encontrei muito mais do que um curso. A docente ajudou-me a acreditar nas minhas ideias e terminei com um projeto de que me orgulho.</blockquote><div className="person"><div className="avatar">JM</div><div><strong>Jordan Mitchell</strong><span>Finalista de Design UX</span></div></div></article>
      <article className="quote-side"><div className="stars" aria-label="5 de 5 estrelas">★★★★★</div><blockquote>“Finalmente, uma aprendizagem que cabe na vida real. Pude estudar depois do trabalho, esclarecer dúvidas e aplicar o que aprendi logo no dia seguinte.”</blockquote><div className="person"><div className="avatar">AS</div><div><strong>Amara Singh</strong><span>Aluna de Pequenos Negócios</span></div></div></article></div>
    </div></section>
  </>;
}
