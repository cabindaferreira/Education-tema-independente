import { Link } from 'wouter';
import { ArrowRight, BadgeCheck, BookOpen, Clock3, RefreshCw } from 'lucide-react';
import { PageIntro } from '@/components/site-layout';
import { useListPublishedCourses } from '@workspace/api-client-react';

function formatKz(value: number) {
  return `${new Intl.NumberFormat('pt-AO', { maximumFractionDigits: 0 }).format(value)} Kz`;
}

export default function CoursesPage() {
  const coursesQuery = useListPublishedCourses();
  const courses = coursesQuery.data ?? [];
  return (
    <>
      <PageIntro eyebrow="Formações profissionais" title="Encontre a sua próxima formação" description="Inscrição gratuita, estágio de três meses e certificado de conclusão reconhecido pelo INEFOP." />
      <section className="section courses ml-[9px] mr-[9px] pl-[0px] pr-[0px] pt-[10px] pb-[10px] mt-[-130px] mb-[-130px]"><div className="container">
        {coursesQuery.isLoading && <div className="course-grid" aria-busy="true" aria-label="A carregar cursos">{[0, 1, 2].map(item => <article className="course-card" key={item}><div className="course-art" style={{ background: 'linear-gradient(110deg,#eee7e3 20%,#faf5f1 45%,#eee7e3 70%)', backgroundSize: '220% 100%', animation: 'skeleton-shift 1.5s infinite' }} /><div className="course-body"><span className="course-duration">A carregar formação…</span><div style={{height:18,marginTop:16,background:'#f1eae6'}} /><div style={{height:40,marginTop:12,background:'#f8f4f1'}} /></div></article>)}</div>}
        {coursesQuery.isError && <div className="rooms-state" role="alert"><strong>Não foi possível carregar os cursos.</strong><p>Verifique a ligação à internet e volte a tentar.</p><button className="button button-teal" type="button" onClick={() => coursesQuery.refetch()}><RefreshCw size={14} /> Tentar novamente</button></div>}
        {!coursesQuery.isLoading && !coursesQuery.isError && courses.length === 0 && <div className="rooms-state"><strong>Não há inscrições abertas neste momento.</strong><p>Estamos a preparar novas formações. Volte a consultar o catálogo em breve.</p></div>}
        {!coursesQuery.isLoading && !coursesQuery.isError && courses.length > 0 && <div className="course-grid" id="course-grid">{courses.map((course, index) => (
          <article className="course-card" key={course.id} data-testid={`card-course-${course.id}`}>
            <div className="course-art"><img src={course.imageUrl} alt={`Cartaz do curso ${course.title}`} loading={index > 2 ? 'lazy' : 'eager'} /></div>
            <div className="course-body"><div className="course-meta"><span className="course-duration"><Clock3 size={14} />{course.duration}</span><span className="course-enrollment">Sem taxa de inscrição</span></div>
              <h3>{course.title}</h3><p>{course.description}</p>
              <ul className="course-highlights"><li><BadgeCheck size={15} /><span>Certificado reconhecido pelo INEFOP</span></li><li><BookOpen size={15} /><span>Manual de apoio incluído</span></li></ul>
              <div className="course-bottom"><span>Investimento total</span><strong>{formatKz(course.priceKz)}</strong></div>
              <Link className="course-cta" href={`/inscricao/${course.id}`} data-testid={`link-enrol-course-${course.id}`}>Inscrever-se <ArrowRight size={14} /></Link>
            </div>
          </article>
        ))}</div>}
      </div></section>
    </>
  );
}
