import type { ReactNode } from 'react';
import { useAuth, useClerk } from '@clerk/react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, BookOpen, CalendarDays, ChevronRight, Image, LayoutDashboard, LogOut, Shield, Users } from 'lucide-react';
import { getGetAdminAccessQueryKey, useGetAdminAccess } from '@workspace/api-client-react';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

const navItems = [
  { href: '/equipa', label: 'Visão geral', icon: LayoutDashboard, id: 'overview' },
  { href: '/equipa/cursos', label: 'Cursos', icon: BookOpen, id: 'courses' },
  { href: '/equipa/midias', label: 'Biblioteca de mídias', icon: Image, id: 'media' },
  { href: '/equipa/clientes', label: 'Clientes', icon: Users, id: 'customers' },
  { href: '/equipa/agenda', label: 'Agenda de salas', icon: CalendarDays, id: 'agenda' },
  { href: '/equipa/reservas', label: 'Reservas', icon: CalendarDays, id: 'reservations' },
  { href: '/equipa/salas', label: 'Preços e horários', icon: CalendarDays, id: 'room-settings' },
  { href: '/equipa/inscricoes', label: 'Inscrições', icon: BookOpen, id: 'enrollments' },
  { href: '/equipa/acessos', label: 'Acessos da equipa', icon: Shield, id: 'team-access', owner: true },
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
    return <main className="academy-admin admin-access-screen"><section className="admin-gate-card"><Shield size={25} /><p className="admin-kicker">ÁREA RESERVADA</p><h1>Gestão Academia Procenter</h1><p>Inicie sessão com a sua conta verificada para aceder à área interna da equipa.</p><div className="admin-gate-actions"><Link href="/sign-in" className="admin-button" data-testid="link-admin-sign-in">Iniciar sessão <ChevronRight size={15} /></Link><Link href="/" className="admin-button secondary" data-testid="link-admin-return-site">Voltar ao site</Link></div></section></main>;
  }
  if (access.isError) {
    const forbidden = statusCode(access.error) === 403;
    return <main className="academy-admin admin-access-screen"><section className="admin-gate-card"><Shield size={25} /><p className="admin-kicker">ACESSO À EQUIPA</p><h1>{forbidden ? 'Acesso ainda não autorizado' : 'Não foi possível validar o acesso'}</h1><p>{forbidden ? 'Esta conta não tem autorização para consultar a administração. Peça acesso ao responsável da Academia Procenter.' : 'A validação de acesso falhou. Verifique a ligação e tente novamente.'}</p>{!forbidden && <button className="admin-button" type="button" onClick={() => access.refetch()}>Tentar novamente</button>}<Link className="admin-inline-link" href="/"><ArrowLeft size={14} /> Voltar ao site</Link></section></main>;
  }
  if (!access.data?.isAdmin || ownerOnly && !access.data.isOwner) {
    return <main className="academy-admin admin-access-screen"><section className="admin-gate-card"><Shield size={25} /><p className="admin-kicker">ACESSO RESTRITO</p><h1>{ownerOnly ? 'Só o responsável pode gerir acessos.' : 'Esta área é reservada à equipa.'}</h1><p>{ownerOnly ? 'A gestão de colaboradores está protegida e disponível apenas para o proprietário da Academia Procenter.' : 'A sua conta não tem autorização para consultar esta informação. Contacte o responsável da Academia.'}</p><div className="admin-gate-actions"><Link className="admin-button" href="/equipa">Voltar à administração</Link><Link className="admin-button secondary" href="/" data-testid="link-admin-return-site">Voltar ao site</Link></div></section></main>;
  }
  return <>{children}</>;
}

export function AdminMasthead({ title }: { title: string }) {
  const [location] = useLocation();
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const access = useGetAdminAccess({
    query: { queryKey: getGetAdminAccessQueryKey(), enabled: Boolean(isLoaded && isSignedIn), retry: false },
  });
  return (
    <header className="admin-masthead" data-page-title={title}>
      <div className="admin-mast-inner">
        <div className="admin-brand-row">
          <Link href="/equipa" className="admin-logo" aria-label="Academia Procenter — Visão geral" data-testid="link-admin-home">
            <img src="/favicon.svg" alt="" />
            <span>ACADEMIA<small>PROCENTER · GESTÃO</small></span>
          </Link>
          <div className="admin-header-actions">
            <Link className="admin-public-link" href="/" data-testid="link-admin-public-site"><ArrowLeft size={14} /> Ver site público</Link>
            <button
              className="admin-signout"
              type="button"
              onClick={() => void signOut({ redirectUrl: basePath || '/' })}
              data-testid="button-admin-signout"
            >
              <LogOut size={14} aria-hidden="true" /> Terminar sessão
            </button>
          </div>
        </div>
        <div className="admin-nav-wrap">
          <p className="admin-nav-label">Espaço de trabalho</p>
          <nav className="admin-nav" aria-label={`Navegação da administração — ${title}`}>
            {navItems.filter(item => !('owner' in item) || access.data?.isOwner).map(item => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} aria-current={location === item.href ? 'page' : undefined} data-testid={`admin-nav-${item.id}`}>
                  <Icon size={15} aria-hidden="true" /><span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}

export function AdminShell({ children, title }: { children: ReactNode; title: string }) {
  return (
    <main className="academy-admin">
      <AdminMasthead title={title} />
      <section className="admin-main">
        <div className="admin-content">{children}</div>
        <footer className="admin-footnote"><span>Academia Procenter · Gestão interna</span><span>Dados internos protegidos</span></footer>
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
