import { Link } from 'wouter';
import { ArrowUpRight, BookOpen, CalendarDays, Image, Users, Shield, ShieldCheck, RefreshCw } from 'lucide-react';
import { getGetAdminOverviewQueryKey, useGetAdminOverview } from '@workspace/api-client-react';
import { AdminPage } from '@/components/admin-shell';

function OverviewContent() {
  const overview = useGetAdminOverview({ query: { queryKey: getGetAdminOverviewQueryKey(), retry: 1 } });
  const metrics = [
    { label: 'Cursos activos', value: overview.data?.courses, note: 'No catálogo da Academia', icon: BookOpen },
    { label: 'Inscrições abertas', value: overview.data?.openEnrollments, note: 'Disponíveis para novos alunos', icon: Users },
    { label: 'Reservas futuras', value: overview.data?.upcomingReservations, note: 'Salas e sessões confirmadas', icon: CalendarDays },
    { label: 'Recursos visuais', value: overview.data?.mediaAssets, note: 'Biblioteca de imagens', icon: Image },
  ];
  const taskGroups = [
    {
      index: '01',
      heading: 'Catálogo & inscrições',
      tasks: [
        { title: 'Gerir cursos', description: 'Publicação, inscrições e preços', href: '/equipa/cursos', icon: BookOpen, id: 'courses' },
        { title: 'Biblioteca de mídias', description: 'Imagens usadas no catálogo', href: '/equipa/midias', icon: Image, id: 'media' },
        { title: 'Inscrições e pagamentos', description: 'Acompanhar candidaturas', href: '/equipa/inscricoes', icon: Users, id: 'enrollments' },
      ],
    },
    {
      index: '02',
      heading: 'Clientes & espaços',
      tasks: [
        { title: 'Consultar clientes', description: 'Inscrições e reservas de salas', href: '/equipa/clientes', icon: Users, id: 'customers' },
        { title: 'Ver agenda', description: 'Reservas e indisponibilidades', href: '/equipa/agenda', icon: CalendarDays, id: 'agenda' },
        { title: 'Reservas do dia', description: 'Rever ocupação das salas', href: '/equipa/reservas', icon: CalendarDays, id: 'reservations' },
        { title: 'Preços e horários', description: 'Editar tarifas e regras das salas', href: '/equipa/salas', icon: CalendarDays, id: 'room-settings' },
      ],
    },
  ];
  return <AdminPage title="Visão geral">
    <section className="admin-dashboard-top" aria-label="Resumo da Academia">
      <div className="admin-welcome">
        <div className="admin-welcome-content">
          <p className="admin-kicker">OPERAÇÕES · PROCENTER</p>
          <h1>Bom dia. Vamos tratar da Academia.</h1>
          <p className="admin-welcome-copy">Um ponto de situação dos cursos, da agenda e dos recursos da equipa.</p>
          <span className="admin-auth-note"><ShieldCheck size={14} /> Área interna autorizada</span>
        </div>
      </div>
      <div className="admin-metrics" aria-busy={overview.isLoading}>
        {metrics.map(({ label, value, note, icon: Icon }) => (
          <article className="admin-metric" key={label} data-testid={`admin-metric-${label.toLowerCase().replaceAll(' ', '-')}`}>
            <span className="admin-metric-icon"><Icon size={16} /></span>
            <span><span className="admin-metric-label">{label}</span><strong className="admin-metric-value">{overview.isLoading ? '—' : value ?? '—'}</strong><small className="admin-metric-note">{note}</small></span>
          </article>
        ))}
      </div>
    </section>
    {overview.isError && <div className="admin-alert"><RefreshCw size={17} /><div><strong>Não foi possível carregar o resumo.</strong><p>Os dados não foram alterados. Volte a tentar.</p><button type="button" className="admin-inline-link" onClick={() => overview.refetch()}>Tentar novamente</button></div></div>}
    <section className="admin-work-section" aria-labelledby="admin-work-title">
      <div className="admin-work-heading">
        <div><h2 id="admin-work-title">Continuar a trabalhar</h2><p>Acesso directo às tarefas mais frequentes da equipa.</p></div>
        <span className="admin-work-mark"><ShieldCheck size={13} /> ACESSO INTERNO</span>
      </div>
      <div className="admin-task-groups">
        {taskGroups.map(({ index, heading, tasks }) => (
          <section className="admin-task-group" aria-labelledby={`admin-task-group-${index}`} key={index}>
            <div className="admin-group-head"><span>{index}</span><h3 id={`admin-task-group-${index}`}>{heading}</h3></div>
            <div className="admin-task-list">
              {tasks.map(({ title, description, href, icon: Icon, id }) => (
                <Link className="admin-task-link" href={href} key={id} data-testid={`admin-task-${id}`}>
                  <span className="admin-task-icon"><Icon size={16} /></span>
                  <span><b>{title}</b><small>{description}</small></span>
                  <ArrowUpRight className="admin-task-arrow" size={15} />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
    <aside className="admin-context" aria-label="Contexto da operação">
      <span className="admin-context-label"><Shield size={14} /> Operação com contexto</span>
      <p>O público continua a inscrever-se através do formulário e pagamento por referência. As alterações feitas aos cursos publicados reflectem-se no catálogo público. As reservas de salas, preços e inscrições mantêm os seus fluxos existentes; esta área reúne os atalhos para a equipa trabalhar sem interromper a experiência dos alunos.</p>
    </aside>
  </AdminPage>;
}

export default function StaffAdminHome() { return <OverviewContent />; }
