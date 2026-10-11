import { useState, type FormEvent } from 'react';
import {
  ArrowRight, BookOpen, BriefcaseBusiness, Camera, Check, Clock3, Code2, Compass,
  GraduationCap, HeartPulse, Menu, Palette, Phone, PenTool, Star, UsersRound, X,
} from 'lucide-react';

const navItems = [
  ['Início', '#home'], ['Cursos', '#courses'], ['Salas', '#categories'],
  ['Eventos', '#events'], ['Contactos', '#contact'], ['Sobre Nós', '#benefits'],
];

const courses = [
  { category: 'DESIGN', title: 'Curso Completo de Design UX', meta: '18 aulas · 6 semanas', price: '$49', rating: '4.9', art: 'art-design', icon: PenTool, description: 'Crie produtos digitais claros, desde o primeiro esboço até ao protótipo final.' },
  { category: 'NEGÓCIOS', title: 'Pequenos Negócios, Grandes Ideias', meta: '24 aulas · 8 semanas', price: '$69', rating: '4.8', art: 'art-business', icon: BriefcaseBusiness, description: 'Transforme uma boa ideia num negócio preparado para crescer ao seu ritmo.' },
  { category: 'TECNOLOGIA', title: 'Crie o Seu Primeiro Site', meta: '32 aulas · 10 semanas', price: '$59', rating: '4.9', art: 'art-tech', icon: Code2, description: 'Aprenda os fundamentos da web e dê espaço às suas ideias online.' },
  { category: 'MARKETING', title: 'Dê Destaque à Sua Marca', meta: '16 aulas · 5 semanas', price: '$45', rating: '4.7', art: 'art-marketing', icon: Compass, description: 'Encontre a voz da sua marca e chegue às pessoas que precisam do seu trabalho.' },
  { category: 'FOTOGRAFIA', title: 'Fotografia no Dia a Dia', meta: '20 aulas · 6 semanas', price: '$39', rating: '4.8', art: 'art-photo', icon: Camera, description: 'Descubra a luz de outra forma e crie fotografias mais expressivas.' },
  { category: 'BEM-ESTAR', title: 'Um Dia de Trabalho com Equilíbrio', meta: '12 aulas · 4 semanas', price: '$35', rating: '4.9', art: 'art-wellness', icon: HeartPulse, description: 'Crie hábitos de trabalho mais tranquilos e sustentáveis.' },
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

const plans = [
  { name: 'Iniciante', summary: 'Cada passo na aprendizagem conta.', price: '$0', period: 'para sempre', features: ['Acesso a cursos gratuitos', 'Aprenda ao seu ritmo', 'Acesso à comunidade'], action: 'COMEÇAR A APRENDER', featured: false },
  { name: 'Explorador', summary: 'Para a sua próxima grande ideia.', price: '$19', period: 'por mês', features: ['Acesso ilimitado aos cursos', 'Certificados de conclusão', 'Materiais para descarregar', 'Sessões de perguntas com docentes'], action: 'ESCOLHER EXPLORADOR', featured: true },
  { name: 'Acesso Total', summary: 'Aprender pode fazer parte da sua vida.', price: '$149', period: 'por ano', features: ['Tudo incluído no plano Explorador', 'Poupe 35% com o plano anual', 'Acompanhamento prioritário', 'Novos cursos todos os meses'], action: 'OBTER ACESSO TOTAL', featured: false },
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);

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
              <a className="top-detail" href="tel:+15550142730" style={{ color: 'inherit', textDecoration: 'none' }}><Phone size={19} /><span>Ligue-nos<br /><strong>+1 (555) 014-2730</strong></span></a>
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
              <a className="nav-cta" href="#pricing" onClick={closeMenu}>OBTER CERTIFICADO <ArrowRight size={13} /></a>
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
      <section className="section courses" id="courses">
        <div className="container">
          <div className="section-heading compact">
            <div className="eyebrow">Aprenda algo novo</div>
            <h2>Cursos online em destaque</h2>
            <p>Novas competências, bons professores e espaço para crescer ao seu ritmo.</p>
          </div>
          <div className="course-grid">
            {courses.map((course, index) => {
              const CourseIcon = course.icon;
              return <article className="course-card" key={course.title} data-testid={`card-course-${index}`}>
                <div className={`course-art ${course.art}`}><CourseIcon className="course-art-icon" size={53} strokeWidth={1.15} /><span className="course-label">{course.category}</span></div>
                <div className="course-body">
                  <div className="course-meta"><span>{course.meta}</span><span className="course-rating"><Star size={11} fill="currentColor" /> {course.rating}</span></div>
                  <h3>{course.title}</h3><p>{course.description}</p>
                  <div className="course-bottom"><span>Com docentes da Academia</span><strong>{course.price} <small>/ curso</small></strong></div>
                </div>
              </article>;
            })}
          </div>
          <div className="center-link"><a className="button button-teal" href="#categories">VER TODAS AS SALAS <ArrowRight size={14} /></a></div>
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
      <section className="section pricing" id="pricing">
        <div className="container">
          <div className="section-heading compact">
            <div className="eyebrow">Aprenda ao seu ritmo</div>
            <h2>Um plano para cada etapa.</h2>
            <p>Comece gratuitamente e escolha a forma de aprender que melhor se adapta a si.</p>
          </div>
          <div className="pricing-grid">
            {plans.map((plan) => <article key={plan.name} className={`price-card ${plan.featured ? 'featured' : ''}`}>
              {plan.featured && <span className="popular-pill">Mais popular</span>}
              <h3>{plan.name}</h3><p>{plan.summary}</p>
              <div className="price">{plan.price}<small> / {plan.period}</small></div>
              <ul>{plan.features.map((feature) => <li key={feature}><Check size={14} />{feature}</li>)}</ul>
              <a className={`button ${plan.featured ? 'button-teal' : 'button-outline'}`} href="#courses">{plan.action} <ArrowRight size={13} /></a>
            </article>)}
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
            <div><h4>Explorar</h4><div className="footer-links"><a href="#benefits">Sobre nós</a><a href="#courses">Cursos</a><a href="#categories">Salas de aprendizagem</a><a href="#pricing">Planos e preços</a></div></div>
            <div><h4>Academia</h4><div className="footer-links"><a href="#team">Os nossos alunos</a><a href="#events">Eventos</a><a href="#newsletter">Boletim informativo</a><a href="#home">Voltar ao início</a></div></div>
            <div><h4>Contactos</h4><div className="footer-links"><a href="mailto:hello@academia.example">hello@academia.example</a><a href="tel:+15550142730">+1 (555) 014-2730</a><a href="#contact">Segunda a sexta, 08h–20h</a></div></div>
          </div>
          <div className="footer-bottom"><span>© 2025 Academia. A aprendizagem é para todos.</span><span>Aprenda bem. <a href="#home">Mantenha a curiosidade.</a></span></div>
        </div>
      </footer>
    </main>
  );
}

export default App;
