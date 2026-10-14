import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Clock3, Images, Users, X } from 'lucide-react';
import { getListRoomPhotosQueryKey, getListRoomsQueryKey, useCheckRoomAvailability, useCreateRoomReservation, useListRoomPhotos, useListRooms } from '@workspace/api-client-react';
import type { ReservationPeriod, Room, RoomAvailability, RoomReservation, RoomSlot } from '@workspace/api-client-react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PageIntro } from '@/components/site-layout';

type BookingFormValues = { name: string; nif: string; company: string; date: string; period: ReservationPeriod; durationHours: string };

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string') return error;
  return 'Não foi possível concluir o pedido. Tente novamente.';
}
function reservationFailureMessage(error: unknown) {
  const detail = errorMessage(error);
  const status = typeof error === 'object' && error !== null && 'status' in error ? Number((error as { status?: unknown }).status) : 0;
  if (status === 409 || /conflict|already booked|not available|indisponível|conflito/i.test(detail)) return 'Este horário deixou de estar disponível. Consulte novamente os horários e escolha uma vaga aberta.';
  return detail;
}
function localDateValue() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}
function formatKz(value: number) { return `${new Intl.NumberFormat('pt-PT').format(value)} Kz`; }
function roomPeriods(roomId: Room['id']): ReservationPeriod[] { return roomId === 'sala-ondjango' ? ['session'] : ['standard', 'after_hours']; }
function defaultRoomPeriod(roomId: Room['id']): ReservationPeriod { return roomId === 'sala-ondjango' ? 'session' : 'standard'; }
function defaultRoomDuration(roomId: Room['id']) { return roomId === 'sala-soba' || roomId === 'sala-kilamba' ? '6' : '1'; }
function roomDurationMinimum(roomId: Room['id']) { return roomId === 'sala-soba' || roomId === 'sala-kilamba' ? 6 : 1; }

export default function RoomsPage() {
  const roomsQuery = useListRooms({
    query: {
      queryKey: getListRoomsQueryKey(),
      refetchInterval: 30_000,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
    },
  });
  const availabilityMutation = useCheckRoomAvailability();
  const reservationMutation = useCreateRoomReservation();
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [galleryRoom, setGalleryRoom] = useState<Room | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [bookingStep, setBookingStep] = useState<'identity' | 'availability' | 'confirmation'>('identity');
  const [availability, setAvailability] = useState<RoomAvailability | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<RoomSlot | null>(null);
  const [reservation, setReservation] = useState<RoomReservation | null>(null);
  const [availabilityError, setAvailabilityError] = useState('');
  const [reservationError, setReservationError] = useState('');
  const form = useForm<BookingFormValues>({ defaultValues: { name: '', nif: '', company: '', date: localDateValue(), period: 'standard', durationHours: '1' }, mode: 'onTouched' });
  const selectedDate = form.watch('date');
  const selectedPeriod = form.watch('period');
  const selectedDuration = form.watch('durationHours');
  const galleryPhotosQuery = useListRoomPhotos(galleryRoom?.id ?? 'sala-soba', {
    query: {
      queryKey: getListRoomPhotosQueryKey(galleryRoom?.id ?? 'sala-soba'),
      enabled: Boolean(galleryRoom),
    },
  });
  const galleryPhotos = galleryRoom
    ? galleryPhotosQuery.data?.length
      ? [
          ...galleryPhotosQuery.data,
          { id: 0, title: galleryRoom.name, altText: `Vista principal de ${galleryRoom.name}`, url: galleryRoom.image, sortOrder: Number.MAX_SAFE_INTEGER },
        ]
      : [{ id: 0, title: galleryRoom.name, altText: `Vista principal de ${galleryRoom.name}`, url: galleryRoom.image, sortOrder: 0 }]
    : [];
  const currentGalleryPhoto = galleryPhotos[galleryIndex];

  useEffect(() => {
    setAvailability(null); setSelectedSlot(null); setAvailabilityError(''); setReservationError('');
  }, [activeRoom?.id, selectedDate, selectedPeriod, selectedDuration]);

  function beginBooking(room: Room) {
    setActiveRoom(room); setBookingStep('identity'); setAvailability(null); setSelectedSlot(null); setReservation(null); setAvailabilityError(''); setReservationError('');
    form.reset({ name: '', nif: '', company: '', date: localDateValue(), period: defaultRoomPeriod(room.id), durationHours: defaultRoomDuration(room.id) });
  }
  function closeBooking() {
    setActiveRoom(null); setAvailability(null); setSelectedSlot(null); setReservation(null); setAvailabilityError(''); setReservationError('');
  }
  function openGallery(room: Room) {
    setGalleryRoom(room);
    setGalleryIndex(0);
  }
  async function continueToAvailability() {
    if (await form.trigger(['name', 'nif'])) setBookingStep('availability');
  }
  async function findAvailableSlots() {
    if (!activeRoom) return;
    const values = form.getValues();
    const needsDuration = values.period === 'standard';
    if (!(await form.trigger(needsDuration ? ['date', 'period', 'durationHours'] : ['date', 'period']))) return;
    setAvailabilityError(''); setAvailability(null); setSelectedSlot(null);
    try {
      const result = await availabilityMutation.mutateAsync({ data: { roomId: activeRoom.id, date: values.date, period: values.period, ...(needsDuration ? { durationHours: Number(values.durationHours) } : {}) } });
      setAvailability(result);
    } catch (error) { setAvailabilityError(errorMessage(error)); }
  }
  async function submitReservation() {
    if (!activeRoom || !availability || !selectedSlot) return;
    setReservationError('');
    const values = form.getValues();
    try {
      const result = await reservationMutation.mutateAsync({ data: {
        roomId: activeRoom.id, date: availability.date, slotId: selectedSlot.id, period: selectedSlot.period,
        ...(selectedSlot.period === 'standard' ? { durationHours: Number(values.durationHours) } : {}),
        name: values.name.trim(), nif: values.nif.trim(), ...(values.company.trim() ? { company: values.company.trim() } : {}),
      } });
      setReservation(result); setBookingStep('confirmation');
      try {
        const refreshed = await availabilityMutation.mutateAsync({ data: { roomId: activeRoom.id, date: availability.date, period: values.period, ...(values.period === 'standard' ? { durationHours: Number(values.durationHours) } : {}) } });
        setAvailability(refreshed);
      } catch { setAvailability(null); }
    } catch (error) { setReservationError(reservationFailureMessage(error)); setAvailability(null); setSelectedSlot(null); }
  }

  return <>
    <PageIntro eyebrow="Espaços Academia Procenter" title="Uma sala certa para cada encontro." description="Conheça os nossos espaços, compare capacidade e facilidades e consulte os horários realmente disponíveis." />
    <section className="section categories mt-[-130px] mb-[-130px]"><div className="container">
      {roomsQuery.isLoading ? <div className="room-grid" aria-label="A carregar salas" data-testid="status-rooms-loading">{[0, 1, 2, 3].map((item) => <div className="room-skeleton" key={item}><div /><span /><span /><span /></div>)}</div>
        : roomsQuery.isError ? <div className="rooms-state rooms-error" role="alert" data-testid="status-rooms-error"><strong>Não foi possível carregar as salas.</strong><p>Verifique a ligação e tente novamente.</p><button className="button button-outline" type="button" onClick={() => roomsQuery.refetch()} data-testid="button-retry-rooms">TENTAR NOVAMENTE</button></div>
        : !roomsQuery.data?.length ? <div className="rooms-state" data-testid="status-rooms-empty"><strong>Não há salas disponíveis neste momento.</strong><p>Volte a consultar mais tarde ou contacte a Academia.</p></div>
         : <div className="room-grid">{roomsQuery.data.map((room) => <article className="room-card" key={room.id} data-testid={`card-room-${room.id}`}>
           <div className="room-image-wrap"><button className="room-gallery-trigger" type="button" onClick={() => openGallery(room)} aria-label={`Abrir catálogo de fotografias de ${room.name}`} data-testid={`button-room-gallery-${room.id}`}><img className={`room-image ${room.id === 'sala-kilamba' ? 'mt-[-13px] mb-[-13px]' : ''}`} src={room.image} alt={`Imagem de ${room.name}`} loading="lazy" data-testid={`img-room-${room.id}`} /><span className="room-gallery-hint"><Images size={15} /> Ver fotografias</span></button><span className="room-capacity" data-testid={`text-room-capacity-${room.id}`}><Users size={15} /> Até {room.capacity} lugares</span></div>
          <div className="room-content"><div className="room-title-row"><span className="room-kicker">ACADEMIA PROCENTER</span><span className="room-id">{room.id}</span></div><h3 data-testid={`text-room-name-${room.id}`}>{room.name}</h3><p className="room-description" data-testid={`text-room-description-${room.id}`}>{room.description}</p>
            <div className="room-facilities"><h4>Facilidades</h4><ul>{room.facilities.map((facility, index) => <li key={`${room.id}-${facility}`} data-testid={`text-room-facility-${room.id}-${index}`}><Check size={14} />{facility}</li>)}</ul></div>
            {!!room.rateDetails.length && <div className="room-rates"><span>Informação de tarifas</span><ul>{room.rateDetails.map((detail, index) => <li key={`${room.id}-rate-${index}`} data-testid={`text-room-rate-${room.id}-${index}`}>{detail}</li>)}</ul></div>}
             <button className="room-gallery-cta" type="button" onClick={() => openGallery(room)} data-testid={`button-room-gallery-cta-${room.id}`}><Images size={15} /> Ver catálogo de fotografias <ArrowRight size={14} /></button>
             <button className="room-book-button" type="button" onClick={() => beginBooking(room)} data-testid={`button-reserve-${room.id}`}>Reservar esta sala <ArrowRight size={15} /></button>
          </div>
        </article>)}</div>}
    </div></section>
     {galleryRoom && <div className="room-gallery-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setGalleryRoom(null); }}>
       <section className="room-gallery-dialog" role="dialog" aria-modal="true" aria-labelledby="room-gallery-title" tabIndex={-1} onKeyDown={(event) => { if (event.key === 'Escape') setGalleryRoom(null); else if (event.key === 'ArrowRight') setGalleryIndex((index) => (index + 1) % Math.max(galleryPhotos.length, 1)); else if (event.key === 'ArrowLeft') setGalleryIndex((index) => (index - 1 + galleryPhotos.length) % Math.max(galleryPhotos.length, 1)); }} data-testid="dialog-room-gallery">
         <header className="room-gallery-head"><div><span className="booking-overline">CATÁLOGO DE FOTOGRAFIAS</span><h2 id="room-gallery-title">{galleryRoom.name}</h2><p>{galleryPhotos.length} {galleryPhotos.length === 1 ? 'fotografia' : 'fotografias'}</p></div><button className="booking-close" type="button" aria-label="Fechar catálogo" onClick={() => setGalleryRoom(null)} data-testid="button-close-room-gallery"><X size={20} /></button></header>
         <div className="room-gallery-stage">
           {currentGalleryPhoto && <img src={currentGalleryPhoto.url} alt={currentGalleryPhoto.altText || currentGalleryPhoto.title} data-testid="img-room-gallery-active" />}
           {galleryPhotos.length > 1 && <><button className="room-gallery-arrow prev" type="button" aria-label="Fotografia anterior" onClick={() => setGalleryIndex((index) => (index - 1 + galleryPhotos.length) % galleryPhotos.length)} data-testid="button-room-gallery-previous"><ChevronLeft size={22} /></button><button className="room-gallery-arrow next" type="button" aria-label="Fotografia seguinte" onClick={() => setGalleryIndex((index) => (index + 1) % galleryPhotos.length)} data-testid="button-room-gallery-next"><ChevronRight size={22} /></button></>}
           <span className="room-gallery-counter">{galleryIndex + 1} / {galleryPhotos.length}</span>
         </div>
         {galleryPhotosQuery.isLoading && <p className="room-gallery-note" role="status">A carregar fotografias adicionais…</p>}
         {galleryPhotosQuery.isError && <p className="room-gallery-note error" role="alert">Não foi possível carregar as fotografias. <button type="button" onClick={() => galleryPhotosQuery.refetch()}>Tentar novamente</button></p>}
         {!galleryPhotosQuery.isLoading && !galleryPhotosQuery.isError && galleryPhotosQuery.data?.length === 0 && <p className="room-gallery-note">Ainda não foram adicionadas outras fotografias desta sala.</p>}
         {galleryPhotos.length > 1 && <div className="room-gallery-thumbnails" aria-label="Fotografias da sala">{galleryPhotos.map((photo, index) => <button className={`room-gallery-thumb ${index === galleryIndex ? 'selected' : ''}`} type="button" key={photo.id} onClick={() => setGalleryIndex(index)} aria-label={`Ver fotografia ${index + 1}: ${photo.title}`} aria-pressed={index === galleryIndex} data-testid={`button-room-gallery-photo-${index}`}><img src={photo.url} alt="" loading="lazy" /></button>)}</div>}
       </section>
     </div>}
    {activeRoom && <div className="booking-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeBooking(); }}>
      <section className="booking-panel" role="dialog" aria-modal="true" aria-labelledby="booking-title" onKeyDown={(event) => { if (event.key === 'Escape') closeBooking(); }} data-testid="dialog-room-booking">
        <div className="booking-panel-head"><div><span className="booking-overline">RESERVA DE ESPAÇO</span><h2 id="booking-title">{activeRoom.name}</h2></div><button className="booking-close" type="button" aria-label="Fechar reserva" onClick={closeBooking} data-testid="button-close-booking"><X size={20} /></button></div>
        {bookingStep !== 'confirmation' && <div className="booking-progress" aria-label={`Etapa ${bookingStep === 'identity' ? '1' : '2'} de 2`}><span className={bookingStep === 'identity' ? 'current' : 'complete'}>01 <b>Os seus dados</b></span><i /><span className={bookingStep === 'availability' ? 'current' : ''}>02 <b>Horário</b></span></div>}
        {bookingStep === 'confirmation' && reservation ? <div className="booking-confirmation" role="status" data-testid="status-reservation-confirmed">
          <div className="confirmation-mark"><Check size={25} /></div><span className="booking-overline">PEDIDO REGISTADO</span><h3>Pedido de reserva registado</h3><p>A Academia Procenter registou o pedido. Consulte abaixo os dados devolvidos pelo sistema.</p>
          <dl><div><dt>Sala</dt><dd data-testid="text-reservation-room">{reservation.roomName}</dd></div><div><dt>Data</dt><dd data-testid="text-reservation-date">{reservation.date}</dd></div><div><dt>Horário</dt><dd data-testid="text-reservation-time">{reservation.startTime} – {reservation.endTime}</dd></div><div><dt>Duração</dt><dd data-testid="text-reservation-duration">{reservation.durationMinutes} minutos</dd></div><div><dt>Valor</dt><dd data-testid="text-reservation-price">{formatKz(reservation.priceKz)}</dd></div><div><dt>Estado</dt><dd data-testid="text-reservation-status">{reservation.status}</dd></div></dl>
          <button className="room-book-button" type="button" onClick={closeBooking} data-testid="button-close-confirmation">Concluir</button>
        </div> : <Form {...form}><form className="booking-form" onSubmit={(event) => event.preventDefault()}>
          {bookingStep === 'identity' ? <>
            <p className="booking-intro">Comece por indicar os dados necessários para identificar a reserva.</p>
            <FormField control={form.control} name="name" rules={{ required: 'Indique o seu nome.', minLength: { value: 2, message: 'O nome deve ter pelo menos 2 caracteres.' }, maxLength: { value: 120, message: 'O nome não pode exceder 120 caracteres.' } }} render={({ field }) => <FormItem className="booking-field"><FormLabel>Nome</FormLabel><FormControl><input {...field} autoComplete="name" placeholder="Nome completo" data-testid="input-booking-name" /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="nif" rules={{ required: 'Indique o NIF.', minLength: { value: 3, message: 'O NIF deve ter pelo menos 3 caracteres.' }, maxLength: { value: 32, message: 'O NIF não pode exceder 32 caracteres.' } }} render={({ field }) => <FormItem className="booking-field"><FormLabel>NIF</FormLabel><FormControl><input {...field} autoComplete="off" placeholder="Número de Identificação Fiscal" data-testid="input-booking-nif" /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="company" rules={{ maxLength: { value: 160, message: 'A empresa não pode exceder 160 caracteres.' } }} render={({ field }) => <FormItem className="booking-field"><FormLabel>Empresa <span>(opcional)</span></FormLabel><FormControl><input {...field} autoComplete="organization" placeholder="Nome da empresa" data-testid="input-booking-company" /></FormControl><FormMessage /></FormItem>} />
            <button className="room-book-button" type="button" onClick={continueToAvailability} data-testid="button-booking-continue">Continuar para horários <ArrowRight size={15} /></button>
          </> : <>
            <button className="booking-back" type="button" onClick={() => setBookingStep('identity')} data-testid="button-booking-back"><ArrowLeft size={14} /> Voltar aos dados</button><p className="booking-intro">Escolha a data, o período e a duração. Só serão apresentados horários abertos pela Academia.</p>
            <div className="booking-fields-row">
              <FormField control={form.control} name="date" rules={{ required: 'Escolha uma data.' }} render={({ field }) => <FormItem className="booking-field"><FormLabel>Data</FormLabel><FormControl><input {...field} type="date" min={localDateValue()} data-testid="input-booking-date" /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="period" rules={{ required: 'Escolha um período.' }} render={({ field }) => <FormItem className="booking-field"><FormLabel>Período</FormLabel><FormControl><select {...field} onChange={(event) => { field.onChange(event); if (event.target.value === 'standard') form.setValue('durationHours', defaultRoomDuration(activeRoom.id), { shouldValidate: true }); }} data-testid="select-booking-period">{roomPeriods(activeRoom.id).map((period) => <option value={period} key={period}>{period === 'standard' ? 'Horário normal' : period === 'after_hours' ? 'Pós-laboral (17:00–20:00)' : 'Sessões fixas'}</option>)}</select></FormControl><FormMessage /></FormItem>} />
            </div>
            {selectedPeriod === 'standard' && <FormField control={form.control} name="durationHours" rules={{ required: 'Escolha a duração.', validate: (value) => (Number(value) >= roomDurationMinimum(activeRoom.id) && Number(value) <= 9) || `Escolha entre ${roomDurationMinimum(activeRoom.id)} e 9 horas.` }} render={({ field }) => <FormItem className="booking-field"><FormLabel>Duração</FormLabel><FormControl><select {...field} data-testid="select-booking-duration">{Array.from({ length: 10 - roomDurationMinimum(activeRoom.id) }, (_, index) => { const hours = roomDurationMinimum(activeRoom.id) + index; return <option value={String(hours)} key={hours}>{hours} horas</option>; })}</select></FormControl><FormMessage /></FormItem>} />}
            <button className="room-book-button" type="button" onClick={findAvailableSlots} disabled={availabilityMutation.isPending} data-testid="button-check-availability">{availabilityMutation.isPending ? 'A consultar horários…' : 'Ver horários disponíveis'} <Clock3 size={15} /></button>
            {availabilityError && <p className="booking-error" role="alert" data-testid="status-availability-error">{availabilityError}</p>}
            {availability && <div className="slot-results" data-testid="list-available-slots"><h3>Horários disponíveis <span>{availability.date}</span></h3>{availability.slots.length ? <div className="slot-grid">{availability.slots.map((slot) => <button className={`slot-option ${selectedSlot?.id === slot.id ? 'selected' : ''}`} type="button" key={slot.id} aria-pressed={selectedSlot?.id === slot.id} onClick={() => { setSelectedSlot(slot); setReservationError(''); }} data-testid={`button-select-slot-${slot.id}`}><strong>{slot.startTime} – {slot.endTime}</strong><span>{slot.durationMinutes} min</span><b>{formatKz(slot.priceKz)}</b></button>)}</div> : <div className="slot-empty" data-testid="status-no-slots">Não existem horários disponíveis para estes critérios. Experimente outra data, período ou duração.</div>}</div>}
            {reservationError && <p className="booking-error" role="alert" data-testid="status-reservation-error">{reservationError} Consulte novamente os horários e escolha uma vaga aberta.</p>}
            {selectedSlot && <button className="room-book-button confirm-booking-button" type="button" onClick={submitReservation} disabled={reservationMutation.isPending} data-testid="button-submit-reservation">{reservationMutation.isPending ? 'A registar reserva…' : `Confirmar reserva · ${formatKz(selectedSlot.priceKz)}`} <ArrowRight size={15} /></button>}
          </>}
        </form></Form>}
      </section>
    </div>}
  </>;
}
