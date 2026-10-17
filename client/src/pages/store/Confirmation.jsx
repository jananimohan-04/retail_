/* Store order confirmation — mirrors legacy vConfirm: summary + track/continue/print. */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, Printer, ArrowRight, Package, Clock, 
  ShieldCheck, MapPin, Receipt, ArrowLeft, ShoppingBag 
} from 'lucide-react';
import { api, fmt } from '../../api';
import { Empty, Skeleton, statusBadge } from '../../components/ui';

export default function Confirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);
  useEffect(() => {
    setOrder(null); 
    setMissing(false);
    api.get('/api/orders/' + id).then(setOrder).catch(() => setMissing(true));
  }, [id]);

  if (missing) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center max-w-lg mx-auto shadow-xs">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Receipt className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Order Not Found</h3>
        <p className="text-slate-500 text-sm mb-6">Order #{id} could not be located in the database.</p>
        <Link 
          to="/store/orders" 
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm"
        >
          View My Orders <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (order === null) return <Skeleton h={320} />;
  const o = order;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto space-y-6"
    >
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden text-center">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
            className="w-18 h-18 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-3xl flex items-center justify-center mb-5 shadow-lg shadow-emerald-950/40"
          >
            <CheckCircle2 className="w-10 h-10" />
          </motion.div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 mb-3">
            Requisition Submitted Successfully
          </span>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
            Order #{o.id}
          </h1>

          <p className="text-slate-300 text-sm max-w-md mx-auto mb-6">
            Stock is reserved in the warehouse and queued for commercial verification & dispatch.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15 text-xs font-semibold">
            <span>Date: <b className="text-white font-mono">{o.date}</b></span>
            <span className="text-white/30">•</span>
            <span>Total: <b className="text-white font-mono">{fmt(o.total)}</b></span>
            <span className="text-white/30">•</span>
            <span>Status: <b className="text-amber-300 font-bold">{o.status}</b></span>
            {o.poRef && (
              <>
                <span className="text-white/30">•</span>
                <span>PO: <b className="text-blue-200 font-mono">{o.poRef}</b></span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Details Box */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
              <MapPin className="w-4 h-4 text-blue-600" /> Delivery Address
            </div>
            <div className="font-bold text-slate-900">{o.companyName || o.customer}</div>
            <div className="text-slate-600">{o.contact || o.customer} • {o.mobile}</div>
            <div className="text-slate-500 mt-1">{o.address || o.city}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Commercial Status
              </div>
              <div className="text-slate-600">
                ERP status recorded as <b className="text-slate-900">{o.status}</b>. GST invoice will be generated upon dispatch.
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              Items reserved: {(o.items || []).reduce((a, i) => a + (i.qty || 0), 0)} unit(s)
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 flex-wrap pt-2 border-t border-slate-100">
          <Link 
            to={'/store/orders/' + o.id}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
          >
            Track Order Details <ArrowRight className="w-4 h-4" />
          </Link>
          <Link 
            to="/store/listing"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" /> Continue Catalog Browsing
          </Link>
          <button 
            type="button" 
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print Requisition
          </button>
        </div>
      </div>
    </motion.div>
  );
}
