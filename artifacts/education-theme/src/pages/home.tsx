import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';

const heroSlides = [
  { image: '/images/academia-hero.jpg', label: 'A Academia' },
  { image: '/images/education-banner-bg.jpg', label: 'Aprendizagem e formação' },
  { image: '/images/courses/crm.jpg', label: 'Formação em CRM' },
  { image: '/images/courses/lideranca-equipas.jpg', label: 'Liderança e gestão de equipas' },
  { image: '/images/courses/gestao-comercial.jpg', label: 'Gestão comercial' },
] as const;

export default function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const isPaused = isHovered || hasFocus;

  useEffect(() => {
    if (isPaused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 6500);
    return () => window.clearInterval(interval);
  }, [activeSlide, isPaused]);

  return (
    <>
      <section className="hero" id="home">
        <div className="hero-slides" aria-hidden="true">
          {heroSlides.map((slide, index) => (
            <div
              className={`hero-slide${index === activeSlide ? ' is-active' : ''}`}
              key={slide.image}
              style={{ backgroundImage: `url("${slide.image}")` }}
            />
          ))}
        </div>
        <div className="hero-watermark" aria-hidden="true" />
        <div className="container"><div className="hero-content">
          <div className="eyebrow">Bem-vindo à Academia</div>
          <h1>Aprenda novas competências online com professores experientes</h1>
          <p className="hero-copy">Cursos práticos de tecnologia, design, negócios e música, orientados por profissionais. Aprenda ao seu ritmo e receba um certificado no final.</p>
          <div className="actions">
            <Link className="button button-teal bg-[#FF0101]" href="/cursos">COMECE AGORA <ArrowRight size={14} /></Link>
            <Link className="button button-white" href="/cursos">VER CURSOS <ArrowRight size={14} /></Link>
          </div>
        </div></div>
        <div
          className="hero-carousel-controls"
          role="group"
          aria-label="Imagens em destaque"
          onPointerEnter={() => setIsHovered(true)}
          onPointerLeave={() => setIsHovered(false)}
          onFocusCapture={() => setHasFocus(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHasFocus(false);
          }}
        >
          {heroSlides.map((slide, index) => (
            <button
              className="hero-carousel-dot"
              type="button"
              key={slide.image}
              aria-label={`Mostrar imagem: ${slide.label}`}
              aria-current={index === activeSlide ? 'true' : undefined}
              onClick={() => setActiveSlide(index)}
            />
          ))}
        </div>
        <div className="hero-scroll" aria-hidden="true" />
      </section>
      <section className="home-note"><div className="container home-note-inner"><div><span className="eyebrow">Academia Procenter</span><h2>Formação para avançar com confiança.</h2></div><Link className="button button-outline" href="/sobre-nos">CONHEÇA A ACADEMIA <ArrowRight size={14} /></Link></div></section>
    </>
  );
}
