import { useMemo, useState } from 'react';
import { useListAdminCustomers, getListAdminCustomersQueryKey } from '@workspace/api-client-react';
import { Search, Users, RefreshCw, X, Mail, Phone, Building2, GraduationCap, DoorOpen } from 'lucide-react';
import { AdminPage, formatAdminDate, formatKz } from '@/components/admin-shell';

function CustomersContent() {
  const [search, setSearch] = useState('');
  const params = useMemo(() => search.trim() ? { search: search.trim() } : {}, [search]);
  const query = useListAdminCustomers(params, { query: { queryKey: getListAdminCustomersQueryKey(params), retry: 1 } });
  const customers = query.data ?? [];
  return <AdminPage title="Clientes">
    <div className="admin-heading"><div><p className="admin-kicker">RELACIONAMENTO · REGISTOS</p><h1>Clientes da Academia</h1><p>Pesquise clientes registados em inscrições de cursos e reservas de salas.</p></div><span className="admin-date"><Users size={15} /> Informação confidencial</span></div>
    <div className="admin-toolbar"><label className="admin-search"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nome, e-mail, telefone, empresa ou NIF" aria-label="Pesquisar clientes" /></label><span className="admin-badge">{query.isLoading ? 'A carregar…' : `${customers.length} registos`}</span></div>
    {query.isError && <div className="admin-alert" role="alert"><X size={16} /><div><strong>Não foi possível consultar os clientes.</strong><p>Verifique a ligação; os dados pessoais mantêm-se protegidos.</p><button className="admin-inline-link" type="button" onClick={() => query.refetch()}>Tentar novamente</button></div></div>}
    <section className="admin-section"><div className="admin-section-head"><div><h2>Registos de clientes</h2><p>Resultados de inscrições e reservas de salas. Utilize os dados apenas para acompanhamento do serviço.</p></div>{query.isError && <button type="button" className="admin-button secondary" onClick={() => query.refetch()}><RefreshCw size={14} /> Actualizar</button>}</div>
      {query.isLoading ? <div className="admin-section-body"><div className="admin-skeleton" /><div className="admin-skeleton" /><div className="admin-skeleton" /></div> : !query.isError && customers.length === 0 ? <div className="admin-empty"><Users size={24} /><strong>{search.trim() ? 'Não encontrámos clientes com esses termos.' : 'Ainda não existem registos de clientes.'}</strong><p>{search.trim() ? 'Tente pesquisar por outro nome ou contacto.' : 'Os registos surgirão após inscrições ou reservas.'}</p></div> : !query.isError && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Cliente</th><th>Contacto</th><th>Origem</th><th>Item</th><th>Data / estado</th><th>Valor</th></tr></thead><tbody>{customers.map(customer => <tr key={`${customer.source}-${customer.id}`}><td><strong>{customer.name}</strong><small>{customer.company || customer.taxId ? [customer.company, customer.taxId ? `NIF ${customer.taxId}` : ''].filter(Boolean).join(' · ') : 'Cliente particular'}</small></td><td>{customer.email && <span style={{display:'flex',gap:5,alignItems:'center',marginBottom:4}}><Mail size={12} />{customer.email}</span>}{customer.phone && <span style={{display:'flex',gap:5,alignItems:'center'}}><Phone size={12} />{customer.phone}</span>}{!customer.email && !customer.phone && '—'}</td><td><span className={`admin-badge ${customer.source === 'course' ? 'red' : ''}`}>{customer.source === 'course' ? <><GraduationCap size={12} /> Curso</> : <><DoorOpen size={12} /> Sala</>}</span></td><td><strong>{customer.item}</strong></td><td>{formatAdminDate(customer.date)}<small>{customer.status}</small></td><td>{formatKz(customer.amountKz)}</td></tr>)}</tbody></table></div>}
    </section>
    <p style={{display:'flex',gap:7,alignItems:'center',color:'#8a7e7a',fontSize:10,marginTop:16}}><Building2 size={14} /> Os resultados reúnem inscrições em cursos e reservas de salas, sem duplicar fluxos operacionais existentes.</p>
  </AdminPage>;
}
export default function StaffCustomersPage() { return <CustomersContent />; }
