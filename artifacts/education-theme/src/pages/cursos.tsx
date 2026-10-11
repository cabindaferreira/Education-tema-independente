import { useState } from 'react';
import { ArrowRight, BadgeCheck, BookOpen, Clock3 } from 'lucide-react';
import { PageIntro } from '@/components/site-layout';

const courses = [
  { title: 'Estágio Formativo em CRM', image: '/images/courses/crm.jpg', description: 'Desenvolva competências práticas para gerir o relacionamento com clientes e apoiar as rotinas comerciais.', price: '100.000 Kz', duration: 'Estágio de 3 meses' },
  { title: 'Estágio Formativo em Tesouraria', image: '/images/courses/tesouraria.jpg', description: 'Aprenda a acompanhar operações de tesouraria, organizar registos e apoiar o controlo financeiro.', price: '100.000 Kz', duration: 'Estágio de 3 meses' },
  { title: 'Liderança e Gestão de Equipas', image: '/images/courses/lideranca-equipas.jpg', description: 'Prepare-se para coordenar equipas, comunicar objetivos e apoiar a execução do trabalho.', price: '100.000 Kz', duration: 'Estágio de 3 meses' },
  { title: 'Estágio Formativo em Gestão Comercial', image: '/images/courses/gestao-comercial.jpg', description: 'Desenvolva competências práticas em gestão de vendas, acompanhamento comercial e relação com clientes.', price: '100.000 Kz', duration: 'Estágio de 3 meses' },
  { title: 'Gestão e Administração de Empresas', image: '/images/courses/gestao-empresas.jpg', description: 'Conheça práticas de planeamento, organização e gestão das atividades de uma empresa.', price: '100.000 Kz', duration: 'Estágio de 3 meses' },
  { title: 'Gestão de Recursos Humanos', image: '/images/courses/recursos-humanos.jpg', description: 'Explore os fundamentos da gestão de pessoas e do apoio às rotinas de recursos humanos.', price: '100.000 Kz', duration: 'Estágio de 3 meses' },
];

export default function CoursesPage() {
  const [showAll, setShowAll] = useState(false);
  const visibleCourses = showAll ? courses : courses.slice(0, 3);
  return (
    <>
      <PageIntro eyebrow="Formações profissionais" title="Encontre a sua próxima formação" description="Inscrição gratuita, estágio de três meses e certificado de conclusão reconhecido pelo INEFOP." />
      <section className="section courses ml-[9px] mr-[9px] pl-[0px] pr-[0px] pt-[10px] pb-[10px] mt-[-40px] mb-[-40px]"><div className="container">
        <div className="course-grid" id="course-grid">{visibleCourses.map((course, index) => (
          <article className="course-card" key={course.title} data-testid={`card-course-${index}`}>
            <div className="course-art"><img src={course.image} alt={`Cartaz do curso ${course.title}`} /></div>
            <div className="course-body"><div className="course-meta"><span className="course-duration"><Clock3 size={14} />{course.duration}</span><span className="course-enrollment">Sem taxa de inscrição</span></div>
              <h3>{course.title}</h3><p>{course.description}</p>
              <ul className="course-highlights"><li><BadgeCheck size={15} /><span>Certificado reconhecido pelo INEFOP</span></li><li><BookOpen size={15} /><span>Manual de apoio incluído</span></li></ul>
              <div className="course-bottom"><span>Investimento total</span><strong>{course.price}</strong></div>
              <a className="course-cta" href={`mailto:academia@procenter.co.ao?subject=${encodeURIComponent(`Inscrição: ${course.title}`)}`}>Quero inscrever-me <ArrowRight size={14} /></a>
            </div>
          </article>
        ))}</div>
        <div className="course-more"><button className="button button-outline" type="button" aria-expanded={showAll} aria-controls="course-grid" onClick={() => setShowAll((value) => !value)}>{showAll ? 'VER MENOS' : 'VER MAIS CURSOS'}<ArrowRight className={showAll ? 'course-more-icon expanded' : 'course-more-icon'} size={14} /></button></div>
      </div></section>
    </>
  );
}
