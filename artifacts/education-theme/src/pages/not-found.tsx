import { AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return <section className="page-intro not-found-page"><div className="container"><div className="eyebrow">Página não encontrada</div><h1>Não conseguimos encontrar este endereço.</h1><p>O conteúdo pode ter mudado ou o endereço pode estar incorreto.</p><Link className="button button-teal" href="/"><AlertCircle size={15} /> VOLTAR AO INÍCIO <ArrowRight size={14} /></Link></div></section>;
}
