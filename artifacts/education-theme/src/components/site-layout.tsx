import { useEffect, useState, type ReactNode } from 'react';
import { Show } from '@clerk/react';
import { Link, useLocation } from 'wouter';
import { ArrowRight, Clock3, Menu, Phone, X } from 'lucide-react';

const links = [
  ['Início', '/'],
  ['Cursos', '/cursos'],
  ['Salas', '/salas'],
  ['Eventos', '/eventos'],
  ['Contactos', '/contactos'],
  ['Sobre Nós', '/sobre-nos'],
] as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="site-shell">
      <div className="topline">
        <div className="container topline-inner">
          <Link className="topbrand" href="/" onClick={closeMenu} aria-label="Página inicial da Academia">
            ACADEMIA<small>FORMAÇÃO ONLINE &amp; APRENDIZAGEM</small>
          </Link>
          <div className="top-details">
            <div className="top-detail"><Clock3 size={20} /><span>Segunda a sexta<br /><strong>08h00–20h00</strong></span></div>
            <a className="top-detail" href="tel:+244921001668" style={{ color: 'inherit', textDecoration: 'none' }}><Phone size={19} /><span>Ligue-nos<br /><strong>+244 921 001 668</strong></span></a>
            <div className="socials" aria-label="Redes sociais"><a href="#contact" aria-label="Facebook">f</a><a href="#contact" aria-label="X">x</a><a href="#contact" aria-label="Instagram">ig</a><a href="#contact" aria-label="LinkedIn">in</a></div>
          </div>
        </div>
      </div>
      <header className="nav-wrap">
        <div className="container nav">
          <Link className="brand" href="/" onClick={closeMenu} aria-label="Página inicial da Academia">
            <span className="brand-mark"><img src="/favicon.svg" alt="" /></span><span>ACADEMIA</span>
          </Link>
          <button className="menu-toggle" type="button" aria-label={menuOpen ? 'Fechar navegação' : 'Abrir navegação'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)} data-testid="button-mobile-menu">
            {menuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
          <nav className={`nav-links ${menuOpen ? 'open' : ''}`} aria-label="Navegação principal">
            {links.map(([label, href]) => (
              <Link key={href} href={href} onClick={closeMenu} aria-current={location === href ? 'page' : undefined} className={location === href ? 'active' : ''}>{label}</Link>
            ))}
            <Show when="signed-out">
              <Link href="/sign-in" onClick={closeMenu} className="nav-auth-link">Entrar</Link>
              <Link href="/sign-up" onClick={closeMenu} className="nav-auth-link">Criar conta</Link>
            </Show>
            <Show when="signed-in">
              <Link href="/conta" onClick={closeMenu} className="nav-auth-link">Minha conta</Link>
            </Show>
            <Link className="nav-cta" href="/cursos" onClick={closeMenu}>VER FORMAÇÕES <ArrowRight size={13} /></Link>
          </nav>
        </div>
      </header>
      {children}
      <footer className="footer" id="contact">
        <div className="container">
          <div className="footer-grid">
            <div><Link className="brand" href="/"><span className="brand-mark"><img src="/favicon.svg" alt="" /></span><span>ACADEMIA</span></Link><p className="footer-brand-copy">Aprendizagem prática para pessoas curiosas. Comece onde está e descubra até onde pode chegar.</p></div>
            <div><h4>Explorar</h4><div className="footer-links"><Link href="/sobre-nos">Sobre nós</Link><Link href="/cursos">Cursos e valores</Link><Link href="/salas">Salas de aprendizagem</Link></div></div>
            <div><h4>Academia</h4><div className="footer-links"><Link href="/sobre-nos">Os nossos alunos</Link><Link href="/eventos">Eventos</Link><Link href="/contactos">Boletim informativo</Link><Link href="/">Voltar ao início</Link></div></div>
            <div><h4>Contactos</h4><div className="footer-links"><a href="mailto:academia@procenter.co.ao">academia@procenter.co.ao</a><a href="tel:+244921001668">+244 921 001 668</a><span>Av. 21 de Janeiro, Cassequel<br />Edifício Procenter, em frente ao Banco BIC</span></div></div>
          </div>
          <div className="footer-bottom"><span>© 2025 Academia. A aprendizagem é para todos.</span><span>Aprenda bem. <Link href="/">Mantenha a curiosidade.</Link></span></div>
        </div>
      </footer>
    </main>
  );
}

export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return <section className="page-intro"><div className="container"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div></section>;
}
