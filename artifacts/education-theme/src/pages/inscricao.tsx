import { useEffect, useState } from 'react';
import { useParams, Link } from 'wouter';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  LoaderCircle,
  ShieldCheck,
} from 'lucide-react';
import type {
  CourseEnrollmentCheckout,
  CourseEnrollmentInput,
  CourseEnrollmentStatus,
} from '@workspace/api-client-react';
import { getGetCourseEnrollmentStatusQueryKey, useCreateCourseEnrollment, useGetCourseEnrollmentStatus, useListPublishedCourses } from '@workspace/api-client-react';
import './inscricao.css';

type EnrollmentForm = Omit<CourseEnrollmentInput, 'privacyAccepted'> & {
  privacyAccepted: boolean;
};

function formatKz(amount: number): string {
  return `${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} Kz`;
}

export default function CourseEnrollmentPage() {
  const { courseId = '' } = useParams<{ courseId: string }>();
  const coursesQuery = useListPublishedCourses();
  const course = coursesQuery.data?.find((entry) => entry.id === courseId);
  const createEnrollment = useCreateCourseEnrollment();
  const [form, setForm] = useState<EnrollmentForm>({
    courseId: courseId as CourseEnrollmentInput['courseId'],
    fullName: '',
    birthDate: '',
    identityNumber: '',
    nationality: '',
    phone: '',
    email: '',
    address: '',
    municipality: '',
    province: '',
    profession: '',
    maritalStatus: '',
    privacyAccepted: false,
  });
  const [checkout, setCheckout] = useState<CourseEnrollmentCheckout | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<CourseEnrollmentStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const statusQuery = useGetCourseEnrollmentStatus(checkout?.id ?? '', {
    query: {
      queryKey: getGetCourseEnrollmentStatusQueryKey(checkout?.id ?? ''),
      enabled: Boolean(checkout?.id && !['paid', 'review_required', 'expired'].includes(paymentStatus?.paymentStatus ?? '')),
      refetchInterval: 5000,
    },
  });

  useEffect(() => {
    setForm((current) => ({
      ...current,
      courseId: courseId as CourseEnrollmentInput['courseId'],
    }));
  }, [courseId]);

  useEffect(() => {
    if (statusQuery.data) setPaymentStatus(statusQuery.data);
  }, [statusQuery.data]);

  function updateField(field: keyof Omit<EnrollmentForm, 'courseId' | 'privacyAccepted'>, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!course || !form.privacyAccepted) return;

    setError('');
    setIsSubmitting(true);
    try {
      const payload: CourseEnrollmentInput = { ...form, privacyAccepted: true };
      const result = await createEnrollment.mutateAsync({ data: payload });
      setCheckout(result);
      setPaymentStatus({
        ...result,
        confirmationEmailStatus: 'pending',
        paidAt: null,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Ocorreu um erro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyReference() {
    if (!checkout) return;
    try {
      await navigator.clipboard.writeText(checkout.paymentReference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Não foi possível copiar. Selecione a referência para a copiar manualmente.');
    }
  }

  if (coursesQuery.isLoading) {
    return <section className="section course-enrollment-section"><div className="container enrollment-container"><div className="enrollment-layout"><div className="enrollment-main"><div className="enrollment-skeleton" aria-busy="true"><span /><span /><span /><span /></div></div></div></div></section>;
  }

  if (coursesQuery.isError) {
    return <section className="section course-enrollment-section"><div className="container enrollment-invalid"><AlertCircle size={30} /><h1>Não foi possível carregar a formação</h1><p>Verifique a ligação e tente novamente.</p><button className="button button-teal" type="button" onClick={() => coursesQuery.refetch()}>Tentar novamente</button></div></section>;
  }

  if (!course) {
    return (
      <section className="section course-enrollment-section">
        <div className="container enrollment-invalid">
          <AlertCircle size={30} />
          <h1>Curso não encontrado</h1>
          <p>Escolha um curso disponível para iniciar a inscrição.</p>
          <Link className="button button-teal" href="/cursos">Ver cursos <ArrowRight size={15} /></Link>
        </div>
      </section>
    );
  }

  if (checkout) {
    const currentStatus = paymentStatus?.paymentStatus ?? checkout.paymentStatus;
    const paid = currentStatus === 'paid';
    const reviewRequired = currentStatus === 'review_required';
    const expired = currentStatus === 'expired';

    return (
      <section className="section course-enrollment-section">
        <div className="container enrollment-container">
          <div className="payment-panel">
            <Link className="enrollment-back" href="/cursos"><ArrowLeft size={15} /> Voltar aos cursos</Link>
            <div className="payment-heading">
              <span className={`payment-state-icon ${paid ? 'is-paid' : reviewRequired || expired ? 'is-attention' : ''}`}>
                {paid ? <CheckCircle2 size={28} /> : reviewRequired || expired ? <AlertCircle size={28} /> : <Clock3 size={28} />}
              </span>
              <div>
                <div className="enrollment-eyebrow">Inscrição {checkout.id.slice(0, 8).toUpperCase()}</div>
                <h1>{paid ? 'Pagamento confirmado' : reviewRequired ? 'Pagamento em análise' : expired ? 'Referência expirada' : 'Finalize a sua inscrição'}</h1>
                <p>
                  {paid
                    ? paymentStatus?.confirmationEmailStatus === 'sent'
                      ? `Enviámos a confirmação para ${form.email}.`
                      : 'O pagamento foi confirmado. A confirmação por e-mail está a ser enviada.'
                    : reviewRequired
                      ? 'Recebemos uma notificação de valor diferente. A equipa da Academia irá verificar o pagamento.'
                      : expired
                        ? 'Esta referência já expirou. Contacte a Academia para gerar uma nova.'
                        : 'Pague com os dados abaixo. A página atualizará o estado automaticamente.'}
                </p>
              </div>
            </div>

            <div className="payment-course-card">
              <img src={course.imageUrl} alt="" />
              <div><span>Curso</span><strong>{course.title}</strong></div>
              <div className="payment-total"><span>Valor</span><strong>{formatKz(checkout.amountKz)}</strong></div>
            </div>

            {!paid && !reviewRequired && !expired && (
              <>
                <div className="payment-instructions">
                  <div className="payment-instruction-header">
                    <h2>Dados para pagamento</h2>
                    <span className="payment-pending"><span /> A aguardar pagamento</span>
                  </div>
                  <p>Na aplicação Multicaixa Express ou num ATM, escolha pagamento por referência e introduza:</p>
                  <div className="payment-detail-grid">
                    <div className="payment-detail"><span>Entidade</span><strong>{checkout.paymentEntity}</strong></div>
                    <div className="payment-detail reference-detail">
                      <span>Referência</span>
                      <div><strong>{checkout.paymentReference}</strong><button type="button" onClick={copyReference} aria-label="Copiar referência">{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Copiada' : 'Copiar'}</button></div>
                    </div>
                    <div className="payment-detail"><span>Montante</span><strong>{formatKz(checkout.amountKz)}</strong></div>
                  </div>
                  <p className="payment-expiry">Válida até {new Date(checkout.expiresAt).toLocaleString('pt-PT', { dateStyle: 'medium', timeStyle: 'short' })}.</p>
                </div>
                <div className="payment-waiting" role="status">
                  <LoaderCircle size={17} className="enrollment-spinner" />
                  <span>À espera da confirmação automática do ProxyPay…</span>
                </div>
              </>
            )}

            {paid && (
              <div className="payment-success" role="status">
                <BadgeCheck size={21} />
                <span>{paymentStatus?.confirmationEmailStatus === 'sent' ? 'Pagamento e e-mail de confirmação concluídos.' : 'Pagamento confirmado; não precisa de fazer mais nada.'}</span>
              </div>
            )}

            <div className="payment-security-note"><ShieldCheck size={16} /> Os dados de pagamento são confirmados pelo ProxyPay. Não envie comprovativos nem dados de cartão por este formulário.</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section course-enrollment-section">
      <div className="container enrollment-container">
        <div className="enrollment-layout">
          <div className="enrollment-main">
            <Link className="enrollment-back" href="/cursos"><ArrowLeft size={15} /> Voltar aos cursos</Link>
            <div className="enrollment-eyebrow">Ficha de inscrição</div>
            <h1>Inscreva-se no curso</h1>
            <p className="enrollment-lead">Preencha os seus dados. Depois, geramos a referência de pagamento do curso.</p>

            <form className="enrollment-form" onSubmit={handleSubmit}>
              <div className="enrollment-section-title"><span>1</span><h2>Dados pessoais</h2></div>
              <label className="enrollment-field enrollment-field-full">
                <span>Nome completo</span>
                <input autoComplete="name" maxLength={160} required value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} />
              </label>
              <div className="enrollment-fields-grid">
                <label className="enrollment-field">
                  <span>Data de nascimento</span>
                  <input type="date" max={new Date().toISOString().slice(0, 10)} required value={form.birthDate} onChange={(event) => updateField('birthDate', event.target.value)} />
                </label>
                <label className="enrollment-field">
                  <span>N.º do BI</span>
                  <input autoComplete="off" maxLength={40} required value={form.identityNumber} onChange={(event) => updateField('identityNumber', event.target.value)} />
                </label>
                <label className="enrollment-field">
                  <span>Nacionalidade</span>
                  <input autoComplete="country-name" maxLength={80} required value={form.nationality} onChange={(event) => updateField('nationality', event.target.value)} />
                </label>
                <label className="enrollment-field">
                  <span>Telefone</span>
                  <input autoComplete="tel" inputMode="tel" maxLength={40} required value={form.phone} onChange={(event) => updateField('phone', event.target.value)} />
                </label>
                <label className="enrollment-field">
                  <span>E-mail</span>
                  <input autoComplete="email" type="email" maxLength={254} required value={form.email} onChange={(event) => updateField('email', event.target.value)} />
                </label>
                <label className="enrollment-field enrollment-field-full">
                  <span>Endereço</span>
                  <input autoComplete="street-address" maxLength={240} required value={form.address} onChange={(event) => updateField('address', event.target.value)} />
                </label>
                <label className="enrollment-field">
                  <span>Município</span>
                  <input maxLength={100} required value={form.municipality} onChange={(event) => updateField('municipality', event.target.value)} />
                </label>
                <label className="enrollment-field">
                  <span>Província</span>
                  <input autoComplete="address-level1" maxLength={100} required value={form.province} onChange={(event) => updateField('province', event.target.value)} />
                </label>
                <label className="enrollment-field">
                  <span>Profissão</span>
                  <input autoComplete="organization-title" maxLength={120} required value={form.profession} onChange={(event) => updateField('profession', event.target.value)} />
                </label>
                <label className="enrollment-field">
                  <span>Estado civil</span>
                  <select required value={form.maritalStatus} onChange={(event) => updateField('maritalStatus', event.target.value)}>
                    <option value="" disabled>Selecione</option>
                    <option>Solteiro(a)</option>
                    <option>Casado(a)</option>
                    <option>União de facto</option>
                    <option>Divorciado(a)</option>
                    <option>Viúvo(a)</option>
                  </select>
                </label>
              </div>

              <label className="enrollment-consent">
                <input type="checkbox" checked={form.privacyAccepted} onChange={(event) => setForm((current) => ({ ...current, privacyAccepted: event.target.checked }))} required />
                <span>Autorizo a utilização destes dados para tratar a minha inscrição, pagamento e comunicações relacionadas com este curso.</span>
              </label>

              {error && <p className="enrollment-error" role="alert"><AlertCircle size={16} />{error}</p>}
              <button className="enrollment-submit" type="submit" disabled={isSubmitting || !form.privacyAccepted}>
                {isSubmitting ? <><LoaderCircle className="enrollment-spinner" size={17} /> A preparar pagamento…</> : <>Continuar para pagamento <ArrowRight size={16} /></>}
              </button>
            </form>
          </div>

          <aside className="enrollment-summary">
            <img className="enrollment-course-image" src={course.imageUrl} alt={`Cartaz do curso ${course.title}`} />
            <div className="enrollment-summary-body">
              <span className="enrollment-summary-label">A sua formação</span>
              <h2>{course.title}</h2>
              <p>{course.description}</p>
              <ul>
                <li><Clock3 size={16} />{course.duration}</li>
                <li><BadgeCheck size={16} />Certificado reconhecido pelo INEFOP</li>
                <li><BookOpen size={16} />Manual de apoio incluído</li>
              </ul>
              <div className="enrollment-summary-price"><span>Inscrição gratuita</span><strong>{formatKz(course.priceKz)}</strong><small>Investimento total do curso</small></div>
              <div className="enrollment-summary-note"><ShieldCheck size={15} /> Pagamento por referência Multicaixa, validado automaticamente.</div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
