import React, { useState, useEffect, useRef } from 'react';
//import './index.css';//
import { HashRouter, Routes, Route, Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from './components/Layout.tsx';
import { CATEGORIES, Business, BusinessStatus, MembershipTier } from './types.ts';
import { MOCK_BUSINESSES } from './constants.tsx';
import { Icon } from './components/Icons.tsx';
import { generateBusinessDescription } from './services/geminiService.ts';
import * as XLSX from 'xlsx';

// Firebase
import { db } from './firebase.ts';
import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';

// Importaciones de Leaflet
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// --- Configuración Global de Leaflet para evitar errores de iconos perdidos ---
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const DB_KEY = 'negocios_hn_local_db_stable';
const ADMIN_AUTH_KEY = 'negocios_hn_admin_session';

const getInitialData = (): Business[] => {
  try {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Error al cargar localStorage", e);
  }
  return MOCK_BUSINESSES;
};

const saveToDB = (data: Business[]) => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Error crítico de almacenamiento:", e);
    throw new Error("Límite de memoria alcanzado en el navegador. Intente subir imágenes más pequeñas o eliminar registros antiguos.");
  }
};

const mapFirestoreToBusiness = (doc: any): Business => {
  const data = doc.data();
  
  // Imagen por defecto si no hay imagen en Firestore
  const defaultImage = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800';
  
  return {
    id: doc.id,
    name: data.name || '',
    ownerPassword: data.ownerPassword || data.ContrasenaPropietario || '',
    description: data.description || data.Descripcion || '',
    category: data.category || data.Categoria || '',
    subCategory: data.subCategory || data.Subcategoria || '',
    address: data.address || data.Direccion || '',
    phone: data.phone || data.Telefono || '',
    whatsapp: data.whatsapp || data.WhatsApp || '',
    image: data.image || data.ImagenPrincipal || defaultImage,
    // CORREGIDO: Conversión de string a enum
    status: data.status?.toString().toLowerCase() === 'verified' 
      ? BusinessStatus.VERIFIED 
      : BusinessStatus.PENDING,
    featured: data.VIP || data.featured || false,
    rating: data.rating || 5.0,
    hours: data.hours || '08:00 AM - 05:00 PM',
    lat: data.lat || 15.6333,
    lng: data.lng || -87.1167,
    tier: data.plan || data.tier || MembershipTier.LITE,
    facebook: data.Facebook || data.facebook || '',
    instagram: data.Instagram || data.instagram || '',
    tiktok: data.TikTok || data.tiktok || '',
    otherLink: data.LinkAdicional || data.otherLink || '',
    gallery: data.GaleriaFotos || data.gallery || []
  };
};

// --- Utilidad para Compresión de Imágenes ---
const compressImage = (base64: string, maxWidth = 800, quality = 0.6): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxWidth) {
          width *= maxWidth / height;
          height = maxWidth;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
};

// --- Componentes ---

const BusinessCard: React.FC<{ biz: Business }> = ({ biz }) => {
  const category = CATEGORIES.find(c => c.id === biz.category);
  return (
    <Link 
      to={`/business/${biz.id}`}
      className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 w-full flex flex-col h-full"
    >
      <div className="relative h-48 overflow-hidden block">
        <img src={biz.image} alt={biz.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-xl flex items-center shadow-sm z-10">
          <Icon name="Star" className="w-3 h-3 text-amber-500 fill-current mr-1" />
          <span className="text-[10px] font-black text-slate-800">{biz.rating}</span>
        </div>
      </div>
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest opacity-70">{category?.name}</span>
          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
            biz.status === BusinessStatus.VERIFIED ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {biz.status === BusinessStatus.VERIFIED ? 'Verificado' : 'Pendiente'}
          </span>
        </div>
        <h4 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors leading-tight">{biz.name}</h4>
        <p className="text-sm text-slate-500 line-clamp-2 mb-4 font-medium leading-relaxed flex-grow">{biz.description}</p>
        <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-tight">
          <Icon name="MapPin" className="w-3 h-3 mr-1.5 text-blue-500 shrink-0" />
          <span className="truncate">{biz.address}</span>
        </div>
      </div>
    </Link>
  );
};

// --- Vistas ---

const HomeView = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);

  useEffect(() => {
  const q = query(collection(db, 'negocios'));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(mapFirestoreToBusiness);
    setBusinesses(data);
    saveToDB(data);
  });
  return () => unsubscribe();
}, []);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const featuredBusinesses = businesses
    .filter(b => b.featured && b.status === BusinessStatus.VERIFIED)
    .slice(0, 6);

  const selectedCategory = CATEGORIES.find(c => c.id === selectedCatId);

  const [subcatSearch, setSubcatSearch] = useState('');
  
  // Dentro del modal de selectedCategory, antes del grid de subcategorías:
<input 
  type="text" 
  placeholder="Buscar subcategoría..." 
  className="w-full mb-4 p-3 border rounded-xl text-sm"
  value={subcatSearch}
  onChange={(e) => setSubcatSearch(e.target.value)}
/>

// Filtrar subcategorías:
{selectedCategory.subCategories
  .filter(sub => sub.name.toLowerCase().includes(subcatSearch.toLowerCase()))
  .map(sub => (
    <Link key={sub.id} to={`/explorer?category=${selectedCategory.id}&sub=${sub.id}`}>
      {sub.name}
    </Link>

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="animate-in fade-in duration-700 w-full overflow-hidden">
      <section className="relative min-h-[350px] h-[50vh] md:h-[55vh] flex items-center justify-center overflow-hidden px-4">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover brightness-[0.5]" alt="Honduras" />
        </div>
        <div className="relative z-10 text-center w-full max-w-4xl space-y-6">
          <div className="space-y-4">
            <h1 className="text-xl md:text-3xl lg:text-4xl font-black text-white leading-tight uppercase tracking-tighter drop-shadow-lg">
              Descubre los mejores <br className="hidden md:block" />
              <span className="text-yellow-400">Productos y Servicios</span> en Honduras
            </h1>
            <p className="text-slate-200 text-xs md:text-sm font-medium max-w-lg mx-auto opacity-90 px-4 leading-relaxed">
              Encuentra negocios locales verificados y apoya la economía de nuestro municipio de forma segura y confiable.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 px-6">
            <button onClick={() => navigate('/explorer')} className="w-full sm:w-auto px-7 py-3 bg-yellow-400 text-[#0a2540] rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center justify-center shadow-xl">Explorar Directorio <Icon name="ChevronRight" className="ml-2 w-4 h-4" /></button>
            <button onClick={() => navigate('/register')} className="w-full sm:w-auto px-7 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 active:scale-95">Publicar Negocio</button>
          </div>
        </div>
      </section>

      {/* Seccion de Categorias Mejorada: Carrusel Horizontal con Flechas de Navegación */}
      <section className="py-10 px-4 md:px-6 max-w-7xl mx-auto overflow-hidden group">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg md:text-2xl font-black text-[#0a2540] uppercase tracking-tighter">Explorar por categoría</h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Usa las flechas o desliza para ver más</span>
        </div>
        
        {/* Contenedor Relativo para Flechas */}
        <div className="relative">
          {/* Flecha Izquierda */}
          <button 
            onClick={() => handleScroll('left')}
            className="absolute -left-2 top-8 z-20 w-10 h-10 bg-white/90 backdrop-blur shadow-xl rounded-full flex items-center justify-center text-[#0a2540] border border-slate-100 transition-all hover:scale-110 active:scale-90 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
          >
            <Icon name="ArrowLeft" className="w-5 h-5" />
          </button>

          {/* Flecha Derecha */}
          <button 
            onClick={() => handleScroll('right')}
            className="absolute -right-2 top-8 z-20 w-10 h-10 bg-white/90 backdrop-blur shadow-xl rounded-full flex items-center justify-center text-[#0a2540] border border-slate-100 transition-all hover:scale-110 active:scale-90 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
          >
            <Icon name="ChevronRight" className="w-5 h-5" />
          </button>

          {/* Carrusel Horizontal */}
          <div 
            ref={scrollRef}
            className="flex overflow-x-auto pb-6 scrollbar-hide gap-6 -mx-4 px-4 scroll-smooth"
          >
            {CATEGORIES.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCatId(cat.id)}
                className="flex-none w-24 flex flex-col items-center gap-3 group/item"
              >
                <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 transition-all group-hover/item:bg-blue-600 group-hover/item:text-white group-hover/item:shadow-lg group-hover/item:scale-110">
                  <Icon name={cat.icon} className="w-7 h-7" />
                </div>
                <span className="text-[9px] font-black uppercase text-center leading-tight text-slate-600 group-hover/item:text-blue-600 transition-colors">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Modal Emergente de Subcategorías */}
      {selectedCategory && (
        <div className="fixed inset-0 bg-[#0a2540]/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setSelectedCatId(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-red-500 transition-colors"
            >
              <Icon name="X" className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-4 mb-2">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shadow-sm">
                <Icon name={selectedCategory.icon} className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-[#0a2540] uppercase tracking-tight leading-none">{selectedCategory.name}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Selecciona una especialidad</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Link 
                to={`/explorer?category=${selectedCategory.id}`} 
                className="col-span-full px-6 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-center shadow-lg hover:bg-blue-700 transition-all active:scale-95"
                onClick={() => setSelectedCatId(null)}
              >
                Ver Todo en esta categoría
              </Link>
              {selectedCategory.subCategories.map(sub => (
                <Link 
                  key={sub.id} 
                  to={`/explorer?category=${selectedCategory.id}&sub=${sub.id}`} 
                  className="px-5 py-4 bg-slate-50 text-slate-600 border border-slate-100 rounded-2xl text-[10px] font-bold uppercase tracking-tight text-center hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
                  onClick={() => setSelectedCatId(null)}
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <section className="py-12 px-4 md:px-6 max-w-7xl mx-auto border-t border-slate-100 mt-4">
        <div className="flex flex-col md:flex-row justify-between items-end gap-3 mb-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-600">
              <Icon name="Sparkles" className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">RECOMENDADOS</span>
            </div>
            <h3 className="text-xl md:text-3xl font-black text-[#0a2540] uppercase tracking-tighter leading-none">Negocios Destacados</h3>
          </div>
          <Link to="/explorer" className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] hover:underline mb-1">Ver todos →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {featuredBusinesses.map(biz => <BusinessCard key={biz.id} biz={biz} />)}
        </div>
      </section>
    </div>
  );
};

const ExplorerView = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const catParam = searchParams.get('category') || 'all';
  const subParam = searchParams.get('sub');

  // Escuchar cambios de Firestore en tiempo real
  useEffect(() => {
    const q = query(collection(db, 'negocios'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(mapFirestoreToBusiness);
      setBusinesses(data);
      // Actualizar localStorage como backup opcional
      saveToDB(data);
      setLoading(false);
    }, (error) => {
      console.error("Error cargando negocios:", error);
      // Fallback a localStorage si Firebase falla
      setBusinesses(getInitialData());
      setLoading(false);
    });

    return () => unsubscribe(); // Limpiar suscripción al salir
  }, []);

const filteredBusinesses = businesses.filter(biz => {
  // 1. Limpiamos los textos de búsqueda y selección
  const query = searchQuery.toLowerCase().trim();
  const selected = selectedCategory.toLowerCase().trim();

  // 2. Extraemos los datos usando los nombres EXACTOS de tu Firebase
  const name = (biz.name || "").toLowerCase();
  const desc = (biz.description || "").toLowerCase();
  const cat = (biz.Categoría || biz.category || "").toLowerCase();
  const subCat = (biz.Subcategoría || biz.subCategory || "").toLowerCase();

  // 3. ¿Coincide con el buscador de texto?
  const matchesSearch = query === "" || 
                        name.includes(query) || 
                        desc.includes(query) || 
                        cat.includes(query) || 
                        subCat.includes(query);

  // 4. ¿Coincide con la categoría del botón?
  // Usamos las variables 'cat' y 'subCat' que ya tienen el dato de Firebase
  const matchesCategory = selected === 'all' || 
                          cat.includes(selected) || 
                          subCat.includes(selected) ||
                          selected.includes(cat);

  return matchesSearch && matchesCategory;
});

  if (loading) return <div className="p-20 text-center font-black text-slate-400 uppercase tracking-widest">Cargando negocios...</div>;

  return (
    <div className="p-4 md:p-8 space-y-10">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Explorar Negocios</h2>
        <div className="relative w-full max-w-md">
          <Icon name="Search" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input type="text" placeholder="Buscar por nombre o servicio..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-6 font-bold focus:ring-2 focus:ring-blue-600/10 transition-all outline-none" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map(biz => <BusinessCard key={biz.id} biz={biz} />)}
        </div>
      ) : (
        <div className="py-20 text-center space-y-4">
          <Icon name="Search" className="w-12 h-12 text-slate-200 mx-auto" />
          <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No hay resultados para esta búsqueda</p>
          <button onClick={clearFilters} className="text-blue-600 font-black uppercase text-[10px] tracking-widest hover:underline">Ver todos los negocios</button>
        </div>
      )}
    </div>
  );
};

const BusinessDetailView = () => {
  const { id } = useParams();
  const [allBusinesses, setAllBusinesses] = useState<Business[]>(getInitialData());
  const biz = allBusinesses.find(b => b.id === id);
  const navigate = useNavigate();

  const [passwordInput, setPasswordInput] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Business> | null>(null);

  if (!biz) return <div className="p-20 text-center font-black text-slate-400 uppercase tracking-widest">Negocio no encontrado</div>;

  const category = CATEGORIES.find(c => c.id === biz.category);

  const handleVerify = () => {
    if (passwordInput === biz.ownerPassword) {
      setIsAuth(true);
      setEditData({ ...biz });
    } else {
      alert("Contraseña incorrecta");
    }
  };

  const handleSaveEdit = () => {
    if (!editData) return;
    const updated = allBusinesses.map(b => b.id === id ? { ...b, ...editData } as Business : b);
    saveToDB(updated);
    setAllBusinesses(updated);
    setIsEditing(false);
    alert("Información actualizada correctamente");
    navigate(0); // Recarga la página para refrescar los datos
  };

  return (
    <div className="animate-in slide-in-from-bottom-8 duration-500 pb-20 bg-slate-50 min-h-screen">
      <div className="relative h-[45vh] md:h-[60vh] w-full overflow-hidden">
        <img src={biz.image} className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105" alt={biz.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a2540]/90 via-transparent to-black/20" />
        <button onClick={() => navigate(-1)} className="absolute top-6 left-6 p-4 bg-white/20 backdrop-blur-2xl rounded-2xl text-white shadow-2xl border border-white/20 hover:bg-white/30 transition-all active:scale-95 z-50"><Icon name="ArrowLeft" className="w-5 h-5" /></button>
        <div className="absolute bottom-16 left-6 md:left-12 right-6 z-10 space-y-3">
           <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-yellow-400 text-[#0a2540] rounded-lg text-[9px] font-black uppercase tracking-[0.2em] shadow-lg">{category?.name}</span>
              <div className="flex items-center text-white font-black text-sm drop-shadow-md"><Icon name="Star" className="w-4 h-4 mr-1 text-yellow-400 fill-current" /> {biz.rating}</div>
           </div>
           <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase drop-shadow-2xl leading-none max-w-4xl">{biz.name}</h2>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-12 -mt-12 relative z-20">
        <div className="bg-white rounded-[3rem] shadow-2xl p-8 md:p-14 space-y-16 border border-slate-100">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
              <div className="space-y-6">
                <div className="flex items-center gap-3"><div className="w-1 h-6 bg-blue-600 rounded-full" /><h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Descripción</h3></div>
                <p className="text-base md:text-lg text-slate-600 leading-relaxed font-medium bg-slate-50 p-6 rounded-3xl border border-slate-100/50">{biz.description}</p>
                
                {/* Sección de Acceso Propietario integrada en la descripción */}
                <div className="mt-12 pt-10 border-t border-slate-100/50">
                  <div className="bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100">
                    {!isAuth ? (
                      <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="flex-1 w-full relative">
                          <Icon name="Lock" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                          <input 
                            type="password" 
                            placeholder="Contraseña del Propietario" 
                            className="w-full bg-white border border-slate-200 py-3 pl-11 pr-4 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-600/10"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                          />
                        </div>
                        <button 
                          onClick={handleVerify}
                          className="w-full md:w-auto px-8 py-3 bg-[#0a2540] text-yellow-400 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg active:scale-95 transition-all"
                        >
                          Gestionar Mi Negocio
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                            <Icon name="ShieldCheck" className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Acceso Verificado</span>
                        </div>
                        <button 
                          onClick={() => setIsEditing(true)}
                          className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-2"
                        >
                          <Icon name="Edit" className="w-4 h-4" />
                          Editar Información
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {biz.gallery && biz.gallery.length > 0 && (
                <div className="space-y-8 pt-4">
                  <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-1 h-6 bg-blue-600 rounded-full" /><h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Galería de Negocio</h3></div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{biz.gallery.length} fotos</span></div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
                    {biz.gallery.map((img, index) => (
                      <div key={index} className="aspect-square rounded-[2rem] overflow-hidden shadow-md border border-slate-100 group bg-slate-50 transition-all hover:shadow-xl hover:-translate-y-1">
                        <img src={img} alt={`Foto ${index + 1}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-12 lg:pl-10 lg:border-l border-slate-50">
               <div className="space-y-10">
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Información</h3>
                    <div className="flex items-start gap-4 text-slate-700">
                      <div className="p-4 bg-blue-50 rounded-2xl shrink-0"><Icon name="MapPin" className="text-blue-600 w-5 h-5" /></div>
                      <div className="space-y-1 pt-1"><span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">Dirección</span><span className="text-sm font-bold leading-snug">{biz.address}</span></div>
                    </div>
                    <div className="flex items-start gap-4 text-slate-700">
                      <div className="p-4 bg-blue-50 rounded-2xl shrink-0"><Icon name="Clock" className="text-blue-600 w-5 h-5" /></div>
                      <div className="space-y-1 pt-1"><span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">Horario</span><span className="text-sm font-bold">{biz.hours}</span></div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Contacto</h3>
                    <div className="flex flex-col gap-4">
                      <a href={`tel:${biz.phone}`} className="w-full py-5 bg-[#0a2540] text-yellow-400 rounded-2xl font-black flex items-center justify-center gap-3 transition-all hover:shadow-2xl active:scale-95 uppercase text-[10px] tracking-widest border border-white/10"><Icon name="Phone" className="w-4 h-4" /> Iniciar Llamada</a>
                      <a href={`https://wa.me/${biz.whatsapp}`} target="_blank" rel="noopener noreferrer" className="w-full py-5 bg-green-500 text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all hover:shadow-2xl active:scale-95 uppercase text-[10px] tracking-widest"><Icon name="MessageCircle" className="w-4 h-4" /> Enviar WhatsApp</a>
                    </div>
                  </div>

                  {(biz.facebook || biz.instagram || biz.tiktok) && (
                    <div className="space-y-6">
                       <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Ecosistema Digital</h3>
                       <div className="flex flex-wrap items-center gap-4">
                          {biz.facebook && (<a href={biz.facebook} target="_blank" rel="noopener noreferrer" className="p-5 bg-slate-50 hover:bg-blue-50 text-[#0a2540] hover:text-blue-600 rounded-[1.5rem] transition-all border border-slate-100 shadow-sm active:scale-90"><Icon name="Facebook" className="w-6 h-6" /></a>)}
                          {biz.instagram && (<a href={biz.instagram} target="_blank" rel="noopener noreferrer" className="p-5 bg-slate-50 hover:bg-pink-50 text-[#0a2540] hover:text-pink-600 rounded-[1.5rem] transition-all border border-slate-100 shadow-sm active:scale-90"><Icon name="Instagram" className="w-6 h-6" /></a>)}
                          {biz.tiktok && (<a href={biz.tiktok} target="_blank" rel="noopener noreferrer" className="p-5 bg-slate-50 hover:bg-slate-100 text-[#0a2540] rounded-[1.5rem] transition-all border border-slate-100 shadow-sm active:scale-90"><Icon name="Music" className="w-6 h-6" /></a>)}
                       </div>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edición del Propietario */}
      {isEditing && editData && (
        <div className="fixed inset-0 bg-[#0a2540]/60 backdrop-blur-md z-[3000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-10 space-y-8 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-[#0a2540] uppercase tracking-tighter">Editar Perfil Comercial</h2>
              <button onClick={() => setIsEditing(false)} className="p-3 text-slate-300 hover:text-red-500 transition-colors"><Icon name="X" className="w-6 h-6" /></button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Foto Principal</label>
                <div className="flex items-center gap-5 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                  <img src={editData.image} className="w-20 h-20 rounded-2xl object-cover shadow-md border border-white" />
                  <div className="flex-1 space-y-3">
                    <input 
                      type="file" 
                      accept="image/*" 
                      id="edit-img-owner" 
                      className="hidden" 
                      onChange={async (e) => {
                        if (e.target.files?.[0]) {
                          const reader = new FileReader();
                          reader.onload = async () => {
                            const compressed = await compressImage(reader.result as string);
                            setEditData(prev => ({ ...prev, image: compressed }));
                          };
                          reader.readAsDataURL(e.target.files[0]);
                        }
                      }}
                    />
                    <label htmlFor="edit-img-owner" className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-slate-50 shadow-sm inline-block">Cambiar Imagen</label>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">JPEG comprimido (máx 800px)</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nombre Comercial</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none" value={editData.name || ''} onChange={e => setEditData({...editData, name: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Resumen / Descripción</label>
                <textarea className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold h-32 resize-none outline-none" value={editData.description || ''} onChange={e => setEditData({...editData, description: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Dirección Física</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none" value={editData.address || ''} onChange={e => setEditData({...editData, address: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Horario</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold text-xs" value={editData.hours || ''} onChange={e => setEditData({...editData, hours: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Teléfono</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold text-xs" value={editData.phone || ''} onChange={e => setEditData({...editData, phone: e.target.value})} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">WhatsApp de Atención</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none" value={editData.whatsapp || ''} onChange={e => setEditData({...editData, whatsapp: e.target.value})} />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={() => setIsEditing(false)} className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100">Descartar</button>
              <button onClick={handleSaveEdit} className="flex-1 py-5 bg-[#0a2540] text-yellow-400 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-95">Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAPA MEJORADO (UI/UX) ---

const MapView = () => {
  const [businesses] = useState<Business[]>(getInitialData().filter(b => b.status === BusinessStatus.VERIFIED));
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Filtrado optimizado por nombre, categoría o dirección
  const filtered = businesses.filter(b => {
    const q = searchQuery.toLowerCase();
    const catName = CATEGORIES.find(c => c.id === b.category)?.name || '';
    return b.name.toLowerCase().includes(q) || 
           catName.toLowerCase().includes(q) || 
           b.address.toLowerCase().includes(q);
  });

  const LocateControl = () => {
    const map = useMap();
    const findMe = () => {
      if (!navigator.geolocation) {
        alert("Geolocalización no soportada en este dispositivo.");
        return;
      }
      map.locate().on('locationfound', (e) => {
        setUserLocation([e.latlng.lat, e.latlng.lng]);
        map.flyTo(e.latlng, 15);
      }).on('locationerror', () => {
        alert("No se pudo obtener tu ubicación. Asegúrate de dar permisos de GPS.");
      });
    };

    return (
      <button 
        onClick={findMe}
        className="absolute bottom-10 right-6 z-[1000] p-4 bg-white text-[#0a2540] rounded-2xl shadow-2xl border border-slate-100 transition-all hover:scale-110 active:scale-90 flex items-center justify-center"
        title="Mi ubicación"
      >
        <Icon name="Navigation" className="w-6 h-6" />
      </button>
    );
  };

  const createCustomIcon = () => {
    return L.divIcon({
      html: `
        <div class="relative">
          <div class="w-10 h-10 bg-white rounded-2xl shadow-xl border-2 border-blue-600 flex items-center justify-center transition-transform hover:scale-110">
            <div class="text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
          </div>
          <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-600 rotate-45"></div>
        </div>
      `,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -35]
    });
  };

  return (
    <div className="relative h-[calc(100vh-140px)] w-full overflow-hidden bg-slate-50 md:rounded-[2.5rem] shadow-inner border border-slate-100">
      {/* Barra de Búsqueda Flotante (Reemplaza Categorías) */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-lg">
        <div className="relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
            <Icon name="Search" className="w-5 h-5" />
          </div>
          <input 
            type="text" 
            placeholder="Buscar en el mapa (Nombre, tipo, dirección...)" 
            className="w-full bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl py-4 pl-14 pr-6 font-bold shadow-2xl focus:ring-4 focus:ring-blue-600/10 transition-all outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <MapContainer 
        center={[15.6333, -87.1167]} 
        zoom={14} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        {filtered.map(biz => (
          <Marker 
            key={biz.id} 
            position={[biz.lat, biz.lng]} 
            icon={createCustomIcon()}
          >
            <Popup className="custom-leaflet-popup">
              <div className="w-[260px] bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in duration-300">
                <div className="relative h-28">
                   <img src={biz.image} alt="" className="w-full h-full object-cover" />
                   <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-xl flex items-center gap-1 shadow-sm">
                      <Icon name="Star" className="w-2.5 h-2.5 text-amber-500 fill-current" />
                      <span className="text-[9px] font-black text-slate-800">{biz.rating}</span>
                   </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="space-y-0.5">
                    <h4 className="font-black text-[#0a2540] uppercase text-xs leading-tight line-clamp-1">{biz.name}</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{CATEGORIES.find(c => c.id === biz.category)?.name}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Icon name="MapPin" className="w-3 h-3 text-blue-500" />
                    <span className="text-[9px] font-medium line-clamp-1">{biz.address}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link 
                      to={`/business/${biz.id}`} 
                      className="py-2.5 bg-[#0a2540] text-yellow-400 rounded-xl text-[9px] font-black uppercase text-center tracking-widest"
                    >
                      Ver Perfil
                    </Link>
                    <a 
                      href={`https://wa.me/${biz.whatsapp}`} 
                      target="_blank" 
                      className="py-2.5 bg-green-500 text-white rounded-xl text-[9px] font-black uppercase text-center tracking-widest flex items-center justify-center gap-1.5"
                    >
                      <Icon name="MessageCircle" className="w-3 h-3" />
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {userLocation && (
          <Marker position={userLocation} icon={L.divIcon({
            html: `<div class="w-6 h-6 bg-blue-600 rounded-full border-4 border-white shadow-2xl animate-pulse"></div>`,
            className: '',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })}>
            <Popup>Tu ubicación actual</Popup>
          </Marker>
        )}

        <LocateControl />
      </MapContainer>

      {/* Estilos específicos para los popups de Leaflet */}
      <style>{`
        .leaflet-popup-content-wrapper {
          padding: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          width: auto !important;
        }
        .leaflet-popup-tip-container {
          display: none !important;
        }
        .leaflet-container {
          background: #f8fafc !important;
        }
      `}</style>
    </div>
  );
};

const MembershipView = () => {
  const plans = [
    { name: 'PLAN LITE', tierSlug: 'lite', icon: 'Rocket', price: 'L 375', period: '/ mes', description: 'El primer paso para digitalizar tu negocio', recommended: false, features: ['Perfil Verificado', 'Presencia en Buscador', 'Escaparate Básico (1 foto)', 'Panel de Control'], buttonText: 'ELEGIR', variant: 'default' },
    { name: 'PLAN PLUS', tierSlug: 'plus', icon: 'Trophy', price: 'L 600', period: '/ mes', description: 'Ideal para convertir visitas en clientes', recommended: true, features: ['Todo de Lite', 'Botón WhatsApp', 'Mayor Alcance (Feed)', '4 Fotos', 'Prioridad en Búsqueda'], buttonText: 'ELEGIR', variant: 'highlight' },
    { name: 'PLAN PRO', tierSlug: 'pro', icon: 'ShieldCheck', price: 'L 850', period: '/ mes', description: 'Para quienes quieren dominar su categoría', recommended: false, features: ['Todo de Plus', 'Redes Sociales', 'Posicionamiento VIP (Top)', 'Catálogo Extendido', 'Asistente IA'], buttonText: 'ELEGIR', variant: 'default' }
  ];

  return (
    <div className="py-20 px-6 md:px-12 bg-slate-50 min-h-screen">
      <div className="text-center space-y-4 mb-20">
        <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-600">PRECIOS</h2>
        <h3 className="text-4xl md:text-5xl font-black text-[#0a2540] uppercase tracking-tighter leading-none">Planes de Membresía</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
        {plans.map((plan) => (
          <div key={plan.name} className={`relative flex flex-col p-10 rounded-[3rem] transition-all duration-500 border ${plan.variant === 'highlight' ? 'bg-blue-600 text-white border-blue-600 shadow-2xl scale-105 z-10' : 'bg-white text-[#0a2540] border-slate-100 shadow-xl hover:shadow-2xl'}`}>
            {plan.recommended && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-[#0a2540] px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">RECOMENDADO</div>}
            <div className="flex flex-col items-center text-center mb-10">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${plan.variant === 'highlight' ? 'bg-white/20' : 'bg-blue-50'}`}><Icon name={plan.icon} className={`w-8 h-8 ${plan.variant === 'highlight' ? 'text-white' : 'text-blue-600'}`} /></div>
              <h4 className="text-2xl font-black uppercase tracking-tight mb-3">{plan.name}</h4>
              <p className={`text-xs font-medium px-4 opacity-80 ${plan.variant === 'highlight' ? 'text-blue-100' : 'text-slate-500'}`}>{plan.description}</p>
              <div className="mt-6 flex items-baseline gap-1"><span className="text-3xl font-black">{plan.price}</span><span className="text-[10px] font-black uppercase tracking-widest opacity-60">{plan.period}</span></div>
            </div>
            <ul className="space-y-5 mb-12 flex-grow">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-4 text-sm font-bold"><div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 ${plan.variant === 'highlight' ? 'border-white/30 text-white' : 'border-blue-100 text-blue-600'}`}><Icon name="CheckCircle2" className="w-3.5 h-3.5" /></div><span className={plan.variant === 'highlight' ? 'text-white' : 'text-slate-700'}>{feature}</span></li>
              ))}
            </ul>
            <Link to={`/register?plan=${plan.tierSlug}`} className={`w-full py-5 rounded-2xl font-black uppercase text-xs text-center tracking-[0.2em] shadow-xl transition-all active:scale-95 ${plan.variant === 'highlight' ? 'bg-white text-blue-600 hover:bg-slate-50' : 'bg-[#0a2540] text-white hover:bg-[#0f345c]'}`}>{plan.buttonText}</Link>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- REGISTRO DE NEGOCIO ---

const RegisterView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get('plan');
  
  const [tier, setTier] = useState<MembershipTier>(MembershipTier.PRO);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasConfirmedExplicitly, setHasConfirmedExplicitly] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    ownerName: '',
    dni: '',
    email: '',
    phone: '',
    businessName: '',
    ownerPassword: '',
    category: CATEGORIES[0].id,
    subCategory: '',
    description: '',
    address: '',
    whatsapp: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    otherLink: '',
    image: '',
    gallery: [] as string[]
  });

  useEffect(() => {
    if (planParam) {
      if (planParam === 'lite') setTier(MembershipTier.LITE);
      else if (planParam === 'plus') setTier(MembershipTier.PLUS);
      else if (planParam === 'pro') setTier(MembershipTier.PRO);
    }
  }, [planParam]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, subCategory: '' }));
  }, [formData.category]);

  const getMaxGallerySlots = () => {
    switch (tier) {
      case MembershipTier.LITE: return 3;
      case MembershipTier.PLUS: return 7;
      case MembershipTier.PRO: return 14;
      default: return 3;
    }
  };

  const totalSlots = getMaxGallerySlots() + 1;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors.includes(name)) {
      setErrors(prev => prev.filter(err => err !== name));
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGallery = false) => {
    const files = e.target.files;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        const compressed = await compressImage(result);
        
        if (isGallery) {
          if (formData.gallery.length < getMaxGallerySlots()) {
            setFormData(prev => ({...prev, gallery: [...prev.gallery, compressed]}));
          } else {alert(`Límite de fotos para el plan ${tier.toUpperCase()} alcanzado.`);
          }
        } else {setFormData(prev => ({...prev, image: compressed}));
          if (errors.includes('image')) {setErrors(prev => prev.filter(err => err !== 'image'));
          }
        }

      };
      reader.readAsDataURL(files[0]);
    }
  };

  const handleAutoRedact = async () => {
    if (!formData.businessName) return alert("Ingrese el nombre del negocio primero.");
    setIsGenerating(true);
    const catName = CATEGORIES.find(c => c.id === formData.category)?.name || 'Negocio';
    const desc = await generateBusinessDescription(formData.businessName, catName);
    setFormData(prev => ({ ...prev, description: desc }));
    setIsGenerating(false);
  };

  const handleSubmitAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    // Solo activamos el modal de confirmación para que el usuario esté seguro
    setShowConfirmModal(true);
  };

  const handleFinalSubmit = async () => {
  setIsSaving(true);
  try {
    const negociosRef = collection(db, 'negocios');
    await addDoc(negociosRef, {
      name: formData.businessName,
      owner: formData.ownerName,
      email: formData.email,
      phone: formData.phone,
      whatsapp: formData.whatsapp,
      category: formData.category,
      subCategory: formData.subCategory,
      address: formData.address,
      description: formData.description,
      status: 'pending',
      createdAt: new Date().toISOString(),
      rating: 5.0,  // ← COMA AGREGADA
      image: formData.image || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800',
      ImagenPrincipal: formData.image || '',
      GaleriaFotos: formData.gallery || [],
      ownerPassword: formData.ownerPassword,
      VIP: false
    });

      // También guardar en LocalStorage para consistencia temporal
      const newBiz: Business = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.businessName,
        ownerPassword: formData.ownerPassword,
        description: formData.description,
        category: formData.category,
        subCategory: formData.subCategory,
        address: formData.address,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        image: formData.image || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800',
        status: BusinessStatus.PENDING,
        featured: false,
        rating: 5.0,
        hours: '08:00 AM - 05:00 PM',
        lat: 15.6333,
        lng: -87.1167,
        tier: tier,
        facebook: formData.facebook,
        instagram: formData.instagram,
        tiktok: formData.tiktok,
        otherLink: formData.otherLink,
        gallery: formData.gallery
      };

      const current = getInitialData();
      saveToDB([newBiz, ...current]);

      setShowConfirmModal(false);
      alert("¡Registro exitoso! Tu negocio ha sido guardado y está en proceso de verificación.");
      navigate('/explorer');
    } catch (error) {
      console.error("Error en Firebase:", error);
      alert("Error al guardar el negocio. Intenta nuevamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const currentCategory = CATEGORIES.find(c => c.id === formData.category);

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 md:px-8 space-y-12 animate-in fade-in duration-500 relative">
      <div className="max-w-4xl mx-auto text-center space-y-2">
        <h2 className="text-3xl md:text-4xl font-black text-[#001f3f] uppercase tracking-tighter">REGISTRO DE NEGOCIO</h2>
        <p className="text-slate-500 font-medium">Únete a la Primera Plataforma Comercial de Honduras.</p>
      </div>

      <form onSubmit={handleSubmitAttempt} className="max-w-3xl mx-auto space-y-10 pb-20">
        <section className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-10 border border-slate-100 space-y-8">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-6 bg-yellow-400 rounded-full" />
             <h3 className="text-sm font-black text-[#001f3f] uppercase tracking-widest">Seleccione su Plan</h3>
          </div>
          <div className="flex bg-slate-50 p-2 rounded-2xl gap-2">
            {[MembershipTier.LITE, MembershipTier.PLUS, MembershipTier.PRO].map(t => (
              <button key={t} type="button" onClick={() => setTier(t)} className={`flex-1 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${tier === t ? 'bg-[#001f3f] text-yellow-400 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Propietario *</label><input type="text" name="ownerName" placeholder="Nombre completo" className={`w-full bg-slate-50 border ${errors.includes('ownerName') ? 'border-red-500' : 'border-slate-200'} rounded-2xl py-4 px-6 outline-none font-bold`} value={formData.ownerName} onChange={handleInputChange} /></div>
            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">DNI *</label><input type="text" name="dni" placeholder="0000-0000-00000" className={`w-full bg-slate-50 border ${errors.includes('dni') ? 'border-red-500' : 'border-slate-200'} rounded-2xl py-4 px-6 outline-none font-bold`} value={formData.dni} onChange={handleInputChange} /></div>
            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Email *</label><input type="email" name="email" placeholder="ejemplo@correo.com" className={`w-full bg-slate-50 border ${errors.includes('email') ? 'border-red-500' : 'border-slate-200'} rounded-2xl py-4 px-6 outline-none font-bold`} value={formData.email} onChange={handleInputChange} /></div>
            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Teléfono *</label><input type="tel" name="phone" placeholder="9999-9999" className={`w-full bg-slate-50 border ${errors.includes('phone') ? 'border-red-500' : 'border-slate-200'} rounded-2xl py-4 px-6 outline-none font-bold`} value={formData.phone} onChange={handleInputChange} /></div>
          </div>
        </section>

        <section className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-10 border border-slate-100 space-y-8">
          <div className="flex items-center gap-3"><div className="w-1.5 h-6 bg-yellow-400 rounded-full" /><h3 className="text-sm font-black text-[#001f3f] uppercase tracking-widest">DETALLES COMERCIALES</h3></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nombre del Negocio *</label><input type="text" name="businessName" placeholder="Nombre Comercial" className={`w-full bg-slate-50 border ${errors.includes('businessName') ? 'border-red-500' : 'border-slate-200'} rounded-2xl py-4 px-6 outline-none font-bold md:col-span-2`} value={formData.businessName} onChange={handleInputChange} /></div>
            <div className="md:col-span-2 space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Contraseña del Propietario *</label><input type="password" name="ownerPassword" placeholder="Crea una contraseña para gestionar tu negocio" className={`w-full bg-slate-50 border ${errors.includes('ownerPassword') ? 'border-red-500' : 'border-slate-200'} rounded-2xl py-4 px-6 outline-none font-bold md:col-span-2`} value={formData.ownerPassword} onChange={handleInputChange} /></div>
            
            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Categoría *</label><select name="category" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 outline-none font-bold appearance-none" value={formData.category} onChange={handleInputChange}>{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Subcategoría *</label><select name="subCategory" className={`w-full bg-slate-50 border ${errors.includes('subCategory') ? 'border-red-500' : 'border-slate-200'} rounded-2xl py-4 px-6 outline-none font-bold appearance-none`} value={formData.subCategory} onChange={handleInputChange}><option value="">Seleccionar Subcategoría</option>{currentCategory?.subCategories.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}</select></div>
          </div>
          <div className="space-y-3">
             <div className="flex justify-between items-center"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">RESUMEN *</label><button type="button" onClick={handleAutoRedact} disabled={isGenerating} className="px-4 py-2 bg-yellow-400 text-[#001f3f] rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50"><Icon name="Sparkles" className="w-3 h-3" /> {isGenerating ? 'GENERANDO...' : 'AUTO-REDACTAR'}</button></div>
             <textarea name="description" placeholder="Descripción breve..." className={`w-full bg-slate-50 border ${errors.includes('description') ? 'border-red-500' : 'border-slate-200'} rounded-2xl py-4 px-6 outline-none font-bold h-32 resize-none`} value={formData.description} onChange={handleInputChange} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Dirección *</label><input type="text" name="address" placeholder="Ubicación física" className={`w-full bg-slate-50 border ${errors.includes('address') ? 'border-red-500' : 'border-slate-200'} rounded-2xl py-4 px-6 outline-none font-bold`} value={formData.address} onChange={handleInputChange} /></div>
            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">WhatsApp *</label><input type="text" name="whatsapp" placeholder="WhatsApp" className={`w-full bg-slate-50 border ${errors.includes('whatsapp') ? 'border-red-500' : 'border-slate-200'} rounded-2xl py-4 px-6 outline-none font-bold`} value={formData.whatsapp} onChange={handleInputChange} /></div>
          </div>
        </section>

        {tier === MembershipTier.PRO && (
          <section className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-10 border border-slate-100 space-y-8 animate-in slide-in-from-top-4">
            <div className="flex items-center gap-3"><div className="w-1.5 h-6 bg-blue-600 rounded-full" /><h3 className="text-sm font-black text-[#001f3f] uppercase tracking-widest">ECOSISTEMA DIGITAL (PRO)</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 flex items-center gap-2"><Icon name="Facebook" className="w-3 h-3" /> FACEBOOK</label><input type="text" name="facebook" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-5 outline-none font-bold text-sm" value={formData.facebook} onChange={handleInputChange} /></div>
              <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 flex items-center gap-2"><Icon name="Instagram" className="w-3 h-3" /> INSTAGRAM</label><input type="text" name="instagram" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-5 outline-none font-bold text-sm" value={formData.instagram} onChange={handleInputChange} /></div>
              <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 flex items-center gap-2"><Icon name="Music" className="w-3 h-3" /> TIKTOK</label><input type="text" name="tiktok" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-5 outline-none font-bold text-sm" value={formData.tiktok} onChange={handleInputChange} /></div>
              <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 flex items-center gap-2"><Icon name="Navigation" className="w-3 h-3" /> OTROS</label><input type="text" name="otherLink" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-5 outline-none font-bold text-sm" value={formData.otherLink} onChange={handleInputChange} /></div>
            </div>
          </section>
        )}

        <section className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-10 border border-slate-100 space-y-8">
           <div className="flex justify-between items-center"><div className="flex items-center gap-3"><div className="w-1.5 h-6 bg-yellow-400 rounded-full" /><h3 className="text-sm font-black text-[#001f3f] uppercase tracking-widest">FOTOS ({formData.gallery.length + (formData.image ? 1 : 0)}/{totalSlots})</h3></div></div>
           <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <label className={`relative aspect-square rounded-3xl border-2 border-dashed ${errors.includes('image') ? 'border-red-500' : 'border-slate-200'} flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-slate-100 overflow-hidden group`}>
                 {formData.image ? <img src={formData.image} className="w-full h-full object-cover" alt="Port" /> : <div className="text-center"><Icon name="PlusCircle" className="mx-auto mb-1 text-slate-300 group-hover:text-blue-500" /><span className="text-[8px] font-black uppercase text-slate-400">Portada</span></div>}
                 <input type="file" className="hidden" accept="image/*" onChange={e => handlePhotoUpload(e)} />
              </label>
              {formData.gallery.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-3xl overflow-hidden shadow-sm group">
                   <img src={img} className="w-full h-full object-cover" alt="Gal" />
                   <button type="button" onClick={() => setFormData(p => ({...p, gallery: p.gallery.filter((_, idx) => idx !== i)}))} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100"><Icon name="X" className="w-3 h-3" /></button>
                </div>
              ))}
              {formData.gallery.length < getMaxGallerySlots() && (
                <label className="relative aspect-square rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-slate-100"><Icon name="PlusCircle" className="text-slate-300 group-hover:text-blue-500" /><input type="file" className="hidden" accept="image/*" onChange={e => handlePhotoUpload(e, true)} /></label>
              )}
           </div>
        </section>
        <button type="submit" className="w-full py-6 bg-[#001f3f] text-yellow-400 rounded-3xl font-black uppercase tracking-[0.2em] shadow-2xl transition-all">INSCRIBIR NEGOCIO</button>
      </form>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-[#0a2540]/90 backdrop-blur-md z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-10 md:p-12 space-y-8 animate-in slide-in-from-bottom-8 duration-500">
              <div className="text-center space-y-3"><h3 className="text-3xl font-black text-[#0a2540] uppercase tracking-tighter">Confirmar Datos</h3><p className="text-slate-500 font-medium">Verifica antes de proceder.</p></div>
              <div className="bg-slate-50 p-8 rounded-[2.5rem] space-y-4 border border-slate-100">
                 <div className="flex flex-col"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Negocio</span><span className="text-lg font-black text-[#0a2540]">{formData.businessName}</span></div>
                 <div className="flex flex-col"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</span><span className="text-lg font-black text-blue-600 uppercase">PLAN {tier.toUpperCase()}</span></div>
              </div>
              <div className="space-y-6">
                 <label className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 cursor-pointer group relative">
                    <input type="checkbox" className="peer h-6 w-6 appearance-none rounded-lg border-2 border-slate-300 bg-white checked:bg-blue-600 checked:border-blue-600" checked={hasConfirmedExplicitly} onChange={(e) => setHasConfirmedExplicitly(e.target.checked)} />
                    <span className="text-xs font-bold text-slate-500">Confirmo que toda la información comercial es verídica.</span>
                 </label>
                 <div className="flex flex-col gap-4">
                    <button type="button" onClick={handleFinalSubmit} disabled={!hasConfirmedExplicitly || isSaving} className={`w-full py-6 rounded-3xl font-black uppercase text-sm tracking-[0.3em] shadow-2xl ${hasConfirmedExplicitly && !isSaving ? 'bg-[#0a2540] text-yellow-400' : 'bg-slate-100 text-slate-300'}`}>{isSaving ? 'GUARDANDO...' : 'Inscribir Ahora'}</button>
                    <button type="button" onClick={() => setShowConfirmModal(false)} className="w-full py-2 text-slate-400 font-black uppercase text-[10px]">Cancelar</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const AdminView = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true');
  const [password, setPassword] = useState('');
  const [businesses, setBusinesses] = useState<Business[]>([]);

  useEffect(() => {
  const q = query(collection(db, 'negocios'));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(mapFirestoreToBusiness);
    setBusinesses(data);
    saveToDB(data);
  }, (error) => {
    console.error("Error en panel admin:", error);
    setBusinesses(getInitialData());
  });
  return () => unsubscribe();
}, []);
  const [menuAbiertoId, setMenuAbiertoId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Partial<Business> | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  // --- Analíticas MOCK (Derivadas de datos reales para consistencia) ---
  const activeUsers = 1245 + businesses.length * 15;
  const totalConversions = businesses.reduce((acc, b) => acc + (b.rating > 4.5 ? 200 : 50), 0) + 342;
  const socialInteractivity = {
    facebook: 420,
    instagram: 310,
    tiktok: 580
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAbiertoId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Mora0105') { 
      setIsAuthenticated(true); sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
    } else { alert('Incorrecto'); }
  };

  const handleLogout = () => { setIsAuthenticated(false); sessionStorage.removeItem(ADMIN_AUTH_KEY); };

  const saveAndRefresh = (data: Business[]) => { setBusinesses(data); saveToDB(data); };

  const toggleStatus = async (id: string) => {
  const businessRef = doc(db, 'negocios', id);
  const currentBiz = businesses.find(b => b.id === id);
  const newStatus = currentBiz?.status === BusinessStatus.VERIFIED ? BusinessStatus.PENDING : BusinessStatus.VERIFIED;
  
  try {
    await updateDoc(businessRef, { status: newStatus });
    // No necesitas actualizar el estado local manualmente porque onSnapshot escuchará el cambio automáticamente
  } catch (error) {
    console.error("Error actualizando estado:", error);
    alert("Error al cambiar estado");
  }
  setMenuAbiertoId(null);
 };

  const toggleFeatured = async (id: string) => {
  const businessRef = doc(db, 'negocios', id);
  const currentBiz = businesses.find(b => b.id === id);
  
  try {
    await updateDoc(businessRef, { VIP: !currentBiz?.featured });
  } catch (error) {
    console.error("Error actualizando VIP:", error);
  }
  setMenuAbiertoId(null);
 };

  const openEditModal = (biz: Business) => { setEditingBusiness({ ...biz }); setIsModalOpen(true); setMenuAbiertoId(null); };

  const handleSaveEdit = async () => {
  if (!editingBusiness?.id) return;
  const businessRef = doc(db, 'negocios', editingBusiness.id);
  
  try {
    await updateDoc(businessRef, {
      name: editingBusiness.name,
      description: editingBusiness.description,
      address: editingBusiness.address,
      // Agrega aquí los campos que permitas editar
    });
    setIsModalOpen(false);
    setEditingBusiness(null);
    alert("Cambios guardados correctamente");
  } catch (error) {
    console.error("Error guardando:", error);
    alert("Error al guardar cambios");
  }
};

  const deleteBusiness = async (id: string) => { 
  if (confirm('¿Eliminar este negocio?')) { 
    try {
      await deleteDoc(doc(db, 'negocios', id));
    } catch (error) {
      console.error("Error eliminando:", error);
      alert("Error al eliminar");
    }
  }
  setMenuAbiertoId(null); 
};

// Agregar import de deleteDoc


  const exportarAExcel = () => {
    const ws = XLSX.utils.json_to_sheet(businesses.map(b => ({ ID: b.id, Nombre: b.name, Categoría: b.category, Estado: b.status, VIP: b.featured ? 'SÍ' : 'NO' })));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Negocios");
    XLSX.writeFile(wb, "Negocios.xlsx");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 space-y-8 border border-slate-100">
          <div className="text-center space-y-2"><Icon name="Lock" className="w-8 h-8 text-[#0a2540] mx-auto mb-4" /><h2 className="text-2xl font-black text-[#0a2540] uppercase">Acceso Maestro</h2></div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" placeholder="Contraseña" className="w-full bg-slate-50 border p-4 rounded-2xl font-bold" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="submit" className="w-full py-4 bg-[#0a2540] text-yellow-400 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl active:scale-95">Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 space-y-10 bg-white min-h-screen">
      <div className="flex flex-col lg:flex-row justify-between lg:items-center border-b border-slate-100 pb-10 gap-6">
        <div>
          <h2 className="text-4xl font-black text-[#0a2540] tracking-tighter uppercase leading-none">GESTIÓN MAESTRA</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Panel de Control y Analíticas de Plataforma</p>
        </div>
        <div className="flex gap-4">
          <button onClick={exportarAExcel} className="p-4 bg-green-50 rounded-2xl text-green-600 shadow-sm hover:shadow-md transition-all active:scale-95" title="Exportar Excel"><Icon name="Book" /></button>
          <button onClick={handleLogout} className="p-4 bg-slate-50 rounded-2xl text-slate-600 shadow-sm hover:shadow-md transition-all active:scale-95" title="Cerrar Sesión"><Icon name="Lock" /></button>
        </div>
      </div>

      {/* --- DASHBOARD ANALÍTICO SUPERIOR --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
        <div className="bg-gradient-to-br from-[#0a2540] to-[#144272] p-8 rounded-[2.5rem] text-white shadow-xl space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-white/10 rounded-2xl"><Icon name="Navigation" className="w-6 h-6 text-yellow-400" /></div>
            <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">+12%</span>
          </div>
          <div className="space-y-1">
            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">Usuarios Activos</h4>
            <p className="text-3xl font-black tracking-tighter leading-none">{activeUsers.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-blue-50 rounded-2xl"><Icon name="MessageCircle" className="w-6 h-6 text-blue-600" /></div>
            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">+8%</span>
          </div>
          <div className="space-y-1">
            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60 text-slate-400">Conversión Total</h4>
            <p className="text-3xl font-black tracking-tighter leading-none text-[#0a2540]">{totalConversions.toLocaleString()}</p>
          </div>
        </div>

        {/* --- GRÁFICO DE INTERACTIVIDAD --- */}
        <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#0a2540]">Interactividad Digital (Social)</h4>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-600" /><span className="text-[8px] font-black uppercase text-slate-400">FB</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-pink-500" /><span className="text-[8px] font-black uppercase text-slate-400">IG</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-900" /><span className="text-[8px] font-black uppercase text-slate-400">TK</span></div>
            </div>
          </div>
          <div className="flex items-end justify-between gap-4 h-32 pt-2">
            <div className="w-full flex flex-col items-center gap-2">
              <div className="w-full bg-blue-600 rounded-xl transition-all duration-1000" style={{ height: '70%' }}></div>
              <span className="text-[8px] font-black text-slate-400">{socialInteractivity.facebook}</span>
            </div>
            <div className="w-full flex flex-col items-center gap-2">
              <div className="w-full bg-pink-500 rounded-xl transition-all duration-1000" style={{ height: '55%' }}></div>
              <span className="text-[8px] font-black text-slate-400">{socialInteractivity.instagram}</span>
            </div>
            <div className="w-full flex flex-col items-center gap-2">
              <div className="w-full bg-slate-900 rounded-xl transition-all duration-1000" style={{ height: '90%' }}></div>
              <span className="text-[8px] font-black text-slate-400">{socialInteractivity.tiktok}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-x-auto relative min-h-[400px]">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="text-left bg-slate-50/30 border-b border-slate-100">
              <th className="py-6 px-8 text-[10px] font-black uppercase text-slate-400">Entidad</th>
              <th className="py-6 px-4 text-[10px] font-black uppercase text-slate-400 text-center">Impacto</th>
              <th className="py-6 px-4 text-[10px] font-black uppercase text-slate-400 text-center">Estado</th>
              <th className="py-6 px-4 text-[10px] font-black uppercase text-slate-400 text-center">VIP</th>
              <th className="py-6 px-8 text-[10px] font-black uppercase text-slate-400 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {businesses.map((biz) => {
              const impact = Math.floor(Math.random() * 500) + 120; // Simulación de vistas por negocio
              return (
                <tr key={biz.id} className="hover:bg-slate-50/50 group transition-colors">
                  <td className="py-6 px-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border shadow-sm">{biz.image ? <img src={biz.image} alt="" className="w-full h-full object-cover" /> : <Icon name="Image" className="w-6 h-6 m-3 text-slate-300" />}</div>
                      <div><h4 className="font-black text-slate-900 uppercase text-xs truncate">{biz.name}</h4><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{biz.category}</p></div>
                    </div>
                  </td>
                  <td className="py-6 px-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[11px] font-black text-[#0a2540]">{impact}</span>
                        {impact > 300 && <Icon name="Sparkles" className="w-3 h-3 text-yellow-500 fill-current" />}
                      </div>
                      <span className="text-[7px] font-black text-slate-300 uppercase tracking-tighter">vistas totales</span>
                    </div>
                  </td>
                  <td className="py-6 px-4 text-center">
                    <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${biz.status === BusinessStatus.VERIFIED ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {biz.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-6 px-4 text-center">
                    {biz.featured ? (
                      <div className="p-2 bg-yellow-50 rounded-xl inline-block"><Icon name="Star" className="w-4 h-4 text-yellow-400 fill-current" /></div>
                    ) : (
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">NO</span>
                    )}
                  </td>
                  <td className="py-6 px-8 text-right relative">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setMenuAbiertoId(menuAbiertoId === biz.id ? null : biz.id)} className={`p-2.5 rounded-xl transition-all ${menuAbiertoId === biz.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}><Icon name="MoreVertical" className="w-5 h-5" /></button>
                      {menuAbiertoId === biz.id && (
                        <div ref={menuRef} className="absolute right-20 top-0 bg-white border border-slate-100 shadow-2xl rounded-2xl p-2 z-[1000] w-48 text-left animate-in fade-in slide-in-from-right-2 duration-200">
                          <button onClick={() => toggleStatus(biz.id)} className="w-full px-4 py-3 hover:bg-slate-50 rounded-xl flex items-center gap-3 transition-colors group/opt">
                            <Icon name="ShieldCheck" className={`${biz.status === BusinessStatus.VERIFIED ? 'text-amber-500' : 'text-green-500'} group-hover/opt:scale-110 transition-transform`} />
                            <span className="text-[11px] font-black uppercase text-slate-600">{biz.status === BusinessStatus.VERIFIED ? 'Desverificar' : 'Verificar'}</span>
                          </button>
                          <button onClick={() => toggleFeatured(biz.id)} className="w-full px-4 py-3 hover:bg-slate-50 rounded-xl flex items-center gap-3 transition-colors group/opt">
                            <Icon name="Star" className={`${biz.featured ? 'text-slate-400' : 'text-yellow-500'} group-hover/opt:scale-110 transition-transform`} />
                            <span className="text-[11px] font-black uppercase text-slate-600">{biz.featured ? 'Quitar VIP' : 'Destacar VIP'}</span>
                          </button>
                          <button onClick={() => openEditModal(biz)} className="w-full px-4 py-3 hover:bg-slate-50 rounded-xl flex items-center gap-3 transition-colors group/opt">
                            <Icon name="Edit" className="text-blue-500 group-hover/opt:scale-110 transition-transform" />
                            <span className="text-[11px] font-black uppercase text-slate-600">Editar Info</span>
                          </button>
                          <div className="h-px bg-slate-50 my-1 mx-2"></div>
                          <button onClick={() => deleteBusiness(biz.id)} className="w-full px-4 py-3 hover:bg-red-50 text-red-600 rounded-xl flex items-center gap-3 transition-colors group/opt">
                            <Icon name="Trash2" className="group-hover/opt:scale-110 transition-transform" />
                            <span className="text-[11px] font-black uppercase">Eliminar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0a2540]/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 space-y-6 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-black text-[#0a2540] uppercase tracking-tighter">Editar Negocio</h2><button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-red-500"><Icon name="X" /></button></div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Fotografía de Portada</label>
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-200 shadow-sm">
                    {editingBusiness?.image ? <img src={editingBusiness.image} className="w-full h-full object-cover" /> : <Icon name="Image" className="w-8 h-8 m-6 text-slate-400" />}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      id="edit-img-admin" 
                      onChange={async (e) => { 
                        if (e.target.files?.[0]) { 
                          const reader = new FileReader();
                          reader.onload = async () => {
                            const compressed = await compressImage(reader.result as string);
                            setEditingBusiness(p => ({ ...p, image: compressed }));
                          };
                          reader.readAsDataURL(e.target.files[0]);
                        } 
                      }} 
                    />
                    <label htmlFor="edit-img-admin" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-slate-50 shadow-sm transition-all active:scale-95 inline-block">Cambiar Foto</label>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Se comprimirá automáticamente</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400 ml-2">Nombre del Negocio</label><input type="text" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-600/10" value={editingBusiness?.name || ''} onChange={e => setEditingBusiness({...editingBusiness, name: e.target.value})} /></div>
              <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400 ml-2">Descripción</label><textarea className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold h-24 resize-none outline-none focus:ring-2 focus:ring-blue-600/10" value={editingBusiness?.description || ''} onChange={e => setEditingBusiness({...editingBusiness, description: e.target.value})} /></div>
              <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400 ml-2">Dirección Física</label><input type="text" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-600/10" value={editingBusiness?.address || ''} onChange={e => setEditingBusiness({...editingBusiness, address: e.target.value})} /></div>
            </div>
            <div className="flex gap-4 pt-4"><button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">Descartar</button><button onClick={handleSaveEdit} className="flex-1 py-4 bg-[#0a2540] text-yellow-400 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:shadow-blue-900/20 active:scale-95 transition-all">Guardar</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/explorer" element={<ExplorerView />} />
          <Route path="/membership" element={<MembershipView />} />
          <Route path="/admin" element={<AdminView />} />
          <Route path="/business/:id" element={<BusinessDetailView />} />
          <Route path="/register" element={<RegisterView />} />
          <Route path="/map" element={<MapView />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
