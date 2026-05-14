import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/index'

// Componentes modulares
import HomeHero from '../../components/home/HomeHero'
import StatsSection from '../../components/home/StatsSection'
import BusinessSections from '../../components/home/BusinessSections'
import ProductsHighlight from '../../components/home/ProductsHighlight'
import TestimonialsSection from '../../components/home/TestimonialsSection'
import NosotrosSection from '../../components/home/NosotrosSection'
import FAQSection from '../../components/home/FAQSection'
import ContactSection from '../../components/home/ContactSection'
import WhatsAppButton from '../../components/home/WhatsAppButton'

// Valores por defecto
const DEFAULTS = {
  heroTitulo:       'Moda que te define, tecnología que te conecta.',
  heroSubtitulo:    'Descubre el equilibrio perfecto entre estilo personal y soluciones tecnológicas de vanguardia.',
  statAnios:        10,
  statReparaciones: 5000,
  statTiendas:      2,
  statSatisfaccion: 98,
  nosotrosTitulo:   'Un negocio familiar con corazón tico',
  nosotrosTexto1:   'OmniHub T&K nació de la unión de dos emprendimientos locales en San José: Tienda Doña Tere y K.M.A. Conexiones.',
  nosotrosTexto2:   'Creemos en la atención cercana, en los precios justos y en que cada cliente merece irse satisfecho.',
  testimonios: [
    { nombre: 'María L.',   inicial: 'M', color: 'bg-rose-500',   texto: 'Encontré ropa preciosa para mis hijos en Tienda Doña Tere. Precios súper accesibles.', estrellas: 5 },
    { nombre: 'Carlos R.',  inicial: 'C', color: 'bg-blue-500',   texto: 'Me repararon el celular en K.M.A. en tiempo récord. Servicio técnico de primera.', estrellas: 5 },
  ],
  faqs: [
    { p: '¿Qué dispositivos reparan?', r: 'Reparamos celulares, tablets, laptops y accesorios de todas las marcas principales.' },
    { p: '¿Tienen garantía?', r: 'Sí, todas nuestras reparaciones y productos cuentan con garantía oficial de OmniHub.' },
  ],
  horario: [
    { dia: 'Lun – Vie', hora: '8:00 am – 6:00 pm' },
    { dia: 'Sábado',    hora: '8:00 am – 4:00 pm' },
    { dia: 'Domingo',   hora: 'Cerrado' },
  ],
  whatsapp:       '50600000000',
  direccionTexto: 'San José, Costa Rica',
  mostrarTestimonios: true,
}

export default function HomePage() {
  // 1. Fetch de Configuración con Auto-Refetch (Polling cada 30s)
  const { data: configData } = useQuery({
    queryKey: ['homeConfig'],
    queryFn: async () => {
      const r = await publicApi.homeConfig()
      return r.data?.data || {}
    },
    refetchInterval: 30000, // Polling automático (reemplaza el setInterval)
    initialData: DEFAULTS,  // Evita parpadeos mientras carga
  })

  // Mezclamos la info de la BD con los Defaults
  const config = { ...DEFAULTS, ...configData }

  // 2. Fetch de Productos Destacados
  const { data: productos = [], isLoading: cargando } = useQuery({
    queryKey: ['homeProductosDestacados'],
    queryFn: async () => {
      const r = await publicApi.catalogo({ limit: 8 })
      const lista = r.data?.data || []
      return lista.filter(p => p.disponible).slice(0, 4)
    },
    refetchInterval: 30000,
  })

  return (
    <div className="bg-[#fcfcfd] min-h-screen selection:bg-blue-500/30">
      
      {/* Hero: Moda + Tecnología */}
      <HomeHero config={config} />

      {/* Stats: Impacto Real */}
      <StatsSection config={config} />

      {/* Secciones de Negocio: Dualismo Premium */}
      <BusinessSections />

      {/* Catálogo Destacado */}
      <ProductsHighlight productos={productos} cargando={cargando} />

      {/* Testimonios con opción de agregar */}
      <TestimonialsSection 
        testimonios={config.testimonios} 
        visible={config.mostrarTestimonios ?? true}
      />

      {/* Nuestra Historia */}
      <NosotrosSection 
        titulo={config.nosotrosTitulo}
        texto1={config.nosotrosTexto1}
        texto2={config.nosotrosTexto2}
      />

      {/* FAQ */}
      <FAQSection faqs={config.faqs} />

      {/* Contacto & Ubicación */}
      <ContactSection 
        horario={config.horario}
        direccion={config.direccionTexto}
        whatsapp={config.whatsapp}
      />

      {/* Botón Flotante Inteligente */}
      <WhatsAppButton numero={config.whatsapp} />

    </div>
  )
}
