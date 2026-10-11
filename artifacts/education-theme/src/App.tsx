import { useState, type FormEvent } from 'react';
import {
  ArrowRight, BookOpen, BriefcaseBusiness, Camera, Check, Clock3, Code2, Compass,
  GraduationCap, HeartPulse, Menu, Palette, Phone, PenTool, Star, UsersRound, X,
} from 'lucide-react';

const navItems = [
  ['Home', '#home'], ['All Courses', '#courses'], ['About', '#benefits'],
  ['Team', '#team'], ['Pricing', '#pricing'], ['Journal', '#journal'], ['Contact', '#contact'],
];

const courses = [
  { category: 'DESIGN', title: 'The Complete UX Design Course', meta: '18 lessons · 6 weeks', price: '$49', rating: '4.9', art: 'art-design', icon: PenTool, description: 'Create thoughtful digital products, from first sketch to polished prototype.' },
  { category: 'BUSINESS', title: 'Small Business, Big Ideas', meta: '24 lessons · 8 weeks', price: '$69', rating: '4.8', art: 'art-business', icon: BriefcaseBusiness, description: 'Turn your good idea into a business built to grow on your terms.' },
  { category: 'TECHNOLOGY', title: 'Code Your First Website', meta: '32 lessons · 10 weeks', price: '$59', rating: '4.9', art: 'art-tech', icon: Code2, description: 'Learn the web essentials and make a place for your ideas online.' },
  { category: 'MARKETING', title: 'Make Your Brand Matter', meta: '16 lessons · 5 weeks', price: '$45', rating: '4.7', art: 'art-marketing', icon: Compass, description: 'Find your voice and connect with the people who need your work.' },
  { category: 'PHOTOGRAPHY', title: 'Photography in Everyday Life', meta: '20 lessons · 6 weeks', price: '$39', rating: '4.8', art: 'art-photo', icon: Camera, description: 'See light differently and make more meaningful photographs.' },
  { category: 'WELLBEING', title: 'A Mindful Workday', meta: '12 lessons · 4 weeks', price: '$35', rating: '4.9', art: 'art-wellness', icon: HeartPulse, description: 'Build calmer, more sustainable habits for the working week.' },
];

const categories = [
  { name: 'Design & Creativity', count: '24 courses', icon: Palette },
  { name: 'Business & Leadership', count: '18 courses', icon: BriefcaseBusiness },
  { name: 'Technology & Coding', count: '16 courses', icon: Code2 },
  { name: 'Photography', count: '12 courses', icon: Camera },
  { name: 'Personal Development', count: '21 courses', icon: Compass },
  { name: 'Health & Wellbeing', count: '14 courses', icon: HeartPulse },
  { name: 'Teaching & Learning', count: '9 courses', icon: GraduationCap },
  { name: 'Writing & Communication', count: '11 courses', icon: BookOpen },
];

const plans = [
  { name: 'Starter', summary: 'A little learning goes a long way.', price: '$0', period: 'forever', features: ['Access to free courses', 'Learn at your own pace', 'Community discussion access'], action: 'START LEARNING', featured: false },
  { name: 'Explorer', summary: 'For your next big idea.', price: '$19', period: 'per month', features: ['Unlimited course access', 'Certificates of completion', 'Downloadable resources', 'Teacher Q&A sessions'], action: 'CHOOSE EXPLORER', featured: true },
  { name: 'All Access', summary: 'Make learning part of your life.', price: '$149', period: 'per year', features: ['Everything in Explorer', 'Save 35% with annual access', 'Priority teacher feedback', 'New classes added monthly'], action: 'GET ALL ACCESS', featured: false },
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
            <a className="topbrand" href="#home" aria-label="Academia home">ACADEMIA<small>ONLINE EDUCATION &amp; LEARNING</small></a>
            <div className="top-details">
              <div className="top-detail"><Clock3 size={20} /><span>Monday - Friday<br /><strong>8:00AM-8:00PM</strong></span></div>
              <a className="top-detail" href="tel:+15550142730" style={{ color: 'inherit', textDecoration: 'none' }}><Phone size={19} /><span>Call Us<br /><strong>+1 (555) 014-2730</strong></span></a>
              <div className="socials" aria-label="Social links"><a href="#contact" aria-label="Facebook">f</a><a href="#contact" aria-label="X">x</a><a href="#contact" aria-label="Instagram">ig</a><a href="#contact" aria-label="LinkedIn">in</a></div>
            </div>
          </div>
        </div>
        <header className="nav-wrap">
          <div className="container nav">
            <a className="brand" href="#home" onClick={closeMenu} aria-label="Academia home"><span className="brand-mark"><img src="/favicon.svg" alt="" /></span><span>ACADEMIA</span></a>
            <button className="menu-toggle" type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)} data-testid="button-mobile-menu">
              {menuOpen ? <X size={23} /> : <Menu size={23} />}
            </button>
            <nav className={`nav-links ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
              {navItems.map(([label, href]) => <a key={href} href={href} onClick={closeMenu}>{label}</a>)}
              <a className="nav-cta" href="#pricing" onClick={closeMenu}>GET CERTIFICATE <ArrowRight size={13} /></a>
            </nav>
          </div>
        </header>
        <div className="container">
          <div className="hero-content">
            <div className="eyebrow">Welcome to Academia</div>
            <h1>Learn New Skills Online with Expert Teachers</h1>
            <p className="hero-copy">Practical courses in software, design, business and music, taught by people who do the work every day, with a certificate when you finish.</p>
            <div className="actions">
              <a className="button button-teal" href="#courses">GET STARTED NOW! <ArrowRight size={14} /></a>
              <a className="button button-white" href="#courses">VIEW COURSE <ArrowRight size={14} /></a>
            </div>
          </div>
        </div>
        <div className="hero-scroll" aria-hidden="true" />
      </section>
      <section className="benefits" id="benefits">
        <div className="container">
          <div className="section-heading">
            <div className="eyebrow">A better way to learn</div>
            <h2>Real skills for the life you’re living.</h2>
            <p>Learn something useful, from people who know it well. Fit new ideas around your life and bring your next plans within reach.</p>
          </div>
          <div className="benefit-grid">
            <article className="benefit"><div className="benefit-icon"><BookOpen size={22} /></div><h3>Learn practical skills</h3><p>Every course is designed around the things you can do with what you learn.</p></article>
            <article className="benefit"><div className="benefit-icon"><UsersRound size={22} /></div><h3>Learn from the experts</h3><p>Get guidance from generous teachers who use these skills in their work every day.</p></article>
            <article className="benefit"><div className="benefit-icon"><GraduationCap size={23} /></div><h3>Earn a certificate</h3><p>Celebrate your progress with a certificate that shows what you’ve accomplished.</p></article>
          </div>
          <div className="stats" aria-label="Academia at a glance">
            <div className="stat"><strong>12,480+</strong><span>Happy learners</span></div>
            <div className="stat"><strong>86</strong><span>Expert teachers</span></div>
            <div className="stat"><strong>240+</strong><span>Online courses</span></div>
            <div className="stat"><strong>4.8/5</strong><span>Learner rating</span></div>
          </div>
        </div>
      </section>
      <section className="section courses" id="courses">
        <div className="container">
          <div className="section-heading compact">
            <div className="eyebrow">Learn something new</div>
            <h2>Popular online courses</h2>
            <p>Fresh skills, thoughtful teachers, and room to grow at your own pace.</p>
          </div>
          <div className="course-grid">
            {courses.map((course, index) => {
              const CourseIcon = course.icon;
              return <article className="course-card" key={course.title} data-testid={`card-course-${index}`}>
                <div className={`course-art ${course.art}`}><CourseIcon className="course-art-icon" size={53} strokeWidth={1.15} /><span className="course-label">{course.category}</span></div>
                <div className="course-body">
                  <div className="course-meta"><span>{course.meta}</span><span className="course-rating"><Star size={11} fill="currentColor" /> {course.rating}</span></div>
                  <h3>{course.title}</h3><p>{course.description}</p>
                  <div className="course-bottom"><span>By Academia teachers</span><strong>{course.price} <small>/ course</small></strong></div>
                </div>
              </article>;
            })}
          </div>
          <div className="center-link"><a className="button button-teal" href="#categories">BROWSE ALL COURSES <ArrowRight size={14} /></a></div>
        </div>
      </section>
      <section className="section categories" id="categories">
        <div className="container">
          <div className="section-heading compact">
            <div className="eyebrow">Find your direction</div>
            <h2>Explore by category</h2>
            <p>Follow a curiosity, build on what you know, or take a fresh path entirely.</p>
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
            <div className="eyebrow">A community that gets it</div>
            <h2>Good things happen when you keep learning.</h2>
          </div>
          <div className="testimonial-grid">
            <article className="quote-main">
              <div className="quote-mark">“</div>
              <div className="stars" aria-label="5 out of 5 stars">★★★★★</div>
              <blockquote>I came to Academia wanting to change careers, but I found much more than a course. My teacher made every big idea feel possible, and I finished with work I’m genuinely proud to show.</blockquote>
              <div className="person"><div className="avatar">JM</div><div><strong>Jordan Mitchell</strong><span>UX Design graduate</span></div></div>
            </article>
            <article className="quote-side">
              <div className="stars" aria-label="5 out of 5 stars">★★★★★</div>
              <blockquote>“Finally, learning that fits around real life. I could pick it up after work, ask questions, and use what I learned the very next day.”</blockquote>
              <div className="person"><div className="avatar">AS</div><div><strong>Amara Singh</strong><span>Small Business learner</span></div></div>
            </article>
          </div>
        </div>
      </section>
      <section className="section journal" id="journal">
        <div className="container">
          <div className="section-heading compact">
            <div className="eyebrow">Notes for the curious</div>
            <h2>From the Academia journal</h2>
            <p>Ideas, advice, and thoughtful reminders for whatever you’re learning next.</p>
          </div>
          <div className="journal-grid">
            <article className="journal-card"><div className="journal-art journal-one"><span>Learning</span></div><div className="journal-body"><div className="journal-meta">MAY 21, 2025 &nbsp;·&nbsp; 5 MIN READ</div><h3>It’s never too late to learn something new</h3><p>A few ways to make space for learning, at any age and any stage.</p><a className="read-more" href="#newsletter">READ THE STORY <ArrowRight size={12} /></a></div></article>
            <article className="journal-card"><div className="journal-art journal-two"><span>Career</span></div><div className="journal-body"><div className="journal-meta">MAY 12, 2025 &nbsp;·&nbsp; 4 MIN READ</div><h3>Small steps toward a more creative career</h3><p>Build momentum with approachable ideas you can try this week.</p><a className="read-more" href="#newsletter">READ THE STORY <ArrowRight size={12} /></a></div></article>
            <article className="journal-card"><div className="journal-art journal-three"><span>Teaching</span></div><div className="journal-body"><div className="journal-meta">APRIL 28, 2025 &nbsp;·&nbsp; 6 MIN READ</div><h3>Meet the teachers who make learning click</h3><p>What great teaching looks like when it begins with real people.</p><a className="read-more" href="#newsletter">READ THE STORY <ArrowRight size={12} /></a></div></article>
          </div>
        </div>
      </section>
      <section className="section pricing" id="pricing">
        <div className="container">
          <div className="section-heading compact">
            <div className="eyebrow">Learning on your terms</div>
            <h2>A plan for wherever you’re starting.</h2>
            <p>Start for free, then choose the kind of learning that works for you.</p>
          </div>
          <div className="pricing-grid">
            {plans.map((plan) => <article key={plan.name} className={`price-card ${plan.featured ? 'featured' : ''}`}>
              {plan.featured && <span className="popular-pill">Most popular</span>}
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
          <div><div className="eyebrow">A little inspiration, now and then</div><h2>Make room for what’s next.</h2><p>Get new courses, useful ideas, and learner stories in your inbox.</p></div>
          <div>
            {joined ? <p className="form-status" role="status">Thanks for your interest. This preview does not save email addresses.</p> : <form className="newsletter-form" onSubmit={joinNewsletter}>
              <label className="sr-only" htmlFor="newsletter-email">Your email address</label>
              <input id="newsletter-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email address" required data-testid="input-newsletter-email" />
              <button className="button button-teal" type="submit" data-testid="button-newsletter-submit">SIGN ME UP <ArrowRight size={14} /></button>
            </form>}
            {!joined && <p className="form-note">Preview only — email addresses are not saved.</p>}
          </div>
        </div>
      </section>
      <footer className="footer" id="contact">
        <div className="container">
          <div className="footer-grid">
            <div><a className="brand" href="#home"><span className="brand-mark"><img src="/favicon.svg" alt="" /></span><span>ACADEMIA</span></a><p className="footer-brand-copy">Practical learning for curious people. Start where you are and see where you can go.</p></div>
            <div><h4>Explore</h4><div className="footer-links"><a href="#benefits">Why Academia</a><a href="#courses">All courses</a><a href="#categories">Course categories</a><a href="#pricing">Plans &amp; pricing</a></div></div>
            <div><h4>Academia</h4><div className="footer-links"><a href="#team">Our learners</a><a href="#journal">The journal</a><a href="#newsletter">Newsletter</a><a href="#home">Back to top</a></div></div>
            <div><h4>Get in touch</h4><div className="footer-links"><a href="mailto:hello@academia.example">hello@academia.example</a><a href="tel:+15550142730">+1 (555) 014-2730</a><a href="#contact">Monday - Friday, 8am-8pm</a></div></div>
          </div>
          <div className="footer-bottom"><span>© 2025 Academia. Learning belongs to everyone.</span><span>Learn well. <a href="#home">Live curious.</a></span></div>
        </div>
      </footer>
    </main>
  );
}

export default App;
