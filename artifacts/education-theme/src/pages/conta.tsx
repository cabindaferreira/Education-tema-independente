import { useEffect, useRef } from 'react';
import { useClerk, useAuth } from '@clerk/react';
import { Link } from 'wouter';
import { getGetAdminAccessQueryKey, useGetAdminAccess, useSyncAuthProfile } from '@workspace/api-client-react';
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, CircleUserRound, LogOut, Mail, ShieldCheck } from 'lucide-react';
import './auth.css';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
}

export function AccountPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const adminAccess = useGetAdminAccess({
    query: {
      queryKey: getGetAdminAccessQueryKey(),
      enabled: Boolean(isLoaded && isSignedIn),
      retry: false,
    },
  });
  const profileMutation = useSyncAuthProfile();
  const hasRequestedProfile = useRef(false);

  useEffect(() => {
    if (isLoaded && isSignedIn && !hasRequestedProfile.current) {
      hasRequestedProfile.current = true;
      profileMutation.mutate();
    }
  }, [isLoaded, isSignedIn, profileMutation.mutate]);

  const retryProfile = () => {
    hasRequestedProfile.current = true;
    profileMutation.mutate();
  };

  if (!isLoaded) {
    return (
      <main className="account-page" data-testid="page-account-loading" aria-busy="true">
        <div className="account-skeleton">
          <span /><span /><span /><div /><span /><span />
        </div>
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="account-page account-gate" data-testid="page-account-signed-out">
        <div className="account-gate-card">
          <Link className="auth-brand auth-brand-dark" href="/" data-testid="link-account-home">
            <img src={`${basePath}/favicon.svg`} alt="" />
            <span>ACADEMIA<small>PROCENTER · ANGOLA</small></span>
          </Link>
          <span className="account-gate-icon"><ShieldCheck size={25} /></span>
          <p className="auth-overline">ÁREA PESSOAL</p>
          <h1>A sua conta, à sua espera.</h1>
          <p>Inicie sessão para consultar os dados associados ao seu perfil Academia.</p>
          <Link className="account-primary-link" href="/sign-in" data-testid="link-account-sign-in">Iniciar sessão</Link>
          <Link className="account-back-link" href="/" data-testid="link-account-return"><ArrowLeft size={15} /> Voltar à página inicial</Link>
        </div>
      </main>
    );
  }

  const profile = profileMutation.data;
  const displayName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'Perfil Academia';

  return (
    <main className="account-page" data-testid="page-account">
      <header className="account-topbar">
        <Link className="auth-brand auth-brand-dark" href="/" aria-label="Página inicial da Academia" data-testid="link-account-brand">
          <img src={`${basePath}/favicon.svg`} alt="" />
          <span>ACADEMIA<small>PROCENTER · ANGOLA</small></span>
        </Link>
        <button className="account-signout" type="button" onClick={() => signOut({ redirectUrl: basePath || '/' })} data-testid="button-sign-out">
          <LogOut size={16} /> Terminar sessão
        </button>
      </header>

      <div className="account-content">
        <div className="account-breadcrumb"><Link href="/" data-testid="link-account-home-breadcrumb">Início</Link><span>/</span><span>Minha conta</span></div>
        <div className="account-welcome">
          <div>
            <p className="auth-overline">ÁREA PESSOAL</p>
            <h1>Bem-vindo{profile?.firstName ? `, ${profile.firstName}` : ' à Academia'}.</h1>
            <p>Este é o seu espaço para acompanhar a sua ligação à Academia Procenter.</p>
          </div>
          <div className="account-welcome-mark"><img src={`${basePath}/favicon.svg`} alt="" /></div>
        </div>

        {adminAccess.data?.isAdmin && (
          <div className="account-admin-access">
            <Link className="account-primary-link" href="/equipa" data-testid="link-account-admin">
              Abrir Painel Administrativo <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {profileMutation.isPending && (
          <section className="account-state account-loading-state" aria-live="polite" aria-busy="true" data-testid="status-profile-loading">
            <span className="account-state-mark"><span /></span>
            <div><strong>A preparar o seu perfil</strong><p>Estamos a carregar os dados da sua conta.</p></div>
          </section>
        )}
        {profileMutation.error && (
          <section className="account-state account-error-state" role="alert" data-testid="status-profile-error">
            <div><strong>Não foi possível carregar o perfil.</strong><p>Verifique a ligação e tente novamente.</p></div>
            <button type="button" onClick={retryProfile} data-testid="button-retry-profile">Tentar novamente</button>
          </section>
        )}
        {profile && (
          <>
            <div className="account-success" role="status" data-testid="status-profile-success">
              <CheckCircle2 size={17} /> Perfil sincronizado com a sua conta Academia
            </div>
            <section className="account-profile-card" aria-labelledby="account-profile-title" data-testid="profile-details">
              <div className="account-card-heading">
                <span className="account-card-icon"><CircleUserRound size={20} /></span>
                <div><p className="auth-overline">OS SEUS DADOS</p><h2 id="account-profile-title">Perfil pessoal</h2></div>
              </div>
              <div className="account-profile-name">
                <span className="account-avatar" aria-hidden="true">{displayName.slice(0, 1).toLocaleUpperCase('pt-AO')}</span>
                <div><strong data-testid="text-profile-name">{displayName}</strong><span>Conta Academia Procenter</span></div>
              </div>
              <dl className="account-details">
                <div><dt><Mail size={15} /> Endereço de e-mail</dt><dd data-testid="text-profile-email">{profile.email || 'Não indicado'}</dd></div>
                <div><dt><CircleUserRound size={15} /> Nome</dt><dd data-testid="text-profile-first-name">{profile.firstName || 'Não indicado'}</dd></div>
                <div><dt><CircleUserRound size={15} /> Apelido</dt><dd data-testid="text-profile-last-name">{profile.lastName || 'Não indicado'}</dd></div>
                <div><dt><CalendarDays size={15} /> Conta criada</dt><dd data-testid="text-profile-created">{formatDate(profile.createdAt)}</dd></div>
                <div><dt><CalendarDays size={15} /> Perfil actualizado</dt><dd data-testid="text-profile-updated">{formatDate(profile.updatedAt)}</dd></div>
              </dl>
            </section>
            <p className="account-private-note"><ShieldCheck size={15} /> Os seus dados são tratados com segurança e usados para gerir a sua conta Academia.</p>
          </>
        )}
      </div>
      <footer className="account-footer"><span>© Academia Procenter</span><Link href="/" data-testid="link-account-footer-home">Voltar ao site <ArrowLeft size={13} /></Link></footer>
    </main>
  );
}

