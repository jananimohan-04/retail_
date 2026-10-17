/* Store profile — mirrors legacy vProfile: me-derived fields + Save toast + Logout. */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, MapPin, Building2, ShieldCheck, 
  LogOut, Save, CheckCircle2, Sparkles 
} from 'lucide-react';
import { useAuth } from '../../auth';
import { toast } from '../../components/ui';

export default function Profile() {
  const { me, logout } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('98765 00001');
  const [email, setEmail] = useState('');
  const [plant, setPlant] = useState('Chakan, Pune');

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => {
    if (me) {
      setName(me.name || '');
      setEmail(me.email || '');
    }
  }, [me]);

  if (!me) return null;

  const out = async () => {
    await logout();
    nav('/login', { replace: true });
  };

  const handleSave = (e) => {
    e.preventDefault();
    toast('Profile changes saved successfully', '✅');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 w-full max-w-5xl mx-auto"
    >
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-blue-600" /> Account & Profile
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">Manage identity credentials and preferred delivery preferences</p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-5 flex-wrap sm:flex-nowrap">
          <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-blue-500/20 flex-shrink-0">
            {(me.name || 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-black text-slate-900">{me.name}</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Account
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                {String(me.role || '').replace('_', ' ')}
              </span>
              <span>•</span>
              <span className="font-mono text-blue-700 font-semibold">{me.companyId || 'PLATFORM'}</span>
              <span>•</span>
              <span>{me.email || ''}</span>
              {me.google && (
                <>
                  <span>•</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Google Auth
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Editable Form */}
        <form onSubmit={handleSave} className="space-y-5 pt-6 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Full Name
              </label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-hidden transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Direct Mobile
              </label>
              <input 
                type="tel" 
                value={mobile} 
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-hidden transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Registered Email (Locked)
              </label>
              <input 
                type="email" 
                value={email} 
                disabled
                className="w-full px-3.5 py-2.5 text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Default Delivery Plant
              </label>
              <input 
                type="text" 
                value={plant} 
                onChange={(e) => setPlant(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-hidden transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 flex-wrap">
            <button 
              type="submit" 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> Save Preferences
            </button>

            <button 
              type="button" 
              onClick={out}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-red-200 hover:bg-red-50 text-red-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out of Platform
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
