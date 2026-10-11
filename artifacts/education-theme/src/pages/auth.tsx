import { SignIn, SignUp } from '@clerk/react';
import { Link } from 'wouter';
import './auth.css';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const signInPath = `${basePath}/sign-in`;
const signUpPath = `${basePath}/sign-up`;

function AuthFrame({
  mode,
}: {
  mode: 'entrar' | 'criar';
}) {
  const isSignUp = mode === 'criar';

  return (
    <main className="auth-page" data-testid={`page-auth-${mode}`}>
      <section className="auth-story" aria-label="Academia Procenter">
        <Link className="auth-brand" href="/" aria-label="Voltar à página inicial" data-testid="link-home-brand">
          <img src={`${basePath}/favicon.svg`} alt="" />
          <span>ACADEMIA<small>PROCENTER · ANGOLA</small></span>
        </Link>

        <div className="auth-story-copy">
          <p className="auth-overline">APRENDER ABRE CAMINHOS</p>
          <h1>{isSignUp ? <>O próximo passo<br />começa aqui.</> : <>O seu percurso<br />continua aqui.</>}</h1>
          <p className="auth-story-description">
            {isSignUp
              ? 'Crie a sua conta e aproxime-se de novas competências, bons encontros e espaços para aprender.'
              : 'Entre na sua área Academia para acompanhar o seu percurso de aprendizagem e as suas reservas.'}
          </p>
        </div>

        <div className="auth-story-foot">
          <span className="auth-rule" />
          <p>Formação prática. Pessoas preparadas.<br />Um futuro construído em Angola.</p>
        </div>
        <span className="auth-story-index" aria-hidden="true">01 / APRENDER</span>
      </section>

      <section className="auth-form-panel">
        <div className="auth-mobile-brand">
          <Link className="auth-brand auth-brand-dark" href="/" aria-label="Voltar à página inicial" data-testid="link-home-mobile">
            <img src={`${basePath}/favicon.svg`} alt="" />
            <span>ACADEMIA<small>PROCENTER · ANGOLA</small></span>
          </Link>
        </div>
        <div className="auth-form-topline">
          <span>{isSignUp ? 'COMECE AQUI' : 'BEM-VINDO DE VOLTA'}</span>
          <Link href="/" data-testid="link-auth-home">Página inicial</Link>
        </div>
        <div className="auth-form-content">
          <div className="auth-heading">
            <p className="auth-overline">{isSignUp ? 'A SUA CONTA ACADEMIA' : 'ÁREA DO ALUNO'}</p>
            <h2>{isSignUp ? 'Criar conta' : 'Iniciar sessão'}</h2>
            <p>{isSignUp
              ? 'Um espaço para acompanhar as suas formações e estar mais perto da Academia.'
              : 'Aceda à sua conta para continuar de onde ficou.'}</p>
          </div>
          <div className="auth-clerk" data-testid={`clerk-${mode}-form`}>
            {isSignUp
              ? <SignUp routing="path" path={signUpPath} signInUrl={signInPath} />
              : <SignIn routing="path" path={signInPath} signUpUrl={signUpPath} />}
          </div>
          <p className="auth-home-note">
            {isSignUp ? 'Quer conhecer a Academia primeiro?' : 'Ainda não tem uma conta?'}{' '}
            <Link href="/" data-testid="link-auth-discover">Explore a Academia</Link>
          </p>
        </div>
        <footer className="auth-footer">
          <span>© Academia Procenter</span>
          <span>Luanda, Angola</span>
        </footer>
      </section>
    </main>
  );
}

export function SignInPage() {
  return <AuthFrame mode="entrar" />;
}

export function SignUpPage() {
  return <AuthFrame mode="criar" />;
}

