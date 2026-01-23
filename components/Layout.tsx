import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from './Icons.tsx';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { label: 'Inicio', path: '/', icon: 'Home' },
    { label: 'Explorar', path: '/explorer', icon: 'LayoutGrid' },
    { label: 'Planes', path: '/membership', icon: 'Trophy' },
    { label: 'Mapa', path: '/map', icon: 'MapPin' },
    { label: 'Registro', path: '/register', icon: 'PlusCircle' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full overflow-x-hidden">
      {/* Desktop Header */}
      <header className="hidden md:block bg-[#0a2540] text-white shadow-lg sticky top-0 z-[60] border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center group transition-transform active:scale-95">
            <div className="flex flex-col -space-y-1">
              <span className="text-2xl font-black tracking-tighter uppercase leading-none">NEGOCIOS</span>
              <span className="text-xl font-black tracking-tighter uppercase text-yellow-400">HN</span>
            </div>
          </Link>
          
          <nav className="flex items-center space-x-8">
            {navItems.map(item => (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all relative py-2 ${
                  location.pathname === item.path ? 'text-yellow-400' : 'text-slate-300 hover:text-white'
                }`}
              >
                {item.label}
                {location.pathname === item.path && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400 rounded-full" />
                )}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden bg-[#0a2540] text-white p-4 sticky top-0 z-[60] shadow-xl flex items-center justify-between border-b border-white/5 w-full">
        <Link to="/" className="flex items-center">
           <div className="flex flex-col -space-y-1">
             <h1 className="text-lg font-black tracking-tighter uppercase leading-none">NEGOCIOS</h1>
             <span className="text-xs font-black tracking-tighter uppercase text-yellow-400 leading-none">HN</span>
           </div>
        </Link>
        <Link to="/explorer" className="p-2.5 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-transform">
          <Icon name="Search" className="w-5 h-5 text-yellow-400" />
        </Link>
      </header>

      <main className="flex-grow max-w-full lg:max-w-6xl mx-auto w-full md:px-6 md:py-8 mb-16 md:mb-0">
        <div className="bg-white md:rounded-[2.5rem] md:shadow-2xl overflow-hidden min-h-screen md:min-h-[calc(100vh-140px)] border-x md:border border-slate-100/50 w-full">
          {children}
        </div>
      </main>

      {/* Mobile Nav - Optimizado para evitar desbordamientos */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200 pb-safe z-[60] shadow-[0_-10px_30px_rgba(0,0,0,0.05)] w-full">
        <div className="flex justify-around items-center h-16 w-full">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/explorer' && location.pathname.startsWith('/category'));
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex flex-col items-center justify-center w-full h-full transition-all relative ${
                  isActive ? 'text-[#0a2540]' : 'text-slate-400'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-yellow-400/10' : ''}`}>
                  <Icon 
                    name={item.icon} 
                    className={`w-5 h-5 transition-transform ${isActive ? 'text-[#0a2540] scale-110' : 'text-slate-400'}`} 
                  />
                </div>
                <span className={`text-[8px] font-black uppercase tracking-tighter mt-1 ${isActive ? 'text-[#0a2540]' : 'text-slate-400'}`}>
                  {item.label}
                </span>
                {isActive && <div className="absolute top-0 w-8 h-1 bg-yellow-400 rounded-b-full" />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer Desktop */}
      <footer className="hidden md:block bg-[#0a2540] text-white py-16 mt-12 border-t border-white/5 w-full">
        <div className="max-w-6xl mx-auto px-6">
           <div className="flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0">
              <div className="text-center md:text-left">
                 <h3 className="text-2xl font-black tracking-tighter uppercase mb-1 leading-none">NEGOCIOS</h3>
                 <h4 className="text-xl font-black tracking-tighter uppercase text-yellow-400 leading-none mb-2">HN</h4>
                 <p className="text-slate-400 text-sm font-medium max-w-xs leading-relaxed">Impulsando el desarrollo digital y económico de Honduras.</p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-8">
                 {['Privacidad', 'Términos', 'Contacto'].map(link => (
                    <span key={link} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-yellow-400 cursor-pointer transition-colors">
                       {link}
                    </span>
                 ))}
              </div>

              <div className="flex items-center space-x-4">
                 <Link to="/admin" className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 flex items-center group">
                    <Icon name="ShieldCheck" className="w-4 h-4 mr-2 text-yellow-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Panel Admin</span>
                 </Link>
              </div>
           </div>
           
           <div className="mt-12 pt-8 border-t border-white/5 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                 © 2025 By: Mora-Grafic’s | Todos los Derechos Reservados.
              </p>
           </div>
        </div>
      </footer>
    </div>
  );
};