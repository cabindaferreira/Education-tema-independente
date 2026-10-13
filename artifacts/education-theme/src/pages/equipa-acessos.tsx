import { useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Check, Mail, Shield, Trash2, UserPlus, X } from 'lucide-react';
import { getListAdminTeamQueryKey, useAuthorizeAdminTeamMember, useListAdminTeam, useRevokeAdminTeamMember } from '@workspace/api-client-react';
import { AdminGuard, AdminShell, formatAdminDate } from '@/components/admin-shell';

function AccessContent() {
  const client = useQueryClient();
  const team = useListAdminTeam({ query: { queryKey: getListAdminTeamQueryKey(), retry: 1 } });
  const authorize = useAuthorizeAdminTeamMember();
  const revoke = useRevokeAdminTeamMember();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const refresh = () => client.invalidateQueries({ queryKey: getListAdminTeamQueryKey() });
  const add = (event: FormEvent) => {
    event.preventDefault(); setError(''); setSuccess('');
    authorize.mutate({ data: { email: email.trim().toLowerCase() } }, { onSuccess: () => { setEmail(''); refresh(); setSuccess('Acesso de equipa autorizado. A pessoa poderá entrar com a sua conta verificada.'); }, onError: e => setError(e instanceof Error ? e.message : 'Não foi possível autorizar esta conta. Confirme que já tem uma conta verificada.') });
  };
  const remove = (userId: string, memberEmail: string) => {
    if (!window.confirm(`Retirar o acesso administrativo a ${memberEmail}?`)) return;
    setError(''); setSuccess('');
    revoke.mutate({ userId }, { onSuccess: () => { refresh(); setSuccess('Acesso administrativo retirado.'); }, onError: e => setError(e instanceof Error ? e.message : 'Não foi possível retirar o acesso.') });
  };
  return <AdminShell title="Acessos da equipa"><div className="admin-heading"><div><p className="admin-kicker">SEGURANÇA · COLABORADORES</p><h1>Acessos da equipa</h1><p>Autorize contas existentes e verificadas para gerir a Academia. Só o proprietário pode alterar esta lista.</p></div><span className="admin-date"><Shield size={15} /> Gestão do proprietário</span></div>
    {error && <div className="admin-alert" role="alert"><X size={16} /><div><strong>Não foi possível concluir.</strong><p>{error}</p></div></div>}{success && <div className="admin-alert success" role="status"><Check size={16} />{success}</div>}
    <section className="admin-section"><div className="admin-section-head"><div><h2>Autorizar colaborador</h2><p>O colaborador tem de criar e verificar a sua conta através do início de sessão existente.</p></div></div><div className="admin-section-body"><form onSubmit={add} style={{display:'flex',gap:10,alignItems:'flex-end',maxWidth:680}}><label className="admin-field" style={{flex:1}}><span>E-mail da conta verificada</span><input type="email" required maxLength={320} value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@exemplo.co.ao" /></label><button className="admin-button" type="submit" disabled={authorize.isPending}><UserPlus size={15} />{authorize.isPending ? 'A autorizar…' : 'Autorizar conta'}</button></form><p style={{color:'#8a7e7a',fontSize:10,lineHeight:1.6,margin:'12px 0 0'}}>Não são criadas palavras-passe nesta área. Cada pessoa entra com a sua própria conta Academia.</p></div></section>
    <section className="admin-section"><div className="admin-section-head"><div><h2>Contas autorizadas</h2><p>Remover um colaborador não apaga a respectiva conta.</p></div></div>{team.isLoading ? <div className="admin-section-body"><div className="admin-skeleton" /><div className="admin-skeleton" /></div> : team.isError ? <div className="admin-state" role="alert"><X size={20} /><strong>Não foi possível carregar a equipa.</strong><p>Verifique a ligação e tente novamente.</p><button className="admin-button secondary" type="button" onClick={() => team.refetch()}>Tentar novamente</button></div> : team.data?.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Colaborador</th><th>Perfil</th><th>Autorizado em</th><th>Acção</th></tr></thead><tbody>{team.data.map(member => <tr key={member.userId}><td><strong>{[member.firstName,member.lastName].filter(Boolean).join(' ') || member.email}</strong><small><Mail size={11} style={{verticalAlign:'-2px',marginRight:4}} />{member.email}</small></td><td><span className={`admin-badge ${member.isOwner ? 'red' : 'good'}`}>{member.isOwner ? 'Proprietário' : 'Colaborador'}</span></td><td>{formatAdminDate(member.createdAt)}</td><td>{member.isOwner ? <span className="admin-badge">Acesso principal</span> : <button type="button" className="admin-icon-button" title="Retirar acesso" aria-label={`Retirar acesso a ${member.email}`} disabled={revoke.isPending} onClick={() => remove(member.userId, member.email)}><Trash2 size={14} /></button>}</td></tr>)}</tbody></table></div> : <div className="admin-empty"><Shield size={24} /><strong>Não há contas de equipa autorizadas.</strong><p>As contas autorizadas surgirão aqui.</p></div>}</section>
  </AdminShell>;
}
export default function StaffAccessPage() { return <AdminGuard ownerOnly><AccessContent /></AdminGuard>; }
