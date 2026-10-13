import { Link } from 'wouter';
import { ArrowUpRight, BookOpen, CalendarDays, Image, Users, ShieldCheck, RefreshCw } from 'lucide-react';
import { getGetAdminOverviewQueryKey, useGetAdminOverview } from '@workspace/api-client-react';
import { AdminPage } from '@/components/admin-shell';

function OverviewContent() {
  const overview = useGetAdminOverview({ query: { queryKey: getGetAdminOverviewQueryKey(), retry: 1 } });
  const stats = [
    { label: 'Cursos activos', value: overview.data?.courses, note: 'No catálogo da Academia', icon: BookOpen },
    { label: 'Inscrições abertas', value: overview.data?.openEnrollments, note: 'Disponíveis para novos alunos', icon: Users },
    { label: 'Reservas futuras', value: overview.data?.upcomingReservations, note: 'Salas e sessões confirmadas', icon: CalendarDays },
    { label: 'Recursos visuais', value: overview.data?.mediaAssets, note: 'Biblioteca de imagens', icon: Image },
  ];
  return <AdminPage title="Visão geral">
    <div className="admin-heading"><div><p className="admin-kicker">OPERAÇÕES · PROCENTER</p><h1>Bom dia. Vamos tratar da Academia.</h1><p>Um ponto de situação dos cursos, da agenda e dos recursos da equipa.</p></div><div className="admin-date"><ShieldCheck size={16} /> Área interna autorizada</div></div>
    {overview.isError && <div className="admin-alert"><RefreshCw size={17} /><div><strong>Não foi possível carregar o resumo.</strong><p>Os dados não foram alterados. Volte a tentar.</p><button type="button" className="admin-inline-link" onClick={() => overview.refetch()}>Tentar novamente</button></div></div>}
    <section className="admin-stats" aria-label="Resumo da Academia" aria-busy={overview.isLoading}>
      {stats.map(({ label, value, note, icon: Icon }) => <article className="admin-stat" key={label}><div className="admin-stat-top"><span>{label}</span><Icon size={17} /></div><strong>{overview.isLoading ? '—' : value ?? '—'}</strong><small>{note}</small></article>)}
    </section>
    <section className="admin-section"><div className="admin-section-head"><div><h2>Continuar a trabalhar</h2><p>Acesso directo às tarefas mais frequentes da equipa.</p></div><span className="admin-badge good">ÁREA INTERNA</span></div>
      <div className="admin-section-body"><div className="admin-quick-grid">
        <Link className="admin-quick-link" href="/equipa/cursos"><span className="admin-quick-icon"><BookOpen size={17} /></span><span><b>Gerir cursos</b><small>Publicação, inscrições e preços</small></span><ArrowUpRight size={15} /></Link>
        <Link className="admin-quick-link" href="/equipa/clientes"><span className="admin-quick-icon"><Users size={17} /></span><span><b>Consultar clientes</b><small>Inscrições e reservas de salas</small></span><ArrowUpRight size={15} /></Link>
        <Link className="admin-quick-link" href="/equipa/agenda"><span className="admin-quick-icon"><CalendarDays size={17} /></span><span><b>Ver agenda</b><small>Reservas e indisponibilidades</small></span><ArrowUpRight size={15} /></Link>
        <Link className="admin-quick-link" href="/equipa/midias"><span className="admin-quick-icon"><Image size={17} /></span><span><b>Biblioteca de mídias</b><small>Imagens usadas no catálogo</small></span><ArrowUpRight size={15} /></Link>
        <Link className="admin-quick-link" href="/equipa/inscricoes"><span className="admin-quick-icon"><Users size={17} /></span><span><b>Inscrições e pagamentos</b><small>Acompanhar candidaturas</small></span><ArrowUpRight size={15} /></Link>
        <Link className="admin-quick-link" href="/equipa/reservas"><span className="admin-quick-icon"><CalendarDays size={17} /></span><span><b>Reservas do dia</b><small>Rever ocupação das salas</small></span><ArrowUpRight size={15} /></Link>
      </div></div>
    </section>
    <section className="admin-section"><div className="admin-section-head"><div><h2>Operação com contexto</h2><p>O público continua a inscrever-se através do formulário e pagamento por referência.</p></div></div><div className="admin-section-body"><p style={{ margin: 0, color: '#746966', fontSize: 11, lineHeight: 1.8 }}>As alterações feitas aos cursos publicados reflectem-se no catálogo público. As reservas de salas, preços e inscrições mantêm os seus fluxos existentes; esta área reúne os atalhos para a equipa trabalhar sem interromper a experiência dos alunos.</p></div></section>
  </AdminPage>;
}

export default function StaffAdminHome() { return <OverviewContent />; }
