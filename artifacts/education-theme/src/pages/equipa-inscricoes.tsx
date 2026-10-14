import { useMemo, useState } from 'react';
import { useAuth } from '@clerk/react';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Check,
  Clock3,
  LockKeyhole,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import {
  getListStaffCourseEnrollmentsQueryKey,
  getListAdminCoursesQueryKey,
  useListAdminCourses,
  useListStaffCourseEnrollments,
  useResolveStaffCourseEnrollment,
  useRetryStaffCourseEnrollmentConfirmation,
  type CoursePaymentStatus,
  type ListStaffCourseEnrollmentsParams,
  type StaffCourseEnrollment,
} from '@workspace/api-client-react';
import { AdminMasthead } from '@/components/admin-shell';
import './equipa-inscricoes.css';

const paymentStatuses: { value: CoursePaymentStatus | ''; label: string }[] = [
  { value: '', label: 'Todos os estados' },
  { value: 'review_required', label: 'Requer revisão' },
  { value: 'pending', label: 'Pendente' },
  { value: 'paid', label: 'Pago' },
  { value: 'expired', label: 'Expirado / não confirmado' },
];

function errorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const value = error as { status?: unknown; response?: { status?: unknown } };
  const status = value.status ?? value.response?.status;
  return typeof status === 'number' ? status : undefined;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('pt-AO', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-AO', { maximumFractionDigits: 0 }).format(value);
}

function paymentLabel(status: string) {
  if (status === 'review_required') return 'Requer revisão';
  if (status === 'paid') return 'Pago';
  if (status === 'expired') return 'Expirado / não confirmado';
  return 'Pendente';
}

function emailLabel(status: string) {
  if (status === 'sent') return 'Confirmação enviada';
  if (status === 'failed') return 'Envio falhou';
  if (status === 'sending') return 'A enviar';
  return 'A aguardar envio';
}

export default function StaffCourseEnrollmentsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [courseId, setCourseId] = useState<ListStaffCourseEnrollmentsParams['courseId'] | ''>('');
  const [paymentStatus, setPaymentStatus] = useState<CoursePaymentStatus | ''>('');
  const [selectedResolution, setSelectedResolution] = useState<string | null>(null);
  const [decision, setDecision] = useState<'confirm_payment' | 'reject_payment'>('confirm_payment');
  const [note, setNote] = useState('');
  const [feedback, setFeedback] = useState('');
  const coursesQuery = useListAdminCourses({
    query: {
      queryKey: getListAdminCoursesQueryKey(),
      enabled: Boolean(isLoaded && isSignedIn),
    },
  });

  const params = useMemo<ListStaffCourseEnrollmentsParams>(() => ({
    ...(courseId ? { courseId } : {}),
    ...(paymentStatus ? { paymentStatus } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
  }), [courseId, paymentStatus, search]);
  const enrollmentsQuery = useListStaffCourseEnrollments(params, {
    query: {
      queryKey: getListStaffCourseEnrollmentsQueryKey(params),
      enabled: Boolean(isLoaded && isSignedIn),
      staleTime: 0,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
    },
  });
  const resolveMutation = useResolveStaffCourseEnrollment();
  const retryMutation = useRetryStaffCourseEnrollmentConfirmation();
  const enrollments = enrollmentsQuery.data ?? [];
  const isForbidden = errorStatus(enrollmentsQuery.error) === 403;
  const isResolving = resolveMutation.isPending || retryMutation.isPending;

  function refreshList() {
    return queryClient.invalidateQueries({ queryKey: getListStaffCourseEnrollmentsQueryKey() });
  }

  function resolve(enrollment: StaffCourseEnrollment) {
    if (note.trim().length < 5 || resolveMutation.isPending) return;
    setFeedback('');
    resolveMutation.mutate({
      id: enrollment.id,
      data: { decision, note: note.trim() },
    }, {
      onSuccess: async () => {
        setSelectedResolution(null);
        setNote('');
        setFeedback(decision === 'confirm_payment'
          ? 'Pagamento confirmado. A tentativa de confirmação por e-mail também ficou registada.'
          : 'Exceção encerrada como pagamento não confirmado.');
        await refreshList();
      },
      onError: () => setFeedback('Não foi possível guardar a resolução. Atualize a lista e tente novamente.'),
    });
  }

  function retryConfirmation(enrollment: StaffCourseEnrollment) {
    if (retryMutation.isPending) return;
    setFeedback('');
    retryMutation.mutate({ id: enrollment.id }, {
      onSuccess: async () => {
        setFeedback('Nova tentativa de envio registada.');
        await refreshList();
      },
      onError: async () => {
        setFeedback('O reenvio não foi concluído. A tentativa ficou registada; atualize a lista para ver o estado.');
        await refreshList();
      },
    });
  }

  if (!isLoaded || isSignedIn && enrollmentsQuery.isLoading) {
    return <main className="staff-enrollments" aria-busy="true"><div className="enrollment-state">A carregar inscrições…</div></main>;
  }
  if (!isSignedIn) {
    return (
      <main className="staff-enrollments staff-enrollments-gate" data-testid="page-course-enrollments-signed-out">
        <section className="enrollment-gate-card">
          <LockKeyhole size={25} />
          <span className="enrollment-overline">ÁREA DA EQUIPA</span>
          <h1>Entre para consultar as inscrições.</h1>
          <p>Os dados dos candidatos são confidenciais e só estão disponíveis para a equipa autorizada.</p>
          <Link to="/sign-in">Iniciar sessão</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="staff-enrollments academy-admin" data-testid="page-staff-course-enrollments">
      {!isForbidden && <AdminMasthead title="Inscrições" />}
      <div className="enrollment-main">
        <section className="enrollment-heading">
          <div>
            <p className="enrollment-overline"><span /> OPERAÇÕES · FORMAÇÃO</p>
            <h1>Inscrições e pagamentos</h1>
            <p>Pesquise candidaturas, reveja exceções de pagamento e acompanhe os envios de confirmação.</p>
          </div>
          <ShieldCheck size={24} />
        </section>

        {isForbidden && (
          <section className="enrollment-alert enrollment-alert-denied" role="alert" data-testid="status-enrollments-forbidden">
            <LockKeyhole size={19} /><div><strong>Acesso restrito à equipa autorizada</strong><p>Esta conta não tem a função necessária para consultar dados pessoais de candidatos.</p></div>
          </section>
        )}
        {enrollmentsQuery.isError && !isForbidden && (
          <section className="enrollment-alert" role="alert">
            <AlertCircle size={19} /><div><strong>Não foi possível carregar as inscrições.</strong><p>Os dados continuam protegidos. Verifique a ligação e tente novamente.</p></div>
            <button type="button" onClick={() => enrollmentsQuery.refetch()}><RefreshCw size={14} /> Tentar novamente</button>
          </section>
        )}
        {feedback && <p className="enrollment-feedback" role="status"><Check size={16} />{feedback}</p>}

        {!isForbidden && (
          <>
            <section className="enrollment-filters" aria-label="Pesquisa e filtros de inscrições">
              <label className="enrollment-search"><span>Pesquisar</span><div><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome, e-mail, telefone ou referência" /></div></label>
              <label><span>Curso</span><select value={courseId} onChange={(event) => setCourseId(event.target.value as ListStaffCourseEnrollmentsParams['courseId'] | '')}><option value="">Todos os cursos</option>{coursesQuery.data?.map((course) => <option value={course.id} key={course.id}>{course.title}</option>)}</select></label>
              <label><span>Pagamento</span><select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as CoursePaymentStatus | '')}>{paymentStatuses.map((status) => <option value={status.value} key={status.value}>{status.label}</option>)}</select></label>
              <p><ShieldCheck size={14} /> Dados pessoais visíveis apenas à equipa autorizada</p>
            </section>

            <section className="enrollment-list-section" aria-live="polite">
              <div className="enrollment-list-heading"><div><span>RESULTADOS</span><h2>Inscrições <small>{enrollmentsQuery.isLoading ? '—' : enrollments.length}</small></h2></div><button type="button" onClick={() => enrollmentsQuery.refetch()} disabled={enrollmentsQuery.isFetching}><RefreshCw size={14} className={enrollmentsQuery.isFetching ? 'is-spinning' : ''} /> Atualizar</button></div>
              {enrollmentsQuery.isLoading ? <div className="enrollment-state">A carregar inscrições…</div> : null}
              {!enrollmentsQuery.isLoading && !enrollmentsQuery.isError && enrollments.length === 0 && (
                <div className="enrollment-state"><Search size={22} /><strong>Sem inscrições para estes filtros.</strong><p>Altere o curso, o estado de pagamento ou os termos da pesquisa.</p></div>
              )}
              <div className="enrollment-cards">
                {enrollments.map((enrollment) => {
                  const isSelected = selectedResolution === enrollment.id;
                  return (
                    <article className={`enrollment-card ${enrollment.paymentStatus === 'review_required' ? 'needs-review' : ''}`} key={enrollment.id} data-testid={`card-course-enrollment-${enrollment.id}`}>
                      <div className="enrollment-card-top">
                        <div className="enrollment-person">
                          <span className="enrollment-person-icon"><UserRound size={18} /></span>
                          <div><h3>{enrollment.fullName}</h3><p>{enrollment.courseTitle}</p></div>
                        </div>
                        <span className={`enrollment-status ${enrollment.paymentStatus}`}><i />{paymentLabel(enrollment.paymentStatus)}</span>
                      </div>
                      <div className="enrollment-summary-grid">
                        <div><span>Referência</span><strong>{enrollment.paymentReference}</strong></div>
                        <div><span>Valor esperado</span><strong>{formatMoney(enrollment.amountKz)} Kz</strong></div>
                        <div><span>Valor recebido</span><strong>{enrollment.paymentAmountKz == null ? '—' : `${formatMoney(enrollment.paymentAmountKz)} Kz`}</strong></div>
                        <div><span>E-mail de confirmação</span><strong className={`email-status ${enrollment.confirmationEmailStatus}`}><Mail size={14} />{emailLabel(enrollment.confirmationEmailStatus)}</strong></div>
                      </div>
                      <details className="enrollment-details">
                        <summary>Ver dados da candidatura</summary>
                        <div className="enrollment-private-grid">
                          <div><span>E-mail</span><strong>{enrollment.email}</strong></div>
                          <div><span>Telefone</span><strong>{enrollment.phone}</strong></div>
                          <div><span>Documento de identificação</span><strong>{enrollment.identityNumber}</strong></div>
                          <div><span>Data de nascimento</span><strong>{formatDate(enrollment.birthDate)}</strong></div>
                          <div><span>Nacionalidade</span><strong>{enrollment.nationality}</strong></div>
                          <div><span>Profissão</span><strong>{enrollment.profession}</strong></div>
                          <div><span>Estado civil</span><strong>{enrollment.maritalStatus}</strong></div>
                          <div><span>Morada</span><strong>{enrollment.address}</strong></div>
                          <div><span>Município / Província</span><strong>{enrollment.municipality} / {enrollment.province}</strong></div>
                          <div><span>Transação</span><strong>{enrollment.paymentTransactionId || '—'}</strong></div>
                          <div><span>Entidade</span><strong>{enrollment.paymentEntity}</strong></div>
                          <div><span>Recebido em</span><strong>{formatDate(enrollment.paidAt)}</strong></div>
                        </div>
                      </details>

                      {enrollment.paymentStatus === 'review_required' && (
                        <div className="enrollment-actions">
                          {!isSelected ? (
                            <button type="button" className="enrollment-primary-button" onClick={() => { setSelectedResolution(enrollment.id); setNote(''); setFeedback(''); }} disabled={isResolving}>Registar resolução</button>
                          ) : (
                            <div className="enrollment-resolution-form">
                              <label><span>Decisão</span><select value={decision} onChange={(event) => setDecision(event.target.value as typeof decision)}><option value="confirm_payment">Confirmar pagamento recebido</option><option value="reject_payment">Marcar como não confirmado</option></select></label>
                              <label><span>Justificação (mínimo 5 caracteres)</span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} placeholder="Registe o motivo e a verificação feita pela equipa." /></label>
                              <div><button type="button" onClick={() => setSelectedResolution(null)} disabled={resolveMutation.isPending}>Cancelar</button><button type="button" className="enrollment-primary-button" onClick={() => resolve(enrollment)} disabled={resolveMutation.isPending || note.trim().length < 5}>{resolveMutation.isPending ? 'A guardar…' : 'Guardar resolução'}</button></div>
                            </div>
                          )}
                        </div>
                      )}
                      {enrollment.paymentStatus === 'paid' && enrollment.confirmationEmailStatus === 'failed' && (
                        <div className="enrollment-actions"><button type="button" className="enrollment-primary-button" onClick={() => retryConfirmation(enrollment)} disabled={isResolving}><RefreshCw size={15} />{retryMutation.isPending ? 'A reenviar…' : 'Tentar enviar confirmação'}</button></div>
                      )}
                      {enrollment.actions.length > 0 && (
                        <details className="enrollment-history">
                          <summary>Histórico da equipa ({enrollment.actions.length})</summary>
                          <ol>{[...enrollment.actions].reverse().map((action) => (
                            <li key={action.id}><span className="history-icon"><Clock3 size={14} /></span><div><strong>{action.actionType === 'payment_resolved' ? 'Exceção de pagamento resolvida' : 'Reenvio de confirmação solicitado'}</strong><p>{action.note}{action.confirmationEmailStatus ? ` · E-mail: ${emailLabel(action.confirmationEmailStatus)}` : ''}</p><small>{formatDate(action.createdAt)}</small></div></li>
                          ))}</ol>
                        </details>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
            <p className="enrollment-privacy-note"><ShieldCheck size={15} /> Consulte os dados pessoais apenas para tratar a inscrição. As decisões e tentativas de e-mail ficam registadas.</p>
          </>
        )}
      </div>
      <footer className="enrollment-footer"><span>ACADEMIA PROCENTER</span><span>Operações internas · Inscrições e pagamentos</span></footer>
    </main>
  );
}
