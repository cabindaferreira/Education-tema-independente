import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Image,
  LayoutDashboard,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import "./academy-admin-refresh.css";

const navigation = [
  { label: "Visão geral", href: "/equipa", icon: LayoutDashboard, active: true },
  { label: "Cursos", href: "/equipa/cursos", icon: BookOpen },
  { label: "Biblioteca de mídias", href: "/equipa/midias", icon: Image },
  { label: "Clientes", href: "/equipa/clientes", icon: Users },
  { label: "Agenda de salas", href: "/equipa/agenda", icon: CalendarDays },
  { label: "Reservas", href: "/equipa/reservas", icon: CalendarDays },
  { label: "Preços e horários", href: "/equipa/salas", icon: CalendarDays },
  { label: "Inscrições", href: "/equipa/inscricoes", icon: BookOpen },
  { label: "Acessos da equipa", href: "/equipa/acessos", icon: Shield },
];

const metrics = [
  { label: "Cursos activos", note: "No catálogo da Academia", icon: BookOpen },
  { label: "Inscrições abertas", note: "Disponíveis para novos alunos", icon: Users },
  { label: "Reservas futuras", note: "Salas e sessões confirmadas", icon: CalendarDays },
  { label: "Recursos visuais", note: "Biblioteca de imagens", icon: Image },
];

const taskGroups = [
  {
    index: "01",
    heading: "Catálogo & inscrições",
    tasks: [
      {
        title: "Gerir cursos",
        description: "Publicação, inscrições e preços",
        href: "/equipa/cursos",
        icon: BookOpen,
      },
      {
        title: "Biblioteca de mídias",
        description: "Imagens usadas no catálogo",
        href: "/equipa/midias",
        icon: Image,
      },
      {
        title: "Inscrições e pagamentos",
        description: "Acompanhar candidaturas",
        href: "/equipa/inscricoes",
        icon: Users,
      },
    ],
  },
  {
    index: "02",
    heading: "Clientes & espaços",
    tasks: [
      {
        title: "Consultar clientes",
        description: "Inscrições e reservas de salas",
        href: "/equipa/clientes",
        icon: Users,
      },
      {
        title: "Ver agenda",
        description: "Reservas e indisponibilidades",
        href: "/equipa/agenda",
        icon: CalendarDays,
      },
      {
        title: "Reservas do dia",
        description: "Rever ocupação das salas",
        href: "/equipa/reservas",
        icon: CalendarDays,
      },
    ],
  },
];

export function Refresh() {
  return (
    <main className="academy-admin-refresh">
      <div className="ar-shell">
        <header className="ar-masthead">
          <div className="ar-mast-inner">
            <div className="ar-brand-row">
              <a className="ar-brand" href="/equipa" aria-label="Academia Procenter — Visão geral">
                <span className="ar-brand-mark" aria-hidden="true">P</span>
                <span className="ar-brand-copy">
                  ACADEMIA
                  <small>PROCENTER · GESTÃO</small>
                </span>
              </a>
              <a className="ar-public-link" href="/">
                <ArrowLeft size={14} aria-hidden="true" />
                Ver site público
              </a>
            </div>
            <div className="ar-nav-wrap">
              <p className="ar-nav-caption">Espaço de trabalho</p>
              <nav className="ar-nav" aria-label="Navegação da administração">
                {navigation.map(({ label, href, icon: Icon, active }) => (
                  <a href={href} aria-current={active ? "page" : undefined} key={href}>
                    <Icon size={15} aria-hidden="true" />
                    <span>{label}</span>
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </header>

        <div className="ar-main">
          <section className="ar-dashboard-top" aria-label="Resumo da Academia">
            <div className="ar-welcome">
              <div className="ar-welcome-content">
                <p className="ar-kicker">OPERAÇÕES · PROCENTER</p>
                <h1>Bom dia. Vamos tratar da Academia.</h1>
                <p className="ar-welcome-copy">
                  Um ponto de situação dos cursos, da agenda e dos recursos da equipa.
                </p>
                <span className="ar-auth-note">
                  <ShieldCheck size={14} aria-hidden="true" />
                  Área interna autorizada
                </span>
              </div>
            </div>

            <div className="ar-metrics">
              {metrics.map(({ label, note, icon: Icon }) => (
                <article className="ar-metric" key={label}>
                  <span className="ar-metric-icon"><Icon size={16} aria-hidden="true" /></span>
                  <span>
                    <span className="ar-metric-label">{label}</span>
                    <strong className="ar-metric-value" aria-label="Sem dados disponíveis">—</strong>
                    <small className="ar-metric-note">{note}</small>
                  </span>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="ar-work-title">
            <div className="ar-work-heading">
              <div>
                <h2 id="ar-work-title">Continuar a trabalhar</h2>
                <p>Acesso directo às tarefas mais frequentes da equipa.</p>
              </div>
              <span className="ar-work-mark">
                <ShieldCheck size={13} aria-hidden="true" />
                ACESSO INTERNO
              </span>
            </div>

            <div className="ar-task-groups">
              {taskGroups.map(({ index, heading, tasks }) => (
                <section className="ar-task-group" aria-labelledby={`ar-group-${index}`} key={index}>
                  <div className="ar-group-head">
                    <span className="ar-group-index">{index}</span>
                    <h3 id={`ar-group-${index}`}>{heading}</h3>
                  </div>
                  <div className="ar-task-list">
                    {tasks.map(({ title, description, href, icon: Icon }) => (
                      <a className="ar-task-link" href={href} key={title}>
                        <span className="ar-task-icon"><Icon size={16} aria-hidden="true" /></span>
                        <span className="ar-task-copy">
                          <b>{title}</b>
                          <small>{description}</small>
                        </span>
                        <ArrowUpRight className="ar-task-arrow" size={15} aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </section>

          <aside className="ar-context" aria-label="Contexto da operação">
            <span className="ar-context-label">
              <Shield size={14} aria-hidden="true" />
              Operação com contexto
            </span>
            <p>
              O público continua a inscrever-se através do formulário e pagamento por referência.
              As alterações feitas aos cursos publicados reflectem-se no catálogo público. As
              reservas de salas, preços e inscrições mantêm os seus fluxos existentes; esta área
              reúne os atalhos para a equipa trabalhar sem interromper a experiência dos alunos.
            </p>
          </aside>

          <div className="ar-footnote">
            <span>Academia Procenter · Gestão interna</span>
            <span>Dados internos protegidos</span>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Refresh;
