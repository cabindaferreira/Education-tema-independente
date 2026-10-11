import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowLeft, ArrowRight, BadgeCheck, BookOpen, Check, Clock3, GraduationCap, Menu,
  Phone, UsersRound, Users, X,
} from 'lucide-react';
import { useCheckRoomAvailability, useCreateRoomReservation, useListRooms } from '@workspace/api-client-react';
import type { ReservationPeriod, Room, RoomAvailability, RoomReservation, RoomSlot } from '@workspace/api-client-react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const navItems = [
  ['Início', '#home'], ['Cursos', '#courses'], ['Salas', '#categories'],
  ['Eventos', '#events'], ['Contactos', '#contact'], ['Sobre Nós', '#benefits'],
];

const courses = [
  {
    title: 'Estágio Formativo em CRM',
    image: '/images/courses/crm.jpg',
    description: 'Desenvolva competências práticas para gerir o relacionamento com clientes e apoiar as rotinas comerciais.',
    price: '100.000 Kz',
    duration: 'Estágio de 3 meses',
  },
  {
    title: 'Estágio Formativo em Tesouraria',
    image: '/images/courses/tesouraria.jpg',
    description: 'Aprenda a acompanhar operações de tesouraria, organizar registos e apoiar o controlo financeiro.',
    price: '100.000 Kz',
    duration: 'Estágio de 3 meses',
  },
  {
    title: 'Liderança e Gestão de Equipas',
    image: '/images/courses/lideranca-equipas.jpg',
    description: 'Prepare-se para coordenar equipas, comunicar objetivos e apoiar a execução do trabalho.',
    price: '100.000 Kz',
    duration: 'Estágio de 3 meses',
  },
  {
    title: 'Estágio Formativo em Gestão Comercial',
    image: '/images/courses/gestao-comercial.jpg',
    description: 'Desenvolva competências práticas em gestão de vendas, acompanhamento comercial e relação com clientes.',
    price: '100.000 Kz',
    duration: 'Estágio de 3 meses',
  },
  {
    title: 'Gestão e Administração de Empresas',
    image: '/images/courses/gestao-empresas.jpg',
    description: 'Conheça práticas de planeamento, organização e gestão das atividades de uma empresa.',
    price: '100.000 Kz',
    duration: 'Estágio de 3 meses',
  },
  {
    title: 'Gestão de Recursos Humanos',
    image: '/images/courses/recursos-humanos.jpg',
    description: 'Explore os fundamentos da gestão de pessoas e do apoio às rotinas de recursos humanos.',
    price: '100.000 Kz',
    duration: 'Estágio de 3 meses',
  },
];

type BookingFormValues = {
  name: string;
  nif: string;
  company: string;
  date: string;
  period: ReservationPeriod;
  durationHours: string;
};

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string') return error;
  return 'Não foi possível concluir o pedido. Tente novamente.';
}

function reservationFailureMessage(error: unknown) {
  const detail = errorMessage(error);
  const status = typeof error === 'object' && error !== null && 'status' in error
    ? Number((error as { status?: unknown }).status)
    : 0;
  if (status === 409 || /conflict|already booked|not available|indisponível|conflito/i.test(detail)) {
    return 'Este horário deixou de estar disponível. Consulte novamente os horários e escolha uma vaga aberta.';
  }
  return detail;
}

function localDateValue() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function formatKz(value: number) {
  return `${new Intl.NumberFormat('pt-PT').format(value)} Kz`;
}

function roomPeriods(roomId: Room['id']): ReservationPeriod[] {
  if (roomId === 'sala-ondjango') return ['session'];
  return ['standard', 'after_hours'];
}

function defaultRoomPeriod(roomId: Room['id']): ReservationPeriod {
  return roomId === 'sala-ondjango' ? 'session' : 'standard';
}

function defaultRoomDuration(roomId: Room['id']) {
  return roomId === 'sala-soba' || roomId === 'sala-kilamba' ? '6' : '1';
}

function roomDurationMinimum(roomId: Room['id']) {
  return roomId === 'sala-soba' || roomId === 'sala-kilamba' ? 6 : 1;
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);
  const visibleCourses = showAllCourses ? courses : courses.slice(0, 3);
  const roomsQuery = useListRooms();
  const availabilityMutation = useCheckRoomAvailability();
  const reservationMutation = useCreateRoomReservation();
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [bookingStep, setBookingStep] = useState<'identity' | 'availability' | 'confirmation'>('identity');
  const [availability, setAvailability] = useState<RoomAvailability | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<RoomSlot | null>(null);
  const [reservation, setReservation] = useState<RoomReservation | null>(null);
  const [availabilityError, setAvailabilityError] = useState('');
  const [reservationError, setReservationError] = useState('');
  const form = useForm<BookingFormValues>({
    defaultValues: { name: '', nif: '', company: '', date: localDateValue(), period: 'standard', durationHours: '1' },
    mode: 'onTouched',
  });
  const selectedDate = form.watch('date');
  const selectedPeriod = form.watch('period');
  const selectedDuration = form.watch('durationHours');

  useEffect(() => {
    setAvailability(null);
    setSelectedSlot(null);
    setAvailabilityError('');
    setReservationError('');
  }, [activeRoom?.id, selectedDate, selectedPeriod, selectedDuration]);

  function closeMenu() {
    setMenuOpen(false);
  }

  function joinNewsletter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email.trim()) setJoined(true);
  }

  function beginBooking(room: Room) {
    setActiveRoom(room);
    setBookingStep('identity');
    setAvailability(null);
    setSelectedSlot(null);
    setReservation(null);
    setAvailabilityError('');
    setReservationError('');
    form.reset({
      name: '',
      nif: '',
      company: '',
      date: localDateValue(),
      period: defaultRoomPeriod(room.id),
      durationHours: defaultRoomDuration(room.id),
    });
  }

  function closeBooking() {
    setActiveRoom(null);
    setAvailability(null);
    setSelectedSlot(null);
    setReservation(null);
    setAvailabilityError('');
    setReservationError('');
  }

  async function continueToAvailability() {
    if (await form.trigger(['name', 'nif'])) setBookingStep('availability');
  }

  async function findAvailableSlots() {
    if (!activeRoom) return;
    const values = form.getValues();
    const needsDuration = values.period === 'standard';
    if (!(await form.trigger(needsDuration ? ['date', 'period', 'durationHours'] : ['date', 'period']))) return;
    setAvailabilityError('');
    setAvailability(null);
    setSelectedSlot(null);
    try {
      const result = await availabilityMutation.mutateAsync({
        data: {
          roomId: activeRoom.id,
          date: values.date,
          period: values.period,
          ...(needsDuration ? { durationHours: Number(values.durationHours) } : {}),
        },
      });
      setAvailability(result);
    } catch (error) {
      setAvailabilityError(errorMessage(error));
    }
  }

  async function submitReservation() {
    if (!activeRoom || !availability || !selectedSlot) return;
    setReservationError('');
    const values = form.getValues();
    try {
      const result = await reservationMutation.mutateAsync({
        data: {
          roomId: activeRoom.id,
          date: availability.date,
          slotId: selectedSlot.id,
          period: selectedSlot.period,
          ...(selectedSlot.period === 'standard' ? { durationHours: Number(values.durationHours) } : {}),
          name: values.name.trim(),
          nif: values.nif.trim(),
          ...(values.company.trim() ? { company: values.company.trim() } : {}),
        },
      });
      setReservation(result);
      setBookingStep('confirmation');
      try {
        const refreshed = await availabilityMutation.mutateAsync({
          data: {
            roomId: activeRoom.id,
            date: availability.date,
            period: values.period,
            ...(values.period === 'standard' ? { durationHours: Number(values.durationHours) } : {}),
          },
        });
        setAvailability(refreshed);
      } catch {
        setAvailability(null);
      }
    } catch (error) {
      setReservationError(reservationFailureMessage(error));
      setAvailability(null);
      setSelectedSlot(null);
    }
  }

  return (
    <main className="site-shell">
      <section className="hero" id="home">
        <div className="topline">
          <div className="container topline-inner">
            <a className="topbrand" href="#home" aria-label="Página inicial da Academia">ACADEMIA<small>FORMAÇÃO ONLINE &amp; APRENDIZAGEM</small></a>
            <div className="top-details">
              <div className="top-detail"><Clock3 size={20} /><span>Segunda a sexta<br /><strong>08h00–20h00</strong></span></div>
              <a className="top-detail" href="tel:+244921001668" style={{ color: 'inherit', textDecoration: 'none' }}><Phone size={19} /><span>Ligue-nos<br /><strong>+244 921 001 668</strong></span></a>
              <div className="socials" aria-label="Redes sociais"><a href="#contact" aria-label="Facebook">f</a><a href="#contact" aria-label="X">x</a><a href="#contact" aria-label="Instagram">ig</a><a href="#contact" aria-label="LinkedIn">in</a></div>
            </div>
          </div>
        </div>
        <header className="nav-wrap">
          <div className="container nav">
            <a className="brand" href="#home" onClick={closeMenu} aria-label="Página inicial da Academia"><span className="brand-mark"><img src="/favicon.svg" alt="" /></span><span>ACADEMIA</span></a>
            <button className="menu-toggle" type="button" aria-label={menuOpen ? 'Fechar navegação' : 'Abrir navegação'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)} data-testid="button-mobile-menu">
              {menuOpen ? <X size={23} /> : <Menu size={23} />}
            </button>
            <nav className={`nav-links ${menuOpen ? 'open' : ''}`} aria-label="Navegação principal">
              {navItems.map(([label, href]) => <a key={href} href={href} onClick={closeMenu}>{label}</a>)}
              <a className="nav-cta" href="#courses" onClick={closeMenu}>VER FORMAÇÕES <ArrowRight size={13} /></a>
            </nav>
          </div>
        </header>
        <div className="container">
          <div className="hero-content">
            <div className="eyebrow">Bem-vindo à Academia</div>
            <h1>Aprenda novas competências online com professores experientes</h1>
            <p className="hero-copy">Cursos práticos de tecnologia, design, negócios e música, orientados por profissionais. Aprenda ao seu ritmo e receba um certificado no final.</p>
            <div className="actions">
              <a className="button button-teal" href="#courses">COMECE AGORA <ArrowRight size={14} /></a>
              <a className="button button-white" href="#courses">VER CURSOS <ArrowRight size={14} /></a>
            </div>
          </div>
        </div>
        <div className="hero-scroll" aria-hidden="true" />
      </section>
      <section className="section courses" id="courses">
        <div className="container">
          <div className="section-heading compact">
            <div className="eyebrow">Formações profissionais</div>
            <h2>Encontre a sua próxima formação</h2>
            <p>Inscrição gratuita, estágio de três meses e certificado de conclusão reconhecido pelo INEFOP.</p>
          </div>
          <div className="course-grid" id="course-grid">
            {visibleCourses.map((course, index) => (
              <article className="course-card" key={course.title} data-testid={`card-course-${index}`}>
                <div className="course-art">
                  <img src={course.image} alt={`Cartaz do curso ${course.title}`} loading="eager" />
                </div>
                <div className="course-body">
                  <div className="course-meta">
                    <span className="course-duration"><Clock3 size={14} />{course.duration}</span>
                    <span className="course-enrollment">Sem taxa de inscrição</span>
                  </div>
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <ul className="course-highlights">
                    <li><BadgeCheck size={15} /><span>Certificado reconhecido pelo INEFOP</span></li>
                    <li><BookOpen size={15} /><span>Manual de apoio incluído</span></li>
                  </ul>
                  <div className="course-bottom"><span>Investimento total</span><strong>{course.price}</strong></div>
                  <a
                    className="course-cta"
                    href={`mailto:academia@procenter.co.ao?subject=${encodeURIComponent(`Inscrição: ${course.title}`)}`}
                  >
                    Quero inscrever-me <ArrowRight size={14} />
                  </a>
                </div>
              </article>
            ))}
          </div>
          <div className="course-more">
            <button
              className="button button-outline"
              type="button"
              aria-expanded={showAllCourses}
              aria-controls="course-grid"
              onClick={() => setShowAllCourses((current) => !current)}
            >
              {showAllCourses ? 'VER MENOS' : 'VER MAIS CURSOS'}
              <ArrowRight className={showAllCourses ? 'course-more-icon expanded' : 'course-more-icon'} size={14} />
            </button>
          </div>
        </div>
      </section>
      <section className="benefits" id="benefits">
        <div className="container">
          <div className="section-heading">
            <div className="eyebrow">Sobre a Academia</div>
            <h2>Competências úteis para o dia a dia.</h2>
            <p>Aprenda algo útil com quem conhece o tema. Integre novas ideias no seu dia a dia e aproxime-se dos seus próximos objetivos.</p>
          </div>
          <div className="benefit-grid">
            <article className="benefit"><div className="benefit-icon"><BookOpen size={22} /></div><h3>Aprenda competências práticas</h3><p>Todos os cursos ajudam a pôr em prática aquilo que aprendeu.</p></article>
            <article className="benefit"><div className="benefit-icon"><UsersRound size={22} /></div><h3>Aprenda com especialistas</h3><p>Receba orientação de profissionais que usam estas competências no dia a dia.</p></article>
            <article className="benefit"><div className="benefit-icon"><GraduationCap size={23} /></div><h3>Obtenha um certificado</h3><p>Assinale o seu progresso com um certificado que reconhece o que alcançou.</p></article>
          </div>
          <div className="stats" aria-label="A Academia em números">
            <div className="stat"><strong>12 480+</strong><span>Alunos satisfeitos</span></div>
            <div className="stat"><strong>86</strong><span>Docentes especialistas</span></div>
            <div className="stat"><strong>240+</strong><span>Cursos online</span></div>
            <div className="stat"><strong>4,8/5</strong><span>Avaliação dos alunos</span></div>
          </div>
        </div>
      </section>
      <section className="section categories" id="categories">
        <div className="container">
          <div className="section-heading compact">
            <div className="eyebrow">Espaços Academia Procenter</div>
            <h2>Uma sala certa para cada encontro.</h2>
            <p>Conheça os nossos espaços, compare capacidade e facilidades e consulte os horários realmente disponíveis.</p>
          </div>
          {roomsQuery.isLoading ? (
            <div className="room-grid" aria-label="A carregar salas" data-testid="status-rooms-loading">
              {[0, 1, 2, 3].map((item) => <div className="room-skeleton" key={item}><div /><span /><span /><span /></div>)}
            </div>
          ) : roomsQuery.isError ? (
            <div className="rooms-state rooms-error" role="alert" data-testid="status-rooms-error">
              <strong>Não foi possível carregar as salas.</strong>
              <p>Verifique a ligação e tente novamente.</p>
              <button className="button button-outline" type="button" onClick={() => roomsQuery.refetch()} data-testid="button-retry-rooms">TENTAR NOVAMENTE</button>
            </div>
          ) : !roomsQuery.data?.length ? (
            <div className="rooms-state" data-testid="status-rooms-empty">
              <strong>Não há salas disponíveis neste momento.</strong>
              <p>Volte a consultar mais tarde ou contacte a Academia.</p>
            </div>
          ) : (
            <div className="room-grid">
              {roomsQuery.data.map((room) => (
                <article className="room-card" key={room.id} data-testid={`card-room-${room.id}`}>
                  <div className="room-image-wrap">
                    <img className="room-image" src={room.image} alt={`Imagem de ${room.name}`} loading="lazy" data-testid={`img-room-${room.id}`} />
                    <span className="room-capacity" data-testid={`text-room-capacity-${room.id}`}><Users size={15} /> Até {room.capacity} lugares</span>
                  </div>
                  <div className="room-content">
                    <div className="room-title-row"><span className="room-kicker">ACADEMIA PROCENTER</span><span className="room-id">{room.id}</span></div>
                    <h3 data-testid={`text-room-name-${room.id}`}>{room.name}</h3>
                    <p className="room-description" data-testid={`text-room-description-${room.id}`}>{room.description}</p>
                    <div className="room-facilities">
                      <h4>Facilidades</h4>
                      <ul>{room.facilities.map((facility, index) => <li key={`${room.id}-${facility}`} data-testid={`text-room-facility-${room.id}-${index}`}><Check size={14} />{facility}</li>)}</ul>
                    </div>
                    {!!room.rateDetails.length && <div className="room-rates"><span>Informação de tarifas</span><ul>{room.rateDetails.map((detail, index) => <li key={`${room.id}-rate-${index}`} data-testid={`text-room-rate-${room.id}-${index}`}>{detail}</li>)}</ul></div>}
                    <button className="room-book-button" type="button" onClick={() => beginBooking(room)} data-testid={`button-reserve-${room.id}`}>
                      Reservar esta sala <ArrowRight size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
      {activeRoom && (
        <div className="booking-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeBooking(); }}>
          <section className="booking-panel" role="dialog" aria-modal="true" aria-labelledby="booking-title" onKeyDown={(event) => { if (event.key === 'Escape') closeBooking(); }} data-testid="dialog-room-booking">
            <div className="booking-panel-head">
              <div><span className="booking-overline">RESERVA DE ESPAÇO</span><h2 id="booking-title">{activeRoom.name}</h2></div>
              <button className="booking-close" type="button" aria-label="Fechar reserva" onClick={closeBooking} data-testid="button-close-booking"><X size={20} /></button>
            </div>
            {bookingStep !== 'confirmation' && <div className="booking-progress" aria-label={`Etapa ${bookingStep === 'identity' ? '1' : '2'} de 2`}><span className={bookingStep === 'identity' ? 'current' : 'complete'}>01 <b>Os seus dados</b></span><i /><span className={bookingStep === 'availability' ? 'current' : ''}>02 <b>Horário</b></span></div>}
            {bookingStep === 'confirmation' && reservation ? (
              <div className="booking-confirmation" role="status" data-testid="status-reservation-confirmed">
                <div className="confirmation-mark"><Check size={25} /></div>
                <span className="booking-overline">PEDIDO REGISTADO</span>
                <h3>Pedido de reserva registado</h3>
                <p>A Academia Procenter registou o pedido. Consulte abaixo os dados devolvidos pelo sistema.</p>
                <dl>
                  <div><dt>Sala</dt><dd data-testid="text-reservation-room">{reservation.roomName}</dd></div>
                  <div><dt>Data</dt><dd data-testid="text-reservation-date">{reservation.date}</dd></div>
                  <div><dt>Horário</dt><dd data-testid="text-reservation-time">{reservation.startTime} – {reservation.endTime}</dd></div>
                  <div><dt>Duração</dt><dd data-testid="text-reservation-duration">{reservation.durationMinutes} minutos</dd></div>
                  <div><dt>Valor</dt><dd data-testid="text-reservation-price">{formatKz(reservation.priceKz)}</dd></div>
                  <div><dt>Estado</dt><dd data-testid="text-reservation-status">{reservation.status}</dd></div>
                </dl>
                <button className="room-book-button" type="button" onClick={closeBooking} data-testid="button-close-confirmation">Concluir</button>
              </div>
            ) : (
              <Form {...form}>
                <form className="booking-form" onSubmit={(event) => event.preventDefault()}>
                  {bookingStep === 'identity' ? (
                    <>
                      <p className="booking-intro">Comece por indicar os dados necessários para identificar a reserva.</p>
                      <FormField control={form.control} name="name" rules={{ required: 'Indique o seu nome.', minLength: { value: 2, message: 'O nome deve ter pelo menos 2 caracteres.' }, maxLength: { value: 120, message: 'O nome não pode exceder 120 caracteres.' } }} render={({ field }) => (
                        <FormItem className="booking-field"><FormLabel>Nome</FormLabel><FormControl><input {...field} autoComplete="name" placeholder="Nome completo" data-testid="input-booking-name" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="nif" rules={{ required: 'Indique o NIF.', minLength: { value: 3, message: 'O NIF deve ter pelo menos 3 caracteres.' }, maxLength: { value: 32, message: 'O NIF não pode exceder 32 caracteres.' } }} render={({ field }) => (
                        <FormItem className="booking-field"><FormLabel>NIF</FormLabel><FormControl><input {...field} autoComplete="off" placeholder="Número de Identificação Fiscal" data-testid="input-booking-nif" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="company" rules={{ maxLength: { value: 160, message: 'A empresa não pode exceder 160 caracteres.' } }} render={({ field }) => (
                        <FormItem className="booking-field"><FormLabel>Empresa <span>(opcional)</span></FormLabel><FormControl><input {...field} autoComplete="organization" placeholder="Nome da empresa" data-testid="input-booking-company" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <button className="room-book-button" type="button" onClick={continueToAvailability} data-testid="button-booking-continue">Continuar para horários <ArrowRight size={15} /></button>
                    </>
                  ) : (
                    <>
                      <button className="booking-back" type="button" onClick={() => setBookingStep('identity')} data-testid="button-booking-back"><ArrowLeft size={14} /> Voltar aos dados</button>
                      <p className="booking-intro">Escolha a data, o período e a duração. Só serão apresentados horários abertos pela Academia.</p>
                      <div className="booking-fields-row">
                        <FormField control={form.control} name="date" rules={{ required: 'Escolha uma data.' }} render={({ field }) => (
                          <FormItem className="booking-field"><FormLabel>Data</FormLabel><FormControl><input {...field} type="date" min={localDateValue()} data-testid="input-booking-date" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="period" rules={{ required: 'Escolha um período.' }} render={({ field }) => (
                          <FormItem className="booking-field"><FormLabel>Período</FormLabel><FormControl><select {...field} onChange={(event) => {
                            field.onChange(event);
                            if (event.target.value === 'standard') form.setValue('durationHours', defaultRoomDuration(activeRoom.id), { shouldValidate: true });
                          }} data-testid="select-booking-period">
                            {roomPeriods(activeRoom.id).map((period) => <option value={period} key={period}>
                              {period === 'standard' ? 'Horário normal' : period === 'after_hours' ? 'Pós-laboral (17:00–20:00)' : 'Sessões fixas'}
                            </option>)}
                          </select></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      {selectedPeriod === 'standard' && <FormField control={form.control} name="durationHours" rules={{
                        required: 'Escolha a duração.',
                        validate: (value) => (Number(value) >= roomDurationMinimum(activeRoom.id) && Number(value) <= 9) || `Escolha entre ${roomDurationMinimum(activeRoom.id)} e 9 horas.`,
                      }} render={({ field }) => (
                        <FormItem className="booking-field"><FormLabel>Duração</FormLabel><FormControl><select {...field} data-testid="select-booking-duration">{Array.from({ length: 10 - roomDurationMinimum(activeRoom.id) }, (_, index) => {
                          const hours = roomDurationMinimum(activeRoom.id) + index;
                          return <option value={String(hours)} key={hours}>{hours} horas</option>;
                        })}</select></FormControl><FormMessage /></FormItem>
                      )} />}
                      <button className="room-book-button" type="button" onClick={findAvailableSlots} disabled={availabilityMutation.isPending} data-testid="button-check-availability">
                        {availabilityMutation.isPending ? 'A consultar horários…' : 'Ver horários disponíveis'} <Clock3 size={15} />
                      </button>
                      {availabilityError && <p className="booking-error" role="alert" data-testid="status-availability-error">{availabilityError}</p>}
                      {availability && (
                        <div className="slot-results" data-testid="list-available-slots">
                          <h3>Horários disponíveis <span>{availability.date}</span></h3>
                          {availability.slots.length ? <div className="slot-grid">{availability.slots.map((slot) => (
                            <button className={`slot-option ${selectedSlot?.id === slot.id ? 'selected' : ''}`} type="button" key={slot.id} aria-pressed={selectedSlot?.id === slot.id} onClick={() => { setSelectedSlot(slot); setReservationError(''); }} data-testid={`button-select-slot-${slot.id}`}>
                              <strong>{slot.startTime} – {slot.endTime}</strong><span>{slot.durationMinutes} min</span><b>{formatKz(slot.priceKz)}</b>
                            </button>
                          ))}</div> : <div className="slot-empty" data-testid="status-no-slots">Não existem horários disponíveis para estes critérios. Experimente outra data, período ou duração.</div>}
                        </div>
                      )}
                      {reservationError && <p className="booking-error" role="alert" data-testid="status-reservation-error">{reservationError} Consulte novamente os horários e escolha uma vaga aberta.</p>}
                      {selectedSlot && <button className="room-book-button confirm-booking-button" type="button" onClick={submitReservation} disabled={reservationMutation.isPending} data-testid="button-submit-reservation">
                        {reservationMutation.isPending ? 'A registar reserva…' : `Confirmar reserva · ${formatKz(selectedSlot.priceKz)}`} <ArrowRight size={15} />
                      </button>}
                    </>
                  )}
                </form>
              </Form>
            )}
          </section>
        </div>
      )}
      <section className="section testimonials" id="team">
        <div className="container">
          <div className="section-heading compact">
            <div className="eyebrow">Uma comunidade que aprende em conjunto</div>
            <h2>Continuar a aprender abre novas possibilidades.</h2>
          </div>
          <div className="testimonial-grid">
            <article className="quote-main">
              <div className="quote-mark">“</div>
              <div className="stars" aria-label="5 de 5 estrelas">★★★★★</div>
              <blockquote>Cheguei à Academia para mudar de carreira e encontrei muito mais do que um curso. A docente ajudou-me a acreditar nas minhas ideias e terminei com um projeto de que me orgulho.</blockquote>
              <div className="person"><div className="avatar">JM</div><div><strong>Jordan Mitchell</strong><span>Finalista de Design UX</span></div></div>
            </article>
            <article className="quote-side">
              <div className="stars" aria-label="5 de 5 estrelas">★★★★★</div>
              <blockquote>“Finalmente, uma aprendizagem que cabe na vida real. Pude estudar depois do trabalho, esclarecer dúvidas e aplicar o que aprendi logo no dia seguinte.”</blockquote>
              <div className="person"><div className="avatar">AS</div><div><strong>Amara Singh</strong><span>Aluna de Pequenos Negócios</span></div></div>
            </article>
          </div>
        </div>
      </section>
      <section className="section journal" id="events">
        <div className="container">
          <div className="section-heading compact">
            <div className="eyebrow">Aprender em conjunto</div>
            <h2>Eventos da Academia</h2>
            <p>Oficinas, aulas abertas e encontros com especialistas. As datas serão anunciadas em breve.</p>
          </div>
          <div className="journal-grid">
            <article className="journal-card"><div className="journal-art journal-one"><span>Oficina</span></div><div className="journal-body"><div className="journal-meta">ONLINE · DATA A ANUNCIAR</div><h3>Design UX: da ideia ao protótipo</h3><p>Uma sessão prática para transformar uma ideia numa experiência digital clara.</p><a className="read-more" href="#contact">SABER MAIS <ArrowRight size={12} /></a></div></article>
            <article className="journal-card"><div className="journal-art journal-two"><span>Aula aberta</span></div><div className="journal-body"><div className="journal-meta">ONLINE · DATA A ANUNCIAR</div><h3>Os primeiros passos na programação</h3><p>Descubra os fundamentos da web numa aula acessível a quem está a começar.</p><a className="read-more" href="#contact">SABER MAIS <ArrowRight size={12} /></a></div></article>
            <article className="journal-card"><div className="journal-art journal-three"><span>Conversa</span></div><div className="journal-body"><div className="journal-meta">ONLINE · DATA A ANUNCIAR</div><h3>Conversa com docentes da Academia</h3><p>Conheça os nossos especialistas e coloque as suas questões sobre os cursos.</p><a className="read-more" href="#contact">SABER MAIS <ArrowRight size={12} /></a></div></article>
          </div>
        </div>
      </section>
      <section className="newsletter" id="newsletter">
        <div className="container newsletter-inner">
          <div><div className="eyebrow">Inspiração, de vez em quando</div><h2>Abra espaço para o próximo passo.</h2><p>Receba cursos novos, ideias úteis e histórias dos nossos alunos.</p></div>
          <div>
            {joined ? <p className="form-status" role="status">Obrigado pelo interesse. Esta pré-visualização não guarda endereços de e-mail.</p> : <form className="newsletter-form" onSubmit={joinNewsletter}>
              <label className="sr-only" htmlFor="newsletter-email">O seu endereço de e-mail</label>
              <input id="newsletter-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="O seu endereço de e-mail" required data-testid="input-newsletter-email" />
              <button className="button button-teal" type="submit" data-testid="button-newsletter-submit">INSCREVER-ME <ArrowRight size={14} /></button>
            </form>}
            {!joined && <p className="form-note">Pré-visualização — os endereços de e-mail não são guardados.</p>}
          </div>
        </div>
      </section>
      <footer className="footer" id="contact">
        <div className="container">
          <div className="footer-grid">
            <div><a className="brand" href="#home"><span className="brand-mark"><img src="/favicon.svg" alt="" /></span><span>ACADEMIA</span></a><p className="footer-brand-copy">Aprendizagem prática para pessoas curiosas. Comece onde está e descubra até onde pode chegar.</p></div>
            <div><h4>Explorar</h4><div className="footer-links"><a href="#benefits">Sobre nós</a><a href="#courses">Cursos e valores</a><a href="#categories">Salas de aprendizagem</a></div></div>
            <div><h4>Academia</h4><div className="footer-links"><a href="#team">Os nossos alunos</a><a href="#events">Eventos</a><a href="#newsletter">Boletim informativo</a><a href="#home">Voltar ao início</a></div></div>
            <div><h4>Contactos</h4><div className="footer-links"><a href="mailto:academia@procenter.co.ao">academia@procenter.co.ao</a><a href="tel:+244921001668">+244 921 001 668</a><span>Av. 21 de Janeiro, Cassequel<br />Edifício Procenter, em frente ao Banco BIC</span></div></div>
          </div>
          <div className="footer-bottom"><span>© 2025 Academia. A aprendizagem é para todos.</span><span>Aprenda bem. <a href="#home">Mantenha a curiosidade.</a></span></div>
        </div>
      </footer>
    </main>
  );
}

export default App;
