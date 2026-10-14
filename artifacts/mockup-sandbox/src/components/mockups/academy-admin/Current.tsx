import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Image,
  LayoutDashboard,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import "./academy-admin.css";

const items = [
  { label: "Visão geral", icon: LayoutDashboard, active: true },
  { label: "Cursos", icon: BookOpen },
  { label: "Biblioteca de mídias", icon: Image },
  { label: "Clientes", icon: Users },
  { label: "Agenda de salas", icon: CalendarDays },
  { label: "Reservas", icon: CalendarDays },
  { label: "Preços e horários", icon: CalendarDays },
  { label: "Inscrições", icon: BookOpen },
  { label: "Acessos da equipa", icon: Shield },
];

const quickLinks = [
  ["Gerir cursos", "Publicação, inscrições e preços", BookOpen],
  ["Consultar clientes", "Inscrições e reservas de salas", Users],
  ["Ver agenda", "Reservas e indisponibilidades", CalendarDays],
  ["Biblioteca de mídias", "Imagens usadas no catálogo", Image],
  ["Inscrições e pagamentos", "Acompanhar candidaturas", Users],
  ["Reservas do dia", "Rever ocupação das salas", CalendarDays],
] as const;

export function Current() {
  return (
    <main className="academy-admin-current">
      <div className="current-frame">
        <aside className="current-sidebar">
          <a className="current-logo" href="#">
            <span className="current-logo-mark">P</span>
            <span>ACADEMIA<small>PROCENTER · GESTÃO</small></span>
          </a>
          <p className="current-nav-label">Espaço de trabalho</p>
          <nav className="current-nav" aria-label="Navegação da administração">
            {items.map(({ label, icon: Icon, active }) => (
              <a href="#" className={active ? "active" : ""} key={label}>
                <Icon size={16} /><span>{label}</span>
              </a>
            ))}
          </nav>
          <div className="current-sidebar-foot">
            <b>Conta da equipa</b>
            Dados internos protegidos<br />Sessão Academia Procenter
          </div>
        </aside>
        <section className="current-main">
          <header className="current-topbar">
            <div className="current-crumb"><span>Academia</span><ChevronRight size={13} /><strong>Visão geral</strong></div>
            <div className="current-top-actions">
              <span className="current-live"><i /> Ligação activa</span>
              <a href="#"><ArrowLeft size={14} /> Ver site público</a>
            </div>
          </header>
          <div className="current-content">
            <div className="current-heading">
              <div>
                <p className="current-kicker">OPERAÇÕES · PROCENTER</p>
                <h1>Bom dia. Vamos tratar da Academia.</h1>
                <p>Um ponto de situação dos cursos, da agenda e dos recursos da equipa.</p>
              </div>
              <span className="current-authorised"><ShieldCheck size={16} /> Área interna autorizada</span>
            </div>
            <section className="current-stats" aria-label="Resumo da Academia">
              {[
                ["Cursos activos", BookOpen],
                ["Inscrições abertas", Users],
                ["Reservas futuras", CalendarDays],
                ["Recursos visuais", Image],
              ].map(([label, Icon]) => {
                const StatIcon = Icon as typeof BookOpen;
                return (
                  <article className="current-stat" key={label as string}>
                    <div><span>{label as string}</span><StatIcon size={17} /></div>
                    <strong>—</strong>
                    <small>No catálogo da Academia</small>
                  </article>
                );
              })}
            </section>
            <section className="current-section">
              <div className="current-section-head">
                <div><h2>Continuar a trabalhar</h2><p>Acesso directo às tarefas mais frequentes da equipa.</p></div>
                <span className="current-badge">ÁREA INTERNA</span>
              </div>
              <div className="current-section-body">
                <div className="current-quick-grid">
                  {quickLinks.map(([title, description, Icon]) => (
                    <a className="current-quick-link" href="#" key={title}>
                      <span className="current-quick-icon"><Icon size={17} /></span>
                      <span><b>{title}</b><small>{description}</small></span>
                      <ArrowUpRight size={15} />
                    </a>
                  ))}
                </div>
              </div>
            </section>
            <section className="current-section">
              <div className="current-section-head"><div><h2>Operação com contexto</h2><p>O público continua a inscrever-se através do formulário e pagamento por referência.</p></div></div>
              <div className="current-section-body">
                <p className="current-context">As alterações feitas aos cursos publicados reflectem-se no catálogo público. As reservas de salas, preços e inscrições mantêm os seus fluxos existentes; esta área reúne os atalhos para a equipa trabalhar sem interromper a experiência dos alunos.</p>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
