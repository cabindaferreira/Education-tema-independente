import { useMemo, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Archive, ArrowUpRight, BookOpen, Check, Edit3, Plus, RefreshCw, Search, X } from 'lucide-react';
import { getGetAdminOverviewQueryKey, getListAdminCoursesQueryKey, getListAdminMediaQueryKey, getListPublishedCoursesQueryKey, useArchiveAdminCourse, useCreateAdminCourse, useListAdminCourses, useListAdminMedia, useUpdateAdminCourse, type AdminCourse, type AdminCourseCreateInput, type AdminCourseUpdateInput } from '@workspace/api-client-react';
import { AdminPage, formatKz } from '@/components/admin-shell';

type CourseForm = AdminCourseCreateInput;
const blankForm: CourseForm = { id: '', title: '', description: '', duration: '', priceKz: 1, imageUrl: '', published: false, enrollmentOpen: false };

function CourseEditor({ course, onClose }: { course: AdminCourse | null; onClose: () => void }) {
  const client = useQueryClient();
  const media = useListAdminMedia({ query: { queryKey: getListAdminMediaQueryKey() } });
  const create = useCreateAdminCourse();
  const update = useUpdateAdminCourse();
  const [form, setForm] = useState<CourseForm>(course ? { ...course } : blankForm);
  const [error, setError] = useState('');
  const busy = create.isPending || update.isPending;
  const change = (key: keyof CourseForm, value: string | number | boolean) => setForm(current => ({ ...current, [key]: value }));
  const save = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const refresh = () => {
      client.invalidateQueries({ queryKey: getListAdminCoursesQueryKey() });
      client.invalidateQueries({ queryKey: getListPublishedCoursesQueryKey() });
      client.invalidateQueries({ queryKey: getGetAdminOverviewQueryKey() });
      onClose();
    };
    if (course) {
      const data: AdminCourseUpdateInput = { title: form.title.trim(), description: form.description.trim(), duration: form.duration.trim(), priceKz: Number(form.priceKz), imageUrl: form.imageUrl.trim(), published: form.published, enrollmentOpen: form.enrollmentOpen };
      update.mutate({ courseId: course.id, data }, { onSuccess: refresh, onError: (e) => setError(e instanceof Error ? e.message : 'Não foi possível guardar o curso.') });
    } else {
      create.mutate({ data: { ...form, id: form.id.trim().toLowerCase(), title: form.title.trim(), description: form.description.trim(), duration: form.duration.trim(), priceKz: Number(form.priceKz), imageUrl: form.imageUrl.trim() } }, { onSuccess: refresh, onError: (e) => setError(e instanceof Error ? e.message : 'Não foi possível criar o curso.') });
    }
  };
  return <div className="admin-dialog-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="course-editor-title">
    <header className="admin-dialog-head"><div><h2 id="course-editor-title">{course ? 'Editar curso' : 'Novo curso'}</h2><p>Os dados guardados são usados no catálogo e na inscrição pública.</p></div><button type="button" className="admin-icon-button" onClick={onClose} aria-label="Fechar"><X size={16} /></button></header>
    <form className="admin-dialog-body" onSubmit={save}><div className="admin-form-grid">
      {!course && <label className="admin-field"><span>Identificador do curso</span><input required minLength={2} maxLength={70} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.id} onChange={e => change('id', e.target.value)} placeholder="ex.: gestao-comercial" /></label>}
      <label className={`admin-field ${course ? 'wide' : ''}`}><span>Nome do curso</span><input required minLength={2} maxLength={160} value={form.title} onChange={e => change('title', e.target.value)} /></label>
      <label className="admin-field"><span>Duração</span><input required minLength={2} maxLength={100} value={form.duration} onChange={e => change('duration', e.target.value)} placeholder="ex.: 3 meses" /></label>
      <label className="admin-field"><span>Preço total (Kz)</span><input required type="number" min={1} max={100000000} value={form.priceKz} onChange={e => change('priceKz', Number(e.target.value))} /></label>
      <label className="admin-field wide"><span>URL da imagem</span><input required maxLength={1000} list="admin-course-media-suggestions" value={form.imageUrl} onChange={e => change('imageUrl', e.target.value)} placeholder="Escolha na biblioteca ou introduza uma URL" /><datalist id="admin-course-media-suggestions">{media.data?.map(asset => <option value={asset.url} label={asset.title} key={asset.id} />)}</datalist><small style={{ color: '#8a7e7a', fontSize: 9 }}>{media.data?.length ? `${media.data.length} imagens disponíveis na biblioteca.` : 'Pode consultar ou carregar imagens na Biblioteca de mídias.'}</small></label>
      <label className="admin-field wide"><span>Descrição</span><textarea required minLength={5} maxLength={2000} value={form.description} onChange={e => change('description', e.target.value)} /></label>
      <div className="wide admin-checks"><label className="admin-check"><input type="checkbox" checked={form.published} onChange={e => change('published', e.target.checked)} /> Publicado no catálogo</label><label className="admin-check"><input type="checkbox" checked={form.enrollmentOpen} onChange={e => change('enrollmentOpen', e.target.checked)} /> Inscrições abertas</label></div>
    </div>{error && <div className="admin-alert" role="alert"><X size={15} />{error}</div>}<div className="admin-form-actions"><button type="button" className="admin-button ghost" onClick={onClose}>Cancelar</button><button type="submit" className="admin-button" disabled={busy}>{busy ? 'A guardar…' : course ? 'Guardar alterações' : 'Criar curso'}</button></div></form>
  </section></div>;
}

function CoursesContent() {
  const client = useQueryClient();
  const query = useListAdminCourses({ query: { queryKey: getListAdminCoursesQueryKey(), retry: 1 } });
  const update = useUpdateAdminCourse();
  const archive = useArchiveAdminCourse();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<AdminCourse | null | undefined>(undefined);
  const [notice, setNotice] = useState('');
  const [operationError, setOperationError] = useState('');
  const rows = useMemo(() => (query.data ?? []).filter(course => `${course.title} ${course.id}`.toLowerCase().includes(search.trim().toLowerCase())), [query.data, search]);
  const refresh = () => { client.invalidateQueries({ queryKey: getListAdminCoursesQueryKey() }); client.invalidateQueries({ queryKey: getListPublishedCoursesQueryKey() }); client.invalidateQueries({ queryKey: getGetAdminOverviewQueryKey() }); };
  const toggle = (course: AdminCourse, key: 'published' | 'enrollmentOpen') => {
    const enabled = !course[key];
    setOperationError(''); setNotice('');
    update.mutate({ courseId: course.id, data: { title: course.title, description: course.description, duration: course.duration, priceKz: course.priceKz, imageUrl: course.imageUrl, published: key === 'published' ? enabled : course.published, enrollmentOpen: key === 'enrollmentOpen' ? enabled : course.enrollmentOpen } }, { onSuccess: () => { refresh(); setNotice('Estado do curso actualizado.'); }, onError: e => setOperationError(e instanceof Error ? e.message : 'Não foi possível actualizar o curso.') });
  };
  const archiveCourse = (course: AdminCourse) => {
    if (!window.confirm(`Arquivar “${course.title}”? O histórico de inscrições será mantido.`)) return;
    archive.mutate({ courseId: course.id }, { onSuccess: () => { refresh(); setNotice('Curso arquivado.'); }, onError: e => setOperationError(e instanceof Error ? e.message : 'Não foi possível arquivar o curso.') });
  };
  return <AdminPage title="Cursos"><div className="admin-heading"><div><p className="admin-kicker">FORMAÇÃO · CATÁLOGO</p><h1>Gestão de cursos</h1><p>Edite a oferta formativa, controle a publicação e defina quando aceitar inscrições.</p></div><button className="admin-button" type="button" onClick={() => setEditing(null)}><Plus size={15} /> Novo curso</button></div>
    {notice && <div className="admin-alert success" role="status"><Check size={16} />{notice}</div>}{operationError && <div className="admin-alert" role="alert"><X size={16} />{operationError}</div>}
    <div className="admin-toolbar"><label className="admin-search"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar por nome ou identificador" aria-label="Pesquisar cursos" /></label><span className="admin-badge">{query.isLoading ? 'A carregar…' : `${rows.length} cursos`}</span></div>
    <section className="admin-section"><div className="admin-section-head"><div><h2>Todos os cursos</h2><p>Os cursos publicados com inscrições abertas aparecem na página pública.</p></div>{query.isError && <button type="button" className="admin-button secondary" onClick={() => query.refetch()}><RefreshCw size={14} /> Tentar novamente</button>}</div>
      {query.isLoading ? <div className="admin-section-body"><div className="admin-skeleton" /><div className="admin-skeleton" /><div className="admin-skeleton" /></div> : query.isError ? <div className="admin-state" role="alert"><X size={20} /><strong>Não foi possível carregar os cursos.</strong><p>Verifique a ligação e tente novamente.</p></div> : rows.length === 0 ? <div className="admin-empty"><BookOpen size={23} /><strong>{search ? 'Sem resultados para esta pesquisa.' : 'Ainda não há cursos no catálogo.'}</strong><p>{search ? 'Experimente outro nome ou identificador.' : 'Crie o primeiro curso para começar a gerir a oferta formativa.'}</p>{!search && <button type="button" className="admin-button" onClick={() => setEditing(null)}><Plus size={14} /> Criar curso</button>}</div> :
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Curso</th><th>Investimento</th><th>Catálogo</th><th>Inscrições</th><th>Acções</th></tr></thead><tbody>{rows.map(course => <tr key={course.id}><td><div style={{ display: 'flex', gap: 11, alignItems: 'center' }}><img className="admin-course-thumb" src={course.imageUrl} alt="" /><span><strong>{course.title}</strong><small>{course.duration} · {course.id}</small></span></div></td><td>{formatKz(course.priceKz)}</td><td><button className={`admin-badge ${course.published ? 'good' : ''}`} type="button" onClick={() => toggle(course, 'published')} disabled={update.isPending} aria-label={`${course.published ? 'Despublicar' : 'Publicar'} ${course.title}`}>{course.published ? 'Publicado' : 'Oculto'}</button></td><td><button className={`admin-badge ${course.enrollmentOpen ? 'good' : 'warn'}`} type="button" onClick={() => toggle(course, 'enrollmentOpen')} disabled={update.isPending}>{course.enrollmentOpen ? 'A aceitar' : 'Fechadas'}</button></td><td><div className="admin-row-actions"><button type="button" className="admin-icon-button" aria-label={`Editar ${course.title}`} title="Editar curso" onClick={() => setEditing(course)}><Edit3 size={14} /></button><a className="admin-icon-button" href={`/inscricao/${course.id}`} target="_blank" rel="noreferrer" aria-label={`Abrir inscrição de ${course.title}`} title="Pré-visualizar inscrição"><ArrowUpRight size={14} /></a><button type="button" className="admin-icon-button" aria-label={`Arquivar ${course.title}`} title="Arquivar" onClick={() => archiveCourse(course)} disabled={archive.isPending}><Archive size={14} /></button></div></td></tr>)}</tbody></table></div>}</section>
    {editing !== undefined && <CourseEditor course={editing} onClose={() => setEditing(undefined)} />}
  </AdminPage>;
}
export default function StaffCoursesPage() { return <CoursesContent />; }
