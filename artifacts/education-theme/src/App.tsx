import { useState, type FormEvent } from 'react';
import { ArrowRight, BookOpen, Menu, X, UsersRound, Lightbulb } from 'lucide-react';

const navItems = [
  ['HOME', '#home'], ['ABOUT', '#about'], ['COURSES', '#courses'],
  ['EVENTS', '#events'], ['COMMUNITY', '#community'],
];

const courses = [
  { category: 'DESIGN & TECHNOLOGY', title: 'Digital Product Design', detail: 'Build useful, beautiful digital experiences from first sketch to final prototype.', lessons: '12 weeks', students: '248 learners', price: '$89', art: 'art-one', symbol: 'D' },
  { category: 'BUSINESS & LEADERSHIP', title: 'The Creative Entrepreneur', detail: 'Turn a sharp idea into a thoughtful, sustainable business with real-world tools.', lessons: '8 weeks', students: '186 learners', price: '$74', art: 'art-two', symbol: '↗' },
  { category: 'SCIENCE & DISCOVERY', title: 'Climate, Cities & Tomorrow', detail: 'Explore practical ways to shape more resilient and equitable places to live.', lessons: '10 weeks', students: '312 learners', price: '$96', art: 'art-three', symbol: '◎' },
];

const events = [
  { day: '18', month: 'JUN', time: '10:00 AM — ONLINE', title: 'The future of learning, together', location: 'Live conversation · 45 min' },
  { day: '22', month: 'JUN', time: '2:30 PM — NEW YORK', title: 'Make room for your next idea', location: 'Studio workshop · 12 seats' },
  { day: '27', month: 'JUN', time: '4:00 PM — ONLINE', title: 'Portfolio review: open session', location: 'Community event · Free' },
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);

  function joinCommunity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email.trim()) setJoined(true);
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <main className="site-shell">
      <div className="topline">
        <div className="container topline-inner">
          <div className="toplinks"><a href="#community">A place to begin again</a><a href="#events">Student stories</a></div>
          <div className="toplinks"><a href="mailto:hello@education.example">hello@education.example</a><a href="#community">Join our community</a></div>
        </div>
      </div>
      <header className="nav-wrap">
        <div className="container nav">
          <a className="brand" href="#home" onClick={closeMenu} aria-label="Education home">
            <span className="brand-mark">e</span><span>education</span>
          </a>
          <button className="menu-toggle" type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)} data-testid="button-mobile-menu">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <nav className={`nav-links ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
            {navItems.map(([label, href]) => <a key={href} href={href} onClick={closeMenu}>{label}</a>)}
            <a className="nav-cta" href="#community" onClick={closeMenu}>GET STARTED <ArrowRight size={13} /></a>
          </nav>
        </div>
      </header>

      <section className="hero" id="home">
        <div className="container">
          <div className="hero-content">
            <div className="eyebrow">A brighter way to learn</div>
            <h1>Better education.<br />A <em>better</em> world.</h1>
            <p className="hero-copy">Curiosity can take you anywhere. Find the people, ideas, and practical skills to help you make your next move with confidence.</p>
            <div className="actions">
              <a className="button button-orange" href="#courses">EXPLORE COURSES <ArrowRight size={15} /></a>
              <a className="text-link" href="#about"><span>▶</span> See what makes us different</a>
            </div>
          </div>
        </div>
        <div className="hero-note"><b>01</b> Learn your way</div>
        <div className="hero-scroll" />
      </section>

      <section className="intro-strip" aria-label="Our impact">
        <div className="container strip-inner">
          <div className="strip-item"><span className="strip-number">01</span><div><strong>Learn with purpose</strong><span>Knowledge that moves you forward</span></div></div>
          <div className="strip-item"><span className="strip-number">02</span><div><strong>Make real connections</strong><span>Good people make great learning</span></div></div>
          <div className="strip-item"><span className="strip-number">03</span><div><strong>Keep growing</strong><span>Your next chapter starts here</span></div></div>
        </div>
      </section>

      <section className="section features" id="why">
        <div className="container">
          <div className="section-heading">
            <div className="eyebrow">Learning, made human</div>
            <h2>More than a class.<br />A whole new perspective.</h2>
            <p>Big ideas belong to everyone. We bring excellent teaching and a generous learning community within reach.</p>
          </div>
          <div className="feature-grid">
            <article className="feature-card"><div className="feature-icon"><BookOpen size={25} /></div><h3>Learn by doing</h3><p>Get hands-on with meaningful projects, useful feedback, and skills you can put to work straight away.</p><a href="#courses" aria-label="Explore practical courses" /></article>
            <article className="feature-card"><div className="feature-icon"><UsersRound size={25} /></div><h3>Find your people</h3><p>Meet a community of curious minds who share ideas, celebrate progress, and help each other through.</p><a href="#community" aria-label="Meet the learning community" /></article>
            <article className="feature-card"><div className="feature-icon"><Lightbulb size={25} /></div><h3>Keep your own pace</h3><p>Flexible learning paths meet you where you are, so you can fit new possibilities into real life.</p><a href="#courses" aria-label="Browse flexible learning paths" /></article>
          </div>
        </div>
      </section>

      <section className="section about" id="about">
        <div className="container about-grid">
          <div className="about-visual" aria-label="Learning can take you somewhere new">
            <div className="about-orbit" /><div className="about-big">EDU.</div>
            <div className="about-mini one">Room to grow</div><div className="about-mini two">Ideas in motion</div>
          </div>
          <div className="about-content">
            <div className="eyebrow">Education for real life</div>
            <h2>Make space for what you could become.</h2>
            <p>We believe learning should feel like an open door, not another hurdle. Our educators bring deep experience, fresh thinking, and a genuine love of helping people find their way.</p>
            <p>Start with one question. Leave with new skills, new perspective, and a community in your corner.</p>
            <div className="about-list">
              <span><i>↗</i> Experts who care</span><span><i>↗</i> Practical, modern courses</span>
              <span><i>↗</i> Learning that fits your life</span><span><i>↗</i> A community that stays</span>
            </div>
            <a className="button button-orange" href="#community">OUR STORY <ArrowRight size={15} /></a>
          </div>
        </div>
      </section>

      <section className="section courses" id="courses">
        <div className="container">
          <div className="section-heading">
            <div className="eyebrow">Find your next thing</div>
            <h2>Courses for the curious.</h2>
            <p>Useful skills, generous teachers, and ideas that stay with you long after class ends.</p>
          </div>
          <div className="course-grid">
            {courses.map((course, index) => <article className="course-card" key={course.title} data-testid={`card-course-${index}`}>
              <div className={`course-art ${course.art}`}><span className="art-symbol">{course.symbol}</span><span className="course-tag">{course.category}</span></div>
              <div className="course-body">
                <div className="course-meta"><span>COURSE {String(index + 1).padStart(2, '0')}</span><span>★ 4.{8 - index}/5</span></div>
                <h3>{course.title}</h3><p>{course.detail}</p>
                <div className="course-bottom"><span>{course.lessons} · {course.students}</span><strong>{course.price}</strong></div>
              </div>
            </article>)}
          </div>
          <div className="center-link"><a className="button button-orange" href="#community">VIEW ALL COURSES <ArrowRight size={15} /></a></div>
        </div>
      </section>

      <section className="section events" id="events">
        <div className="container">
          <div className="section-heading">
            <div className="eyebrow">Come learn together</div>
            <h2>Good things happen<br />when we get together.</h2>
            <p>Join a workshop, listen in, or bring a question. There is always a seat for you.</p>
          </div>
          <div className="event-row">
            {events.map((event, index) => <article className="event-card" key={event.title} data-testid={`card-event-${index}`}>
              <div className="event-date"><b>{event.day}</b><span>{event.month}</span></div>
              <div className="event-info"><small>{event.time}</small><h3>{event.title}</h3><p>{event.location}</p></div>
            </article>)}
          </div>
        </div>
      </section>

      <section className="community" id="community">
        <div className="container community-inner">
          <div>
            <div className="eyebrow">Your next chapter starts here</div>
            <h2>Bring your curiosity.<br />We’ll bring the community.</h2>
            <p>Get a thoughtful note when new courses and events open.</p>
          </div>
          <form onSubmit={joinCommunity}>
            {joined ? <div className="button button-light" role="status">Thanks for your interest. This preview doesn’t save email addresses yet.</div> : <><label htmlFor="community-email" className="sr-only">Your email address</label><input id="community-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email address" required data-testid="input-community-email" /><button className="button button-light" type="submit" data-testid="button-join-community">COUNT ME IN <ArrowRight size={15} /></button></>}
          </form>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div><a className="brand" href="#home"><span className="brand-mark">e</span><span>education</span></a><p>Curiosity can take you anywhere. Let's find out where it takes you next.</p></div>
            <div><h4>Explore</h4><div className="footer-links"><a href="#about">Our approach</a><a href="#courses">Courses</a><a href="#events">Events</a><a href="#community">Community</a></div></div>
            <div><h4>Keep in touch</h4><div className="footer-links"><a href="mailto:hello@education.example">hello@education.example</a><a href="#community">Student stories</a><a href="#community">For educators</a></div></div>
            <div><h4>A little more learning</h4><div className="footer-links"><a href="#courses">Browse all courses</a><a href="#events">Upcoming events</a><a href="#home">Back to the top ↑</a></div></div>
          </div>
          <div className="footer-bottom"><span>© 2024 Education. Made for what comes next.</span><span>Learn well. <a href="#home">Live curious.</a></span></div>
        </div>
      </footer>
    </main>
  );
}

export default App;
