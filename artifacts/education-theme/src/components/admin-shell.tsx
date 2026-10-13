import { useState, type ReactNode } from 'react';
import { useAuth } from '@clerk/react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, BookOpen, CalendarDays, ChevronRight, Image, LayoutDashboard, Menu, Shield, Users, X } from 'lucide-react';
import { getGetAdminAccessQueryKey, useGetAdminAccess } from '@workspace/api-client-react';

const navItems = [
  { href: '/equipa', label: 'Visão geral', icon: LayoutDashboard },
  { href: '/equipa/cursos', label: 'Cursos', icon: BookOpen },
  { href: '/equipa/midias', label: 'Biblioteca de mídias', icon: Image },
  { href: '/equipa/clientes', label: 'Clientes', icon: Users },
  { href: '/equipa/agenda', label: 'Agenda de salas', icon: CalendarDays },
  { href: '/equipa/reservas', label: 'Reservas', icon: CalendarDays },
  { href: '/equipa/salas', label: 'Preços e horários', icon: CalendarDays },
  { href: '/equipa/inscricoes', label: 'Inscrições', icon: BookOpen },
  { href: '/equipa/acessos', label: 'Acessos da equipa', icon: Shield, owner: true },
] as const;

function statusCode(error: unknown) {
  if (!error || typeof error !== 'object') return undefined;
  const value = error as { status?: unknown; response?: { status?: unknown } };
  const status = value.status ?? value.response?.status;
  return typeof status === 'number' ? status : undefined;
}

export function AdminGuard({ children, ownerOnly = false }: { children: ReactNode; ownerOnly?: boolean }) {
  const { isLoaded, isSignedIn } = useAuth();
  const access = useGetAdminAccess({
    query: { queryKey: getGetAdminAccessQueryKey(), enabled: Boolean(isLoaded && isSignedIn), retry: false },
  });
  if (!isLoaded || isSignedIn && access.isLoading) {
    return <main className="academy-admin admin-access-screen"><div className="admin-gate-card" aria-busy="true"><div className="admin-skeleton" /><div className="admin-skeleton" /></div></main>;
  }
  if (!isSignedIn) {
    return <main className="academy-admin admin-access-screen"><section className="admin-gate-card"><Shield size={25} /><p className="admin-kicker">ÁREA RESERVADA</p><h1>Gestão Academia Procenter</h1><p>Inicie sessão com a sua conta verificada para aceder à área interna da equipa.</p><Link href="/sign-in" className="admin-button" data-testid="link-admin-sign-in">Iniciar sessão <ChevronRight size={15} /></Link></section></main>;
  }
  if (access.isError) {
    const forbidden = statusCode(access.error) === 403;
    return <main className="academy-admin admin-access-screen"><section className="admin-gate-card"><Shield size={25} /><p className="admin-kicker">ACESSO À EQUIPA</p><h1>{forbidden ? 'Acesso ainda não autorizado' : 'Não foi possível validar o acesso'}</h1><p>{forbidden ? 'Esta conta não tem autorização para consultar a administração. Peça acesso ao responsável da Academia Procenter.' : 'A validação de acesso falhou. Verifique a ligação e tente novamente.'}</p>{!forbidden && <button className="admin-button" type="button" onClick={() => access.refetch()}>Tentar novamente</button>}<Link className="admin-inline-link" href="/"><ArrowLeft size={14} /> Voltar ao site</Link></section></main>;
  }
  if (!access.data?.isAdmin || ownerOnly && !access.data.isOwner) {
    return <main className="academy-admin admin-access-screen"><section className="admin-gate-card"><Shield size={25} /><p className="admin-kicker">ACESSO RESTRITO</p><h1>{ownerOnly ? 'Só o responsável pode gerir acessos.' : 'Esta área é reservada à equipa.'}</h1><p>{ownerOnly ? 'A gestão de colaboradores está protegida e disponível apenas para o proprietário da Academia Procenter.' : 'A sua conta não tem autorização para consultar esta informação. Contacte o responsável da Academia.'}</p><Link className="admin-button" href="/equipa">Voltar à administração</Link></section></main>;
  }
  return <>{children}</>;
}

export function AdminShell({ children, title }: { children: ReactNode; title: string }) {
  const [location] = useLocation();
  const { isLoaded, isSignedIn } = useAuth();
  const access = useGetAdminAccess({
    query: { queryKey: getGetAdminAccessQueryKey(), enabled: Boolean(isLoaded && isSignedIn), retry: false },
  });
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <main className="academy-admin">
      <div className={`admin-sidebar ${menuOpen ? 'is-open' : ''}`}>
        <Link href="/equipa" className="admin-logo" onClick={() => setMenuOpen(false)}><img src="/favicon.svg" alt="" /><span>ACADEMIA<small>PROCENTER · GESTÃO</small></span></Link>
        <p className="admin-nav-label">Espaço de trabalho</p>
        <nav className="admin-nav" aria-label="Navegação da administração">
          {navItems.filter(item => !('owner' in item) || access.data?.isOwner).map(item => {
            const Icon = item.icon;
            return <Link key={item.href} href={item.href} aria-current={location === item.href ? 'page' : undefined} onClick={() => setMenuOpen(false)}><Icon size={16} /><span>{item.label}</span></Link>;
          })}
        </nav>
        <div className="admin-sidebar-foot"><b>{access.data?.email ?? 'Conta da equipa'}</b>Dados internos protegidos<br />Sessão Academia Procenter</div>
      </div>
      <section className="admin-main">
        <header className="admin-topbar">
          <button className="admin-mobile-menu" type="button" aria-label={menuOpen ? 'Fechar navegação' : 'Abrir navegação'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={17} /> : <Menu size={17} />}</button>
          <div className="admin-topbar-crumb"><span>Academia</span><ChevronRight size={13} /><strong>{title}</strong></div>
          <div className="admin-top-actions"><span className="admin-live"><i /> Ligação activa</span><Link className="admin-public-link" href="/"><ArrowLeft size={14} /> Ver site público</Link></div>
        </header>
        <div className="admin-content">{children}</div>
      </section>
    </main>
  );
}

export function AdminPage({ title, children }: { title: string; children: ReactNode }) {
  return <AdminGuard><AdminShell title={title}>{children}</AdminShell></AdminGuard>;
}

export function formatKz(value: number | null | undefined) {
  return value == null ? '—' : `${new Intl.NumberFormat('pt-AO', { maximumFractionDigits: 0 }).format(value)} Kz`;
}

export function formatAdminDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('pt-AO', { dateStyle: 'medium' }).format(date);
}
