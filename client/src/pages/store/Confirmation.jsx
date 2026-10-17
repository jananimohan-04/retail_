/* Store order confirmation — mirrors legacy vConfirm: summary + track/continue/print. */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, fmt } from '../../api';
import { Empty, Skeleton } from '../../components/ui';

export default function Confirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);
  useEffect(() => {
    setOrder(null); setMissing(false);
    api.get('/api/orders/' + id).then(setOrder).catch(() => setMissing(true));
  }, [id]);

  if (missing) return <Empty icon="📭" title="No orders yet." />;
  if (order === null) return <Skeleton h={280} />;
  const o = order;
  return (
    <div className="card">
      <div style={{ background: 'linear-gradient(135deg,#0B1533,#1E40AF)', color: '#fff', padding: 36, textAlign: 'center' }}>
        <div style={{ fontSize: 52 }}>🏭</div>
        <h1 style={{ margin: '8px 0' }}>Order request submitted</h1>
        <p>Order <b>{o.id}</b> • {fmt(o.total)} • status <b>{o.status}</b>{o.poRef ? ' • PO ' + o.poRef : ''}</p>
      </div>
      <div className="card-pad" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link className="btn btn-primary" to={'/store/orders/' + o.id}>Track order →</Link>
        <Link className="btn btn-ghost" to="/store/listing">Continue browsing</Link>
        <button className="btn btn-ghost" onClick={() => window.print()}>🖨️ Print</button>
      </div>
    </div>
  );
}
