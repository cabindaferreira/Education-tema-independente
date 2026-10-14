import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Image, RefreshCw, Trash2, UploadCloud, X } from 'lucide-react';
import { getListAdminMediaQueryKey, getListHomepageBannersQueryKey, getListRoomPhotosQueryKey, useCreateAdminMedia, useListAdminMedia, useRemoveAdminMedia, useRequestAdminMediaUploadUrl, useUpdateAdminMedia, type AdminMediaInput, type AdminMediaInputRoomId, type AdminMediaUpdateRoomId } from '@workspace/api-client-react';
import { AdminPage, formatAdminDate } from '@/components/admin-shell';

const roomNames: Record<NonNullable<AdminMediaInputRoomId>, string> = {
  'sala-soba': 'Sala Soba',
  'sala-kilamba': 'Sala Kilamba',
  'sala-kudi': 'Sala Kudi',
  'sala-ondjango': 'Sala Ondjango',
};

function mediaRoomName(roomId: AdminMediaInputRoomId) {
  return roomId ? roomNames[roomId] : 'Biblioteca geral';
}

function MediaContent() {
  const client = useQueryClient();
  const media = useListAdminMedia({ query: { queryKey: getListAdminMediaQueryKey(), retry: 1 } });
  const requestUrl = useRequestAdminMediaUploadUrl();
  const register = useCreateAdminMedia();
  const remove = useRemoveAdminMedia();
  const updateMedia = useUpdateAdminMedia();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [altText, setAltText] = useState('');
  const [roomId, setRoomId] = useState<AdminMediaInputRoomId>(null);
  const [homeBanner, setHomeBanner] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingMediaId, setEditingMediaId] = useState<number | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<AdminMediaUpdateRoomId>(null);
  const [selectedHomeBanner, setSelectedHomeBanner] = useState(false);
  const busy = requestUrl.isPending || register.isPending;
  const refresh = () => Promise.all([
    client.invalidateQueries({ queryKey: getListAdminMediaQueryKey() }),
    client.invalidateQueries({ queryKey: getListHomepageBannersQueryKey() }),
  ]);
  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    if (selected && !title) setTitle(selected.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '));
    setError(''); setSuccess('');
  };
  const upload = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) return;
    setError(''); setSuccess('');
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) {
      setError('Formato não suportado. Utilize uma imagem JPEG, PNG, WebP ou AVIF.'); return;
    }
    if (file.size > 15 * 1024 * 1024) { setError('O ficheiro excede o limite de 15 MB.'); return; }
    try {
      const contentType = file.type as AdminMediaInput['contentType'];
      const uploadInfo = await requestUrl.mutateAsync({ data: { contentType, sizeBytes: file.size } });
      const response = await fetch(uploadInfo.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!response.ok) throw new Error('O armazenamento não aceitou o ficheiro. Tente novamente.');
      await register.mutateAsync({ data: { title: title.trim(), altText: altText.trim(), roomId, homeBanner, objectPath: uploadInfo.objectPath, contentType, sizeBytes: file.size } });
      await refresh();
      setSuccess('Imagem carregada e adicionada à biblioteca.');
      setDialog(false); setFile(null); setTitle(''); setAltText(''); setRoomId(null); setHomeBanner(false);
      if (inputRef.current) inputRef.current.value = '';
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Não foi possível concluir o carregamento.');
    }
  };
  const deleteMedia = (id: number, name: string) => {
    if (!window.confirm(`Remover “${name}” da biblioteca?`)) return;
    setError(''); setSuccess('');
    remove.mutate({ id }, { onSuccess: () => { refresh(); setSuccess('Imagem removida da biblioteca.'); }, onError: e => setError(e instanceof Error ? e.message : 'Não foi possível remover a imagem. Se estiver a ser usada num curso, altere primeiro a imagem desse curso.') });
  };
  const saveAssociations = async (id: number) => {
    setError(''); setSuccess('');
    try {
      await updateMedia.mutateAsync({ id, data: { roomId: selectedRoomId, homeBanner: selectedHomeBanner } });
      const previousRoomId = media.data?.find(item => item.id === id)?.roomId;
      const affectedRoomIds = [...new Set([previousRoomId, selectedRoomId].filter(
        (roomId): roomId is NonNullable<AdminMediaUpdateRoomId> => roomId != null,
      ))];
      await Promise.all([
        refresh(),
        ...affectedRoomIds.map(roomId => client.invalidateQueries({ queryKey: getListRoomPhotosQueryKey(roomId) })),
      ]);
      setEditingMediaId(null);
      setSuccess('Associações da imagem actualizadas.');
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Não foi possível alterar a sala associada.');
    }
  };
  return <AdminPage title="Biblioteca de mídias">
      <div className="admin-heading"><div><p className="admin-kicker">CONTEÚDOS · RECURSOS VISUAIS</p><h1>Biblioteca de mídias</h1><p>Carregue imagens para os cursos, associe-as a salas ou inclua-as no banner da página Início.</p></div><button type="button" className="admin-button" onClick={() => { setDialog(true); setError(''); }}><UploadCloud size={15} /> Carregar imagem</button></div>
    {success && <div className="admin-alert success" role="status"><Check size={16} />{success}</div>}{error && !dialog && <div className="admin-alert" role="alert"><X size={16} /><div><strong>Não foi possível concluir a operação.</strong><p>{error}</p></div></div>}
    <section className="admin-section"><div className="admin-section-head"><div><h2>Imagens activas</h2><p>{media.data?.length ?? 0} recursos registados · JPEG, PNG, WebP ou AVIF até 15 MB</p></div>{media.isError && <button className="admin-button secondary" type="button" onClick={() => media.refetch()}><RefreshCw size={14} /> Tentar novamente</button>}</div>
        <div className="admin-section-body">{media.isLoading ? <div className="admin-media-grid">{[0,1,2].map(n => <div className="admin-skeleton tall" key={n} />)}</div> : media.isError ? <div className="admin-state" role="alert"><X size={20} /><strong>Não foi possível carregar a biblioteca.</strong><p>Verifique a ligação e tente novamente.</p></div> : media.data?.length ? <div className="admin-media-grid">{media.data.map(item => <article className="admin-media-card" key={item.id}><img src={item.url} alt={item.altText} loading="lazy" /><div className="admin-media-info"><strong title={item.title}>{item.title}</strong><small>{item.contentType} · {(item.sizeBytes / 1024).toFixed(0)} KB · {formatAdminDate(item.createdAt)}</small><span className="admin-media-room-tag">{item.roomId ? `Galeria · ${mediaRoomName(item.roomId)}` : 'Sem sala associada'}</span>{item.homeBanner && <span className="admin-media-banner-tag">Banner · Início</span>}
          {editingMediaId === item.id ? <div className="admin-media-room-edit">
            <label className="admin-field"><span>Associar à sala</span><select aria-label={`Sala associada a ${item.title}`} value={selectedRoomId ?? ''} onChange={e => setSelectedRoomId(e.target.value ? e.target.value as NonNullable<AdminMediaUpdateRoomId> : null)}><option value="">Biblioteca geral (sem sala)</option>{Object.entries(roomNames).map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label>
            <label className="admin-media-home-banner-toggle"><input type="checkbox" checked={selectedHomeBanner} onChange={e => setSelectedHomeBanner(e.target.checked)} /><span><strong>Incluir na rotação da página Início</strong><small>A imagem entra no banner público enquanto esta opção estiver activa.</small></span></label>
            <div className="admin-media-room-edit-actions"><button type="button" className="admin-button" onClick={() => saveAssociations(item.id)} disabled={updateMedia.isPending}>{updateMedia.isPending ? 'A guardar…' : 'Guardar associações'}</button><button type="button" className="admin-button ghost" onClick={() => setEditingMediaId(null)} disabled={updateMedia.isPending}>Cancelar</button></div>
          </div> : <button type="button" className="admin-inline-link admin-media-room-edit-trigger" onClick={() => { setEditingMediaId(item.id); setSelectedRoomId(item.roomId); setSelectedHomeBanner(item.homeBanner); setError(''); setSuccess(''); }}>Editar associações</button>}
          <div className="admin-media-actions"><a href={item.url} target="_blank" rel="noreferrer" className="admin-inline-link">Abrir imagem</a><button type="button" className="admin-icon-button" aria-label={`Remover ${item.title}`} title="Remover imagem" onClick={() => deleteMedia(item.id, item.title)} disabled={remove.isPending || updateMedia.isPending}><Trash2 size={14} /></button></div></div></article>)}</div> : <div className="admin-empty"><Image size={25} /><strong>A biblioteca ainda está vazia.</strong><p>Carregue uma imagem para a usar numa sala ou curso.</p><button type="button" className="admin-button" onClick={() => setDialog(true)}><UploadCloud size={14} /> Carregar primeira imagem</button></div>}</div>
    </section>
    {dialog && <div className="admin-dialog-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && !busy) setDialog(false); }}><section className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="media-dialog-title"><header className="admin-dialog-head"><div><h2 id="media-dialog-title">Adicionar imagem</h2><p>O ficheiro é enviado directamente para o armazenamento seguro.</p></div><button type="button" className="admin-icon-button" onClick={() => setDialog(false)} aria-label="Fechar" disabled={busy}><X size={16} /></button></header><form className="admin-dialog-body" onSubmit={upload}><div className="admin-form-grid">
      <label className="admin-field wide"><span>Ficheiro de imagem</span><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" required onChange={chooseFile} /></label>
      <label className="admin-field wide"><span>Título</span><input required minLength={2} maxLength={160} value={title} onChange={e => setTitle(e.target.value)} /></label>
      <label className="admin-field wide"><span>Texto alternativo</span><input maxLength={500} value={altText} onChange={e => setAltText(e.target.value)} placeholder="Descrição breve para leitores de ecrã" /></label>
      <label className="admin-field wide"><span>Adicionar à galeria da sala</span><select value={roomId ?? ''} onChange={e => setRoomId(e.target.value ? e.target.value as NonNullable<AdminMediaInputRoomId> : null)}><option value="">Não associar a uma sala</option>{Object.entries(roomNames).map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select><small style={{ color: '#8a7e7a', fontSize: 9 }}>A fotografia aparecerá no catálogo público da sala escolhida.</small></label>
      <label className="admin-media-home-banner-toggle wide"><input type="checkbox" checked={homeBanner} onChange={e => setHomeBanner(e.target.checked)} /><span><strong>Adicionar também à rotação do banner</strong><small>A imagem será apresentada na página Início, além das imagens actuais.</small></span></label>
      {file && <div className="wide admin-badge">{file.name} · {(file.size / 1024).toFixed(0)} KB</div>}
    </div>{error && <div className="admin-alert" role="alert"><X size={15} />{error}</div>}<div className="admin-form-actions"><button type="button" className="admin-button ghost" onClick={() => setDialog(false)} disabled={busy}>Cancelar</button><button type="submit" className="admin-button" disabled={!file || busy}>{busy ? 'A carregar…' : 'Carregar para a biblioteca'}</button></div></form></section></div>}
  </AdminPage>;
}
export default function StaffMediaPage() { return <MediaContent />; }
