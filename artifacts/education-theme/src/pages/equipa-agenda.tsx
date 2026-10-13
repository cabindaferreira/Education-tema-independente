import { useMemo, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Check, Clock3, DoorOpen, LockKeyhole, Plus, RefreshCw, Trash2, UserRound, X } from 'lucide-react';
import { getGetAdminAgendaQueryKey, getListRoomsQueryKey, useCreateAdminRoomBlock, useGetAdminAgenda, useListRooms, useReleaseAdminRoomBlock, type GetAdminAgendaParams, type RoomId } from '@workspace/api-client-react';
import { AdminPage, formatKz } from '@/components/admin-shell';

function today() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
const roomChoices: { id: RoomId; name: string }[] = [
  { id: 'sala-soba', name: 'Sala Soba' }, { id: 'sala-kilamba', name: 'Sala Kilamba' },
  { id: 'sala-kudi', name: 'Sala Kudi' }, { id: 'sala-ondjango', name: 'Sala Ondjango' },
];
function AgendaContent() {
  const client = useQueryClient();
  const rooms = useListRooms({ query: { queryKey: getListRoomsQueryKey(), retry: 1 } });
  const [roomId, setRoomId] = useState<RoomId>('sala-soba');
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('20:00');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const params = useMemo<GetAdminAgendaParams>(() => ({ roomId, date }), [roomId, date]);
  const agenda = useGetAdminAgenda(params, { query: { queryKey: getGetAdminAgendaQueryKey(params), retry: 1 } });
  const createBlock = useCreateAdminRoomBlock();
  const releaseBlock = useReleaseAdminRoomBlock();
  const roomName = rooms.data?.find(room => room.id === roomId)?.name ?? roomChoices.find(room => room.id === roomId)?.name ?? 'Sala';
  const refresh = () => client.invalidateQueries({ queryKey: getGetAdminAgendaQueryKey(params) });
  const addBlock = (event: FormEvent) => {
    event.preventDefault(); setError(''); setNotice('');
    if (endTime <= startTime) { setError('A hora de fim deve ser posterior à hora de início.'); return; }
    createBlock.mutate({ data: { roomId, date, startTime, endTime, reason: reason.trim() } }, { onSuccess: () => { refresh(); setReason(''); setNotice('Indisponibilidade registada na agenda.'); }, onError: e => setError(e instanceof Error ? e.message : 'Não foi possível bloquear este horário.') });
  };
  const release = (id: number) => {
    if (!window.confirm('Libertar este horário? A disponibilidade da sala será reposta.')) return;
    setError(''); setNotice('');
    releaseBlock.mutate({ id }, { onSuccess: () => { refresh(); setNotice('Horário libertado.'); }, onError: e => setError(e instanceof Error ? e.message : 'Não foi possível libertar o horário.') });
  };
  const reservations = agenda.data?.reservations ?? [];
  const blocks = agenda.data?.blocks ?? [];
  return <AdminPage title="Agenda de salas">
    <div className="admin-heading"><div><p className="admin-kicker">OPERAÇÕES · ESPAÇOS</p><h1>Agenda de salas</h1><p>Consulte reservas confirmadas e crie períodos de indisponibilidade operacional.</p></div><span className="admin-date"><LockKeyhole size={15} /> Acesso da equipa</span></div>
    {error && <div className="admin-alert" role="alert"><X size={16} /><div><strong>Não foi possível concluir a operação.</strong><p>{error}</p></div></div>}{notice && <div className="admin-alert success" role="status"><Check size={16} />{notice}</div>}
    <section className="admin-section"><div className="admin-section-head"><div><h2>Seleccionar agenda</h2><p>Escolha a sala e a data a consultar.</p></div></div><div className="admin-section-body"><div className="admin-form-grid"><label className="admin-field"><span>Sala</span><select value={roomId} onChange={e => setRoomId(e.target.value as RoomId)}>{(rooms.data?.length ? rooms.data : roomChoices).map(room => <option key={room.id} value={room.id}>{room.name}</option>)}</select></label><label className="admin-field"><span>Data</span><input type="date" value={date} onChange={e => setDate(e.target.value)} /></label></div>{rooms.isError && <div className="admin-alert" style={{marginTop:12}}><X size={15} />Não foi possível carregar os nomes das salas. A agenda continua disponível com a lista configurada.</div>}</div></section>
    <div className="admin-stats" style={{marginTop:16}}><article className="admin-stat"><div className="admin-stat-top"><span>Reservas na data</span><CalendarDays size={16} /></div><strong>{agenda.isLoading ? '—' : reservations.length}</strong><small>{roomName} · {date}</small></article><article className="admin-stat"><div className="admin-stat-top"><span>Indisponibilidades</span><LockKeyhole size={16} /></div><strong>{agenda.isLoading ? '—' : blocks.length}</strong><small>Bloqueios activos na data</small></article><article className="admin-stat"><div className="admin-stat-top"><span>Reservas confirmadas</span><DoorOpen size={16} /></div><strong>{agenda.isLoading ? '—' : reservations.filter(r => r.status === 'confirmed').length}</strong><small>Horários ocupados</small></article><article className="admin-stat"><div className="admin-stat-top"><span>Data consultada</span><Clock3 size={16} /></div><strong style={{fontSize:17}}>{date ? new Intl.DateTimeFormat('pt-AO',{day:'numeric',month:'short'}).format(new Date(`${date}T12:00:00`)) : '—'}</strong><small>{roomName}</small></article></div>
    <div className="admin-agenda-grid">
      <section className="admin-section"><div className="admin-section-head"><div><h2>Reservas confirmadas</h2><p>Registos existentes para este dia.</p></div>{agenda.isError && <button className="admin-button secondary" type="button" onClick={() => agenda.refetch()}><RefreshCw size={14} /> Actualizar</button>}</div><div className="admin-section-body">{agenda.isLoading ? <><div className="admin-skeleton" /><div className="admin-skeleton" /></> : agenda.isError ? <div className="admin-state" role="alert"><X size={19} /><strong>Não foi possível consultar a agenda.</strong><p>Verifique a ligação e tente novamente.</p><button type="button" className="admin-button secondary" onClick={() => agenda.refetch()}>Tentar novamente</button></div> : reservations.length ? <div className="admin-agenda-list">{reservations.map(res => <article className="admin-agenda-entry" key={res.id}><div><strong>{res.startTime} – {res.endTime} · {res.name}</strong><small>{res.company || 'Reserva individual'} · {formatKz(res.priceKz)} · {res.status === 'confirmed' ? 'Confirmada' : 'Cancelada'}</small></div><span className={`admin-badge ${res.status === 'confirmed' ? 'good' : ''}`}><UserRound size={12} />{res.status === 'confirmed' ? 'Confirmada' : 'Cancelada'}</span></article>)}</div> : <div className="admin-empty"><CalendarDays size={23} /><strong>Sem reservas nesta data.</strong><p>A agenda está livre para a sala seleccionada.</p></div>}</div></section>
      <section className="admin-section"><div className="admin-section-head"><div><h2>Bloqueios de disponibilidade</h2><p>Feche horários por manutenção ou motivos operacionais.</p></div></div><div className="admin-section-body">{agenda.isLoading ? <div className="admin-skeleton" /> : blocks.length ? <div className="admin-agenda-list">{blocks.map(block => <article className="admin-agenda-entry" key={block.id}><div><strong>{block.startTime} – {block.endTime}</strong><small>{block.reason}</small></div><button className="admin-icon-button" type="button" title="Libertar horário" aria-label={`Libertar horário ${block.startTime}`} disabled={releaseBlock.isPending} onClick={() => release(block.id)}><Trash2 size={14} /></button></article>)}</div> : !agenda.isError && <div className="admin-empty" style={{padding:'20px 12px'}}><Check size={20} /><strong>Sem bloqueios registados.</strong><p>Os horários mantêm a disponibilidade normal.</p></div>}
        <form onSubmit={addBlock} style={{marginTop:17,paddingTop:16,borderTop:'1px solid #eee6df'}}><p className="admin-kicker">NOVO BLOQUEIO</p><div className="admin-form-grid"><label className="admin-field"><span>Início</span><input type="time" required value={startTime} onChange={e => setStartTime(e.target.value)} /></label><label className="admin-field"><span>Fim</span><input type="time" required value={endTime} onChange={e => setEndTime(e.target.value)} /></label><label className="admin-field wide"><span>Motivo</span><input required minLength={2} maxLength={300} value={reason} onChange={e => setReason(e.target.value)} placeholder="ex.: Manutenção da sala" /></label></div><button className="admin-button" style={{marginTop:13}} type="submit" disabled={createBlock.isPending || agenda.isError || !date}><Plus size={14} />{createBlock.isPending ? 'A registar…' : 'Bloquear horário'}</button></form>
      </div></section>
    </div>
    <p style={{color:'#8a7e7a',fontSize:10,marginTop:15,lineHeight:1.6}}>Os bloqueios de disponibilidade não alteram nem cancelam reservas confirmadas.</p>
  </AdminPage>;
}
export default function StaffAgendaPage() { return <AgendaContent />; }
