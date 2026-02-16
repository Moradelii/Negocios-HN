export enum BusinessStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected'
}

// 🔥 ACTUALIZADO: Solo un tier ahora - PLUS
export enum MembershipTier {
  PLUS = 'plus'
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
  owner?: string;
  dni?: string;
  email?: string;
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

export interface Review {
  id: string;
  businessId: string;
  userName: string;
  userEmail?: string;
  rating: number;
  comment: string;
  createdAt: string;
  helpful?: number;
}

export const CATEGORIES: Category[] = [
  { 
    id: 'agricultura-agroindustria', 
    name: 'Agricultura y Agroindustria', 
    icon: 'Sprout', 
    subCategories: [
      { id: 'agricultura-tradicional', name: 'Agricultura tradicional y sostenible' },
      { id: 'agroexportadoras', name: 'Agroexportadoras' },
      { id: 'alimentos-balanceados', name: 'Alimentos balanceados para peces/ganado' },
      { id: 'apicultura', name: 'Apicultura (miel, derivados)' },
      { id: 'avicultura', name: 'Avicultura' },
      { id: 'empacadoras-frutas', name: 'Empacadoras y Exportadoras de Frutas' },
      { id: 'exportadoras-agricolas', name: 'Exportadoras Agrícolas' },
      { id: 'ganaderia', name: 'Ganadería' },
      { id: 'insumos-agricolas', name: 'Insumos agrícolas (semillas, fertilizantes)' },
      { id: 'insumos-veterinarios', name: 'Insumos Veterinarios' },
      { id: 'maquinaria-agricola', name: 'Maquinaria y herramientas agrícolas' },
      { id: 'piscicultura-acuicultura', name: 'Piscicultura y Acuicultura' },
      { id: 'plantas-exoticas', name: 'Plantas Exóticas y Ornamentales' },
      { id: 'porcicultura', name: 'Porcicultura' },
      { id: 'procesadoras-alimentos', name: 'Procesadoras de Alimentos' },
      { id: 'produccion-organica', name: 'Producción Orgánica' },
      { id: 'venta-alevines', name: 'Venta de Alevines' },
      { id: 'venta-productos-campo', name: 'Venta directa de productos del campo' },
      { id: 'viveros-plantas', name: 'Viveros (plantas Frutales y Ornamentales)' }
    ] 
  },
  { 
    id: 'alimentacion-bebidas', 
    name: 'Alimentación y Bebidas', 
    icon: 'Utensils', 
    subCategories: [
      { id: 'cafeterias', name: 'Cafeterías' },
      { id: 'carnicerias-marisquerias', name: 'Carnicerías y marisquerías' },
      { id: 'catering-eventos', name: 'Catering y eventos' },
      { id: 'comidas-rapidas', name: 'Comidas rápidas' },
      { id: 'food-trucks', name: 'Food trucks' },
      { id: 'frutas-verduras', name: 'Frutas y Verduras' },
      { id: 'jugos-batidos', name: 'Jugos, batidos y smoothies' },
      { id: 'licorerias', name: 'Licorerías' },
      { id: 'pasteleria-panaderia', name: 'Pastelerías y panaderías' },
      { id: 'pulperias', name: 'Pulperías' },
      { id: 'restaurantes', name: 'Restaurantes' },
      { id: 'restaurantes-tematicos', name: 'Restaurantes temáticos' },
      { id: 'tiendas-abarrotes', name: 'Tiendas de abarrotes / minisúper' },
      { id: 'tiendas-saludables', name: 'Tiendas saludables / orgánicos' },
      { id: 'cafe-especializado', name: 'Vendedores de café especializado' }
    ] 
  },
  { 
    id: 'arte-cultura-entretenimiento', 
    name: 'Arte, Cultura y Entretenimiento', 
    icon: 'Palette', 
    subCategories: [
      { id: 'academias-arte-musica', name: 'Academias de arte y música' },
      { id: 'artistas-artesanos', name: 'Artistas plásticos y artesanos' },
      { id: 'cines', name: 'Cines' },
      { id: 'fotografia-videografia', name: 'Fotografía y videografía' },
      { id: 'librerias', name: 'Librerías' },
      { id: 'musicos-djs', name: 'Músicos y DJs' },
      { id: 'produccion-audiovisual', name: 'Producción audiovisual' },
      { id: 'teatros-espectaculos', name: 'Teatros y espectáculos' },
      { id: 'tiendas-instrumentos', name: 'Tiendas de instrumentos' }
    ] 
  },
  { 
    id: 'artesanias-emprendedores', 
    name: 'Artesanías y Emprendedores Locales', 
    icon: 'Hand', 
    subCategories: [
      { id: 'bisuteria', name: 'Bisutería' },
      { id: 'insumos-manualidades', name: 'Insumos para manualidades' },
      { id: 'jabones-artesanales', name: 'Jabones artesanales' },
      { id: 'manualidades', name: 'Manualidades' },
      { id: 'papeleria-creativa', name: 'Papelería creativa' },
      { id: 'productos-hechos-mano', name: 'Productos hechos a mano' },
      { id: 'regalos-personalizados', name: 'Regalos personalizados' },
      { id: 'sublimacion', name: 'Sublimación personalizada' },
      { id: 'velas-artesanales', name: 'Velas artesanales' }
    ] 
  },
  { 
    id: 'autos-motos-bicicletas', 
    name: 'Autos, Motos y Bicicletas', 
    icon: 'Car', 
    subCategories: [
      { id: 'autopartes-repuestos', name: 'Autopartes y repuestos' },
      { id: 'electricidad-automotriz', name: 'Electricidad automotriz' },
      { id: 'gruas-asistencia', name: 'Grúas y asistencia vial' },
      { id: 'lavado-planchado', name: 'Lavado y planchado' },
      { id: 'llantas-baterias', name: 'Llantas y baterías' },
      { id: 'talleres-mecanicos', name: 'Talleres mecánicos' },
      { id: 'venta-autos', name: 'Venta de autos nuevos/usados' },
      { id: 'venta-motos-bicicletas', name: 'Venta de motos y bicicletas' }
    ] 
  },
  { 
    id: 'bienes-raices-inmobiliaria', 
    name: 'Bienes Raíces e Inmobiliaria', 
    icon: 'Building', 
    subCategories: [
      { id: 'administracion-propiedades', name: 'Administración de propiedades' },
      { id: 'agentes-arrendamientos', name: 'Agentes de Arrendamientos' },
      { id: 'agentes-estado', name: 'Agentes de Estado (bienes nacionales)' },
      { id: 'avaluos', name: 'Avalúos' },
      { id: 'consultores-propiedad', name: 'Consultores de Propiedad' },
      { id: 'corredores-inmobiliarios', name: 'Corredores inmobiliarios' },
      { id: 'desarrollo-urbanistico', name: 'Desarrollo Urbanístico' },
      { id: 'desarrollos-residenciales', name: 'Desarrollos Residenciales' },
      { id: 'equipo-seguridad-incendios', name: 'Equipo de Seguridad contra Incendios' },
      { id: 'mudanzas-reubicacion', name: 'Mudanzas y Reubicación' },
      { id: 'propiedad-comercial', name: 'Propiedad Comercial' },
      { id: 'propiedad-extranjera', name: 'Propiedad Extranjera' },
      { id: 'renovaciones-propiedad', name: 'Renovaciones de Propiedad' },
      { id: 'seguridad-propiedad', name: 'Seguridad de Propiedad' },
      { id: 'subastas-propiedad', name: 'Subastas de Propiedad' },
      { id: 'venta-casas', name: 'Venta de casas' },
      { id: 'venta-alquiler-propiedades', name: 'Venta/alquiler de propiedades' }
    ] 
  },
  { 
    id: 'comercio-electronico', 
    name: 'Comercio Electrónico y Tiendas Online', 
    icon: 'ShoppingBag', 
    subCategories: [
      { id: 'dropshipping', name: 'Dropshipping' },
      { id: 'marketplaces', name: 'Marketplaces' },
      { id: 'productos-digitales', name: 'Productos digitales' },
      { id: 'envios-ecommerce', name: 'Servicios de envíos para ecommerce' },
      { id: 'tiendas-online', name: 'Tiendas online' }
    ] 
  },
  { 
    id: 'compras-retail', 
    name: 'Compras y Retail', 
    icon: 'ShoppingCart', 
    subCategories: [
      { id: 'boutiques', name: 'Boutiques' },
      { id: 'centros-comerciales', name: 'Centros comerciales' },
      { id: 'cosmeticos', name: 'Cosméticos y belleza' },
      { id: 'deportes', name: 'Deportes' },
      { id: 'electrodomesticos', name: 'Electrodomésticos' },
      { id: 'ferreterias', name: 'Ferreterías' },
      { id: 'joyerias', name: 'Joyerías' },
      { id: 'jugueterias', name: 'Jugueterías' },
      { id: 'libreria-papeleria', name: 'Librerías y papelería' },
      { id: 'muebles-decoracion', name: 'Muebles y decoración' },
      { id: 'opticas', name: 'Ópticas' },
      { id: 'perfumerias', name: 'Perfumerías' },
      { id: 'relojerias', name: 'Relojerías' },
      { id: 'supermercados', name: 'Supermercados' },
      { id: 'tiendas-departamento', name: 'Tiendas por departamento' },
      { id: 'zapaterias', name: 'Zapaterías' }
    ] 
  },
  { 
    id: 'construccion-remodelacion', 
    name: 'Construcción y Remodelación', 
    icon: 'HardHat', 
    subCategories: [
      { id: 'albanileria', name: 'Albañilería' },
      { id: 'arquitectura', name: 'Arquitectura' },
      { id: 'carpinteria', name: 'Carpintería' },
      { id: 'diseno-interiores', name: 'Diseño de interiores' },
      { id: 'electricidad', name: 'Electricidad' },
      { id: 'herreria', name: 'Herrería' },
      { id: 'ingenieria-civil', name: 'Ingeniería civil' },
      { id: 'jardineria-paisajismo', name: 'Jardinería y paisajismo' },
      { id: 'materiales-construccion', name: 'Materiales de construcción' },
      { id: 'pintura', name: 'Pintura' },
      { id: 'plomeria', name: 'Plomería' },
      { id: 'soldadura', name: 'Soldadura' },
      { id: 'vidrios-aluminios', name: 'Vidrios y aluminios' }
    ] 
  },
  { 
    id: 'deportes-fitness', 
    name: 'Deportes y Fitness', 
    icon: 'Dumbbell', 
    subCategories: [
      { id: 'entrenadores-personales', name: 'Entrenadores personales' },
      { id: 'gimnasios', name: 'Gimnasios' },
      { id: 'nutricion-deportiva', name: 'Nutrición deportiva' },
      { id: 'tiendas-deportes', name: 'Tiendas de deportes' },
      { id: 'yoga-pilates', name: 'Yoga y Pilates' }
    ] 
  },
  { 
    id: 'educacion-capacitacion', 
    name: 'Educación y Capacitación', 
    icon: 'GraduationCap', 
    subCategories: [
      { id: 'academias-idiomas', name: 'Academias de idiomas' },
      { id: 'centros-capacitacion', name: 'Centros de capacitación técnica' },
      { id: 'clases-particulares', name: 'Clases particulares' },
      { id: 'colegios', name: 'Colegios' },
      { id: 'cursos-online', name: 'Cursos online' },
      { id: 'guarderias', name: 'Guarderías' },
      { id: 'universidades', name: 'Universidades' }
    ] 
  },
  { 
    id: 'entretenimiento-eventos', 
    name: 'Entretenimiento y Eventos', 
    icon: 'PartyPopper', 
    subCategories: [
      { id: 'animadores', name: 'Animadores' },
      { id: 'bares', name: 'Bares y discotecas' },
      { id: 'bowling', name: 'Bowling' },
      { id: 'cines', name: 'Cines' },
      { id: 'organizacion-eventos', name: 'Organización de eventos' },
      { id: 'parques-diversion', name: 'Parques de diversión' },
      { id: 'salones-fiestas', name: 'Salones de fiestas' }
    ] 
  },
  { 
    id: 'hogar-decoracion', 
    name: 'Hogar y Decoración', 
    icon: 'Home', 
    subCategories: [
      { id: 'alfombras-cortinas', name: 'Alfombras y cortinas' },
      { id: 'antiguedades', name: 'Antigüedades' },
      { id: 'electrodomesticos', name: 'Electrodomésticos' },
      { id: 'iluminacion', name: 'Iluminación' },
      { id: 'menaje-hogar', name: 'Menaje del hogar' },
      { id: 'muebles', name: 'Muebles' },
      { id: 'plantas-decoracion', name: 'Plantas de decoración' },
      { id: 'tapiceria', name: 'Tapicería' }
    ] 
  },
  { 
    id: 'mascotas', 
    name: 'Mascotas', 
    icon: 'Leaf', 
    subCategories: [
      { id: 'adiestramiento', name: 'Adiestramiento' },
      { id: 'alimentos-accesorios', name: 'Alimentos y accesorios' },
      { id: 'estetica-canina', name: 'Estética canina' },
      { id: 'guarderias', name: 'Guarderías' },
      { id: 'tiendas-mascotas', name: 'Tiendas de mascotas' },
      { id: 'veterinarias', name: 'Veterinarias' }
    ] 
  },
  { 
    id: 'moda-belleza', 
    name: 'Moda y Belleza', 
    icon: 'Sparkles', 
    subCategories: [
      { id: 'barberia', name: 'Barberías' },
      { id: 'boutiques', name: 'Boutiques' },
      { id: 'cosmetologia', name: 'Cosmetología' },
      { id: 'maquillaje', name: 'Maquillaje profesional' },
      { id: 'peluquerias', name: 'Peluquerías' },
      { id: 'salones-belleza', name: 'Salones de belleza' },
      { id: 'spa-masajes', name: 'Spa y masajes' },
      { id: 'tatuajes-piercings', name: 'Tatuajes y piercings' },
      { id: 'tiendas-ropa', name: 'Tiendas de ropa' },
      { id: 'unas', name: 'Uñas' }
    ] 
  },
  { 
    id: 'publicidad-marketing', 
    name: 'Publicidad y Marketing', 
    icon: 'Megaphone', 
    subCategories: [
      { id: 'agencias-marketing', name: 'Agencias de marketing' },
      { id: 'community-managers', name: 'Community managers' },
      { id: 'diseno-grafico', name: 'Diseño gráfico' },
      { id: 'diseno-logos-flyers', name: 'Diseño de Logos, Flyers, Motion Flyers, Banners' },
      { id: 'diseno-web', name: 'Diseño y Desarrollo Web' },      
      { id: 'fotografia-producto', name: 'Fotografía de producto' },
      { id: 'imprentas', name: 'Imprentas' },
      { id: 'publicidad-exterior', name: 'Publicidad exterior' },
      { id: 'rotulacion', name: 'Rotulación' },
      { id: 'video-marketing', name: 'Video marketing' }
    ] 
  },
  { 
    id: 'salud-bienestar', 
    name: 'Salud y Bienestar', 
    icon: 'HeartPulse', 
    subCategories: [
      { id: 'clinicas-dentales', name: 'Clínicas dentales' },
      { id: 'clinicas-medicas', name: 'Clínicas médicas' },
      { id: 'farmacias', name: 'Farmacias' },
      { id: 'fisioterapia', name: 'Fisioterapia' },
      { id: 'hospitales', name: 'Hospitales' },
      { id: 'laboratorios', name: 'Laboratorios clínicos' },
      { id: 'medicina-alternativa', name: 'Medicina alternativa' },
      { id: 'nutricion', name: 'Nutrición' },
      { id: 'opticas', name: 'Ópticas' },
      { id: 'psicologia', name: 'Psicología' }
    ] 
  },
  { 
    id: 'servicios-empresariales', 
    name: 'Servicios Empresariales', 
    icon: 'Briefcase', 
    subCategories: [
      { id: 'consultores', name: 'Consultores' },
      { id: 'consultores-seguridad', name: 'Consultores de Seguridad Contra Incendios' },
      { id: 'corredores-negocios', name: 'Corredores de Negocios' },
      { id: 'equipos-limpieza', name: 'Equipos y Servicios de Limpieza' },
      { id: 'estudios-impresion', name: 'Estudios de Impresión' },
      { id: 'estudios-mercado', name: 'Estudios de Mercado' },
      { id: 'estudios-publicidad', name: 'Estudios de Publicidad' },
      { id: 'formacion-empresarial', name: 'Formación Empresarial' },
      { id: 'negocios-extranjero', name: 'Negocios en el Extranjero' },
      { id: 'pequeno-negocio', name: 'Pequeño Negocio' },
      { id: 'recursos-humanos', name: 'Recursos Humanos' },
      { id: 'relaciones-publicas', name: 'Relaciones Públicas' },
      { id: 'salud-seguridad-laboral', name: 'Salud y Seguridad Laboral' },
      { id: 'servicio-secretariado', name: 'Servicio de Secretariado' },
      { id: 'servicio-tintoreria', name: 'Servicio de Tintorería' },
      { id: 'servicios-seguridad', name: 'Servicios de Seguridad' },
      { id: 'servicios-venta-menor', name: 'Servicios de Venta al Por Menor' },
      { id: 'subastador', name: 'Subastador' },
      { id: 'subcontratacion-ventas', name: 'Subcontratación de Ventas' }
    ] 
  },
  { 
    id: 'servicios-seguridad', 
    name: 'Servicios de Seguridad', 
    icon: 'ShieldCheck', 
    subCategories: [
      { id: 'alarmas-camaras', name: 'Alarmas y cámaras' },
      { id: 'control-accesos', name: 'Control de accesos' },
      { id: 'guardias', name: 'Guardias' },
      { id: 'monitoreo', name: 'Monitoreo' },
      { id: 'seguridad-privada', name: 'Seguridad privada' }
    ] 
  },
  { 
    id: 'servicios-domesticos', 
    name: 'Servicios Domésticos', 
    icon: 'Home', 
    subCategories: [
      { id: 'cuidado-adultos', name: 'Cuidado de adultos mayores' },
      { id: 'instalaciones', name: 'Instalaciones' },
      { id: 'lavanderia', name: 'Lavandería' },
      { id: 'limpieza-casas', name: 'Limpieza de casas' },
      { id: 'nineras', name: 'Niñeras' },
      { id: 'reparaciones-hogar', name: 'Reparaciones del hogar' },
      { id: 'tecnicos-varios', name: 'Técnicos varios' }
    ] 
  },
  { 
    id: 'servicios-financieros', 
    name: 'Servicios Financieros', 
    icon: 'Landmark', 
    subCategories: [
      { id: 'asesoria-fiscal', name: 'Asesoría fiscal' },
      { id: 'bancos', name: 'Bancos' },
      { id: 'casas-cambio', name: 'Casas de cambio' },
      { id: 'contadores', name: 'Contadores' },
      { id: 'cooperativas', name: 'Cooperativas' },
      { id: 'microcreditos', name: 'Microcréditos' },
      { id: 'pagos-digitales', name: 'Pagos digitales' },
      { id: 'seguros', name: 'Seguros' }
    ] 
  },
  { 
    id: 'servicios-legales', 
    name: 'Servicios Legales', 
    icon: 'Gavel', 
    subCategories: [
      { id: 'abogados', name: 'Abogados' },
      { id: 'consultoria-legal', name: 'Consultoría legal' },
      { id: 'mediacion-arbitraje', name: 'Mediación y arbitraje' },
      { id: 'notarias', name: 'Notarías' }
    ] 
  },
  { 
    id: 'servicios-profesionales', 
    name: 'Servicios Profesionales y Freelancers', 
    icon: 'User', 
    subCategories: [
      { id: 'asistentes-virtuales', name: 'Asistentes virtuales' },
      { id: 'coaches', name: 'Coaches' },
      { id: 'consultores', name: 'Consultores' },
      { id: 'disenadores', name: 'Diseñadores' },
      { id: 'programadores', name: 'Programadores' },
      { id: 'recursos-humanos', name: 'Recursos humanos' },
      { id: 'redaccion', name: 'Redacción' },
      { id: 'traduccion', name: 'Traducción' }
    ] 
  },
  { 
    id: 'tecnologia-electronica', 
    name: 'Tecnología, Electrónica e Informática', 
    icon: 'Cpu', 
    subCategories: [
      { id: 'alojamiento-web', name: 'Alojamiento Web' },
      { id: 'aplicaciones-software', name: 'Aplicaciones de Software' },
      { id: 'ciberseguridad', name: 'Ciberseguridad' },
      { id: 'comunicaciones', name: 'Comunicaciones' },
      { id: 'consumibles-informaticos', name: 'Consumibles Informáticos' },
      { id: 'desarrollo-software', name: 'Desarrollo de software' },
      { id: 'formacion-informatica', name: 'Formación Informática' },
      { id: 'hardware-informatico', name: 'Hardware Informático' },
      { id: 'informacion-tecnologica', name: 'Información Tecnológica' },
      { id: 'informacion-tecnologica', name: 'Venta de Celulares y Accesorios' },      
      { id: 'reparacion-celulares', name: 'Reparación de Celulares' },
      { id: 'reparacion-computadoras', name: 'Reparación de Computadoras e Impresoras' },
      { id: 'internet-redes', name: 'Servicios de internet y redes' },
      { id: 'servicios-informaticos', name: 'Servicios Informáticos' },
      { id: 'servicios-web', name: 'Servicios Web' },
      { id: 'soporte-tecnico', name: 'Soporte Técnico' },
      { id: 'tiendas-tecnologia', name: 'Tiendas de Tecnología' },
      { id: 'venta-accesorios', name: 'Venta de Accesorios' },
      { id: 'insumos-plotters', name: 'Venta de insumos para Plotters' }
    ] 
  },
  { 
    id: 'transporte-logistica', 
    name: 'Transporte, Autos, Logística', 
    icon: 'Truck', 
    subCategories: [
      { id: 'aeropuertos-servicios', name: 'Aeropuertos y Servicios' },
      { id: 'agencias-viaje', name: 'Agencias de Viaje' },
      { id: 'agentes-transportes', name: 'Agentes de Transportes' },
      { id: 'agentes-maritimos', name: 'Agentes Marítimos y Portuarios' },
      { id: 'auto-partes', name: 'Auto Partes Accesorios' },
      { id: 'bicicletas', name: 'Bicicletas (tiendas especializadas)' },
      { id: 'delivery', name: 'Delivery' },
      { id: 'escuelas-conducir', name: 'Escuelas de Conducir' },
      { id: 'fabricantes-vehiculos', name: 'Fabricantes de Vehículos' },
      { id: 'gasolineras', name: 'Gasolineras' },
      { id: 'logistica-transporte', name: 'Logística de Transporte' },
      { id: 'motos', name: 'Motos (tiendas especializadas)' },
      { id: 'mototaxis', name: 'Mototaxis' },
      { id: 'mudanzas', name: 'Mudanzas' },
      { id: 'renta-autos', name: 'Renta de Autos' },
      { id: 'renta-buses', name: 'Renta de buses' },
      { id: 'servicio-paqueteria', name: 'Servicio de Paquetería' },
      { id: 'servicio-vehiculos', name: 'Servicio de Vehículos Especializado' },
      { id: 'servicios-mensajeria', name: 'Servicios de Mensajería' },
      { id: 'taxis', name: 'Taxis' },
      { id: 'transporte-aereo', name: 'Transporte Aéreo de Carga' },
      { id: 'transporte-carga', name: 'Transporte de carga' },
      { id: 'transporte-pasajeros', name: 'Transporte de Pasajeros' },
      { id: 'transporte-escolar', name: 'Transporte escolar' },
      { id: 'transporte-privado', name: 'Transporte privado' },
      { id: 'venta-vehiculos', name: 'Venta de Vehículos (concesionarios)' }
    ] 
  },
  { 
    id: 'turismo-alojamiento', 
    name: 'Turismo y Alojamiento', 
    icon: 'Palmtree', 
    subCategories: [
      { id: 'agencias-visa', name: 'Agencias tramites de Visa' },
      { id: 'agentes-viaje', name: 'Agentes de Viaje' },
      { id: 'alquiler-alojamiento', name: 'Alquiler de Alojamiento' },
      { id: 'apartamentos-turisticos', name: 'Apartamentos Turísticos' },
      { id: 'atracciones-turisticas', name: 'Atracciones Turísticas' },
      { id: 'camping-caravanas', name: 'Camping y Caravanas' },
      { id: 'casa-familia', name: 'Casa de Familia' },
      { id: 'casas-rurales', name: 'Casa Rurales / Cabañas' },
      { id: 'casas-huespedes', name: 'Casas de Huéspedes' },
      { id: 'casas-vacaciones', name: 'Casas de Vacaciones / Airbnb' },
      { id: 'equipo-hotel', name: 'Equipo de Hotel y Motel' },
      { id: 'excursiones', name: 'Excursiones' },
      { id: 'guias-turisticos', name: 'Guías turísticos' },
      { id: 'hostales', name: 'Hostales' },
      { id: 'hoteles', name: 'Hoteles' },
      { id: 'moteles', name: 'Moteles' },
      { id: 'informacion-turistica', name: 'Información Turística' },
      { id: 'lugares-visitar', name: 'Lugares para Visitar' },
      { id: 'operadores-turisticos', name: 'Operadores Turísticos' },
      { id: 'servicio-traducciones', name: 'Servicio de Traducciones' },
      { id: 'souvenirs', name: 'Souvenirs' },
      { id: 'tours', name: 'Tours' },
      { id: 'transporte-turistico', name: 'Transporte turístico' },
      { id: 'turismo-local', name: 'Turismo Local' }
]; 

