import { useMemo, useState } from 'react';
import { useAuth } from '@clerk/react';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  DoorOpen,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import {
  RoomId,
  getListRoomReservationsQueryKey,
  useCancelRoomReservation,
  useListRoomReservations,
  useListRooms,
  type RoomStaffReservation,
} from '@workspace/api-client-react';
import './equipa-reservas.css';

const roomChoices = [
  { id: RoomId['sala-soba'], label: 'Sala Soba' },
  { id: RoomId['sala-kilamba'], label: 'Sala Kilamba' },
  { id: RoomId['sala-kudi'], label: 'Sala Kudi' },
  { id: RoomId['sala-ondjango'], label: 'Sala Ondjango' },
] as const;

function localDateString() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function errorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const value = error as { status?: unknown; response?: { status?: unknown } };
  const status = value.status ?? value.response?.status;
  return typeof status === 'number' ? status : undefined;
}

function formatLongDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (!value || Number.isNaN(date.getTime())) return 'Data não seleccionada';
  return new Intl.DateTimeFormat('pt-AO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('pt-AO', { maximumFractionDigits: 0 }).format(value);
}

function formatCancellationDateTime(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('pt-AO', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function getBookingTime(reservation: RoomStaffReservation) {
  return `${reservation.startTime} – ${reservation.endTime}`;
}

export default function StaffReservationsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const roomsQuery = useListRooms();
  const [roomId, setRoomId] = useState<(typeof roomChoices)[number]['id']>(RoomId['sala-soba']);
  const [date, setDate] = useState(localDateString);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const params = useMemo(() => ({ roomId, date }), [roomId, date]);
  const reservationsQuery = useListRoomReservations(params, {
    query: {
      enabled: Boolean(isLoaded && isSignedIn && roomsQuery.data && /^\d{4}-\d{2}-\d{2}$/.test(date)),
      queryKey: getListRoomReservationsQueryKey(params),
    },
  });
  const cancelReservation = useCancelRoomReservation();
  const reservations = reservationsQuery.data ?? [];
  const confirmedCount = reservations.filter((reservation) => reservation.status === 'confirmed').length;
  const cancelledCount = reservations.filter((reservation) => reservation.status === 'cancelled').length;
  const queryIsForbidden = errorStatus(reservationsQuery.error) === 403;
  const cancelIsForbidden = errorStatus(cancelReservation.error) === 403;

  const handleCancel = (reservation: RoomStaffReservation) => {
    if (reservation.status !== 'confirmed' || cancelReservation.isPending) return;
    const accepted = window.confirm(
      `Cancelar a reserva de ${reservation.name} às ${reservation.startTime}? O horário ficará disponível novamente.`,
    );
    if (!accepted) return;
    setCancellingId(reservation.id);
    cancelReservation.mutate({ id: reservation.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRoomReservationsQueryKey(params) });
        setCancellingId(null);
      },
      onError: () => setCancellingId(null),
    });
  };

  if (!isLoaded) {
    return (
      <main className="staff-reservations" data-testid="page-reservations-loading" aria-busy="true">
        <div className="staff-loading">
          <div className="staff-loading-bar" />
          <div className="staff-loading-heading" />
          <div className="staff-loading-controls" />
          <div className="staff-loading-row" />
          <div className="staff-loading-row" />
        </div>
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="staff-reservations staff-access-page" data-testid="page-reservations-signed-out">
        <section className="staff-gate-card">
          <span className="staff-gate-icon"><LockKeyhole size={22} /></span>
          <p className="staff-overline">ÁREA DA EQUIPA</p>
          <h1>Entre para consultar as reservas.</h1>
          <p>Esta área é reservada à equipa Academia Procenter. Inicie sessão para continuar.</p>
          <Link className="staff-primary-link" href="/sign-in" data-testid="link-reservations-sign-in">Iniciar sessão</Link>
          <Link className="staff-return-link" href="/" data-testid="link-reservations-home"><ArrowLeft size={15} /> Voltar ao site</Link>
        </section>
      </main>
    );
  }

  const roomOptions = roomsQuery.data?.length
    ? roomsQuery.data.map((room) => ({ id: room.id, label: room.name }))
    : roomChoices;
  const roomName = roomsQuery.data?.find((room) => room.id === roomId)?.name
    ?? roomChoices.find((room) => room.id === roomId)?.label
    ?? 'Sala';
  const roomIsUnavailable = roomsQuery.isError;
  const isForbidden = queryIsForbidden || cancelIsForbidden;

  return (
    <main className="staff-reservations" data-testid="page-staff-reservations">
      <header className="staff-topbar">
        <div className="staff-topbar-inner">
          <Link className="staff-brand" href="/" aria-label="Academia Procenter, página inicial" data-testid="link-staff-brand">
            <img src="/favicon.svg" alt="" />
            <span>ACADEMIA<small>PROCENTER · EQUIPA</small></span>
          </Link>
          <div className="staff-topbar-meta"><span className="staff-secure-dot" /> Área interna <span className="staff-topbar-separator">/</span> Reservas</div>
          <Link className="staff-exit-link" href="/equipa" data-testid="link-admin-dashboard">Painel</Link>
          <Link className="staff-exit-link" href="/equipa/salas" data-testid="link-room-settings">Preços e horários</Link>
          <Link className="staff-exit-link" href="/equipa/inscricoes" data-testid="link-course-enrollments">Inscrições</Link>
          <Link className="staff-exit-link" href="/" data-testid="link-staff-exit">Voltar ao site <ArrowLeft size={14} /></Link>
        </div>
      </header>

      <div className="staff-main">
        <div className="staff-breadcrumb" aria-label="Caminho de navegação">
          <Link href="/" data-testid="link-reservations-breadcrumb-home">Academia</Link><span>/</span><span>Equipa</span><span>/</span><strong>Reservas</strong>
        </div>

        <section className="staff-heading">
          <div>
            <p className="staff-overline"><span /> OPERAÇÕES · SALAS</p>
            <h1>Reservas da equipa</h1>
            <p className="staff-heading-copy">Confirme o movimento do dia e liberte horários cancelados.</p>
          </div>
          <div className="staff-date-note"><CalendarDays size={17} /><span>Agenda de<br /><strong data-testid="text-selected-date-long">{formatLongDate(date)}</strong></span></div>
        </section>

        <section className="staff-filter-panel" aria-label="Filtros de reservas">
          <div className="staff-filter-intro">
            <span className="staff-filter-icon"><DoorOpen size={18} /></span>
            <div><strong>Ver agenda</strong><span>Escolha a sala e o dia</span></div>
          </div>
          <label className="staff-filter-field">
            <span>Sala</span>
            <select value={roomId} onChange={(event) => setRoomId(event.target.value as (typeof roomChoices)[number]['id'])} data-testid="select-reservation-room">
              {roomOptions.map((room) => <option value={room.id} key={room.id}>{room.label}</option>)}
            </select>
          </label>
          <label className="staff-filter-field staff-date-field">
            <span>Data</span>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} data-testid="input-reservation-date" />
          </label>
          <div className="staff-filter-foot"><ShieldCheck size={15} /> Dados visíveis apenas à equipa autorizada</div>
        </section>

        {isForbidden && (
          <section className="staff-alert staff-alert-denied" role="alert" data-testid="status-reservations-forbidden">
            <span className="staff-alert-icon"><LockKeyhole size={19} /></span>
            <div><strong>Acesso restrito à equipa autorizada</strong><p>A sua sessão está activa, mas esta conta não tem a função privada de equipa necessária para consultar ou gerir reservas. Peça acesso a um responsável Academia Procenter.</p></div>
          </section>
        )}

        {cancelReservation.isError && !cancelIsForbidden && (
          <section className="staff-alert staff-alert-error" role="alert" data-testid="status-cancel-error">
            <AlertCircle size={18} /><div><strong>Não foi possível cancelar a reserva.</strong><p>O horário não foi alterado. Tente novamente.</p></div>
            <button type="button" onClick={() => cancelReservation.reset()} data-testid="button-dismiss-cancel-error" aria-label="Fechar aviso"><X size={17} /></button>
          </section>
        )}

        {!isForbidden && (
          <>
            <section className="staff-overview" aria-label="Resumo da agenda">
                <div className="staff-overview-copy"><span className="staff-overview-label">AGENDA DA DATA SELECCIONADA</span><strong data-testid="text-agenda-title">{roomName}</strong><span data-testid="text-agenda-date">{formatLongDate(date)}</span></div>
              <div className="staff-overview-stats">
                <div><strong data-testid="text-confirmed-count">{reservationsQuery.isLoading ? '—' : confirmedCount}</strong><span>Confirmadas</span></div>
                <div><strong data-testid="text-cancelled-count">{reservationsQuery.isLoading ? '—' : cancelledCount}</strong><span>Canceladas</span></div>
                <div><strong data-testid="text-total-count">{reservationsQuery.isLoading ? '—' : reservations.length}</strong><span>Total do dia</span></div>
              </div>
            </section>

            <section className="staff-schedule-section" aria-labelledby="schedule-title">
              <div className="staff-schedule-heading">
                <div><p className="staff-overline">HORÁRIOS DO DIA</p><h2 id="schedule-title">Agenda <span>{roomName}</span></h2></div>
                {reservationsQuery.isError && !queryIsForbidden && (
                  <button type="button" className="staff-retry-button" onClick={() => reservationsQuery.refetch()} data-testid="button-retry-reservations"><RefreshCw size={15} /> Tentar novamente</button>
                )}
              </div>

              {roomIsUnavailable && (
                <div className="staff-state staff-state-error" role="alert" data-testid="status-rooms-error">
                  <AlertCircle size={21} /><strong>Não foi possível carregar as salas.</strong><p>Verifique a ligação e tente novamente.</p>
                  <button type="button" onClick={() => roomsQuery.refetch()} data-testid="button-retry-rooms">Tentar novamente</button>
                </div>
              )}
              {reservationsQuery.isLoading && (
                <div className="staff-skeleton-list" aria-label="A carregar reservas" aria-busy="true" data-testid="status-reservations-loading">
                  {[0, 1, 2].map((item) => <div className="staff-booking-skeleton" key={item}><span /><span /><span /><span /></div>)}
                </div>
              )}
              {reservationsQuery.isError && !queryIsForbidden && !roomIsUnavailable && (
                <div className="staff-state staff-state-error" role="alert" data-testid="status-reservations-error">
                  <AlertCircle size={21} /><strong>Não foi possível carregar a agenda.</strong><p>Os dados continuam protegidos. Verifique a ligação e volte a tentar.</p>
                  <button type="button" onClick={() => reservationsQuery.refetch()} data-testid="button-retry-reservations-state">Tentar novamente</button>
                </div>
              )}
              {!reservationsQuery.isLoading && !reservationsQuery.isError && !roomIsUnavailable && reservations.length === 0 && (
                <div className="staff-state staff-state-empty" data-testid="status-reservations-empty">
                  <span className="staff-empty-icon"><CalendarDays size={23} /></span>
                  <strong>{date ? 'Dia sem reservas.' : 'Seleccione uma data.'}</strong>
                  <p>{date ? `Não existem reservas para ${roomName} em ${formatLongDate(date)}. Os horários estão livres.` : 'Escolha um dia no filtro acima para consultar a agenda da sala.'}</p>
                </div>
              )}
              {!reservationsQuery.isLoading && !reservationsQuery.isError && reservations.length > 0 && (
                <div className="staff-booking-list" data-testid="list-room-reservations">
                  {reservations.map((reservation, index) => (
                    <article className={`staff-booking ${reservation.status === 'cancelled' ? 'is-cancelled' : ''}`} key={reservation.id} data-testid={`card-reservation-${reservation.id}`} style={{ animationDelay: `${Math.min(index * 45, 225)}ms` }}>
                      <div className="staff-booking-time"><Clock3 size={16} /><strong>{getBookingTime(reservation)}</strong><span>{reservation.durationMinutes} min</span></div>
                      <div className="staff-booking-person">
                        <span className="staff-person-mark"><UserRound size={17} /></span>
                        <div><strong data-testid={`text-reservation-name-${reservation.id}`}>{reservation.name}</strong><span data-testid={`text-reservation-company-${reservation.id}`}>{reservation.company || 'Reserva individual'}</span></div>
                      </div>
                      <div className="staff-booking-price"><span>Valor</span><strong data-testid={`text-reservation-price-${reservation.id}`}>{formatPrice(reservation.priceKz)} <small>Kz</small></strong></div>
                      <div className="staff-booking-state">
                        <div className={`staff-status-pill ${reservation.status}`} data-testid={`status-reservation-${reservation.id}`}>
                          <span />{reservation.status === 'confirmed' ? 'Confirmada' : 'Cancelada'}
                        </div>
                        {reservation.status === 'cancelled' && (
                          <p className="staff-cancel-audit" data-testid={`text-reservation-cancellation-${reservation.id}`}>
                            {reservation.cancelledAt && formatCancellationDateTime(reservation.cancelledAt)
                              ? `Cancelada por ${reservation.cancelledBy || 'membro da equipa'} em ${formatCancellationDateTime(reservation.cancelledAt)}`
                              : 'Cancelada antes do registo de auditoria.'}
                          </p>
                        )}
                      </div>
                      {reservation.status === 'confirmed' ? (
                        <button
                          className="staff-cancel-button"
                          type="button"
                          onClick={() => handleCancel(reservation)}
                          disabled={cancelReservation.isPending}
                          data-testid={`button-cancel-reservation-${reservation.id}`}
                          aria-label={`Cancelar reserva de ${reservation.name}`}
                        >
                          {cancellingId === reservation.id ? <span className="staff-button-pulse" /> : <X size={15} />}
                          <span>{cancellingId === reservation.id ? 'A cancelar' : 'Cancelar'}</span>
                        </button>
                      ) : (
                        <span className="staff-released"><Check size={15} /> Horário libertado</span>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
            <p className="staff-privacy-note"><ShieldCheck size={15} /> A informação de clientes é confidencial. Consulte apenas o necessário para gerir reservas.</p>
          </>
        )}
      </div>
      <footer className="staff-footer"><span>ACADEMIA PROCENTER</span><span>Operações internas · Reservas de salas</span></footer>
    </main>
  );
}
