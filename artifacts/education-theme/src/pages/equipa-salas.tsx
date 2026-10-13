import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, Check, Clock3, LockKeyhole, Plus, Save, ShieldCheck, Trash2 } from 'lucide-react';
import {
  getGetRoomBookingSettingsQueryKey,
  getListRoomsQueryKey,
  useGetRoomBookingSettings,
  useUpdateRoomBookingSettings,
  type RoomBookingRules,
  type RoomBookingSettings,
} from '@workspace/api-client-react';
import './equipa-salas.css';

const roomChoices = [
  { id: 'sala-soba', label: 'Sala Soba', kind: 'standard' },
  { id: 'sala-kilamba', label: 'Sala Kilamba', kind: 'standard' },
  { id: 'sala-kudi', label: 'Sala Kudi', kind: 'standard' },
  { id: 'sala-ondjango', label: 'Sala Ondjango', kind: 'session' },
] as const;

type RoomId = keyof RoomBookingSettings['roomRules'];
type RuleKey = keyof RoomBookingRules;

const timeFields: { key: RuleKey; label: string }[] = [
  { key: 'standardStartTime', label: 'Início do horário normal' },
  { key: 'standardEndTime', label: 'Fim do horário normal' },
  { key: 'afterHoursStartTime', label: 'Início pós-laboral' },
  { key: 'afterHoursEndTime', label: 'Fim pós-laboral' },
];
const sessionFields: { key: RuleKey; label: string }[] = [
  { key: 'sessionMorningStartTime', label: 'Início da sessão da manhã' },
  { key: 'sessionMorningEndTime', label: 'Fim da sessão da manhã' },
  { key: 'sessionAfternoonStartTime', label: 'Início da sessão da tarde' },
  { key: 'sessionAfternoonEndTime', label: 'Fim da sessão da tarde' },
];

function isTimeField(key: RuleKey) {
  return key.toLowerCase().includes('time');
}

function errorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const status = (error as { status?: unknown }).status;
  return typeof status === 'number' ? status : undefined;
}

export default function StaffRoomSettingsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const settingsQuery = useGetRoomBookingSettings({
    query: {
      queryKey: getGetRoomBookingSettingsQueryKey(),
      enabled: Boolean(isLoaded && isSignedIn),
      staleTime: 0,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
    },
  });
  const saveSettings = useUpdateRoomBookingSettings();
  const [settings, setSettings] = useState<RoomBookingSettings | null>(null);
  const [dirty, setDirty] = useState(false);
  const [holidayDate, setHolidayDate] = useState('');
  const [saved, setSaved] = useState(false);
  const isForbidden = errorStatus(settingsQuery.error) === 403;

  useEffect(() => {
    if (settingsQuery.data && !dirty) setSettings(settingsQuery.data);
  }, [settingsQuery.data, dirty]);

  function updateRule(roomId: RoomId, key: RuleKey, value: string) {
    setDirty(true);
    setSaved(false);
    setSettings((current) => {
      if (!current) return current;
      return {
        ...current,
        roomRules: {
          ...current.roomRules,
          [roomId]: {
            ...current.roomRules[roomId],
            [key]: isTimeField(key) ? value : Number(value),
          },
        },
      };
    });
  }

  function addHoliday() {
    if (!settings || !holidayDate || settings.holidayDates.includes(holidayDate)) return;
    setSettings({ ...settings, holidayDates: [...settings.holidayDates, holidayDate].sort() });
    setHolidayDate('');
    setDirty(true);
    setSaved(false);
  }

  function removeHoliday(date: string) {
    if (!settings) return;
    setSettings({ ...settings, holidayDates: settings.holidayDates.filter((entry) => entry !== date) });
    setDirty(true);
    setSaved(false);
  }

  function save() {
    if (!settings || saveSettings.isPending) return;
    saveSettings.mutate({ data: settings }, {
      onSuccess: (result) => {
        setSettings(result);
        setDirty(false);
        setSaved(true);
        queryClient.setQueryData(getGetRoomBookingSettingsQueryKey(), result);
        queryClient.invalidateQueries({ queryKey: getListRoomsQueryKey() });
      },
    });
  }

  if (!isLoaded || isSignedIn && settingsQuery.isLoading) {
    return <main className="staff-settings"><div className="staff-settings-loading" aria-busy="true">A carregar as regras das salas…</div></main>;
  }
  if (!isSignedIn) {
    return (
      <main className="staff-settings staff-settings-gate">
        <section className="staff-settings-gate-card">
          <LockKeyhole size={24} />
          <span className="staff-settings-overline">ÁREA DA EQUIPA</span>
          <h1>Entre para gerir as salas.</h1>
          <p>Esta área é reservada à equipa autorizada da Academia Procenter.</p>
          <Link to="/sign-in">Iniciar sessão</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="staff-settings" data-testid="page-staff-room-settings">
      <header className="staff-settings-topbar">
        <Link to="/" className="staff-settings-brand"><img src="/favicon.svg" alt="" /><span>ACADEMIA<small>PROCENTER · EQUIPA</small></span></Link>
        <span><i /> Área interna / Salas</span>
        <Link to="/equipa" className="staff-settings-back">Painel</Link>
        <Link to="/equipa/inscricoes" className="staff-settings-back">Inscrições</Link>
        <Link to="/equipa/reservas" className="staff-settings-back">Reservas <ArrowLeft size={14} /></Link>
      </header>
      <div className="staff-settings-main">
        <nav className="staff-settings-breadcrumb"><Link to="/">Academia</Link><span>/</span><Link to="/equipa/reservas">Equipa</Link><span>/</span><strong>Preços e horários</strong></nav>
        <section className="staff-settings-heading">
          <div><p className="staff-settings-overline"><span /> OPERAÇÕES · SALAS</p><h1>Preços e horários</h1><p>As alterações passam a valer nas próximas consultas e reservas. Reservas confirmadas mantêm o valor acordado.</p></div>
          <ShieldCheck size={22} />
        </section>

        {isForbidden && <div className="staff-settings-alert" role="alert"><LockKeyhole size={18} /><div><strong>Acesso restrito à equipa autorizada</strong><p>Esta conta não tem a função necessária para editar preços, horários ou feriados.</p></div></div>}
        {settingsQuery.isError && !isForbidden && <div className="staff-settings-alert" role="alert"><strong>Não foi possível carregar as regras. Atualize a página e tente novamente.</strong></div>}
        {saveSettings.isError && <div className="staff-settings-alert" role="alert"><strong>{(saveSettings.error as Error)?.message || 'Não foi possível guardar as alterações. Verifique os dados e tente novamente.'}</strong></div>}
        {saved && <div className="staff-settings-success" role="status"><Check size={17} /> Alterações guardadas e já aplicadas às novas reservas.</div>}

        {settings && !isForbidden && (
          <>
            <div className="staff-settings-room-grid">
              {roomChoices.map((room) => {
                const rules = settings.roomRules[room.id];
                return (
                  <section className="staff-settings-room" key={room.id} aria-label={`Regras da ${room.label}`}>
                    <div className="staff-settings-room-title"><span><Clock3 size={17} /></span><div><small>REGRAS DE RESERVA</small><h2>{room.label}</h2></div></div>
                    {room.kind === 'standard' ? (
                      <>
                        <div className="staff-settings-field-grid">
                          {timeFields.map(({ key, label }) => <RuleInput key={key} roomId={room.id} rules={rules} fieldKey={key} label={label} onChange={updateRule} />)}
                          <RuleInput roomId={room.id} rules={rules} fieldKey="standardMinimumHours" label="Mínimo de horas" onChange={updateRule} />
                          <RuleInput roomId={room.id} rules={rules} fieldKey="standardHourlyRate" label="Preço por hora (Kz)" onChange={updateRule} />
                          {room.id === 'sala-kudi' && <RuleInput roomId={room.id} rules={rules} fieldKey="standardDiscountFromHours" label="Preço reduzido para reservas abaixo de (h)" onChange={updateRule} />}
                          {room.id === 'sala-kudi' && <RuleInput roomId={room.id} rules={rules} fieldKey="standardShortStayHourlyRate" label="Preço reduzido por hora (Kz)" onChange={updateRule} />}
                          <RuleInput roomId={room.id} rules={rules} fieldKey="afterHoursPriceKz" label="Preço pós-laboral (Kz)" onChange={updateRule} />
                        </div>
                        <p className="staff-settings-hint">Os horários normais e pós-laborais estão disponíveis nos dias úteis, excepto feriados.</p>
                      </>
                    ) : (
                      <>
                        <div className="staff-settings-field-grid">
                          {sessionFields.map(({ key, label }) => <RuleInput key={key} roomId={room.id} rules={rules} fieldKey={key} label={label} onChange={updateRule} />)}
                          <RuleInput roomId={room.id} rules={rules} fieldKey="weekdaySessionPriceKz" label="Preço em dia útil (Kz)" onChange={updateRule} />
                          <RuleInput roomId={room.id} rules={rules} fieldKey="holidaySessionPriceKz" label="Preço em fim de semana/feriado (Kz)" onChange={updateRule} />
                        </div>
                        <p className="staff-settings-hint">A sala abre aos fins de semana e feriados com a tarifa correspondente.</p>
                      </>
                    )}
                  </section>
                );
              })}
            </div>

            <section className="staff-settings-holidays">
              <div className="staff-settings-holiday-heading"><span><CalendarDays size={17} /></span><div><small>CALENDÁRIO</small><h2>Feriados</h2><p>As datas aqui indicadas bloqueiam horários normais e aplicam a tarifa de feriado às sessões.</p></div></div>
              <div className="staff-settings-holiday-add">
                <label htmlFor="staff-holiday-date">Adicionar data de feriado</label>
                <input id="staff-holiday-date" type="date" value={holidayDate} onChange={(event) => setHolidayDate(event.target.value)} data-testid="input-holiday-date" />
                <button type="button" onClick={addHoliday} disabled={!holidayDate || settings.holidayDates.includes(holidayDate)} data-testid="button-add-holiday"><Plus size={15} /> Adicionar data</button>
              </div>
              <div className="staff-settings-holiday-list" data-testid="list-room-holidays">
                {settings.holidayDates.length ? settings.holidayDates.map((date) => (
                  <div key={date} className="staff-settings-holiday-chip"><time dateTime={date}>{new Intl.DateTimeFormat('pt-AO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))}</time><button type="button" aria-label={`Remover feriado ${date}`} onClick={() => removeHoliday(date)} data-testid={`button-remove-holiday-${date}`}><Trash2 size={14} /></button></div>
                )) : <p className="staff-settings-empty-holidays">Ainda não há datas de feriado registadas.</p>}
              </div>
            </section>

            <div className="staff-settings-save-row">
              <span>{dirty ? 'Tem alterações por guardar.' : 'Os preços e horários guardados estão em vigor.'}</span>
              <button type="button" onClick={save} disabled={!dirty || saveSettings.isPending} data-testid="button-save-room-settings">
                {saveSettings.isPending ? <span className="staff-settings-spinner" /> : <Save size={16} />}
                {saveSettings.isPending ? 'A guardar…' : 'Guardar alterações'}
              </button>
            </div>
          </>
        )}
      </div>
      <footer className="staff-settings-footer"><span>ACADEMIA PROCENTER</span><span>Operações internas · Salas</span></footer>
    </main>
  );
}

function RuleInput({
  roomId,
  rules,
  fieldKey,
  label,
  onChange,
}: {
  roomId: RoomId;
  rules: RoomBookingRules;
  fieldKey: RuleKey;
  label: string;
  onChange: (roomId: RoomId, key: RuleKey, value: string) => void;
}) {
  const isTime = isTimeField(fieldKey);
  return (
    <label className="staff-settings-field">
      <span>{label}</span>
      <input
        type={isTime ? 'time' : 'number'}
        min={isTime ? undefined : 1}
        max={fieldKey === 'standardMinimumHours' ? 9 : undefined}
        step={1}
        value={String(rules[fieldKey])}
        onChange={(event) => onChange(roomId, fieldKey, event.target.value)}
      />
    </label>
  );
}
