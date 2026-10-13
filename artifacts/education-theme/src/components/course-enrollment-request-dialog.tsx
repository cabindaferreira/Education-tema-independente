import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, LoaderCircle } from 'lucide-react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import type { CourseEnrollmentRequestInput } from '@workspace/api-client-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useCreateCourseEnrollmentRequest } from '@workspace/api-client-react';
import './course-enrollment-request-dialog.css';

const enrollmentRequestSchema = z.object({
  courseId: z.enum([
    'crm',
    'tesouraria',
    'lideranca-equipas',
    'gestao-comercial',
    'gestao-empresas',
    'recursos-humanos',
  ]),
  fullName: z.string().trim().min(2, 'Indique o seu nome completo.').max(120, 'O nome é demasiado longo.'),
  phone: z.string()
    .trim()
    .min(7, 'Indique um número de telefone válido.')
    .max(24, 'O telefone é demasiado longo.')
    .regex(/^\+?[\d\s().-]+$/, 'Use apenas números e símbolos de telefone.')
    .refine((value) => value.replace(/\D/g, '').length >= 7, 'Indique pelo menos 7 algarismos.'),
  email: z.string().trim().email('Indique um endereço de e-mail válido.').max(320, 'O e-mail é demasiado longo.'),
  privacyAccepted: z.boolean().refine((accepted) => accepted, 'É necessário aceitar o aviso de privacidade.'),
});

type EnrollmentRequestForm = z.infer<typeof enrollmentRequestSchema>;

type Course = {
  id: CourseEnrollmentRequestInput['courseId'];
  title: string;
};

type CourseEnrollmentRequestDialogProps = {
  course: Course;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CourseEnrollmentRequestDialog({
  course,
  open,
  onOpenChange,
}: CourseEnrollmentRequestDialogProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const requestMutation = useCreateCourseEnrollmentRequest();
  const form = useForm<EnrollmentRequestForm>({
    resolver: zodResolver(enrollmentRequestSchema),
    defaultValues: {
      courseId: course.id as EnrollmentRequestForm['courseId'],
      fullName: '',
      phone: '',
      email: '',
      privacyAccepted: false,
    },
    mode: 'onBlur',
  });

  async function sendRequest(values: EnrollmentRequestForm) {
    setSubmitError(false);
    try {
      await requestMutation.mutateAsync({ data: { ...values, privacyAccepted: true } });
      setSubmitted(true);
    } catch {
      setSubmitError(true);
    }
  }

  const errors = form.formState.errors;
  const busy = requestMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="course-request-dialog" data-testid="dialog-course-request">
        <DialogHeader className="course-request-header">
          <span className="course-request-eyebrow">Pedido de inscrição</span>
          <DialogTitle>{submitted ? 'Pedido recebido' : course.title}</DialogTitle>
          <DialogDescription>
            {submitted
              ? 'A equipa da Academia recebeu os seus dados.'
              : 'Deixe os seus contactos e a nossa equipa falará consigo sobre esta formação.'}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="course-request-success" role="status" aria-live="polite" data-testid="status-course-request-success">
            <CheckCircle2 aria-hidden="true" size={28} />
            <p>O seu pedido foi enviado com sucesso. A equipa da Academia Procenter entrará em contacto consigo.</p>
          </div>
        ) : (
          <Form {...form}>
            <form className="course-request-form" onSubmit={form.handleSubmit(sendRequest as SubmitHandler<EnrollmentRequestForm>)} noValidate>
              <input type="hidden" {...form.register('courseId')} />

              <label className="course-request-field">
                <span>Nome completo</span>
                <Input
                  autoComplete="name"
                  maxLength={120}
                  placeholder="O seu nome"
                  disabled={busy}
                  aria-invalid={!!errors.fullName}
                  aria-describedby={errors.fullName ? 'course-request-name-error' : undefined}
                  data-testid="input-course-request-name"
                  {...form.register('fullName')}
                />
                {errors.fullName && <small id="course-request-name-error" className="course-request-field-error">{errors.fullName.message}</small>}
              </label>

              <label className="course-request-field">
                <span>Telefone</span>
                <Input
                  type="tel"
                  autoComplete="tel"
                  maxLength={24}
                  placeholder="+244 923 456 789"
                  disabled={busy}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'course-request-phone-error' : undefined}
                  data-testid="input-course-request-phone"
                  {...form.register('phone')}
                />
                {errors.phone && <small id="course-request-phone-error" className="course-request-field-error">{errors.phone.message}</small>}
              </label>

              <label className="course-request-field">
                <span>E-mail</span>
                <Input
                  type="email"
                  autoComplete="email"
                  maxLength={320}
                  placeholder="nome@exemplo.com"
                  disabled={busy}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'course-request-email-error' : undefined}
                  data-testid="input-course-request-email"
                  {...form.register('email')}
                />
                {errors.email && <small id="course-request-email-error" className="course-request-field-error">{errors.email.message}</small>}
              </label>

              <div className="course-request-privacy">
                <p>Os seus dados serão enviados por e-mail à equipa da Academia Procenter apenas para responder a este pedido. Não serão adicionados à newsletter.</p>
                <label className="course-request-consent">
                  <input
                    type="checkbox"
                    disabled={busy}
                    aria-invalid={!!errors.privacyAccepted}
                    aria-describedby={errors.privacyAccepted ? 'course-request-privacy-error' : undefined}
                    data-testid="checkbox-course-request-privacy"
                    {...form.register('privacyAccepted')}
                  />
                  <span>Li e aceito o uso dos meus dados para responder a este pedido.</span>
                </label>
                {errors.privacyAccepted && <small id="course-request-privacy-error" className="course-request-field-error">{errors.privacyAccepted.message}</small>}
              </div>

              {submitError && (
                <p className="course-request-submit-error" role="alert" data-testid="status-course-request-error">
                  Não foi possível enviar o pedido agora. Tente novamente mais tarde.
                </p>
              )}

              <button className="course-request-submit" type="submit" disabled={busy} data-testid="button-course-request-submit">
                {busy ? <><LoaderCircle size={16} className="course-request-spinner" /> A ENVIAR…</> : 'PEDIR INSCRIÇÃO'}
              </button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
