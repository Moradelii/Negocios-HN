export enum BusinessStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected'
}

export enum MembershipTier {
  LITE = 'lite',
  PLUS = 'plus',
  PRO = 'pro'
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
    id: 'comercio-electronico', 
    name: 'Comercio Electrónico', 
    icon: 'ShoppingBag', 
    subCategories: [
      { id: 'tiendas-online', name: 'Tiendas online' },
      { id: 'marketplace', name: 'Marketplace' },
      { id: 'plataformas-digitales', name: 'Plataformas de productos digitales' },
      { id: 'productos-locales', name: 'Vendedores de productos locales' }
    ] 
  },
  { 
    id: 'alimentacion-bebidas', 
    name: 'Alimentación y Bebidas', 
    icon: 'Utensils', 
    subCategories: [
      { id: 'restaurantes-cafes', name: 'Restaurantes y cafeterías' },
      { id: 'comida-rapida', name: 'Comida rápida' },
      { id: 'pasteleria-panaderia', name: 'Pastelerías y panaderías' },
      { id: 'food-trucks', name: 'Food trucks' },
      { id: 'catering-eventos', name: 'Catering y eventos' },
      { id: 'productos-organicos', name: 'Tiendas de productos orgánicos' },
      { id: 'alimentos-saludables', name: 'Tiendas de alimentos saludables' },
      { id: 'jugos-batidos', name: 'Jugos naturales y batidos' },
      { id: 'cafe-especializado', name: 'Vendedores de café especializado' }
    ] 
  },
  { 
    id: 'tecnologia-electronica', 
    name: 'Tecnología y Electrónica', 
    icon: 'Cpu', 
    subCategories: [
      { id: 'venta-compus', name: 'Venta de computadoras, laptops y accesorios' },
      { id: 'reparacion-tech', name: 'Servicios de reparación de tecnología' },
      { id: 'moviles-accesorios', name: 'Venta de teléfonos móviles y accesorios' },
      { id: 'gadgets', name: 'Tiendas de gadgets y dispositivos electrónicos' },
      { id: 'software', name: 'Desarrollo de software' },
      { id: 'apps', name: 'Aplicaciones móviles' },
      { id: 'ciberseguridad', name: 'Servicios de ciberseguridad' }
    ] 
  },
  { 
    id: 'salud-bienestar', 
    name: 'Salud y Bienestar', 
    icon: 'HeartPulse', 
    subCategories: [
      { id: 'hospitales', name: 'Hospitales' },
      { id: 'farmacias', name: 'Farmacias, medicamentos' },
      { id: 'clinicas-medicas', name: 'Clínicas médicas' },
      { id: 'clinicas-dentales', name: 'Clínicas dentales' },
      { id: 'psicologos', name: 'Psicólogos y terapeutas' },
      { id: 'nutricionistas', name: 'Nutricionistas y dietistas' },
      { id: 'gimnasios-entrenadores', name: 'Gimnasios y entrenadores personales' },
      { id: 'bienestar-spa', name: 'Centros de bienestar y spa' },
      { id: 'suplementos', name: 'Tiendas de suplementos alimenticios' },
      { id: 'estetica-belleza', name: 'Centros de estética y belleza' }
    ] 
  },
  { 
    id: 'moda-ropa', 
    name: 'Moda y Ropa', 
    icon: 'Shirt', 
    subCategories: [
      { id: 'ropa-generica', name: 'Tiendas de ropa masculina, femenina e infantil' },
      { id: 'segunda-mano', name: 'Moda de segunda mano' },
      { id: 'zapaterias', name: 'Zapaterías' },
      { id: 'accesorios', name: 'Accesorios (joyas, relojes, bolsos)' },
      { id: 'marcas-locales', name: 'Diseñadores y marcas locales' },
      { id: 'sastreria', name: 'Sastrería y alteraciones' },
      { id: 'ropa-deportiva', name: 'Venta de ropa deportiva' }
    ] 
  },
  { 
    id: 'hogar-decoracion', 
    name: 'Hogar y Decoración', 
    icon: 'Home', 
    subCategories: [
      { id: 'muebles-decor', name: 'Muebles y artículos de decoración' },
      { id: 'diseno-interiores', name: 'Diseño de interiores' },
      { id: 'pinturas-construccion', name: 'Pinturas y materiales de construcción' },
      { id: 'articulos-hogar', name: 'Tiendas de artículos para el hogar' },
      { id: 'remodelacion', name: 'Proyectos de remodelación' },
      { id: 'jardineria', name: 'Jardinería y paisajismo' },
      { id: 'mascotas', name: 'Artículos para mascotas' },
      { id: 'electrodomesticos', name: 'Tiendas de electrodomésticos' }
    ] 
  },
  { 
    id: 'educacion-formacion', 
    name: 'Educación y Formación', 
    icon: 'GraduationCap', 
    subCategories: [
      { id: 'inst-educativas', name: 'Instituciones educativas (colegios, universidades)' },
      { id: 'academias-idiomas', name: 'Academias de idiomas' },
      { id: 'cursos-online', name: 'Cursos online' },
      { id: 'clases-particulares', name: 'Clases particulares (matemáticas, idiomas, música.)' },
      { id: 'entrenadores-coaches', name: 'Entrenadores y coaches' },
      { id: 'talleres-emprendedores', name: 'Talleres y capacitaciones para emprendedores' },
      { id: 'consultoria-educacion', name: 'Consultorías en educación' },
      { id: 'guarderias', name: 'Guarderías y preescolares' }
    ] 
  },
  { 
    id: 'turismo-ocio', 
    name: 'Turismo y Ocio', 
    icon: 'Palmtree', 
    subCategories: [
      { id: 'agencias-viajes', name: 'Agencias de viajes' },
      { id: 'hoteles-hospedaje', name: 'Hoteles y hospedaje' },
      { id: 'excursiones', name: 'Excursiones y actividades turísticas' },
      { id: 'transporte-turistico', name: 'Transporte turístico' },
      { id: 'bares-tematicos', name: 'Restaurantes y bares temáticos' },
      { id: 'guias-turisticos', name: 'Guías turísticos' },
      { id: 'alquiler-vehiculos', name: 'Alquiler de vehículos (autos, motos, bicicletas)' },
      { id: 'souvenirs', name: 'Tiendas de souvenirs' }
    ] 
  },
  { 
    id: 'servicios-financieros-legales', 
    name: 'Servicios Financieros y Legales', 
    icon: 'Landmark', 
    subCategories: [
      { id: 'asesoria-contable', name: 'Asesoría contable y fiscal' },
      { id: 'consultoria-legal', name: 'Consultoría legal' },
      { id: 'seguros', name: 'Seguros y agentes de seguros' },
      { id: 'prestamos', name: 'Préstamos personales y microcréditos' },
      { id: 'asesoria-inversiones', name: 'Asesoría en inversiones y ahorro' },
      { id: 'notarias', name: 'Notarías' },
      { id: 'abogados', name: 'Abogados especializados' },
      { id: 'bienes-raices', name: 'Corredores de bienes raíces' }
    ] 
  },
  { 
    id: 'arte-entretenimiento', 
    name: 'Arte y Entretenimiento', 
    icon: 'Palette', 
    subCategories: [
      { id: 'artistas-plasticos', name: 'Artistas plásticos y escultores' },
      { id: 'musicos-locales', name: 'Músicos y grupos locales' },
      { id: 'foto-video', name: 'Fotografía y videografía' },
      { id: 'diseno-grafico', name: 'Servicios de diseño gráfico' },
      { id: 'eventos-culturales', name: 'Organizaciones y eventos culturales' },
      { id: 'teatros', name: 'Teatros y presentaciones' },
      { id: 'instrumentos', name: 'Tiendas de música e instrumentos' },
      { id: 'bibliotecas-librerias', name: 'Bibliotecas y librerías' }
    ] 
  },
  { 
    id: 'construccion-bienes-raices', 
    name: 'Construcción y Bienes Raíces', 
    icon: 'Hammer', 
    subCategories: [
      { id: 'constructoras', name: 'Empresas constructoras' },
      { id: 'proyectos-inmobiliarios', name: 'Proyectos inmobiliarios' },
      { id: 'agentes-inmobiliarios', name: 'Agentes inmobiliarios' },
      { id: 'venta-propiedades', name: 'Venta de terrenos y propiedades' },
      { id: 'reformas', name: 'Remodelaciones y reformas' },
      { id: 'arquitectos-ingenieros', name: 'Servicios de arquitectos e ingenieros' },
      { id: 'alquiler-propiedades', name: 'Alquiler de propiedades' }
    ] 
  },
  { 
    id: 'automotriz', 
    name: 'Automotriz', 
    icon: 'Car', 
    subCategories: [
      { id: 'talleres-mecanicos', name: 'Talleres mecánicos y de reparación' },
      { id: 'venta-autos', name: 'Venta de autos nuevos y usados' },
      { id: 'alquiler-autos', name: 'Alquiler de vehículos' },
      { id: 'autopartes', name: 'Servicios de autopartes y accesorios' },
      { id: 'gasolineras', name: 'Estaciones de servicio (gasolineras)' },
      { id: 'neumaticos-llantas', name: 'Reparación de neumáticos, Llantas y baterías' },
      { id: 'repuestos', name: 'Venta de repuestos' }
    ] 
  },
  { 
    id: 'servicios-profesionales', 
    name: 'Servicios Profesionales', 
    icon: 'Briefcase', 
    subCategories: [
      { id: 'consultorias-estrategicas', name: 'Consultorías (estratégica, tecnológica, marketing)' },
      { id: 'diseno-web', name: 'Diseño y desarrollo Web' },
      { id: 'diseno-grafico-prof', name: 'Diseño Gráfico' },
      { id: 'foto-profesional', name: 'Fotografía profesional' },
      { id: 'traduccion', name: 'Traducción e interpretación' },
      { id: 'marketing-digital', name: 'Servicios de marketing digital' },
      { id: 'contenido', name: 'Creación de contenido' },
      { id: 'rrhh', name: 'Asesoría en recursos humanos' }
    ] 
  },
  { 
    id: 'servicios-entretenimiento-eventos', 
    name: 'Servicios de Entretenimiento y Eventos', 
    icon: 'PartyPopper', 
    subCategories: [
      { id: 'organizacion-bodas', name: 'Organización de eventos y bodas' },
      { id: 'alquiler-audiovisual', name: 'Alquiler de equipo de sonido y audiovisuales' },
      { id: 'discotecas-bares', name: 'Discotecas y bares' },
      { id: 'comediantes-actores', name: 'Comediantes y actores' },
      { id: 'djs-artistas', name: 'DJs y artistas de entretenimiento' },
      { id: 'alquiler-espacios', name: 'Alquiler de espacios para eventos' }
    ] 
  },
  { 
    id: 'servicios-comunicacion', 
    name: 'Servicios de Comunicación', 
    icon: 'Megaphone', 
    subCategories: [
      { id: 'publicidad-marketing', name: 'Agencia de publicidad y marketing' },
      { id: 'relaciones-publicas', name: 'Relaciones públicas' },
      { id: 'comunicacion-corp', name: 'Servicios de comunicación corporativa' },
      { id: 'influencers', name: 'Marketing de influencia' },
      { id: 'contenido-digital', name: 'Creación de contenido digital' }
    ] 
  },
  { 
    id: 'servicios-logistica-transporte', 
    name: 'Servicios de Logística y Transporte', 
    icon: 'Truck', 
    subCategories: [
      { id: 'mensajeria', name: 'Empresas de mensajería' },
      { id: 'transporte-carga', name: 'Transporte de carga' },
      { id: 'mudanzas', name: 'Empresas de mudanzas' },
      { id: 'transporte-publico', name: 'Servicios de transporte público' },
      { id: 'delivery', name: 'Empresas de entrega rápida (delivery)' },
      { id: 'alquiler-transporte', name: 'Alquiler de transporte' }
    ] 
  },
  { 
    id: 'emprendedores-startups', 
    name: 'Emprendedores y Startups', 
    icon: 'Rocket', 
    subCategories: [
      { id: 'tech-startup', name: 'Negocios de tecnología' },
      { id: 'eco-startup', name: 'Tiendas de productos ecológicos' },
      { id: 'energias-renovables', name: 'Empresas de energías renovables' },
      { id: 'emprendedores-sociales', name: 'Emprendedores sociales' },
      { id: 'fintech', name: 'Startups en el sector financiero' },
      { id: 'crowdfunding', name: 'Plataformas de crowdfunding' },
      { id: 'marcas-moda-startup', name: 'Nuevas marcas de moda' }
    ] 
  },
  { 
    id: 'agricultura-agroindustria', 
    name: 'Agricultura y Agroindustria', 
    icon: 'Sprout', 
    subCategories: [
      { id: 'agri-sostenible', name: 'Agricultura sostenible' },
      { id: 'alimentos-organicos-agri', name: 'Empresas de producción de alimentos orgánicos' },
      { id: 'venta-agricola', name: 'Venta de productos agrícolas' },
      { id: 'ganaderia-agri', name: 'Ganadería' },
      { id: 'suministros-agricolas', name: 'Tiendas de suministros agrícolas' },
      { id: 'procesadoras-alimentos', name: 'Procesadoras de alimentos' },
      { id: 'productos-agricultura', name: 'Tiendas de productos para la agricultura' }
    ] 
  },
  { 
    id: 'servicios-ambientales-ecologicos', 
    name: 'Servicios Ambientales y Ecológicos', 
    icon: 'Leaf', 
    subCategories: [
      { id: 'reciclaje', name: 'Reciclaje y gestión de residuos' },
      { id: 'limpieza', name: 'Empresas de limpieza' },
      { id: 'energia-limpia', name: 'Energía solar y eólica' },
      { id: 'consultoria-ambiental', name: 'Consultoría ambiental' },
      { id: 'productos-ecologicos', name: 'Tiendas de productos ecológicos' },
      { id: 'agri-sostenible-serv', name: 'Agricultura sostenible' }
    ] 
  },
  { 
    id: 'servicios-seguridad', 
    name: 'Servicios de Seguridad', 
    icon: 'ShieldCheck', 
    subCategories: [
      { id: 'seguridad-privada', name: 'Empresas de seguridad privada' },
      { id: 'alarmas-camaras', name: 'Instalación de alarmas y cámaras' },
      { id: 'patrullaje', name: 'Servicios de patrullaje' },
      { id: 'consultoria-seguridad', name: 'Consultorías en seguridad' },
      { id: 'proteccion-eventos', name: 'Protección de eventos' }
    ] 
  },
  { 
    id: 'deportes-recreacion', 
    name: 'Deportes y Recreación', 
    icon: 'Dumbbell', 
    subCategories: [
      { id: 'gimnasios-deportes', name: 'Centros deportivos y gimnasios' },
      { id: 'personal-trainer', name: 'Entrenadores personales' },
      { id: 'articulos-deportivos', name: 'Venta de artículos deportivos' },
      { id: 'recreacion', name: 'Actividades recreativas (senderismo, ciclismo)' },
      { id: 'academias-deportes', name: 'Academias de deportes (fútbol, baloncesto)' }
    ] 
  }
];
