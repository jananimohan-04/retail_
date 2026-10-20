/* Industrial seed — CNCFORGE Industrial Store (dev seed only).
   Controlled replacement for the old consumer demo catalog.
   Never auto-deletes production records: backend migration script backs up db.json first. */
window.MOCK = (() => {
  const IMG = (id, w=700) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
  const CAT = [
    { id:'cnc-machines', name:'CNC Machines', icon:'🏭', desc:'Turning, milling & machining centers', scope:'global', companyId:null, image:'', sortOrder:0, active:true },
    { id:'cutting-tools', name:'Cutting Tools', icon:'🔩', desc:'Inserts, end mills, drills & taps', scope:'global', companyId:null, image:'', sortOrder:1, active:true },
    { id:'spares', name:'Machine Spare Parts', icon:'⚙️', desc:'Bearings, ball screws & hydraulics', scope:'global', companyId:null, image:'', sortOrder:2, active:true },
    { id:'workholding', name:'Workholding & Accessories', icon:'🗜️', desc:'Chucks, collets & fixtures', scope:'global', companyId:null, image:'', sortOrder:3, active:true },
    { id:'electrical', name:'Control & Electrical', icon:'🎛️', desc:'Servo, drives & sensors', scope:'global', companyId:null, image:'', sortOrder:4, active:true },
    { id:'raw-materials', name:'Raw Materials', icon:'🧱', desc:'Bars, rods, sheets & plastics', scope:'global', companyId:null, image:'', sortOrder:5, active:true },
    { id:'consumables', name:'Industrial Consumables', icon:'🛢️', desc:'Coolants, lubricants & abrasives', scope:'global', companyId:null, image:'', sortOrder:6, active:true },
    { id:'measuring', name:'Measuring & Inspection', icon:'📏', desc:'Calipers, micrometers & gauges', scope:'global', companyId:null, image:'', sortOrder:7, active:true },
    { id:'safety', name:'Safety & Maintenance', icon:'🦺', desc:'PPE, filters & maintenance kits', scope:'global', companyId:null, image:'', sortOrder:8, active:true },
  ];
  const COMPANIES = [
    { id:'C-ARGUS', code:'C-ARGUS', name:'Argus', logo:'🏭', industry:'CNC Manufacturing', email:'argushexadoc2021@gmail.com', phone:'', address:'', city:'Pune', state:'Maharashtra', pin:'411001', description:'ARGUSCNC Industrial Manufacturing', status:'active', storeStatus:'active', plan:'Scale', orders:0, revenue:0, products:5, users:4, createdAt:'2026-10-16', updatedAt:'2026-10-18' },
  ];
  const PRODUCTS = [
    { id:'P-MVCLL5E3UF', sku:'ARG-PRECISION-8891', companyId:'C-ARGUS', name:'High Precision CNC Milling Bit 10mm', brand:'ArgusCNC', price:1850, uom:'Pc', moq:1, stock:45, category:'cutting-tools', visible:true, featured:true, sold:0, created:'2026-10-16', desc:'High precision 10mm carbide milling bit for industrial CNC machining.', specs:{'Diameter':'10mm','Material':'Solid Carbide'}, images:[], video:'' },
    { id:'P-MVCIQHM6IG', sku:'ARG-PRECISION-9901', companyId:'C-ARGUS', name:'High Precision CNC Milling Bit 6mm', brand:'ArgusCNC', price:1450, uom:'Pc', moq:1, stock:60, category:'cutting-tools', visible:true, featured:false, sold:0, created:'2026-10-16', desc:'High precision 6mm carbide milling bit for industrial CNC machining.', specs:{'Diameter':'6mm','Material':'Solid Carbide'}, images:[], video:'' },
    { id:'P-MVCI09EQA7', sku:'ARG-TEST-002', companyId:'C-ARGUS', name:'Precision Collet Chuck Updated', brand:'ArgusCNC', price:3200, uom:'Pc', moq:1, stock:25, category:'workholding', visible:true, featured:false, sold:0, created:'2026-10-16', desc:'Precision industrial collet chuck.', specs:{}, images:[], video:'' },
    { id:'P-MVCHP97CXZ', sku:'ARG-TEST-001', companyId:'C-ARGUS', name:'Precision Test Carbide End Mill 10mm', brand:'ArgusCNC', price:1600, uom:'Pc', moq:1, stock:30, category:'cutting-tools', visible:true, featured:false, sold:0, created:'2026-10-16', desc:'Precision test carbide end mill.', specs:{}, images:[], video:'' },
    { id:'P-MVCEPL6DHG', sku:'ARG-CH20-01', companyId:'C-ARGUS', name:'Argus High-Precision Collet CH-20', brand:'ArgusCNC', price:2400, uom:'Pc', moq:1, stock:50, category:'workholding', visible:true, featured:true, sold:0, created:'2026-10-16', desc:'High-precision collet CH-20.', specs:{}, images:[], video:'' }
  ];
  const ORDERS = [];
  const QUOTES = [];
  const USERS = [
    { id:'U-super-janani', name:'Janani Mohan', role:'super_admin', companyId:null, email:'jananimohan44@gmail.com', active:true },
    { id:'U-argus', name:'argus', role:'company_admin', companyId:'C-ARGUS', email:'argushexadoc2021@gmail.com', active:true },
    { id:'U-tech-argus', name:'Technologies Argus', role:'super_admin', companyId:null, email:'technologiesargus@gmail.com', active:true },
    { id:'U-prod-argus', name:'Production Argus', role:'sales_user', companyId:'C-ARGUS', email:'productionargus@gmail.com', active:true },
    { id:'U-janani-1604', name:'janani', role:'sales_user', companyId:'C-ARGUS', email:'jananimohan1604@gmail.com', mobile:'', active:true },
  ];
  return { CAT, COMPANIES, PRODUCTS, ORDERS, QUOTES, USERS };
})();
