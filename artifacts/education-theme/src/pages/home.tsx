import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <>
      <section className="hero" id="home">
        <div className="container"><div className="hero-content">
          <div className="eyebrow">Bem-vindo à Academia</div>
          <h1>Aprenda novas competências online com professores experientes</h1>
          <p className="hero-copy">Cursos práticos de tecnologia, design, negócios e música, orientados por profissionais. Aprenda ao seu ritmo e receba um certificado no final.</p>
          <div className="actions">
            <Link className="button button-teal" href="/cursos">COMECE AGORA <ArrowRight size={14} /></Link>
            <Link className="button button-white" href="/cursos">VER CURSOS <ArrowRight size={14} /></Link>
          </div>
        </div></div>
        <div className="hero-scroll" aria-hidden="true" />
      </section>
      <section className="home-note"><div className="container home-note-inner"><div><span className="eyebrow">Academia Procenter</span><h2>Formação para avançar com confiança.</h2></div><Link className="button button-outline" href="/sobre-nos">CONHEÇA A ACADEMIA <ArrowRight size={14} /></Link></div></section>
    </>
  );
}
