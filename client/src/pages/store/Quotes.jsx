/* Store quotes — mirrors legacy vMyQuotes: RFQs with quoted prices + admin notes. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileText, ShoppingBag, Clock, ChevronRight, CheckCircle2, 
  HelpCircle, AlertCircle, ArrowRight 
} from 'lucide-react';
import { api, fmt } from '../../api';
import { Empty, Skeleton, statusBadge, PageHero } from '../../components/ui';
import { asList } from './Home';

export default function Quotes() {
  const [quotes, setQuotes] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => {
    api.get('/api/quotations').then((d) => setQuotes(asList(d))).catch(() => setQuotes([]));
    api.get('/api/products').then((d) => setProducts(asList(d))).catch(() => {});
  }, []);

  if (quotes === null) return <Skeleton h={280} />;
  const prodById = (pid) => products.find((p) => p.id === pid) || { name: pid, sku: pid, images: [] };

  return (
    <div className="space-y-6 w-full">
      <PageHero
        title={`Quotation Requests (${quotes.length})`}
        subtitle="Custom indents, technical specification RFQs, high-volume machinery, and tooling estimates."
        icon={FileText}
        badgeText="Quotation Pipeline"
        badgeColor="orange"
        gradient="from-orange-500 via-amber-500 to-red-500"
        actions={
          <Link 
            to="/store/listing" 
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm shadow-orange-600/30 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Browse Catalog
          </Link>
        }
      />

      {quotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center max-w-md mx-auto shadow-xs">
          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No quotation requests yet</h3>
          <p className="text-slate-500 text-xs mb-5">
            You haven't requested any custom pricing or bulk quotation indents yet.
          </p>
          <Link 
            to="/store/listing" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
          >
            Explore Catalog <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => {
            const p = prodById(q.pid);
            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition-all space-y-3"
              >
                <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
                  <img 
                    src={(p.images || [])[0] || ''} 
                    onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${q.pid}/100/100`; }} 
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 bg-slate-50 flex-shrink-0" 
                    alt={p.name} 
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-sm font-mono">{q.id}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-bold text-slate-800 text-sm">{p.name}</span>
                    </div>

                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-slate-600 font-semibold">{p.sku || q.pid}</span>
                      <span>•</span>
                      <span>Requested Qty: <b className="text-slate-800">{q.qty}</b></span>
                      <span>•</span>
                      <span className="font-mono">{q.date}</span>
                    </div>

                    {q.techReq && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2">
                        <span className="font-bold text-slate-700">Technical Requirement:</span> {q.techReq}
                      </p>
                    )}
                  </div>

                  <div className="text-right flex flex-col items-end gap-1.5 min-w-[120px]">
                    <div>{statusBadge(q.status)}</div>
                    {q.quotePrice != null ? (
                      <div className="mt-1">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Quoted Unit Price</span>
                        <span className="font-black text-emerald-600 text-sm font-mono">{fmt(q.quotePrice)}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                        Awaiting Quote
                      </span>
                    )}
                  </div>
                </div>

                {q.adminNote && (
                  <div className="pt-2 border-t border-slate-100 text-xs text-blue-900 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/60">
                    <span className="font-bold">🏭 Supplier Note:</span> {q.adminNote}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
