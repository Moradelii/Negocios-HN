import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import { HashRouter, Routes, Route, Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CATEGORIES, Business, BusinessStatus, MembershipTier } from './types';
import { MOCK_BUSINESSES } from './constants';
import { Icon } from './components/Icons';
import { generateBusinessDescription } from './services/geminiService';
import * as XLSX from 'xlsx';

// Firebase
import { db, storage } from './firebase';
import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

// Importaciones de Leaflet
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// --- Configuración Global de Leaflet ---
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Honduras center coordinates
const HONDURAS_CENTER: [number, number] = [14.0816, -86.8735];
const HONDURAS_ZOOM = 8;

const DB_KEY = 'negocios_hn_local_db_stable';
const ADMIN_AUTH_KEY = 'negocios_hn_admin_session';
const ADMIN_PASSWORD = 'Mora0105'; // TODO: Mover a variable de entorno (.env)

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
    throw new Error("Límite de memoria alcanzado.");
  }
};

const mapFirestoreToBusiness = (doc: any): Business => {
  const data = doc.data();
  const defaultImage = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800';
  
  return {
    id: doc.id,
    name: data.name || '',
    ownerPassword: data.ownerPassword || '',
    description: data.description || '',
    category: data.category || '',
    subCategory: data.subCategory || '',
    address: data.address || '',
    phone: data.phone || '',
    whatsapp: data.whatsapp || '',
    image: data.image || defaultImage,
    status: data.status?.toString().toLowerCase() === 'verified' 
      ? BusinessStatus.VERIFIED 
      : BusinessStatus.PENDING,
    featured: data.VIP || data.featured || false,
    rating: data.rating || 5.0,
    hours: data.hours || '08:00 AM - 05:00 PM',
    lat: data.lat || 14.936958286959436,
    lng: data.lng || -86.5828171827915,
    tier: data.tier || MembershipTier.INICIA,
    facebook: data.facebook || '',
    instagram: data.instagram || '',
    tiktok: data.tiktok || '',
    otherLink: data.otherLink || '',
    gallery: data.gallery || []
  };
};

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

// --- Subir imagen a Firebase Storage ---
// Subir imagen a Cloudinary (reemplaza Firebase Storage)
const uploadImageToCloudinary = async (base64Image: string, folder: string = 'businesses'): Promise<string> => {
  if (!base64Image || !base64Image.startsWith('data:')) {
    // Si ya es una URL (no base64), devolverla tal cual
    return base64Image;
  }
  
  const cloudName = 'dvaapavvt'; // Tu cloud name
  const uploadPreset = 'negocios_hn'; // El nombre que creaste arriba
  
  const formData = new FormData();
  formData.append('file', base64Image);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folder);
  
  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Imagen subida a Cloudinary:', data.secure_url);
    return data.secure_url; // URL segura HTTPS
    
  } catch (error) {
    console.error('Error subiendo a Cloudinary:', error);
    alert('Error al subir imagen. Intenta con una más pequeña.');
    throw error;
  }
};

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

// --- HomeView Corregido ---
const HomeView = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [subcatSearch, setSubcatSearch] = useState(''); // Importante: inicializa vacío
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'negocios'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(mapFirestoreToBusiness);
      setBusinesses(data);
      saveToDB(data);
    });
    return () => unsubscribe();
  }, []);

  const featuredBusinesses = businesses
    .filter(b => b.featured && b.status === BusinessStatus.VERIFIED)
    .slice(0, 6);

  // Buscar la categoría seleccionada
  const selectedCategory = CATEGORIES.find(c => c.id === selectedCatId);

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
      {/* HERO SECTION */}
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
              Encuentra negocios locales verificados y apoya la economía de nuestro municipio.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 px-6">
            <button onClick={() => navigate('/explorer')} className="w-full sm:w-auto px-7 py-3 bg-yellow-400 text-[#0a2540] rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center justify-center shadow-xl">
              Explorar Directorio <Icon name="ChevronRight" className="ml-2 w-4 h-4" />
            </button>
            <button onClick={() => navigate('/register')} className="w-full sm:w-auto px-7 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 active:scale-95">
              Publicar Negocio
            </button>
          </div>
        </div>
      </section>

      {/* CATEGORÍAS - CARRUSEL */}
      <section className="py-10 px-4 md:px-6 max-w-7xl mx-auto overflow-hidden group">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg md:text-2xl font-black text-[#0a2540] uppercase tracking-tighter">Explorar por categoría</h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Selecciona un icono para ver especialidades</span>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => handleScroll('left')}
            className="absolute -left-2 top-8 z-20 w-10 h-10 bg-white/90 backdrop-blur shadow-xl rounded-full flex items-center justify-center text-[#0a2540] border border-slate-100 transition-all hover:scale-110 active:scale-90 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
          >
            <Icon name="ArrowLeft" className="w-5 h-5" />
          </button>

          <button 
            onClick={() => handleScroll('right')}
            className="absolute -right-2 top-8 z-20 w-10 h-10 bg-white/90 backdrop-blur shadow-xl rounded-full flex items-center justify-center text-[#0a2540] border border-slate-100 transition-all hover:scale-110 active:scale-90 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
          >
            <Icon name="ChevronRight" className="w-5 h-5" />
          </button>

          <div 
            ref={scrollRef}
            className="flex overflow-x-auto pb-6 scrollbar-hide gap-6 -mx-4 px-4 scroll-smooth"
          >
            {CATEGORIES.map(cat => (
              <button 
                key={cat.id}
                onClick={() => {
                  setSelectedCatId(cat.id);
                  setSubcatSearch(''); // Limpiar búsqueda al abrir
                }}
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

      {/* MODAL DE SUBCATEGORÍAS */}
{selectedCategory && (
  <div className="fixed inset-0 bg-[#0a2540]/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-300">
    <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-300 max-h-[80vh] flex flex-col">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shadow-sm">
            <Icon name={selectedCategory.icon} className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-2xl font-black text-[#0a2540] uppercase tracking-tight leading-none">{selectedCategory.name}</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {selectedCategory.subCategories?.length || 0} especialidades
            </p>
          </div>
        </div>
        <button 
          onClick={() => {
            setSelectedCatId(null);
            setSubcatSearch('');
          }} 
          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
        >
          <Icon name="X" className="w-6 h-6" />
        </button>
      </div>

      {/* Buscador CORREGIDO */}
      <div className="relative">
        <Icon name="Search" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Buscar especialidad..." 
          className="w-full p-4 pl-12 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600/10 bg-slate-50"
          value={subcatSearch}
          onChange={(e) => {
            setSubcatSearch(e.target.value);
          }}
        />
        {subcatSearch && (
          <button 
            onClick={() => setSubcatSearch('')} 
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <Icon name="X" className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Lista de Subcategorías CON FILTRO FUNCIONAL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto flex-1 min-h-0">
        
        {/* Opción: Ver Todo */}
        <Link 
          to={`/explorer?category=${selectedCategory.id}`} 
          className="col-span-full px-6 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-center shadow-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
          onClick={() => {
            setSelectedCatId(null);
            setSubcatSearch('');
          }}
        >
          <Icon name="Grid" className="w-4 h-4" />
          Ver Todo en {selectedCategory.name}
        </Link>
        
        {/* FILTRADO FUNCIONAL */}
        {selectedCategory.subCategories
          ?.filter(sub => {
            // Si no hay texto de búsqueda, mostrar todo
            if (!subcatSearch || subcatSearch.trim() === '') return true;
            // Filtrar por nombre (ignorando mayúsculas)
            return sub.name.toLowerCase().includes(subcatSearch.toLowerCase().trim());
          })
          ?.map(sub => (
            <Link 
              key={sub.id} 
              to={`/explorer?category=${selectedCategory.id}&sub=${sub.id}`} 
              className="px-5 py-4 bg-slate-50 text-slate-600 border border-slate-100 rounded-2xl text-[10px] font-bold uppercase tracking-tight text-center hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all active:scale-95"
              onClick={() => {
                setSelectedCatId(null);
                setSubcatSearch('');
              }}
            >
              {sub.name}
            </Link>
        ))}

        {/* Mensaje si no hay coincidencias en el buscador */}
        {subcatSearch && selectedCategory.subCategories?.filter(sub => 
          sub.name.toLowerCase().includes(subcatSearch.toLowerCase().trim())
        ).length === 0 && (
          <div className="col-span-full py-8 text-center text-slate-400">
            <Icon name="SearchX" className="w-8 h-8 mx-auto mb-2" />
            <p className="text-xs font-bold">No se encontró "{subcatSearch}"</p>
            <p className="text-[10px]">Prueba con otra palabra</p>
          </div>
        )}
      </div>
    </div>
  </div>
)}

      {/* DESTACADOS */}
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

// --- ExplorerView Corregido ---
const ExplorerView = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const catParam = searchParams.get('category') || 'all';
  const subParam = searchParams.get('sub');

  useEffect(() => {
    const q = query(collection(db, 'negocios'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(mapFirestoreToBusiness);
      setBusinesses(data);
      saveToDB(data);
      setLoading(false);
    }, (error) => {
      console.error("Error cargando negocios:", error);
      setBusinesses(getInitialData());
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filtered = businesses.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase()) || 
                         b.description.toLowerCase().includes(search.toLowerCase()) ||
                         b.address.toLowerCase().includes(search.toLowerCase());
    const matchesCat = catParam === 'all' || b.category?.toLowerCase() === catParam.toLowerCase();
    
    // Filtro de subcategoría: comparación flexible (por id O por nombre)
    let matchesSub = true;
    if (subParam) {
      const subParamLower = subParam.toLowerCase();
      // Buscar el nombre de la subcategoría desde CATEGORIES
      let subName = '';
      for (const cat of CATEGORIES) {
        const found = cat.subCategories?.find(s => s.id.toLowerCase() === subParamLower);
        if (found) { subName = found.name.toLowerCase(); break; }
      }
      const bizSubLower = (b.subCategory || '').toLowerCase();
      matchesSub = bizSubLower === subParamLower || 
                   (subName && bizSubLower === subName) ||
                   bizSubLower.includes(subParamLower) ||
                   (subName && bizSubLower.includes(subName));
    }
    
    return matchesSearch && matchesCat && matchesSub;
  });

  const clearFilters = () => {
    setSearch('');
    setSearchParams({});
  };

  if (loading) return <div className="p-20 text-center font-black text-slate-400 uppercase tracking-widest">Cargando negocios...</div>;

  return (
    <div className="p-4 md:p-8 space-y-10">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Explorar Negocios</h2>
        <div className="relative w-full max-w-md">
          <Icon name="Search" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input type="text" placeholder="Buscar por nombre..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-6 font-bold focus:ring-2 focus:ring-blue-600/10 transition-all outline-none" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map(biz => <BusinessCard key={biz.id} biz={biz} />)}
        </div>
      ) : (
        <div className="py-20 text-center space-y-4">
          <Icon name="Search" className="w-12 h-12 text-slate-200 mx-auto" />
          <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No hay resultados</p>
          <button onClick={clearFilters} className="text-blue-600 font-black uppercase text-[10px] tracking-widest hover:underline">Ver todos</button>
        </div>
      )}
    </div>
  );
};

// --- BusinessDetailView Corregido con Firestore ---
const BusinessDetailView = () => {
  const { id } = useParams();
  const [biz, setBiz] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Business> | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxCaption, setLightboxCaption] = useState<string>('');
  const [lightboxLoading, setLightboxLoading] = useState(false);
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const navigate = useNavigate();
  const bizRef = useRef<Business | null>(null);
  bizRef.current = biz;

  // --- Firestore listener ---
  useEffect(() => {
    if (!id) return;
    const unsubscribe = onSnapshot(
      doc(db, 'negocios', id),
      (docSnap) => {
        if (docSnap.exists()) {
          setBiz(mapFirestoreToBusiness(docSnap));
        } else {
          setBiz(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error cargando negocio:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [id]);

  // --- Keyboard handler para lightbox (DEBE estar antes de cualquier return) ---
  useEffect(() => {
    if (lightboxIndex === null) return;
    const currentBiz = bizRef.current;
    if (!currentBiz?.gallery) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
        setLightboxCaption('');
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const gallery = bizRef.current?.gallery;
        if (!gallery) return;
        setLightboxIndex(prev => {
          if (prev === null) return prev;
          const dir = e.key === 'ArrowLeft' ? -1 : 1;
          return (prev + dir + gallery.length) % gallery.length;
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIndex]);

  // Cuando cambia lightboxIndex, generar caption (si está abierto)
  useEffect(() => {
    if (lightboxIndex === null) return;
    const currentBiz = bizRef.current;
    if (!currentBiz) return;

    let cancelled = false;
    setLightboxCaption('');
    setLightboxLoading(true);

    (async () => {
      try {
        const catName = CATEGORIES.find(c => c.id === currentBiz.category)?.name || 'negocio';
        const prompt = `Eres un asistente comercial. El negocio se llama "${currentBiz.name}" y está en la categoría "${catName}". Su descripción es: "${currentBiz.description}". Esta es la imagen número ${lightboxIndex + 1} de su galería. Escribe una descripción corta y atractiva (máximo 2 oraciones) de lo que probablemente muestra esta imagen en relación con los productos o servicios del negocio.`;
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 150,
            messages: [{ role: "user", content: prompt }]
          })
        });
        if (response.ok && !cancelled) {
          const data = await response.json();
          const text = data.content?.find((b: any) => b.type === 'text')?.text || '';
          setLightboxCaption(text.trim());
        }
      } catch {
        if (!cancelled) setLightboxCaption('');
      }
      if (!cancelled) setLightboxLoading(false);
    })();

    return () => { cancelled = true; };
  }, [lightboxIndex]);

  // --- Early returns (después de TODOS los hooks) ---
  if (loading) return <div className="p-20 text-center font-black text-slate-400 uppercase tracking-widest">Cargando...</div>;
  if (!biz) return <div className="p-20 text-center font-black text-slate-400 uppercase tracking-widest">Negocio no encontrado</div>;

  const category = CATEGORIES.find(c => c.id === biz.category);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
    setLightboxCaption('');
  };

  const navigateLightbox = (dir: number) => {
    if (lightboxIndex === null || !biz.gallery) return;
    const next = (lightboxIndex + dir + biz.gallery.length) % biz.gallery.length;
    setLightboxIndex(next);
  };

  const handleVerify = () => {
    const inputTrimmed = passwordInput.trim();
    const storedPassword = (biz.ownerPassword || '').trim();
    
    if (!storedPassword) {
      alert("Este negocio no tiene contraseña configurada. Contacte al administrador.");
      return;
    }
    
    if (inputTrimmed === storedPassword) {
      setIsAuth(true);
      setEditData({ ...biz });
    } else {
      alert("Contraseña incorrecta. Intente de nuevo.");
      setPasswordInput('');
    }
  };

  // Límite de galería según tier
  const getOwnerMaxGallery = () => {
    switch (biz?.tier) {
      case MembershipTier.INICIA: return 4;   // 5 total - 1 portada
      case MembershipTier.IMPULSA: return 14;   // 15 total - 1 portada
      case MembershipTier.DOMINA: return 44;   // 45 total - 1 portada
      default: return 3;
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editData) return;
    const files = e.target.files;
    if (!files || !files[0]) return;
    if ((editData.gallery?.length || 0) >= getOwnerMaxGallery()) {
      alert(`Límite de fotos alcanzado para tu plan (${getOwnerMaxGallery()} en galería).`);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string);
      setEditData(prev => ({ ...prev, gallery: [...(prev?.gallery || []), compressed] }));
    };
    reader.readAsDataURL(files[0]);
  };

  const removeGalleryImage = (index: number) => {
    if (!editData) return;
    setEditData(prev => ({ ...prev, gallery: (prev?.gallery || []).filter((_, i) => i !== index) }));
  };

  const handleSaveEdit = async () => {
    if (!editData || !id) return;
    try {
      const businessRef = doc(db, 'negocios', id);
      
      // Subir imagen principal si es base64
      let imageUrl = editData.image;
      if (editData.image?.startsWith('data:')) {
        imageUrl = await uploadImageToCloudinary(editData.image, `businesses/${id}/${Date.now()}`);
      }

      // Subir imágenes nuevas de galería que sean base64
      const galleryUrls: string[] = [];
      for (const img of (editData.gallery || [])) {
        if (img.startsWith('data:')) {
          const url = await uploadImageToCloudinary(img, `businesses/${id}/gallery_${Date.now()}_${Math.random().toString(36).slice(2,7)}`);
          galleryUrls.push(url);
        } else {
          galleryUrls.push(img); // Ya es URL de Cloudinary
        }
      }

      await updateDoc(businessRef, {
        name: editData.name,
        description: editData.description,
        address: editData.address,
        subCategory: editData.subCategory,
        phone: editData.phone,
        whatsapp: editData.whatsapp,
        image: imageUrl,
        hours: editData.hours,
        gallery: galleryUrls
      });
      
      setIsEditing(false);
      alert("Información actualizada correctamente");
    } catch (error) {
      console.error("Error actualizando:", error);
      alert("Error al guardar cambios");
    }
  };

  return (
    <div className="animate-in slide-in-from-bottom-8 duration-500 pb-20 bg-slate-50 min-h-screen">
      <div className="relative h-[45vh] md:h-[60vh] w-full overflow-hidden">
        <img src={biz.image} className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105" alt={biz.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a2540]/90 via-transparent to-black/20" />
        <button onClick={() => navigate(-1)} className="absolute top-6 left-6 p-4 bg-white/20 backdrop-blur-2xl rounded-2xl text-white shadow-2xl border border-white/20 hover:bg-white/30 transition-all active:scale-95 z-50">
          <Icon name="ArrowLeft" className="w-5 h-5" />
        </button>
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
                

              </div>

              {biz.gallery && biz.gallery.length > 0 && (
                <div className="space-y-8 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3"><div className="w-1 h-6 bg-blue-600 rounded-full" /><h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Galería</h3></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{biz.gallery.length} fotos</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
                    {biz.gallery.map((img, index) => (
                      <button 
                        key={index} 
                        type="button"
                        onClick={() => openLightbox(index)}
                        className="aspect-square rounded-[2rem] overflow-hidden shadow-md border border-slate-100 group bg-slate-50 transition-all hover:shadow-xl hover:-translate-y-1 relative"
                      >
                        <img src={img} alt={`Foto ${index + 1}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        {/* Magnify hint */}
                        <div className="absolute inset-0 bg-[#0a2540]/0 group-hover:bg-[#0a2540]/30 transition-all flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur p-2.5 rounded-xl shadow-lg">
                            <Icon name="Maximize2" className="w-5 h-5 text-[#0a2540]" />
                          </div>
                        </div>
                      </button>
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
                      <div className="space-y-1 pt-1 flex-1"><span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">Dirección</span><span className="text-sm font-bold leading-snug">{biz.address}</span></div>
                      <button
                        type="button"
                        onClick={() => navigate(`/map?lat=${biz.lat}&lng=${biz.lng}&name=${encodeURIComponent(biz.name)}`)}
                        title="Ver ubicación en mapa"
                        className="p-3 bg-green-50 hover:bg-green-600 text-green-600 hover:text-white rounded-2xl transition-all active:scale-90 shrink-0 shadow-sm border border-green-200 hover:border-green-600 hover:shadow-md"
                      >
                        <Icon name="Crosshair" className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-start gap-4 text-slate-700">
                      <div className="p-4 bg-blue-50 rounded-2xl shrink-0"><Icon name="Clock" className="text-blue-600 w-5 h-5" /></div>
                      <div className="space-y-1 pt-1"><span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">Horario</span><span className="text-sm font-bold">{biz.hours}</span></div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Contacto</h3>
                    <div className="flex flex-col gap-4">
                      <a href={`tel:${biz.phone}`} className="w-full py-5 bg-[#0a2540] text-yellow-400 rounded-2xl font-black flex items-center justify-center gap-3 transition-all hover:shadow-2xl active:scale-95 uppercase text-[10px] tracking-widest border border-white/10"><Icon name="Phone" className="w-4 h-4" />Llamar</a>
                      <a href={`https://wa.me/${biz.whatsapp}`} target="_blank" rel="noopener noreferrer" className="w-full py-5 bg-green-500 text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all hover:shadow-2xl active:scale-95 uppercase text-[10px] tracking-widest"><Icon name="MessageCircle" className="w-4 h-4" />WhatsApp</a>
                    </div>
                    {/* Link sutil para el propietario */}
                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => setShowOwnerModal(true)}
                        className="text-[10px] font-bold text-slate-300 hover:text-blue-500 transition-colors underline underline-offset-3"
                      >
                        Cuenta
                      </button>
                    </div>
                  </div>

                  {(biz.facebook || biz.instagram || biz.tiktok) && (
                    <div className="space-y-6">
                       <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Redes</h3>
                       <div className="flex flex-wrap items-center gap-4">
                          {biz.facebook && (<a href={biz.facebook} target="_blank" className="p-5 bg-slate-50 hover:bg-blue-50 text-[#0a2540] rounded-[1.5rem] transition-all border border-slate-100 shadow-sm"><Icon name="Facebook" className="w-6 h-6" /></a>)}
                          {biz.instagram && (<a href={biz.instagram} target="_blank" className="p-5 bg-slate-50 hover:bg-pink-50 text-[#0a2540] rounded-[1.5rem] transition-all border border-slate-100 shadow-sm"><Icon name="Instagram" className="w-6 h-6" /></a>)}
                          {biz.tiktok && (<a href={biz.tiktok} target="_blank" className="p-5 bg-slate-50 hover:bg-slate-100 text-[#0a2540] rounded-[1.5rem] transition-all border border-slate-100 shadow-sm"><Icon name="Music" className="w-6 h-6" /></a>)}
                       </div>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* LIGHTBOX */}
      {lightboxIndex !== null && biz.gallery && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[5000] flex flex-col items-center justify-center p-4"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button 
            onClick={closeLightbox} 
            className="absolute top-4 right-4 p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all z-10"
          >
            <Icon name="X" className="w-5 h-5" />
          </button>

          {/* Counter badge */}
          <div className="absolute top-4 left-4 px-3.5 py-1.5 bg-white/10 backdrop-blur rounded-xl z-10">
            <span className="text-white text-[11px] font-black">{lightboxIndex + 1} / {biz.gallery.length}</span>
          </div>

          {/* Left arrow */}
          <button 
            onClick={(e) => { e.stopPropagation(); navigateLightbox(-1); }} 
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/25 rounded-2xl text-white transition-all z-10"
          >
            <Icon name="ArrowLeft" className="w-5 h-5" />
          </button>

          {/* Right arrow */}
          <button 
            onClick={(e) => { e.stopPropagation(); navigateLightbox(1); }} 
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/25 rounded-2xl text-white transition-all z-10"
          >
            <Icon name="ChevronRight" className="w-5 h-5" />
          </button>

          {/* Image + Caption container */}
          <div 
            className="flex flex-col items-center gap-5 max-w-3xl w-full max-h-[85vh] flex-1 justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            <div className="flex-1 w-full flex items-center justify-center min-h-0">
              <img 
                src={biz.gallery[lightboxIndex]} 
                alt={`Foto ${lightboxIndex + 1}`} 
                className="max-h-[65vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
              />
            </div>

            {/* Caption area */}
            <div className="w-full max-w-xl text-center">
              {lightboxLoading ? (
                <div className="flex items-center justify-center gap-2 py-3">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="text-white/50 text-[11px] font-bold uppercase tracking-widest">Generando descripción...</span>
                </div>
              ) : lightboxCaption ? (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="Sparkles" className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-yellow-400 text-[9px] font-black uppercase tracking-[0.2em]">Descripción</span>
                  </div>
                  <p className="text-white text-sm font-medium leading-relaxed">{lightboxCaption}</p>
                </div>
              ) : (
                <p className="text-white/40 text-[11px] font-bold">Foto {lightboxIndex + 1} de la galería</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CUENTA — login del propietario */}
      {showOwnerModal && (
        <div className="fixed inset-0 bg-[#0a2540]/60 backdrop-blur-md z-[3000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 space-y-8 shadow-2xl">

            {/* Header */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#0a2540] flex items-center justify-center">
                  <Icon name="Lock" className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#0a2540] uppercase tracking-tighter leading-none">Cuenta</h2>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Acceso del propietario</p>
                </div>
              </div>
              <button
                onClick={() => { setShowOwnerModal(false); setPasswordInput(''); }}
                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
              >
                <Icon name="X" className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            {!isAuth ? (
              <div className="space-y-5">
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed text-center">
                  Ingresa la contraseña asociada a este negocio para poder editar su información.
                </p>
                <div className="relative">
                  <Icon name="Lock" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4.5 h-4.5" />
                  <input
                    type="password"
                    placeholder="Contraseña"
                    autoFocus
                    className="w-full bg-slate-50 border border-slate-200 py-4 pl-12 pr-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-300 transition-all"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleVerify(); } }}
                  />
                </div>
                <button
                  onClick={handleVerify}
                  className="w-full py-4 bg-[#0a2540] text-yellow-400 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all"
                >
                  Verificar
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Confirmación de acceso */}
                <div className="flex items-center justify-center gap-3 py-4 bg-green-50 rounded-2xl border border-green-100">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <Icon name="ShieldCheck" className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-black uppercase text-green-700 tracking-widest">Acceso Verificado</span>
                </div>
                {/* CTA Editar */}
                <button
                  onClick={() => { setIsEditing(true); setShowOwnerModal(false); }}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Icon name="Edit" className="w-4 h-4" /> Editar Mi Negocio
                </button>
                {/* Cerrar */}
                <button
                  onClick={() => setShowOwnerModal(false)}
                  className="w-full py-3 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isEditing && editData && (
        <div className="fixed inset-0 bg-[#0a2540]/60 backdrop-blur-md z-[3000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-10 space-y-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-[#0a2540] uppercase tracking-tighter">Editar</h2>
              <button onClick={() => setIsEditing(false)} className="p-3 text-slate-300 hover:text-red-500"><Icon name="X" className="w-6 h-6" /></button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Foto</label>
                <div className="flex items-center gap-5 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                  <img src={editData.image} className="w-20 h-20 rounded-2xl object-cover shadow-md" alt="" />
                  <div className="flex-1 space-y-3">
                    <input type="file" accept="image/*" id="edit-img" className="hidden" onChange={async (e) => {
                      if (e.target.files?.[0]) {
                        const reader = new FileReader();
                        reader.onload = async () => {
                          const compressed = await compressImage(reader.result as string);
                          setEditData(prev => ({ ...prev, image: compressed }));
                        };
                        reader.readAsDataURL(e.target.files[0]);
                      }
                    }} />
                    <label htmlFor="edit-img" className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase cursor-pointer hover:bg-slate-50 shadow-sm inline-block">Cambiar</label>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nombre</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold" value={editData.name || ''} onChange={e => setEditData({...editData, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Descripción</label>
                <textarea className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold h-32 resize-none" value={editData.description || ''} onChange={e => setEditData({...editData, description: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Dirección</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold" value={editData.address || ''} onChange={e => setEditData({...editData, address: e.target.value})} />
              </div>

              {/* GALERÍA - Editable por propietario */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">
                    Galería ({editData.gallery?.length || 0}/{getOwnerMaxGallery()})
                  </label>
                  <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-100 px-3 py-1 rounded-lg">
                    Plan {biz?.tier?.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {(editData.gallery || []).map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-2xl overflow-hidden shadow-sm group border border-slate-100">
                      <img src={img} className="w-full h-full object-cover" alt={`Foto ${i + 1}`} />
                      <button 
                        type="button" 
                        onClick={() => removeGalleryImage(i)} 
                        className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Icon name="X" className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {(editData.gallery?.length || 0) < getOwnerMaxGallery() && (
                    <label className="relative aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-all group">
                      <Icon name="PlusCircle" className="text-slate-300 group-hover:text-blue-500 w-6 h-6" />
                      <span className="text-[8px] font-black uppercase text-slate-400 mt-1 group-hover:text-blue-500">Agregar</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleGalleryUpload} />
                    </label>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setIsEditing(false)} className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest">Descartar</button>
              <button onClick={handleSaveEdit} className="flex-1 py-5 bg-[#0a2540] text-yellow-400 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- MapView (Leaflet – centrado en Honduras) ---

// Sub-componente: vuela al marcador indicado por los query-params
const FlyToMarker = ({ businesses, targetName }: { businesses: Business[]; targetName: string | null }) => {
  const map = useMap();
  useEffect(() => {
    if (!targetName) {
      // Sin parámetro → centrar Honduras
      map.flyTo(HONDURAS_CENTER, HONDURAS_ZOOM, { duration: 1.2 });
      return;
    }
    const target = businesses.find(b => b.name === targetName);
    if (target) {
      map.flyTo([target.lat, target.lng], 15, { duration: 1.2 });
    }
  }, [businesses, targetName, map]);
  return null;
};

const MapView = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams()[0];

  // Parámetros de URL (cuando se llega desde un negocio específico)
  const paramLat  = searchParams.get('lat');
  const paramLng  = searchParams.get('lng');
  const paramName = searchParams.get('name');
  const targetName = paramName ? decodeURIComponent(paramName) : null;

  // Centro inicial del mapa
  const initCenter: [number, number] = paramLat && paramLng
    ? [parseFloat(paramLat), parseFloat(paramLng)]
    : HONDURAS_CENTER;
  const initZoom = paramLat && paramLng ? 15 : HONDURAS_ZOOM;

  // ---------------------------------------------------------------------------
  // Firestore
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const q = query(collection(db, 'negocios'));
    const unsub = onSnapshot(q, (snapshot) => {
      setBusinesses(snapshot.docs.map(mapFirestoreToBusiness).filter(b => b.status === BusinessStatus.VERIFIED));
    });
    return () => unsub();
  }, []);

  // ---------------------------------------------------------------------------
  // Filtrado expandido: nombre, descripción, dirección, categoría
  // ---------------------------------------------------------------------------
  const filtered = businesses.filter(b => {
    if (!searchQuery.trim()) return true;                      // sin texto → todo
    const q = searchQuery.toLowerCase();
    const catName = (CATEGORIES.find(c => c.id === b.category)?.name || '').toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      (b.description || '').toLowerCase().includes(q) ||
      (b.address || '').toLowerCase().includes(q) ||
      catName.includes(q)
    );
  });

// Sub-componente: renderiza los marcadores. Vive DENTRO de MapContainer
// para que react-leaflet lo re-renderice cuando sus props cambien.
const MarkerLayer = ({
  filtered,
  targetName,
}: {
  filtered: Business[];
  targetName: string | null;
}) => {
  const createBusinessIcon = (isTarget: boolean) =>
    L.divIcon({
      html: `<div style="position:relative;width:36px;height:36px;">
        <div style="width:36px;height:36px;background:#fff;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,.25);border:3px solid ${isTarget ? '#facc15' : '#2563eb'};display:flex;align-items:center;justify-content:center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${isTarget ? '#facc15' : '#2563eb'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
        <div style="position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);width:10px;height:10px;background:${isTarget ? '#facc15' : '#2563eb'};transform:translateX(-50%) rotate(45deg);"></div>
      </div>`,
      className: '',
      iconSize: [36, 42],
      iconAnchor: [18, 42],
      popupAnchor: [0, -38],
    });

  return (
    <>
      {filtered.map(biz => {
        const isTarget = targetName === biz.name;
        return (
          <Marker
            key={biz.id}
            position={[biz.lat, biz.lng]}
            icon={createBusinessIcon(isTarget)}
            zIndexOffset={isTarget ? 999 : 0}
            ref={(marker) => {
              if (marker && isTarget) {
                setTimeout(() => marker.openPopup(), 600);
              }
            }}
          >
            <Popup className="custom-leaflet-popup">
              <div className="w-[250px] bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-100">
                <div className="relative h-28 overflow-hidden">
                  <img src={biz.image} alt="" className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded-xl flex items-center gap-1 shadow-sm">
                    <Icon name="Star" className="w-2.5 h-2.5 text-amber-500 fill-current" />
                    <span className="text-[9px] font-black text-slate-800">{biz.rating}</span>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="font-black text-[#0a2540] uppercase text-xs leading-tight truncate">{biz.name}</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{CATEGORIES.find(c => c.id === biz.category)?.name}</p>
                  <p className="text-[9px] text-slate-500 leading-snug line-clamp-2">{biz.address}</p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link to={`/business/${biz.id}`} className="py-2.5 bg-[#0a2540] text-yellow-400 rounded-xl text-[9px] font-black uppercase text-center tracking-widest">Ver Perfil</Link>
                    <a href={`https://wa.me/${biz.whatsapp}`} target="_blank" rel="noopener noreferrer" className="py-2.5 bg-green-500 text-white rounded-xl text-[9px] font-black uppercase text-center tracking-widest flex items-center justify-center gap-1.5">
                      <Icon name="MessageCircle" className="w-3 h-3" />WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="relative h-[calc(100vh-140px)] w-full overflow-hidden bg-slate-50 md:rounded-[2.5rem] shadow-inner border border-slate-100">

      {/* Buscador flotante */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-lg">
        <div className="relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
            <Icon name="Search" className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Buscar negocio, lugar, producto o servicio..."
            className="w-full bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl py-4 pl-14 pr-6 font-bold shadow-2xl focus:ring-4 focus:ring-blue-600/10 transition-all outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              <Icon name="X" className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mapa */}
      <MapContainer center={initCenter} zoom={initZoom} style={{ height: '100%', width: '100%' }} zoomControl={false}>

        {/* Tiles: CartoDB Positron (limpio, moderno, gratuito, sin API key) */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          maxZoom={19}
        />

        {/* Volar al negocio objetivo (o a Honduras) */}
        <FlyToMarker businesses={businesses} targetName={targetName} />

        {/* Marcadores (componente hijo para que reaccione al filtro) */}
        <MarkerLayer filtered={filtered} targetName={targetName} />
      </MapContainer>

      {/* Botones flotantes abajo-derecha */}
      <div className="absolute bottom-10 right-6 z-[1000] flex flex-col gap-3">
        {/* Centrar en Mora-Grafic's */}
        <button
          onClick={() => {
            window.location.hash = `/map?name=${encodeURIComponent("Mora-Grafic's")}`;
          }}
          className="p-4 bg-white text-[#0a2540] rounded-2xl shadow-2xl border border-slate-100 transition-all hover:scale-110 active:scale-90 flex items-center justify-center"
          title="Mora-Grafic's"
        >
          <Icon name="MapPin" className="w-6 h-6" />
        </button>
        {/* Mi ubicación */}
        <button
          onClick={() => {
            if (!navigator.geolocation) return alert('Geolocalización no soportada');
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                // Navegar al mapa centrado en la ubicación del usuario
                window.location.hash = `/map?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`;
              },
              () => alert('No se pudo obtener tu ubicación')
            );
          }}
          className="p-4 bg-white text-[#0a2540] rounded-2xl shadow-2xl border border-slate-100 transition-all hover:scale-110 active:scale-90 flex items-center justify-center"
          title="Mi ubicación"
        >
          <Icon name="Navigation" className="w-6 h-6" />
        </button>
      </div>

      {/* Estilos para popup de Leaflet */}
      <style>{`
        .leaflet-popup-content-wrapper { padding: 0 !important; background: transparent !important; box-shadow: none !important; border-radius: 16px !important; overflow: hidden !important; }
        .leaflet-popup-content { margin: 0 !important; width: auto !important; }
        .leaflet-popup-tip-container { display: none !important; }
        .leaflet-container { background: #f8fafc !important; }
      `}</style>
    </div>
  );
};

// --- MembershipView (Completo) ---
const MembershipView = () => {
  const [yearly, setYearly] = useState(false);

  const plans = [
    {
      name: 'PLAN INICIA',
      tierSlug: 'lite',
      icon: 'Rocket',
      badge: 'OFERTA LANZAMIENTO',
      description: 'El primer paso para digitalizar tu negocio',
      monthly: 375,
      yearly: 150,
      yearlyFixed: true,
      variant: 'default' as const,
      features: [
        'Perfil verificado',
        'Botón WhatsApp y llamadas',
        '4 Fotos (1 Portada + 3 Galería)',
        'Ubicación en mapa interactivo',
        '1 promoción mensual',
        '1 boost de visibilidad',
        'Estadísticas básicas',
      ]
    },
    {
      name: 'PLAN IMPULSA',
      tierSlug: 'plus',
      icon: 'Trophy',
      badge: 'EL MÁS POPULAR',
      description: 'Ideal para convertir visitas en clientes',
      monthly: 600,
      yearly: 600 * 10,
      yearlyFixed: false,
      variant: 'highlight' as const,
      features: [
        'Todo lo del Plan Inicia',
        'Posición prioritaria en búsquedas',
        '8 Fotos (1 Portada + 7 Galería)',
        'WhatsApp destacado',
        'Publicaciones ilimitadas',
        '3 boosts de visibilidad',
        'Estadísticas avanzadas',
        '1 diseño profesional',
      ]
    },
    {
      name: 'PLAN DOMINA',
      tierSlug: 'pro',
      icon: 'ShieldCheck',
      badge: 'MÁXIMA EXPOSICIÓN',
      description: 'Para quienes quieren dominar su categoría',
      monthly: 850,
      yearly: 850 * 10,
      yearlyFixed: false,
      variant: 'default' as const,
      features: [
        'Todo lo del Plan Impulsa',
        'Primeros lugares garantizados',
        'Tu negocio en Destacados (VIP)',
        '15 Fotos (1 Portada + 14 Galería)',
        '12 motion flyers profesionales',
        '12 diseños profesionales',
        'Promoción en redes sociales',
        'Asistente IA automático',
        'Hasta 24 boosts de visibilidad',
        'Soporte 24/7 prioritario',
      ]
    }
  ];

  const getPrice = (plan: typeof plans[0]) => yearly ? plan.yearly : plan.monthly;
  const getPeriod = (plan: typeof plans[0]) => {
    if (!yearly) return '/ mes';
    return plan.yearlyFixed ? '/ año (oferta)' : '/ año';
  };
  const getSavings = (plan: typeof plans[0]) =>
    plan.yearlyFixed ? plan.monthly * 12 - plan.yearly : plan.monthly * 2;

  return (
    <div className="py-20 px-6 md:px-12 bg-slate-50 min-h-screen">

      {/* Header */}
      <div className="text-center space-y-4 mb-8">
        <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-600">PRECIOS</h2>
        <h3 className="text-4xl md:text-5xl font-black text-[#0a2540] uppercase tracking-tighter leading-none">Planes de Membresía</h3>
        <p className="text-slate-500 text-sm font-medium">Más clientes · Más visibilidad · Más ventas</p>
      </div>

      {/* Toggle Mensual / Anual */}
      <div className="flex justify-center mb-12">
        <div className="flex items-center gap-4 bg-white shadow-md border border-slate-100 p-2.5 rounded-2xl">
          <span className={`text-[11px] font-black uppercase tracking-widest px-1 ${!yearly ? 'text-[#0a2540]' : 'text-slate-400'}`}>Mensual</span>
          <button
            onClick={() => setYearly(!yearly)}
            className={`w-14 h-7 rounded-full relative transition-colors duration-300 ${yearly ? 'bg-[#0a2540]' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-0.5 bg-white w-6 h-6 rounded-full shadow-sm transition-all duration-300 ${yearly ? 'left-7' : 'left-0.5'}`} />
          </button>
          <span className={`text-[11px] font-black uppercase tracking-widest px-1 ${yearly ? 'text-[#0a2540]' : 'text-slate-400'}`}>Anual</span>
          {yearly && (
            <span className="text-[9px] font-black uppercase tracking-widest bg-green-100 text-green-700 px-3 py-1.5 rounded-xl border border-green-200">
              ¡Hasta 2 meses GRATIS!
            </span>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
        {plans.map((plan) => (
          <div key={plan.name} className={`relative flex flex-col p-10 rounded-[3rem] transition-all duration-500 border ${plan.variant === 'highlight' ? 'bg-blue-600 text-white border-blue-600 shadow-2xl scale-105 z-10' : 'bg-white text-[#0a2540] border-slate-100 shadow-xl hover:shadow-2xl'}`}>

            {/* Badge superior */}
            {plan.badge && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <span className={`inline-flex items-center gap-1.5 px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg whitespace-nowrap ${plan.variant === 'highlight' ? 'bg-yellow-400 text-[#0a2540]' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                  <Icon name={plan.variant === 'highlight' ? 'Star' : 'Rocket'} className="w-3.5 h-3.5" />
                  {plan.badge}
                </span>
              </div>
            )}

            {/* Badge de ahorro — solo cuando está activo el modo anual */}
            {yearly && (
              <div className="absolute top-5 right-5 z-10">
                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-xl ${plan.variant === 'highlight' ? 'bg-white/15 text-green-300 border border-white/20' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                  Ahorras L.{getSavings(plan)}
                </span>
              </div>
            )}

            {/* Icono + Nombre + Descripción + Precio */}
            <div className="flex flex-col items-center text-center mb-10">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${plan.variant === 'highlight' ? 'bg-white/20' : 'bg-blue-50'}`}>
                <Icon name={plan.icon} className={`w-8 h-8 ${plan.variant === 'highlight' ? 'text-white' : 'text-blue-600'}`} />
              </div>
              <h4 className="text-2xl font-black uppercase tracking-tight mb-3">{plan.name}</h4>
              <p className={`text-xs font-medium px-4 opacity-80 ${plan.variant === 'highlight' ? 'text-blue-100' : 'text-slate-500'}`}>{plan.description}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-3xl font-black">L.{getPrice(plan)}</span>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{getPeriod(plan)}</span>
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-5 mb-12 flex-grow">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-4 text-sm font-bold">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 ${plan.variant === 'highlight' ? 'border-white/30 text-white' : 'border-blue-100 text-blue-600'}`}>
                    <Icon name="CheckCircle2" className="w-3.5 h-3.5" />
                  </div>
                  <span className={plan.variant === 'highlight' ? 'text-white' : 'text-slate-700'}>{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link to={`/register?plan=${plan.tierSlug}`} className={`w-full py-5 rounded-2xl font-black uppercase text-xs text-center tracking-[0.2em] shadow-xl transition-all active:scale-95 ${plan.variant === 'highlight' ? 'bg-white text-blue-600 hover:bg-slate-50' : 'bg-[#0a2540] text-white hover:bg-[#0f345c]'}`}>ELEGIR</Link>
          </div>
        ))}
      </div>

      {/* Footer */}
      <p className="text-center text-[11px] text-slate-400 font-bold mt-10 tracking-wide">
        Sin contratos · Cancelas cuando quieras · Activación inmediata
      </p>

      {/* ===== CATEGORÍAS ===== */}
      <div className="mt-24 max-w-7xl mx-auto">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-600">EXPLORAR</h2>
          <h3 className="text-3xl md:text-4xl font-black text-[#0a2540] uppercase tracking-tighter leading-none">20 Categorías de negocios</h3>
          <p className="text-slate-500 text-sm font-medium max-w-lg mx-auto">Desde agricultura hasta tecnología — tu negocio tiene un lugar en Negocios-HN.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={`/explorer?category=${cat.id}`}
              className="group flex flex-col items-center gap-3 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-xl hover:border-[#0a2540] hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 group-hover:bg-[#0a2540] flex items-center justify-center transition-all">
                <Icon name={cat.icon} className="w-6 h-6 text-blue-600 group-hover:text-yellow-400 transition-colors" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-[#0a2540] text-center leading-snug transition-colors">{cat.name}</span>
              <span className="text-[9px] font-bold text-slate-400">{cat.subCategories.length} subcategorías</span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
};

// --- Register View Corregido con Storage ---
const RegisterView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get('plan');
  
  const [tier, setTier] = useState<MembershipTier>(MembershipTier.DOMINA);
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
      if (planParam === 'inicia') setTier(MembershipTier.INICIA);
      else if (planParam === 'impulsa') setTier(MembershipTier.IMPULSA);
      else if (planParam === 'domina') setTier(MembershipTier.DOMINA);
    }
  }, [planParam]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, subCategory: '' }));
  }, [formData.category]);

  const getMaxGallerySlots = () => {
    switch (tier) {
      case MembershipTier.INICIA: return 3;
      case MembershipTier.IMPULSA: return 7;
      case MembershipTier.DOMINA: return 14;
      default: return 3;
    }
  };

  // --- Horario de atención ---
  const DAYS_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const [schedule, setSchedule] = useState(
    DAYS_ES.map((day, i) => ({
      day,
      open: i < 5, // Lunes a viernes abierto por defecto
      from: '08:00',
      to: '17:00'
    }))
  );

  const toggleDayOpen = (index: number) => {
    setSchedule(prev => prev.map((d, i) => i === index ? { ...d, open: !d.open } : d));
  };
  const updateDayTime = (index: number, field: 'from' | 'to', value: string) => {
    setSchedule(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d));
  };
  const formatScheduleForStorage = (): string => {
    const openDays = schedule.filter(d => d.open);
    if (openDays.length === 0) return 'Cerrado';
    // Agrupar días consecutivos con mismo horario
    const groups: { days: string[], from: string, to: string }[] = [];
    openDays.forEach(d => {
      const last = groups[groups.length - 1];
      if (last && last.from === d.from && last.to === d.to) {
        last.days.push(d.day);
      } else {
        groups.push({ days: [d.day], from: d.from, to: d.to });
      }
    });
    return groups.map(g => {
      const dayStr = g.days.length === 1 ? g.days[0] : `${g.days[0]} - ${g.days[g.days.length - 1]}`;
      // Formatear hora a 12h
      const fmt = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${m.toString().padStart(2,'0')} ${ampm}`;
      };
      return `${dayStr}: ${fmt(g.from)} - ${fmt(g.to)}`;
    }).join(' | ');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGallery = false) => {
    const files = e.target.files;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        if (isGallery) {
          if (formData.gallery.length < getMaxGallerySlots()) {
            setFormData(prev => ({...prev, gallery: [...prev.gallery, compressed]}));
          } else {
            alert(`Límite de fotos para el plan ${tier.toUpperCase()} alcanzado.`);
          }
        } else {
          setFormData(prev => ({...prev, image: compressed}));
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
    setShowConfirmModal(true);
  };

  const handleFinalSubmit = async () => {
    setIsSaving(true);
    try {
      // Subir imagen principal a Storage
      let mainImageUrl = formData.image;
      if (formData.image) {
        mainImageUrl = await uploadImageToCloudinary(formData.image, `businesses/${Date.now()}_main`);
      }

      // Subir galería
      const galleryUrls = [];
      for (let i = 0; i < formData.gallery.length; i++) {
        const url = await uploadImageToCloudinary(formData.gallery[i], `businesses/${Date.now()}_gallery_${i}`);
        galleryUrls.push(url);
      }

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
        rating: 5.0,
        image: mainImageUrl || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800',
        ownerPassword: formData.ownerPassword,
        VIP: false,
        gallery: galleryUrls,
        hours: formatScheduleForStorage(),
        tier: tier
      });

      setShowConfirmModal(false);
      alert("¡Registro exitoso! Tu negocio está en proceso de verificación.");
      navigate('/explorer');
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar. Intenta con imágenes más pequeñas.");
    } finally {
      setIsSaving(false);
    }
  };

  const currentCategory = CATEGORIES.find(c => c.id === formData.category);
  const totalSlots = getMaxGallerySlots() + 1;

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 md:px-8 space-y-12 animate-in fade-in duration-500 relative">
      <div className="max-w-4xl mx-auto text-center space-y-2">
        <h2 className="text-3xl md:text-4xl font-black text-[#001f3f] uppercase tracking-tighter">REGISTRO DE NEGOCIO</h2>
        <p className="text-slate-500 font-medium">Únete a la Primera Plataforma Comercial de Honduras.</p>
      </div>

      <form onSubmit={handleSubmitAttempt} className="max-w-3xl mx-auto space-y-10 pb-20">
        <section className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-10 border border-slate-100 space-y-8">
          <div className="flex items-center gap-3"><div className="w-1.5 h-6 bg-yellow-400 rounded-full" /><h3 className="text-sm font-black text-[#001f3f] uppercase tracking-widest">Seleccione su Plan</h3></div>
          <div className="flex bg-slate-50 p-2 rounded-2xl gap-2">
            {[MembershipTier.INICIA, MembershipTier.IMPULSA, MembershipTier.DOMINA].map(t => (
              <button key={t} type="button" onClick={() => setTier(t)} className={`flex-1 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${tier === t ? 'bg-[#001f3f] text-yellow-400 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Propietario *</label><input type="text" name="ownerName" placeholder="Nombre completo" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 outline-none font-bold" value={formData.ownerName} onChange={handleInputChange} /></div>
            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">DNI *</label><input type="text" name="dni" placeholder="0000-0000-00000" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 outline-none font-bold" value={formData.dni} onChange={handleInputChange} /></div>
            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Email *</label><input type="email" name="email" placeholder="ejemplo@correo.com" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 outline-none font-bold" value={formData.email} onChange={handleInputChange} /></div>
            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Teléfono *</label><input type="tel" name="phone" placeholder="9999-9999" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 outline-none font-bold" value={formData.phone} onChange={handleInputChange} /></div>
          </div>
        </section>

        <section className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-10 border border-slate-100 space-y-8">
          <div className="flex items-center gap-3"><div className="w-1.5 h-6 bg-yellow-400 rounded-full" /><h3 className="text-sm font-black text-[#001f3f] uppercase tracking-widest">DETALLES COMERCIALES</h3></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nombre del Negocio *</label><input type="text" name="businessName" placeholder="Nombre Comercial" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 outline-none font-bold" value={formData.businessName} onChange={handleInputChange} /></div>
            <div className="md:col-span-2 space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Contraseña del Propietario *</label><input type="password" name="ownerPassword" placeholder="Crea una contraseña para gestionar tu negocio" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 outline-none font-bold" value={formData.ownerPassword} onChange={handleInputChange} /></div>
            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Categoría *</label><select name="category" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 outline-none font-bold appearance-none" value={formData.category} onChange={handleInputChange}>{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Subcategoría *</label><select name="subCategory" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 outline-none font-bold appearance-none" value={formData.subCategory} onChange={handleInputChange}><option value="">Seleccionar Subcategoría</option>{currentCategory?.subCategories.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}</select></div>
          </div>
          <div className="space-y-3">
             <div className="flex justify-between items-center"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">RESUMEN *</label><button type="button" onClick={handleAutoRedact} disabled={isGenerating} className="px-4 py-2 bg-yellow-400 text-[#001f3f] rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50"><Icon name="Sparkles" className="w-3 h-3" />{isGenerating ? 'GENERANDO...' : 'AUTO-REDACTAR'}</button></div>
             <textarea name="description" placeholder="Descripción breve..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 outline-none font-bold h-32 resize-none" value={formData.description} onChange={handleInputChange} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Dirección *</label><input type="text" name="address" placeholder="Ubicación física" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 outline-none font-bold" value={formData.address} onChange={handleInputChange} /></div>
            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">WhatsApp *</label><input type="text" name="whatsapp" placeholder="WhatsApp" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 outline-none font-bold" value={formData.whatsapp} onChange={handleInputChange} /></div>
          </div>
        </section>

        {/* HORARIO DE ATENCIÓN */}
        <section className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-10 border border-slate-100 space-y-8">
          <div className="flex items-center gap-3"><div className="w-1.5 h-6 bg-yellow-400 rounded-full" /><h3 className="text-sm font-black text-[#001f3f] uppercase tracking-widest">Horario de Atención</h3></div>
          
          <div className="space-y-3">
            {schedule.map((day, i) => (
              <div 
                key={day.day} 
                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${day.open ? 'bg-slate-50 border-slate-200' : 'bg-slate-50/30 border-slate-100 opacity-60'}`}
              >
                <button 
                  type="button" 
                  onClick={() => toggleDayOpen(i)}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${day.open ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${day.open ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
                <span className={`text-[11px] font-black uppercase tracking-tight w-24 shrink-0 ${day.open ? 'text-slate-700' : 'text-slate-400'}`}>
                  {day.day}
                </span>
                {day.open ? (
                  <div className="flex items-center gap-2 flex-1 flex-wrap sm:flex-nowrap">
                    <select 
                      value={day.from} 
                      onChange={e => updateDayTime(i, 'from', e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold outline-none flex-1 min-w-[90px] appearance-none cursor-pointer"
                    >
                      {Array.from({length: 24}, (_, h) => 
                        ['00','30'].map(m => {
                          const val = `${h.toString().padStart(2,'0')}:${m}`;
                          const ampm = h >= 12 ? 'PM' : 'AM';
                          const h12 = h % 12 || 12;
                          return <option key={val} value={val}>{h12}:{m} {ampm}</option>;
                        })
                      )}
                    </select>
                    <span className="text-[10px] font-black text-slate-400">—</span>
                    <select 
                      value={day.to} 
                      onChange={e => updateDayTime(i, 'to', e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold outline-none flex-1 min-w-[90px] appearance-none cursor-pointer"
                    >
                      {Array.from({length: 24}, (_, h) => 
                        ['00','30'].map(m => {
                          const val = `${h.toString().padStart(2,'0')}:${m}`;
                          const ampm = h >= 12 ? 'PM' : 'AM';
                          const h12 = h % 12 || 12;
                          return <option key={val} value={val}>{h12}:{m} {ampm}</option>;
                        })
                      )}
                    </select>
                  </div>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400 italic flex-1">Cerrado este día</span>
                )}
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest block mb-1.5">Vista previa</span>
            <p className="text-xs font-bold text-slate-600 leading-relaxed">{formatScheduleForStorage()}</p>
          </div>
        </section>

        {tier === MembershipTier.DOMINA && (
          <section className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-10 border border-slate-100 space-y-8 animate-in slide-in-from-top-4">
            <div className="flex items-center gap-3"><div className="w-1.5 h-6 bg-blue-600 rounded-full" /><h3 className="text-sm font-black text-[#001f3f] uppercase tracking-widest">ECOSISTEMA DIGITAL (DOMINA)</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 flex items-center gap-2"><Icon name="Facebook" className="w-3 h-3" />FACEBOOK</label><input type="text" name="facebook" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-5 outline-none font-bold text-sm" value={formData.facebook} onChange={handleInputChange} /></div>
              <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 flex items-center gap-2"><Icon name="Instagram" className="w-3 h-3" />INSTAGRAM</label><input type="text" name="instagram" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-5 outline-none font-bold text-sm" value={formData.instagram} onChange={handleInputChange} /></div>
              <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 flex items-center gap-2"><Icon name="Music" className="w-3 h-3" />TIKTOK</label><input type="text" name="tiktok" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-5 outline-none font-bold text-sm" value={formData.tiktok} onChange={handleInputChange} /></div>
              <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 flex items-center gap-2"><Icon name="Navigation" className="w-3 h-3" />OTROS</label><input type="text" name="otherLink" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-5 outline-none font-bold text-sm" value={formData.otherLink} onChange={handleInputChange} /></div>
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

// --- ADMIM VIEW (Completo con Modal de Edición Restaurado) ---
const AdminView = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true');
  const [password, setPassword] = useState('');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [menuAbiertoId, setMenuAbiertoId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Partial<Business> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'negocios'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(mapFirestoreToBusiness);
      setBusinesses(data);
    }, (error) => {
      console.error("Error en panel admin:", error);
    });
    return () => unsubscribe();
  }, []);

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
    if (password === ADMIN_PASSWORD) { 
      setIsAuthenticated(true); 
      sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
    } else { 
      alert('Incorrecto'); 
    }
  };

  const handleLogout = () => { 
    setIsAuthenticated(false); 
    sessionStorage.removeItem(ADMIN_AUTH_KEY); 
  };

  const toggleStatus = async (id: string) => {
    const businessRef = doc(db, 'negocios', id);
    const currentBiz = businesses.find(b => b.id === id);
    const newStatus = currentBiz?.status === BusinessStatus.VERIFIED ? BusinessStatus.PENDING : BusinessStatus.VERIFIED;
    try {
      await updateDoc(businessRef, { status: newStatus });
    } catch (error) {
      console.error("Error:", error);
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
      console.error("Error:", error);
    }
    setMenuAbiertoId(null);
  };

  const openEditModal = (biz: Business) => { 
    setEditingBusiness({ ...biz }); 
    setIsModalOpen(true); 
    setMenuAbiertoId(null); 
  };

  const handleSaveEdit = async () => {
    if (!editingBusiness?.id) return;
    
    try {
      const businessRef = doc(db, 'negocios', editingBusiness.id);
      
      // Portada: subir si es base64
      let imageUrl = editingBusiness.image;
      if (editingBusiness.image?.startsWith('data:')) {
        imageUrl = await uploadImageToCloudinary(editingBusiness.image, 'businesses');
      }

      // Galería: subir solo las que sean base64 nuevas
      const galleryUrls: string[] = [];
      for (const img of (editingBusiness.gallery || [])) {
        if (img.startsWith('data:')) {
          const url = await uploadImageToCloudinary(img, `businesses/${editingBusiness.id}/gallery_${Date.now()}_${Math.random().toString(36).slice(2,7)}`);
          galleryUrls.push(url);
        } else {
          galleryUrls.push(img);
        }
      }

      await updateDoc(businessRef, {
        name: editingBusiness.name,
        description: editingBusiness.description,
        address: editingBusiness.address,
        subCategory: editingBusiness.subCategory,
        image: imageUrl,
        gallery: galleryUrls
      });
      
      setIsModalOpen(false);
      alert("Cambios guardados correctamente");
      
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar");
    }
  };

  const deleteBusiness = async (id: string) => { 
    if (confirm('¿Eliminar este negocio?')) { 
      try {
        await deleteDoc(doc(db, 'negocios', id));
      } catch (error) {
        console.error("Error:", error);
        alert("Error al eliminar");
      }
    }
    setMenuAbiertoId(null); 
  };

  const exportarAExcel = () => {
    const ws = XLSX.utils.json_to_sheet(businesses.map(b => ({ ID: b.id, Nombre: b.name, Categoría: b.category, Estado: b.status, VIP: b.featured ? 'SÍ' : 'NO' })));
    const wb = XLSX.utils.book_new(); 
    XLSX.utils.book_append_sheet(wb, ws, "Negocios");
    XLSX.writeFile(wb, "Negocios.xlsx");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 space-y-8 border border-slate-100">
          <div className="text-center space-y-2"><Icon name="Lock" className="w-8 h-8 text-[#0a2540] mx-auto mb-4" /><h2 className="text-2xl font-black text-[#0a2540] uppercase">Acceso Maestro</h2></div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" placeholder="Contraseña" className="w-full bg-slate-50 border p-4 rounded-2xl font-bold" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="submit" className="w-full py-4 bg-[#0a2540] text-yellow-400 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl">Entrar</button>
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
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Panel de Control</p>
        </div>
        <div className="flex gap-4">
          <button onClick={exportarAExcel} className="p-4 bg-green-50 rounded-2xl text-green-600 shadow-sm hover:shadow-md"><Icon name="Book" /></button>
          <button onClick={handleLogout} className="p-4 bg-slate-50 rounded-2xl text-slate-600 shadow-sm hover:shadow-md"><Icon name="Lock" /></button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="text-left bg-slate-50/30 border-b border-slate-100">
              <th className="py-6 px-8 text-[10px] font-black uppercase text-slate-400">Entidad</th>
              <th className="py-6 px-4 text-[10px] font-black uppercase text-slate-400 text-center">Estado</th>
              <th className="py-6 px-4 text-[10px] font-black uppercase text-slate-400 text-center">VIP</th>
              <th className="py-6 px-8 text-[10px] font-black uppercase text-slate-400 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {businesses.map((biz) => (
              <tr key={biz.id} className="hover:bg-slate-50/50">
                <td className="py-6 px-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border shadow-sm">{biz.image ? <img src={biz.image} alt="" className="w-full h-full object-cover" /> : <Icon name="Image" className="w-6 h-6 m-3 text-slate-300" />}</div>
                    <div>
                      <h4 className="font-black text-slate-900 uppercase text-xs">{biz.name}</h4>
                      <p className="text-[9px] font-black text-slate-400 uppercase">{biz.category}</p>
                      {biz.subCategory && <p className="text-[8px] text-blue-600 font-bold mt-0.5">↳ {biz.subCategory}</p>}
                    </div>
                  </div>
                </td>
                <td className="py-6 px-4 text-center">
                  <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase ${biz.status === BusinessStatus.VERIFIED ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{biz.status.toUpperCase()}</span>
                </td>
                <td className="py-6 px-4 text-center">
                  {biz.featured ? <div className="p-2 bg-yellow-50 rounded-xl inline-block"><Icon name="Star" className="w-4 h-4 text-yellow-400 fill-current" /></div> : <span className="text-[9px] font-black text-slate-300">NO</span>}
                </td>
                <td className="py-6 px-8 text-right relative">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setMenuAbiertoId(menuAbiertoId === biz.id ? null : biz.id)} className={`p-2.5 rounded-xl ${menuAbiertoId === biz.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-100'}`}><Icon name="MoreVertical" className="w-5 h-5" /></button>
                    {menuAbiertoId === biz.id && (
                      <div ref={menuRef} className="absolute right-20 top-0 bg-white border border-slate-100 shadow-2xl rounded-2xl p-2 z-[1000] w-48 text-left">
                        <button onClick={() => toggleStatus(biz.id)} className="w-full px-4 py-3 hover:bg-slate-50 rounded-xl flex items-center gap-3 text-[11px] font-black uppercase"><Icon name="ShieldCheck" />{biz.status === BusinessStatus.VERIFIED ? 'Desverificar' : 'Verificar'}</button>
                        <button onClick={() => toggleFeatured(biz.id)} className="w-full px-4 py-3 hover:bg-slate-50 rounded-xl flex items-center gap-3 text-[11px] font-black uppercase"><Icon name="Star" />{biz.featured ? 'Quitar VIP' : 'Destacar'}</button>
                        <button onClick={() => openEditModal(biz)} className="w-full px-4 py-3 hover:bg-slate-50 rounded-xl flex items-center gap-3 text-[11px] font-black uppercase"><Icon name="Edit" />Editar</button>
                        <div className="h-px bg-slate-50 my-1 mx-2"></div>
                        <button onClick={() => deleteBusiness(biz.id)} className="w-full px-4 py-3 hover:bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-[11px] font-black uppercase"><Icon name="Trash2" />Eliminar</button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && editingBusiness && (
        <div className="fixed inset-0 bg-[#0a2540]/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black text-[#0a2540] uppercase tracking-tighter">Editar Negocio</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-red-500">
                <Icon name="X" className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-5">

              {/* PORTADA */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Imagen de Portada</label>
                <div className="flex items-center gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                    {editingBusiness.image
                      ? <img src={editingBusiness.image} className="w-full h-full object-cover" alt="Portada" />
                      : <div className="w-full h-full flex items-center justify-center"><Icon name="Image" className="w-6 h-6 text-slate-300" /></div>
                    }
                  </div>
                  <div className="flex-1 space-y-2">
                    <input type="file" accept="image/*" id="admin-portada" className="hidden" onChange={async (e) => {
                      if (e.target.files?.[0]) {
                        const reader = new FileReader();
                        reader.onload = async () => {
                          const compressed = await compressImage(reader.result as string);
                          setEditingBusiness(prev => prev ? {...prev, image: compressed} : prev);
                        };
                        reader.readAsDataURL(e.target.files[0]);
                      }
                    }} />
                    <label htmlFor="admin-portada" className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase cursor-pointer hover:bg-blue-50 hover:border-blue-300 shadow-sm inline-flex items-center gap-2 transition-all">
                      <Icon name="Image" className="w-3.5 h-3.5 text-blue-600" />
                      {editingBusiness.image ? 'Cambiar Portada' : 'Subir Portada'}
                    </label>
                  </div>
                </div>
              </div>

              {/* NOMBRE */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Nombre</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none"
                  value={editingBusiness.name || ''} 
                  onChange={e => setEditingBusiness({...editingBusiness, name: e.target.value})} 
                />
              </div>

              {/* DESCRIPCIÓN */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Descripción</label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold h-24 resize-none outline-none"
                  value={editingBusiness.description || ''} 
                  onChange={e => setEditingBusiness({...editingBusiness, description: e.target.value})}
                />
              </div>

              {/* DIRECCIÓN */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Dirección</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none"
                  value={editingBusiness.address || ''} 
                  onChange={e => setEditingBusiness({...editingBusiness, address: e.target.value})} 
                />
              </div>

              {/* SUBCATEGORÍA */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">
                  Subcategoría {editingBusiness.subCategory ? '' : '(No asignada)'}
                </label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none"
                  value={editingBusiness.subCategory || ''}
                  onChange={e => setEditingBusiness({...editingBusiness, subCategory: e.target.value})}
                >
                  <option value="">Seleccionar subcategoría...</option>
                  {CATEGORIES.map(cat => (
                    <optgroup key={cat.id} label={cat.name}>
                      {cat.subCategories.map(sub => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* GALERÍA — Admin puede agregar, reemplazar y eliminar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Galería ({(editingBusiness.gallery || []).length}/{(() => { const t = editingBusiness.tier; return t === 'domina' ? 14 : t === 'impulsa' ? 7 : 3; })()})
                  </label>
                  <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-100 px-3 py-1 rounded-lg">
                    Plan {(editingBusiness.tier || 'lite').toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {(editingBusiness.gallery || []).map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden shadow-sm border border-slate-200 group bg-slate-50">
                      <img src={img} className="w-full h-full object-cover" alt={`Foto ${idx + 1}`} />
                      {/* Overlay con acciones al hover */}
                      <div className="absolute inset-0 bg-[#0a2540]/60 flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Reemplazar */}
                        <label className="px-2.5 py-1.5 bg-white/90 rounded-lg text-[8px] font-black uppercase cursor-pointer hover:bg-white flex items-center gap-1.5 shadow-sm">
                          <Icon name="Image" className="w-3 h-3 text-blue-600" />Reemplazar
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            if (e.target.files?.[0]) {
                              const reader = new FileReader();
                              reader.onload = async () => {
                                const compressed = await compressImage(reader.result as string);
                                setEditingBusiness(prev => {
                                  if (!prev) return prev;
                                  const g = [...(prev.gallery || [])];
                                  g[idx] = compressed;
                                  return { ...prev, gallery: g };
                                });
                              };
                              reader.readAsDataURL(e.target.files[0]);
                            }
                          }} />
                        </label>
                        {/* Eliminar */}
                        <button type="button" onClick={() => {
                          setEditingBusiness(prev => prev ? { ...prev, gallery: (prev.gallery || []).filter((_, i) => i !== idx) } : prev);
                        }} className="px-2.5 py-1.5 bg-red-500/90 text-white rounded-lg text-[8px] font-black uppercase flex items-center gap-1.5 hover:bg-red-600 shadow-sm">
                          <Icon name="Trash2" className="w-3 h-3" />Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* Slot para agregar nueva imagen */}
                  {(editingBusiness.gallery || []).length < (() => { const t = editingBusiness.tier; return t === 'domina' ? 14 : t === 'impulsa' ? 7 : 3; })() && (
                    <label className="relative aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-all group">
                      <Icon name="PlusCircle" className="text-slate-300 group-hover:text-blue-500 w-5 h-5" />
                      <span className="text-[8px] font-black uppercase text-slate-400 mt-1 group-hover:text-blue-500">Agregar</span>
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        if (e.target.files?.[0]) {
                          const reader = new FileReader();
                          reader.onload = async () => {
                            const compressed = await compressImage(reader.result as string);
                            setEditingBusiness(prev => prev ? { ...prev, gallery: [...(prev.gallery || []), compressed] } : prev);
                          };
                          reader.readAsDataURL(e.target.files[0]);
                        }
                      }} />
                    </label>
                  )}
                </div>
              </div>

            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest">
                Cancelar
              </button>
              <button onClick={handleSaveEdit} className="flex-1 py-4 bg-[#0a2540] text-yellow-400 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">
                Guardar Cambios
              </button>
            </div>
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