export enum BusinessStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected'
}

export enum MembershipTier {
  INICIA = 'inicia',
  IMPULSA = 'impulsa',
  DOMINA = 'domina'
}

export interface SubCategory {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  subCategories: SubCategory[];
}

export interface Business {
  id: string;
  name: string;
  description: string;
  category: string;
  subCategory: string;
  address: string;
  phone: string;
  whatsapp: string;
  image: string;
  status: BusinessStatus;
  featured: boolean;
  rating: number;
  hours: string;
  lat: number;
  lng: number;
  tier?: MembershipTier;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  otherLink?: string;
  gallery?: string[];
  ownerPassword?: string;
}

export const CATEGORIES: Category[] = [
  { 
    id: 'agricultura-agroindustria', 
    name: 'Agricultura y Ganadería', 
    icon: 'Sprout', 
    subCategories: [
      { id: 'agricultura-sostenible', name: 'Agricultura tradicional y sostenible' },
      { id: 'produccion-organica', name: 'Producción orgánica' },
      { id: 'ganaderia-avicultura', name: 'Ganadería y avicultura' },
      { id: 'apicultura', name: 'Apicultura (miel y derivados)' },
      { id: 'piscicultura', name: 'Piscicultura y acuicultura' },
      { id: 'procesadoras-alimentos', name: 'Procesadoras de alimentos' },
      { id: 'insumos-agricolas', name: 'Insumos agrícolas (semillas, fertilizantes)' },
      { id: 'maquinaria-agricola', name: 'Maquinaria y herramientas agrícolas' },
      { id: 'venta-productos-campo', name: 'Venta directa de productos del campo' },
      { id: 'viveros-plantas', name: 'Viveros y plantas ornamentales' },
      { id: 'agroexportadoras', name: 'Empacadoras y agroexportadoras' }
    ] 
  },
  { 
    id: 'alimentacion-bebidas', 
    name: 'Alimentación y Bebidas', 
    icon: 'Utensils', 
    subCategories: [
      { id: 'restaurantes', name: 'Restaurantes' },
      { id: 'comida-rapida', name: 'Comida rápida' },
      { id: 'baleadas-tipica', name: 'Baleadas y comida típica hondureña' },
      { id: 'comedores-populares', name: 'Comedores populares' },
      { id: 'cafeterias', name: 'Cafeterías' },
      { id: 'cafe-especializado', name: 'Café hondureño especializado' },
      { id: 'pasteleria-panaderia', name: 'Pastelerías y panaderías' },
      { id: 'tortillerias', name: 'Tortillerías' },
      { id: 'rosticeria', name: 'Rosticerías / pollo asado' },
      { id: 'heladerias-raspados', name: 'Heladerías y raspados' },
      { id: 'food-trucks', name: 'Food trucks' },
      { id: 'catering-eventos', name: 'Catering y eventos' },
      { id: 'jugos-batidos', name: 'Jugos, batidos y smoothies' },
      { id: 'tiendas-saludables', name: 'Tiendas saludables / orgánicos' },
      { id: 'abarrotes-minisuper', name: 'Tiendas de abarrotes / minisúper' },
      { id: 'pulperias', name: 'Pulperías' },
      { id: 'carnicer­ias-marisquerias', name: 'Carnicerías y marisquerías' },
      { id: 'verdulerias', name: 'Verdulerías' },
      { id: 'licorerias', name: 'Licorerías' }
    ] 
  },
  { 
    id: 'arte-cultura-artesanias', 
    name: 'Arte, Cultura y Artesanías', 
    icon: 'Palette', 
    subCategories: [
      { id: 'artistas-plasticos', name: 'Artistas plásticos y artesanos' },
      { id: 'fotografia-videografia', name: 'Fotografía y videografía' },
      { id: 'diseno-grafico', name: 'Diseño gráfico' },
      { id: 'produccion-audiovisual', name: 'Producción audiovisual' },
      { id: 'musicos-djs', name: 'Músicos y DJs' },
      { id: 'librerias', name: 'Librerías' },
      { id: 'teatros-espectaculos', name: 'Teatros y espectáculos' },
      { id: 'instrumentos-musica', name: 'Tiendas de instrumentos musicales' },
      { id: 'academias-arte-musica', name: 'Academias de arte y música' },
      { id: 'velas-artesanales', name: 'Velas artesanales' },
      { id: 'jabones-artesanales', name: 'Jabones artesanales' },
      { id: 'manualidades', name: 'Manualidades y productos hechos a mano' },
      { id: 'bisuteria', name: 'Bisutería' },
      { id: 'sublimacion', name: 'Sublimación personalizada' },
      { id: 'regalos-personalizados', name: 'Regalos personalizados' },
      { id: 'papeleria-creativa', name: 'Papelería creativa' },
      { id: 'cuadros-arte-decorativo', name: 'Cuadros y arte decorativo' },

    ] 
  },
  { 
    id: 'automotriz', 
    name: 'Autos, Motos y Bicicletas', 
    icon: 'Car', 
    subCategories: [
      { id: 'talleres-mecanicos', name: 'Talleres mecánicos' },
      { id: 'autopartes-repuestos', name: 'Autopartes y repuestos' },
      { id: 'llantas-baterias', name: 'Llantas y baterías' },
      { id: 'electricidad-automotriz', name: 'Electricidad automotriz' },
      { id: 'lavado', name: 'Lavado' },
      { id: 'alquiler-vehiculos', name: 'Alquiler de vehículos' },
      { id: 'venta-autos', name: 'Venta de autos nuevos/usados' },
      { id: 'venta-motos-bicicletas', name: 'Venta de motos y bicicletas' },
      { id: 'gruas-asistencia', name: 'Grúas y asistencia vial' }
    ] 
  },
  { 
    id: 'comercio-electronico', 
    name: 'Comercio Electrónico', 
    icon: 'ShoppingBag', 
    subCategories: [
      { id: 'tiendas-online', name: 'Tiendas online' },
      { id: 'dropshipping', name: 'Dropshipping' },
      { id: 'productos-digitales', name: 'Productos digitales' },
      { id: 'marketplaces', name: 'Marketplaces' },
      { id: 'envios-ecommerce', name: 'Servicios de envíos para ecommerce' }
    ] 
  },
  { 
    id: 'construccion-inmobiliaria', 
    name: 'Construcción e Inmobiliaria', 
    icon: 'Hammer', 
    subCategories: [
      { id: 'constructoras', name: 'Constructoras' },
      { id: 'remodelaciones', name: 'Remodelaciones' },
      { id: 'arquitectos-ingenieros', name: 'Arquitectos e ingenieros' },
      { id: 'maestros-obra', name: 'Maestros de obra' },
      { id: 'ferreterias', name: 'Ferreterías' },
      { id: 'pintores', name: 'Pintores' },
      { id: 'electricistas', name: 'Electricistas' },
      { id: 'plomeros', name: 'Plomeros' },
      { id: 'carpinteros', name: 'Carpinteros' },
      { id: 'alquiler-maquinaria', name: 'Alquiler de maquinaria' },
      { id: 'inmobiliarias', name: 'Inmobiliarias' },
      { id: 'venta-propiedades', name: 'Venta de propiedades' },
      { id: 'alquiler-propiedades', name: 'Alquiler de propiedades' },
      { id: 'desarrollos-residenciales', name: 'Desarrollos residenciales' },
      { id: 'avaluos', name: 'Avalúos' }
    ] 
  },
  { 
    id: 'deportes-recreacion', 
    name: 'Deportes y Recreación', 
    icon: 'Dumbbell', 
    subCategories: [
      { id: 'gimnasios', name: 'Gimnasios' },
      { id: 'entrenadores-personales', name: 'Entrenadores personales' },
      { id: 'academias-deportivas', name: 'Academias deportivas (fútbol, baloncesto)' },
      { id: 'tiendas-deportivas', name: 'Tiendas deportivas' },
      { id: 'parques-centros-recreativos', name: 'Parques y centros recreativos' },
      { id: 'yoga-pilates-artes-marciales', name: 'Yoga / pilates / artes marciales' }
    ] 
  },
  { 
    id: 'educacion-formacion', 
    name: 'Educación y Formación', 
    icon: 'GraduationCap', 
    subCategories: [
      { id: 'escuelas-colegios', name: 'Escuelas y colegios' },
      { id: 'universidades', name: 'Universidades' },
      { id: 'guarderias', name: 'Guarderías' },
      { id: 'clases-particulares', name: 'Clases particulares' },
      { id: 'academias-idiomas', name: 'Academias de idiomas' },
      { id: 'cursos-online', name: 'Cursos online' },
      { id: 'talleres-tecnicos', name: 'Talleres técnicos' },
      { id: 'coaching-mentoria', name: 'Coaching y mentoría' }
    ] 
  },
  { 
    id: 'tecnologia-electronica', 
    name: 'Tecnología y Electrónica', 
    icon: 'Cpu', 
    subCategories: [
      { id: 'desarrollo-software', name: 'Desarrollo de software' },
      { id: 'apps-moviles', name: 'Apps móviles' },
      { id: 'reparacion-celulares', name: 'Reparación de celulares' },
	  { id: 'venta-celulares', name: 'Venta de celulares y Accesorios' },
      { id: 'reparacion-computadoras', name: 'Reparación de computadoras' },
      { id: 'servicio-tecnico-tv', name: 'Servicio técnico de televisores' },
      { id: 'ciberseguridad', name: 'Ciberseguridad' },
      { id: 'soporte-tecnico', name: 'Soporte técnico' },
      { id: 'tiendas-tecnologia', name: 'Tiendas de tecnología' },
      { id: 'venta-accesorios', name: 'Venta de accesorios' },
      { id: 'internet-redes', name: 'Servicios de internet y redes' },
      { id: 'gaming', name: 'Gaming (consolas, videojuegos)' },
      { id: 'drones', name: 'Drones y accesorios' },
      { id: 'impresoras-consumibles', name: 'Impresoras y consumibles' }
    ] 
  },
  { 
    id: 'hogar-decoracion', 
    name: 'Hogar y Decoración', 
    icon: 'Home', 
    subCategories: [
      { id: 'muebles', name: 'Muebles' },
      { id: 'decoracion', name: 'Decoración' },
      { id: 'electrodomesticos', name: 'Electrodomésticos' },
      { id: 'jardineria', name: 'Jardinería' },
      { id: 'limpieza-hogar', name: 'Limpieza del hogar' },
      { id: 'cortinas-persianas', name: 'Cortinas y persianas' },
      { id: 'colchones', name: 'Colchones' },
      { id: 'cerrajeria', name: 'Cerrajería' },
      { id: 'tapiceria', name: 'Tapicería' },
      { id: 'vidrios-espejos', name: 'Vidrios y espejos' },
      { id: 'pisos-azulejos', name: 'Pisos y azulejos' },
      { id: 'iluminacion', name: 'Iluminación (lámparas, LED)' },
	  { id: 'resina-epoxica', name: 'Resina epóxica (relojes, cuadros, decoración)' },
      { id: 'lavado-planchado', name: 'Lavado y planchado' },	  
      { id: 'tufting-alfombras', name: 'Tufting / alfombras artesanales / MousePad' }
    ] 
  },
  { 
    id: 'moda-belleza', 
    name: 'Moda y Belleza', 
    icon: 'Shirt', 
    subCategories: [
      { id: 'tiendas-ropa', name: 'Tiendas de ropa' },
      { id: 'zapaterias', name: 'Zapaterías' },
      { id: 'accesorios', name: 'Accesorios' },
      { id: 'joyerias', name: 'Joyerías' },
      { id: 'relojerias', name: 'Relojerías' },
      { id: 'segunda-mano', name: 'Tiendas de segunda mano / consignación' },
      { id: 'alquiler-vestidos', name: 'Alquiler de vestidos (XV años, bodas)' },
      { id: 'sastreria', name: 'Sastrería' },
      { id: 'salones-belleza', name: 'Salones de belleza' },
      { id: 'barberias', name: 'Barberías' },
      { id: 'maquillistas', name: 'Maquillistas' },
      { id: 'unas-estetica', name: 'Uñas y estética' },
      { id: 'perfumerias', name: 'Perfumerías' },
      { id: 'extensiones-cabello', name: 'Extensiones de cabello' }
    ] 
  },
  { 
    id: 'salud-bienestar', 
    name: 'Salud y Bienestar', 
    icon: 'HeartPulse', 
    subCategories: [
      { id: 'hospitales', name: 'Hospitales' },
      { id: 'clinicas-medicas', name: 'Clínicas médicas' },
      { id: 'clinicas-dentales', name: 'Clínicas dentales' },
      { id: 'laboratorios-clinicos', name: 'Laboratorios clínicos' },
      { id: 'farmacias', name: 'Farmacias' },
      { id: 'psicologos', name: 'Psicólogos' },
      { id: 'nutricionistas', name: 'Nutricionistas' },
      { id: 'centros-rehabilitacion', name: 'Centros de rehabilitación' },
      { id: 'spa-masajes', name: 'Spa y masajes' },
      { id: 'tiendas-naturistas', name: 'Tiendas naturistas' },
      { id: 'quiropracticos', name: 'Quiroprácticos' },
      { id: 'fisioterapia', name: 'Fisioterapia' },
      { id: 'terapia-ocupacional', name: 'Terapia ocupacional' },
      { id: 'podologos', name: 'Podólogos' },
      { id: 'opticas', name: 'Ópticas' },
      { id: 'ambulancias-privadas', name: 'Ambulancias privadas' }
    ] 
  },
  { 
    id: 'mascotas-veterinaria', 
    name: 'Mascotas y Veterinaria', 
    icon: 'Dog', 
    subCategories: [
      { id: 'veterinarias', name: 'Clínicas veterinarias' },
      { id: 'peluquerias-caninas', name: 'Peluquerías caninas (grooming)' },
      { id: 'tiendas-mascotas', name: 'Tiendas de mascotas' },
      { id: 'alimentos-accesorios', name: 'Alimentos y accesorios' },
      { id: 'pensiones-guarderias', name: 'Pensiones/guarderías para mascotas' },
      { id: 'adiestramiento', name: 'Adiestramiento' },
      { id: 'ambulancias-veterinarias', name: 'Ambulancias veterinarias' }
    ] 
  },
  { 
    id: 'servicios-ambientales', 
    name: 'Servicios Ambientales y Energía', 
    icon: 'Leaf', 
    subCategories: [
      { id: 'energia-solar', name: 'Energía solar' },
      { id: 'energia-eolica', name: 'Energía eólica' },
      { id: 'reciclaje', name: 'Reciclaje' },
      { id: 'gestion-residuos', name: 'Gestión de residuos' },
      { id: 'limpieza-industrial', name: 'Limpieza industrial' },
      { id: 'fumigacion', name: 'Fumigación' },
      { id: 'tratamiento-agua', name: 'Tratamiento de agua' }
    ] 
  },
  { 
    id: 'marketing-publicidad', 
    name: 'Marketing y Publicidad', 
    icon: 'Megaphone', 
    subCategories: [
      { id: 'publicidad', name: 'Publicidad' },
      { id: 'marketing-digital', name: 'Marketing digital' },
      { id: 'community-managers', name: 'Community managers' },
      { id: 'fotografia-comercial', name: 'Fotografía comercial' },
      { id: 'produccion-contenido', name: 'Producción de contenido' },
      { id: 'branding', name: 'Branding' },
      { id: 'desarrollo-web', name: 'Diseño y desarrollo web' },
	  { id: 'diseño-grafico', name: 'Diseño gráfico / Logos / banners' },
      { id: 'impresion-rotulacion', name: 'Impresión y rotulación' },
      { id: 'edicion-video', name: 'Edición de video' },
      { id: 'comunicacion', name: 'Radio / Televisión / Lives / Redes Sociales' },	  
      { id: 'motion-graphics', name: 'Motion graphics / Motion flyers' }
    ] 
  },
  { 
    id: 'eventos-celebraciones', 
    name: 'Eventos y Celebraciones', 
    icon: 'PartyPopper', 
    subCategories: [
      { id: 'organizacion-eventos', name: 'Organización de eventos' },
      { id: 'alquiler-mobiliario', name: 'Alquiler de mobiliario' },
      { id: 'sonido-iluminacion', name: 'Sonido e iluminación' },
      { id: 'djs', name: 'DJs' },
      { id: 'decoracion-eventos', name: 'Decoración' },
      { id: 'salones-eventos', name: 'Salones para eventos' },
      { id: 'catering', name: 'Catering' },
      { id: 'fotografia-eventos', name: 'Fotografía de eventos' }
    ] 
  },
  { 
    id: 'logistica-transporte', 
    name: 'Logística y Transporte', 
    icon: 'Truck', 
    subCategories: [
      { id: 'delivery', name: 'Delivery' },
      { id: 'mensajeria', name: 'Mensajería' },
      { id: 'mudanzas', name: 'Mudanzas' },
      { id: 'transporte-carga', name: 'Transporte de carga' },
      { id: 'transporte-privado', name: 'Transporte privado' },
      { id: 'taxis', name: 'Taxis' },
      { id: 'mototaxis', name: 'Mototaxis' },
      { id: 'transporte-escolar', name: 'Transporte escolar' },
      { id: 'alquiler-buses', name: 'Alquiler de buses' },
      { id: 'bodegas-almacenamiento', name: 'Bodegas y almacenamiento' },
      { id: 'courier-internacional', name: 'Courier internacional' },
      { id: 'gasolineras-starmart', name: 'Gasolineras y starmart' },	  
      { id: 'casilleros-virtuales', name: 'Casilleros virtuales (Miami, USA)' }
    ] 
  },
  { 
    id: 'servicios-financieros-legales', 
    name: 'Servicios Financieros y Legales', 
    icon: 'Landmark', 
    subCategories: [
      { id: 'bancos', name: 'Bancos' },
      { id: 'cooperativas', name: 'Cooperativas' },
      { id: 'microcreditos', name: 'Microcréditos' },
      { id: 'seguros', name: 'Seguros' },
      { id: 'contadores', name: 'Contadores' },
      { id: 'asesoria-fiscal', name: 'Asesoría fiscal' },
      { id: 'casas-cambio', name: 'Casas de cambio' },
      { id: 'pagos-digitales', name: 'Pagos digitales' },
      { id: 'abogados', name: 'Abogados' },
      { id: 'notarias', name: 'Notarías' },
      { id: 'consultoria-legal', name: 'Consultoría legal' },
      { id: 'mediacion-arbitraje', name: 'Mediación y arbitraje' }
    ] 
  },
  { 
    id: 'servicios-seguridad', 
    name: 'Servicios de Seguridad', 
    icon: 'ShieldCheck', 
    subCategories: [
      { id: 'seguridad-privada', name: 'Seguridad privada' },
      { id: 'alarmas-camaras', name: 'Alarmas y cámaras' },
      { id: 'guardias', name: 'Guardias' },
      { id: 'monitoreo', name: 'Monitoreo' },
      { id: 'control-accesos', name: 'Control de accesos' }
    ] 
  },
  { 
    id: 'turismo-hospitalidad', 
    name: 'Turismo y Hospitalidad', 
    icon: 'Palmtree', 
    subCategories: [
      { id: 'hoteles', name: 'Hoteles' },
      { id: 'hostales', name: 'Hostales' },
      { id: 'airbnb', name: 'Airbnb' },
      { id: 'tours', name: 'Tours' },
      { id: 'guias-turisticos', name: 'Guías turísticos' },
      { id: 'transporte-turistico', name: 'Transporte turístico' },
      { id: 'restaurantes-tematicos', name: 'Restaurantes temáticos' },
      { id: 'souvenirs', name: 'Souvenirs' }
    ] 
  }
];
