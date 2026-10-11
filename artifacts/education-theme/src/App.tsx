import { useState, type FormEvent } from 'react';
import {
  ArrowRight, BadgeCheck, BookOpen, BriefcaseBusiness, Camera, Clock3, Code2, Compass,
  GraduationCap, HeartPulse, Menu, Palette, Phone, UsersRound, X,
} from 'lucide-react';

const navItems = [
  ['Início', '#home'], ['Cursos', '#courses'], ['Salas', '#categories'],
  ['Eventos', '#events'], ['Contactos', '#contact'], ['Sobre Nós', '#benefits'],
];

const courses = [
  {
    title: 'Estágio Formativo em CRM',
    image: '/images/courses/crm.jpg',
    description: 'Desenvolva competências práticas para gerir o relacionamento com clientes e apoiar as rotinas comerciais.',
    price: '100.000 Kz',
    duration: 'Estágio de 3 meses',
  },
  {
    title: 'Estágio Formativo em Tesouraria',
    image: '/images/courses/tesouraria.jpg',
    description: 'Aprenda a acompanhar operações de tesouraria, organizar registos e apoiar o controlo financeiro.',
    price: '100.000 Kz',
    duration: 'Estágio de 3 meses',
  },
  {
    title: 'Liderança e Gestão de Equipas',
    image: '/images/courses/lideranca-equipas.jpg',
    description: 'Prepare-se para coordenar equipas, comunicar objetivos e apoiar a execução do trabalho.',
    price: '100.000 Kz',
    duration: 'Estágio de 3 meses',
  },
  {
    title: 'Estágio Formativo em Gestão Comercial',
    image: '/images/courses/gestao-comercial.jpg',
    description: 'Desenvolva competências práticas em gestão de vendas, acompanhamento comercial e relação com clientes.',
    price: '100.000 Kz',
    duration: 'Estágio de 3 meses',
  },
  {
    title: 'Gestão e Administração de Empresas',
    image: '/images/courses/gestao-empresas.jpg',
    description: 'Conheça práticas de planeamento, organização e gestão das atividades de uma empresa.',
    price: '100.000 Kz',
    duration: 'Estágio de 3 meses',
  },
  {
    title: 'Gestão de Recursos Humanos',
    image: '/images/courses/recursos-humanos.jpg',
    description: 'Explore os fundamentos da gestão de pessoas e do apoio às rotinas de recursos humanos.',
    price: '100.000 Kz',
    duration: 'Estágio de 3 meses',
  },
];

const categories = [
  { name: 'Design e Criatividade', count: '24 cursos', icon: Palette },
  { name: 'Negócios e Liderança', count: '18 cursos', icon: BriefcaseBusiness },
  { name: 'Tecnologia e Programação', count: '16 cursos', icon: Code2 },
  { name: 'Fotografia', count: '12 cursos', icon: Camera },
  { name: 'Desenvolvimento Pessoal', count: '21 cursos', icon: Compass },
  { name: 'Saúde e Bem-Estar', count: '14 cursos', icon: HeartPulse },
  { name: 'Ensino e Aprendizagem', count: '9 cursos', icon: GraduationCap },
  { name: 'Escrita e Comunicação', count: '11 cursos', icon: BookOpen },
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);
  const visibleCourses = showAllCourses ? courses : courses.slice(0, 3);

  function closeMenu() {
    setMenuOpen(false);
  }

  function joinNewsletter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email.trim()) setJoined(true);
  }

  return (
    <main className="site-shell">
      <section className="hero" id="home">
        <div className="topline">
          <div className="container topline-inner">
            <a className="topbrand" href="#home" aria-label="Página inicial da Academia">ACADEMIA<small>FORMAÇÃO ONLINE &amp; APRENDIZAGEM</small></a>
            <div className="top-details">
              <div className="top-detail"><Clock3 size={20} /><span>Segunda a sexta<br /><strong>08h00–20h00</strong></span></div>
              <a className="top-detail" href="tel:+244921001668" style={{ color: 'inherit', textDecoration: 'none' }}><Phone size={19} /><span>Ligue-nos<br /><strong>+244 921 001 668</strong></span></a>
              <div className="socials" aria-label="Redes sociais"><a href="#contact" aria-label="Facebook">f</a><a href="#contact" aria-label="X">x</a><a href="#contact" aria-label="Instagram">ig</a><a href="#contact" aria-label="LinkedIn">in</a></div>
            </div>
          </div>
        </div>
        <header className="nav-wrap">
          <div className="container nav">
            <a className="brand" href="#home" onClick={closeMenu} aria-label="Página inicial da Academia"><span className="brand-mark"><img src="/favicon.svg" alt="" /></span><span>ACADEMIA</span></a>
            <button className="menu-toggle" type="button" aria-label={menuOpen ? 'Fechar navegação' : 'Abrir navegação'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)} data-testid="button-mobile-menu">
              {menuOpen ? <X size={23} /> : <Menu size={23} />}
            </button>
            <nav className={`nav-links ${menuOpen ? 'open' : ''}`} aria-label="Navegação principal">
              {navItems.map(([label, href]) => <a key={href} href={href} onClick={closeMenu}>{label}</a>)}
              <a className="nav-cta" href="#courses" onClick={closeMenu}>VER FORMAÇÕES <ArrowRight size={13} /></a>
            </nav>
          </div>
        </header>
        <div className="container">
          <div className="hero-content">
            <div className="eyebrow">Bem-vindo à Academia</div>
            <h1>Aprenda novas competências online com professores experientes</h1>
            <p className="hero-copy">Cursos práticos de tecnologia, design, negócios e música, orientados por profissionais. Aprenda ao seu ritmo e receba um certificado no final.</p>
            <div className="actions">
              <a className="button button-teal" href="#courses">COMECE AGORA <ArrowRight size={14} /></a>
              <a className="button button-white" href="#courses">VER CURSOS <ArrowRight size={14} /></a>
            </div>
          </div>
        </div>
        <div className="hero-scroll" aria-hidden="true" />
      </section>
      <section className="section courses" id="courses">
        <div className="container">
          <div className="section-heading compact">
            <div className="eyebrow">Formações profissionais</div>
            <h2>Encontre a sua próxima formação</h2>
            <p>Inscrição gratuita, estágio de três meses e certificado de conclusão reconhecido pelo INEFOP.</p>
          </div>
          <div className="course-grid" id="course-grid">
            {visibleCourses.map((course, index) => (
              <article className="course-card" key={course.title} data-testid={`card-course-${index}`}>
                <div className="course-art">
                  <img src={course.image} alt={`Cartaz do curso ${course.title}`} loading="eager" />
                </div>
                <div className="course-body">
                  <div className="course-meta">
                    <span className="course-duration"><Clock3 size={14} />{course.duration}</span>
                    <span className="course-enrollment">Sem taxa de inscrição</span>
                  </div>
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <ul className="course-highlights">
                    <li><BadgeCheck size={15} /><span>Certificado reconhecido pelo INEFOP</span></li>
                    <li><BookOpen size={15} /><span>Manual de apoio incluído</span></li>
                  </ul>
                  <div className="course-bottom"><span>Investimento total</span><strong>{course.price}</strong></div>
                  <a
                    className="course-cta"
                    href={`mailto:academia@procenter.co.ao?subject=${encodeURIComponent(`Inscrição: ${course.title}`)}`}
                  >
                    Quero inscrever-me <ArrowRight size={14} />
                  </a>
                </div>
              </article>
            ))}
          </div>
          <div className="course-more">
            <button
              className="button button-outline"
              type="button"
              aria-expanded={showAllCourses}
              aria-controls="course-grid"
              onClick={() => setShowAllCourses((current) => !current)}
            >
              {showAllCourses ? 'VER MENOS' : 'VER MAIS CURSOS'}
              <ArrowRight className={showAllCourses ? 'course-more-icon expanded' : 'course-more-icon'} size={14} />
            </button>
          </div>
        </div>
      </section>
      <section className="benefits" id="benefits">
        <div className="container">
          <div className="section-heading">
            <div className="eyebrow">Sobre a Academia</div>
            <h2>Competências úteis para o dia a dia.</h2>
            <p>Aprenda algo útil com quem conhece o tema. Integre novas ideias no seu dia a dia e aproxime-se dos seus próximos objetivos.</p>
          </div>
          <div className="benefit-grid">
            <article className="benefit"><div className="benefit-icon"><BookOpen size={22} /></div><h3>Aprenda competências práticas</h3><p>Todos os cursos ajudam a pôr em prática aquilo que aprendeu.</p></article>
            <article className="benefit"><div className="benefit-icon"><UsersRound size={22} /></div><h3>Aprenda com especialistas</h3><p>Receba orientação de profissionais que usam estas competências no dia a dia.</p></article>
            <article className="benefit"><div className="benefit-icon"><GraduationCap size={23} /></div><h3>Obtenha um certificado</h3><p>Assinale o seu progresso com um certificado que reconhece o que alcançou.</p></article>
          </div>
          <div className="stats" aria-label="A Academia em números">
            <div className="stat"><strong>12 480+</strong><span>Alunos satisfeitos</span></div>
            <div className="stat"><strong>86</strong><span>Docentes especialistas</span></div>
            <div className="stat"><strong>240+</strong><span>Cursos online</span></div>
            <div className="stat"><strong>4,8/5</strong><span>Avaliação dos alunos</span></div>
          </div>
        </div>
      </section>
      <section className="section categories" id="categories">
        <div className="container">
          <div className="section-heading compact">
            <div className="eyebrow">Salas de aprendizagem</div>
            <h2>Explore as nossas salas</h2>
            <p>Explore um tema novo, desenvolva o que já sabe ou comece um caminho diferente.</p>
          </div>
          <div className="category-grid">
            {categories.map((category) => {
              const CategoryIcon = category.icon;
              return <a className="category" key={category.name} href="#courses"><span className="category-icon"><CategoryIcon size={17} /></span><span><strong>{category.name}</strong><small>{category.count}</small></span></a>;
            })}
          </div>
        </div>
      </section>
      <section className="section testimonials" id="team">
        <div className="container">
          <div className="section-heading compact">
            <div className="eyebrow">Uma comunidade que aprende em conjunto</div>
            <h2>Continuar a aprender abre novas possibilidades.</h2>
          </div>
          <div className="testimonial-grid">
            <article className="quote-main">
              <div className="quote-mark">“</div>
              <div className="stars" aria-label="5 de 5 estrelas">★★★★★</div>
              <blockquote>Cheguei à Academia para mudar de carreira e encontrei muito mais do que um curso. A docente ajudou-me a acreditar nas minhas ideias e terminei com um projeto de que me orgulho.</blockquote>
              <div className="person"><div className="avatar">JM</div><div><strong>Jordan Mitchell</strong><span>Finalista de Design UX</span></div></div>
            </article>
            <article className="quote-side">
              <div className="stars" aria-label="5 de 5 estrelas">★★★★★</div>
              <blockquote>“Finalmente, uma aprendizagem que cabe na vida real. Pude estudar depois do trabalho, esclarecer dúvidas e aplicar o que aprendi logo no dia seguinte.”</blockquote>
              <div className="person"><div className="avatar">AS</div><div><strong>Amara Singh</strong><span>Aluna de Pequenos Negócios</span></div></div>
            </article>
          </div>
        </div>
      </section>
      <section className="section journal" id="events">
        <div className="container">
          <div className="section-heading compact">
            <div className="eyebrow">Aprender em conjunto</div>
            <h2>Eventos da Academia</h2>
            <p>Oficinas, aulas abertas e encontros com especialistas. As datas serão anunciadas em breve.</p>
          </div>
          <div className="journal-grid">
            <article className="journal-card"><div className="journal-art journal-one"><span>Oficina</span></div><div className="journal-body"><div className="journal-meta">ONLINE · DATA A ANUNCIAR</div><h3>Design UX: da ideia ao protótipo</h3><p>Uma sessão prática para transformar uma ideia numa experiência digital clara.</p><a className="read-more" href="#contact">SABER MAIS <ArrowRight size={12} /></a></div></article>
            <article className="journal-card"><div className="journal-art journal-two"><span>Aula aberta</span></div><div className="journal-body"><div className="journal-meta">ONLINE · DATA A ANUNCIAR</div><h3>Os primeiros passos na programação</h3><p>Descubra os fundamentos da web numa aula acessível a quem está a começar.</p><a className="read-more" href="#contact">SABER MAIS <ArrowRight size={12} /></a></div></article>
            <article className="journal-card"><div className="journal-art journal-three"><span>Conversa</span></div><div className="journal-body"><div className="journal-meta">ONLINE · DATA A ANUNCIAR</div><h3>Conversa com docentes da Academia</h3><p>Conheça os nossos especialistas e coloque as suas questões sobre os cursos.</p><a className="read-more" href="#contact">SABER MAIS <ArrowRight size={12} /></a></div></article>
          </div>
        </div>
      </section>
      <section className="newsletter" id="newsletter">
        <div className="container newsletter-inner">
          <div><div className="eyebrow">Inspiração, de vez em quando</div><h2>Abra espaço para o próximo passo.</h2><p>Receba cursos novos, ideias úteis e histórias dos nossos alunos.</p></div>
          <div>
            {joined ? <p className="form-status" role="status">Obrigado pelo interesse. Esta pré-visualização não guarda endereços de e-mail.</p> : <form className="newsletter-form" onSubmit={joinNewsletter}>
              <label className="sr-only" htmlFor="newsletter-email">O seu endereço de e-mail</label>
              <input id="newsletter-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="O seu endereço de e-mail" required data-testid="input-newsletter-email" />
              <button className="button button-teal" type="submit" data-testid="button-newsletter-submit">INSCREVER-ME <ArrowRight size={14} /></button>
            </form>}
            {!joined && <p className="form-note">Pré-visualização — os endereços de e-mail não são guardados.</p>}
          </div>
        </div>
      </section>
      <footer className="footer" id="contact">
        <div className="container">
          <div className="footer-grid">
            <div><a className="brand" href="#home"><span className="brand-mark"><img src="/favicon.svg" alt="" /></span><span>ACADEMIA</span></a><p className="footer-brand-copy">Aprendizagem prática para pessoas curiosas. Comece onde está e descubra até onde pode chegar.</p></div>
            <div><h4>Explorar</h4><div className="footer-links"><a href="#benefits">Sobre nós</a><a href="#courses">Cursos e valores</a><a href="#categories">Salas de aprendizagem</a></div></div>
            <div><h4>Academia</h4><div className="footer-links"><a href="#team">Os nossos alunos</a><a href="#events">Eventos</a><a href="#newsletter">Boletim informativo</a><a href="#home">Voltar ao início</a></div></div>
            <div><h4>Contactos</h4><div className="footer-links"><a href="mailto:academia@procenter.co.ao">academia@procenter.co.ao</a><a href="tel:+244921001668">+244 921 001 668</a><span>Av. 21 de Janeiro, Cassequel<br />Edifício Procenter, em frente ao Banco BIC</span></div></div>
          </div>
          <div className="footer-bottom"><span>© 2025 Academia. A aprendizagem é para todos.</span><span>Aprenda bem. <a href="#home">Mantenha a curiosidade.</a></span></div>
        </div>
      </footer>
    </main>
  );
}

export default App;
