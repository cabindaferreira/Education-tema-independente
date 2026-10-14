import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, Search, Bell, ArrowUpRight, ArrowRight, Users, Mail,
  MountainSnow, Plane, Star, Filter, MoreHorizontal, Send, CheckCircle2,
  Circle, TrendingUp, ChevronDown, MapPin
} from 'lucide-react';

const spring = { type: 'spring', stiffness: 380, damping: 28, mass: 0.7 };
const springSoft = { type: 'spring', stiffness: 220, damping: 26 };

const CONTACTS = [
  { id: 1, name: 'Ingrid Halvorsen', initials: 'IH', city: 'Oslo, Norway', segment: 'Returning Voyager', ltv: 18420, lastTrip: 'Kyoto Ryokan Circuit', lastDate: 'Apr 2025', status: 'Booked', open: 4, tier: 'Summit' },
  { id: 2, name: 'Tomas Eriksen', initials: 'TE', city: 'Copenhagen, DK', segment: 'High Intent', ltv: 9210, lastTrip: 'Hokkaidō Powder Week', lastDate: 'Feb 2025', status: 'Opened', open: 2, tier: 'Ridge' },
  { id: 3, name: 'Aiko Tanabe', initials: 'AT', city: 'Kanazawa, Japan', segment: 'Returning Voyager', ltv: 24650, lastTrip: 'Lofoten Midnight Sun', lastDate: 'Jun 2025', status: 'Booked', open: 6, tier: 'Summit' },
  { id: 4, name: 'Marcus Lindqvist', initials: 'ML', city: 'Stockholm, SE', segment: 'Dormant', ltv: 4180, lastTrip: 'Setouchi Art Islands', lastDate: 'Oct 2023', status: 'Sent', open: 0, tier: 'Trail' },
  { id: 5, name: 'Clara Nørgaard', initials: 'CN', city: 'Aarhus, DK', segment: 'High Intent', ltv: 7340, lastTrip: 'Tōhoku Onsen Trail', lastDate: 'Nov 2024', status: 'Opened', open: 3, tier: 'Ridge' },
  { id: 6, name: 'Renji Okabe', initials: 'RO', city: 'Sapporo, Japan', segment: 'New Lead', ltv: 0, lastTrip: '—', lastDate: '—', status: 'Sent', open: 1, tier: 'Trail' },
  { id: 7, name: 'Freya Aaltonen', initials: 'FA', city: 'Helsinki, FI', segment: 'Returning Voyager', ltv: 15890, lastTrip: 'Kumano Kodō Pilgrimage', lastDate: 'May 2025', status: 'Opened', open: 5, tier: 'Summit' },
  { id: 8, name: 'Søren Vestergaard', initials: 'SV', city: 'Bergen, Norway', segment: 'Dormant', ltv: 6020, lastTrip: 'Nikkō Autumn Leaves', lastDate: 'Nov 2023', status: 'Not sent', open: 0, tier: 'Trail' },
  { id: 9, name: 'Yuki Morimoto', initials: 'YM', city: 'Osaka, Japan', segment: 'High Intent', ltv: 11760, lastTrip: 'Faroe Islands Trek', lastDate: 'Aug 2024', status: 'Booked', open: 7, tier: 'Ridge' },
];

const SEGMENTS = ['All contacts', 'Returning Voyager', 'High Intent', 'Dormant', 'New Lead'];

const STATUS_STYLE = {
  'Booked':   { dot: '#5C7250', bg: 'rgba(92,114,80,0.10)', text: '#4A5C40' },
  'Opened':   { dot: '#B5754A', bg: 'rgba(181,117,74,0.10)', text: '#96603C' },
  'Sent':     { dot: '#8C8577', bg: 'rgba(140,133,119,0.12)', text: '#6E6859' },
  'Not sent': { dot: '#C9C2B4', bg: 'rgba(201,194,180,0.18)', text: '#8C8577' },
};

function StatusPill({ status }) {
  const s = STATUS_STYLE[status];
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide"
      style={{ background: s.bg, color: s.text }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {status}
    </span>
  );
}

export default function App() {
  const [segment, setSegment] = useState('All contacts');
  const [query, setQuery] = useState('');
  const [hovered, setHovered] = useState(null);

  const filtered = useMemo(() => {
    return CONTACTS.filter(c =>
      (segment === 'All contacts' || c.segment === segment) &&
      (c.name.toLowerCase().includes(query.toLowerCase()) || c.city.toLowerCase().includes(query.toLowerCase()))
    );
  }, [segment, query]);

  const stats = [
    { label: 'Equinox invitations sent', value: '2,847', delta: '+312 this week', icon: Send },
    { label: 'Campaign open rate', value: '64.2%', delta: '+8.1 pts vs. spring', icon: Mail },
    { label: 'Bookings secured', value: '186', delta: '¥41.2M revenue', icon: MountainSnow },
    { label: 'Avg. lifetime value', value: '¥1.36M', delta: 'Summit tier up 14%', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen w-full" style={{ background: '#F2EEE6', color: '#1F1C17', fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=Zen+Kaku+Gothic+New:wght@400;500&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
        ::selection { background: #B5754A; color: #F8F5EE; }
        * { -webkit-font-smoothing: antialiased; }
        .serif { font-family: 'Fraunces', serif; }
        .jp { font-family: 'Zen Kaku Gothic New', sans-serif; }
        input::placeholder { color: #A39B8B; }
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D6CFC0; border-radius: 8px; border: 3px solid #F2EEE6; }
        .grain {
          position: fixed; inset: 0; pointer-events: none; z-index: 50; opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
        .hairline { border-color: rgba(31,28,23,0.10); }
      `}} />
      <div className="grain" />

      <div className="flex">
        {/* ───────── Sidebar ───────── */}
        <aside className="hidden lg:flex flex-col w-[228px] shrink-0 h-screen sticky top-0 border-r hairline px-6 py-8" style={{ background: '#EDE8DD' }}>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: '#1F1C17' }}>
              <Compass size={17} color="#F2EEE6" strokeWidth={1.75} />
            </div>
            <div>
              <div className="serif text-[17px] font-medium leading-none tracking-tight">Kaidō</div>
              <div className="text-[10px] tracking-[0.18em] uppercase mt-1" style={{ color: '#8C8577' }}>Expeditions</div>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {[
              { label: 'Overview', icon: Compass },
              { label: 'Contacts', icon: Users, active: true },
              { label: 'Campaigns', icon: Send },
              { label: 'Itineraries', icon: Plane },
              { label: 'Loyalty tiers', icon: Star },
            ].map(item => (
              <motion.button key={item.label}
                whileHover={{ x: 4 }} whileTap={{ scale: 0.97 }} transition={spring}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-left ${item.active ? '' : 'opacity-55 hover:opacity-90'}`}
                style={item.active ? { background: '#F8F5EE', boxShadow: '0 1px 2px rgba(31,28,23,0.06)' } : {}}>
                <item.icon size={16} strokeWidth={1.75} />
                {item.label}
              </motion.button>
            ))}
          </nav>

          <div className="mt-auto">
            <div className="rounded-xl p-4 border hairline" style={{ background: '#F8F5EE' }}>
              <div className="jp text-[11px] tracking-[0.2em] mb-1" style={{ color: '#B5754A' }}>秋分</div>
              <div className="serif text-[14px] font-medium leading-snug">Equinox Sale ends in 6 days</div>
              <div className="text-[11px] mt-1.5" style={{ color: '#8C8577' }}>72% of booking goal reached</div>
              <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: '#E2DBCC' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: '72%' }} transition={{ ...springSoft, delay: 0.4 }}
                  className="h-full rounded-full" style={{ background: '#B5754A' }} />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6 px-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold" style={{ background: '#1F1C17', color: '#F2EEE6' }}>HN</div>
              <div>
                <div className="text-[12px] font-medium">Hana Nakamura</div>
                <div className="text-[10.5px]" style={{ color: '#8C8577' }}>Guest Relations Lead</div>
              </div>
            </div>
          </div>
        </aside>

        {/* ───────── Main ───────── */}
        <main className="flex-1 min-w-0">
          {/* Top bar */}
          <header className="flex items-center justify-between px-8 lg:px-10 py-5 border-b hairline sticky top-0 z-20" style={{ background: 'rgba(242,238,230,0.92)', backdropFilter: 'blur(12px)' }}>
            <div className="flex items-center gap-2 text-[12px]" style={{ color: '#8C8577' }}>
              <span>Workspace</span>
              <span style={{ color: '#C9C2B4' }}>/</span>
              <span className="font-medium" style={{ color: '#1F1C17' }}>Contacts · Equinox campaign</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-lg border hairline w-[260px]" style={{ background: '#F8F5EE' }}>
                <Search size={14} strokeWidth={1.75} style={{ color: '#A39B8B' }} />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search guests or cities…"
                  className="bg-transparent outline-none text-[13px] w-full" />
              </div>
              <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} transition={spring}
                className="relative w-9 h-9 rounded-lg border hairline flex items-center justify-center" style={{ background: '#F8F5EE' }}>
                <Bell size={15} strokeWidth={1.75} />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full" style={{ background: '#B5754A' }} />
              </motion.button>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} transition={spring}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium" style={{ background: '#1F1C17', color: '#F2EEE6' }}>
                New outreach <ArrowUpRight size={14} strokeWidth={2} />
              </motion.button>
            </div>
          </header>

          <div className="px-8 lg:px-10 py-9 max-w-[1240px]">

            {/* ───── Type-only hero ───── */}
            <section className="rounded-2xl border hairline px-8 py-9 lg:px-12 lg:py-11 mb-8 relative overflow-hidden" style={{ background: '#1F1C17', color: '#F2EEE6' }}>
              <div className="absolute right-10 top-1/2 -translate-y-1/2 jp text-[150px] leading-none select-none hidden xl:block" style={{ color: 'rgba(242,238,230,0.05)' }}>北へ</div>
              <div className="flex flex-col lg:flex-row lg:items-end gap-8 lg:gap-16 relative">
                <div className="flex-1">
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springSoft, delay: 0.05 }}
                    className="flex items-center gap-3 mb-5">
                    <span className="text-[11px] tracking-[0.28em] uppercase font-medium" style={{ color: '#C49A6C' }}>Autumn Equinox Sale</span>
                    <span className="h-px w-10" style={{ background: 'rgba(242,238,230,0.25)' }} />
                    <span className="text-[11px] tracking-[0.18em] uppercase" style={{ color: 'rgba(242,238,230,0.45)' }}>Sept 18 – 24</span>
                  </motion.div>
                  <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springSoft, delay: 0.12 }}
                    className="serif font-light leading-[1.04] tracking-[-0.015em]" style={{ fontSize: 'clamp(34px, 4.6vw, 58px)' }}>
                    The bold travel<br />
                    <span className="font-medium" style={{ color: '#C49A6C' }}>before the season turns.</span>
                  </motion.h1>
                  <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springSoft, delay: 0.2 }}
                    className="mt-5 text-[14px] leading-relaxed max-w-[480px]" style={{ color: 'rgba(242,238,230,0.62)' }}>
                    Six days to move 1,120 high-intent guests toward Hokkaidō, Lofoten and the Kumano Kodō.
                    Summit-tier members unlock 30% — the rest follow your lead.
                  </motion.p>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springSoft, delay: 0.28 }}
                    className="flex flex-wrap items-center gap-3 mt-7">
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={spring}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold" style={{ background: '#C49A6C', color: '#1F1C17' }}>
                      Launch final push <ArrowRight size={15} strokeWidth={2.25} />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={spring}
                      className="px-5 py-2.5 rounded-lg text-[13px] font-medium border" style={{ borderColor: 'rgba(242,238,230,0.25)', color: '#F2EEE6' }}>
                      Review segments
                    </motion.button>
                  </motion.div>
                </div>

                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springSoft, delay: 0.3 }}
                  className="grid grid-cols-3 gap-px rounded-xl overflow-hidden border lg:w-[360px]" style={{ borderColor: 'rgba(242,238,230,0.14)', background: 'rgba(242,238,230,0.14)' }}>
                  {[
                    { k: '186', l: 'bookings' },
                    { k: '64%', l: 'open rate' },
                    { k: '6 d', l: 'remaining' },
                  ].map(x => (
                    <div key={x.l} className="px-5 py-4" style={{ background: '#26221C' }}>
                      <div className="serif text-[26px] font-light">{x.k}</div>
                      <div className="text-[10.5px] tracking-[0.14em] uppercase mt-1" style={{ color: 'rgba(242,238,230,0.45)' }}>{x.l}</div>
                    </div>
                  ))}
                </motion.div>
              </div>
            </section>

            {/* ───── Stat cards ───── */}
            <section className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-9">
              {stats.map((s, i) => (
                <motion.div key={s.label}
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springSoft, delay: 0.1 + i * 0.06 }}
                  whileHover={{ y: -4 }}
                  className="rounded-xl border hairline p-5 cursor-default" style={{ background: '#F8F5EE' }}>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-[11px] tracking-[0.12em] uppercase font-medium" style={{ color: '#8C8577' }}>{s.label}</span>
                    <s.icon size={15} strokeWidth={1.75} style={{ color: '#B5754A' }} />
                  </div>
                  <div className="serif text-[30px] font-light leading-none tracking-tight">{s.value}</div>
                  <div className="text-[11.5px] mt-2.5 font-medium" style={{ color: '#5C7250' }}>{s.delta}</div>
                </motion.div>
              ))}
            </section>

            {/* ───── Contacts header & filters ───── */}
            <section className="flex flex-col gap-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="serif text-[24px] font-medium tracking-tight">Guest contacts</h2>
                  <p className="text-[12.5px] mt-1" style={{ color: '#8C8577' }}>{filtered.length} guests in view · sorted by lifetime value</p>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} transition={spring}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg border hairline text-[12.5px] font-medium" style={{ background: '#F8F5EE' }}>
                    <Filter size={13.5} strokeWidth={1.75} /> Filters
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} transition={spring}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg border hairline text-[12.5px] font-medium" style={{ background: '#F8F5EE' }}>
                    Lifetime value <ChevronDown size={13.5} strokeWidth={1.75} />
                  </motion.button>
                </div>
              </div>

              {/* Segment tabs */}
              <div className="flex flex-wrap gap-1.5 p-1.5 rounded-xl border hairline w-fit" style={{ background: '#EDE8DD' }}>
                {SEGMENTS.map(s => {
                  const active = s === segment;
                  return (
                    <motion.button key={s} onClick={() => setSegment(s)} whileTap={{ scale: 0.95 }} transition={spring}
                      className="relative px-4 py-2 rounded-lg text-[12.5px] font-medium">
                      {active && (
                        <motion.span layoutId="seg-pill" transition={spring}
                          className="absolute inset-0 rounded-lg" style={{ background: '#1F1C17' }} />
                      )}
                      <span className="relative z-10" style={{ color: active ? '#F2EEE6' : '#6E6859' }}>{s}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* ───── Contact cards ───── */}
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-1">
                <AnimatePresence mode="popLayout">
                  {filtered.map(c => (
                    <motion.div key={c.id} layout
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      transition={spring}
                      onMouseEnter={() => setHovered(c.id)} onMouseLeave={() => setHovered(null)}
                      whileHover={{ y: -5 }}
                      className="rounded-xl border hairline p-5 cursor-pointer relative"
                      style={{ background: '#F8F5EE', boxShadow: hovered === c.id ? '0 12px 32px -12px rgba(31,28,23,0.18)' : '0 1px 2px rgba(31,28,23,0.04)' }}>

                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-full flex items-center justify-center serif text-[15px] font-medium border"
                            style={{
                              background: c.tier === 'Summit' ? '#1F1C17' : c.tier === 'Ridge' ? '#E5DECF' : '#F2EEE6',
                              color: c.tier === 'Summit' ? '#C49A6C' : '#1F1C17',
                              borderColor: 'rgba(31,28,23,0.10)'
                            }}>
                            {c.initials}
                          </div>
                          <div>
                            <div className="text-[14.5px] font-semibold tracking-tight">{c.name}</div>
                            <div className="flex items-center gap-1 text-[11.5px] mt-0.5" style={{ color: '#8C8577' }}>
                              <MapPin size={11} strokeWidth={1.75} /> {c.city}
                            </div>
                          </div>
                        </div>
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} transition={spring}
                          className="w-7 h-7 rounded-md flex items-center justify-center" style={{ color: '#A39B8B' }}>
                          <MoreHorizontal size={15} />
                        </motion.button>
                      </div>

                      <div className="flex items-center gap-2 mt-4">
                        <StatusPill status={c.status} />
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-medium border hairline" style={{ color: '#6E6859' }}>{c.segment}</span>
                        {c.tier === 'Summit' && (
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium" style={{ background: 'rgba(196,154,108,0.16)', color: '#96703C' }}>
                            <Star size={10} fill="#96703C" strokeWidth={0} /> Summit
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-px mt-4 rounded-lg overflow-hidden border hairline" style={{ background: 'rgba(31,28,23,0.08)' }}>
                        <div className="px-4 py-3" style={{ background: '#F2EEE6' }}>
                          <div className="text-[10px] tracking-[0.14em] uppercase" style={{ color: '#8C8577' }}>Lifetime value</div>
                          <div className="serif text-[18px] font-medium mt-1">{c.ltv ? `¥${(c.ltv / 100).toFixed(1)}万` : '—'}</div>
                        </div>
                        <div className="px-4 py-3" style={{ background: '#F2EEE6' }}>
                          <div className="text-[10px] tracking-[0.14em] uppercase" style={{ color: '#8C8577' }}>Email opens</div>
                          <div className="serif text-[18px] font-medium mt-1">{c.open}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3.5 border-t hairline">
                        <div className="text-[11.5px]" style={{ color: '#8C8577' }}>
                          Last journey · <span className="font-medium" style={{ color: '#1F1C17' }}>{c.lastTrip}</span>
                          {c.lastDate !== '—' && <span> · {c.lastDate}</span>}
                        </div>
                        <AnimatePresence>
                          {hovered === c.id && (
                            <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={spring}
                              className="flex items-center gap-1 text-[11.5px] font-semibold shrink-0" style={{ color: '#B5754A' }}>
                              Open <ArrowUpRight size={12} strokeWidth={2.25} />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {filtered.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border hairline p-12 text-center" style={{ background: '#F8F5EE' }}>
                  <div className="serif text-[18px]">No guests match this view</div>
                  <div className="text-[12.5px] mt-1" style={{ color: '#8C8577' }}>Adjust your search or choose another segment.</div>
                </motion.div>
              )}

              <div className="flex items-center justify-between py-6 mt-2 border-t hairline">
                <div className="text-[12px]" style={{ color: '#8C8577' }}>Showing {filtered.length} of 1,120 guests in the Equinox cohort</div>
                <div className="jp text-[11px] tracking-[0.3em]" style={{ color: '#C9C2B4' }}>街道 · KAIDŌ EXPEDITIONS</div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}