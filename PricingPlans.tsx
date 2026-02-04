import { useState } from "react"

/* ========= Iconos SVG reutilizables ========= */
const Check = () => (
  <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
    <path d="M5 13l4 4L19 7" />
  </svg>
)

const Star = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3 7 7 .6-5.3 4.6 1.6 7L12 18l-6.3 3.8 1.6-7L2 9.6 9 9z"/>
  </svg>
)

const Rocket = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2c4 2 7 6 7 10l3 3-5 1-1 5-3-3c-4 0-8-3-10-7 3-6 6-8 9-9z"/>
  </svg>
)

/* ========= Types ========= */
type Plan = {
  name: string
  badge?: string
  highlight?: boolean
  monthly?: number
  yearly?: number
  cta: string
  features: string[]
}

/* ========= Data ========= */
const plans: Plan[] = [
  {
    name: "1 Plan Inicia",
    badge: "OFERTA LANZAMIENTO",
    yearly: 150,
    cta: "Crear mi negocio",
    features: [
      "Perfil verificado",
      "Botón WhatsApp y llamadas",
      "5 fotos de productos",
      "Ubicación en mapa",
      "1 promoción mensual",
      "1 boost de visibilidad",
      "Estadísticas básicas",
    ]
  },
  {
    name: "2 Plan Impulsa",
    badge: "EL MÁS POPULAR",
    highlight: true,
    monthly: 375,
    yearly: 375 * 10, // 2 meses gratis
    cta: "Quiero más clientes",
    features: [
      "Todo lo del 1 Plan Empieza, Más",
      "Posición prioritaria en búsquedas",
      "15 imágenes de productos o servicios",
      "WhatsApp destacado",
      "Publicaciones ilimitadas",
      "3 boosts de visibilidad",
      "Estadísticas avanzadas",
      "1 diseño profesional",
    ]
  },
  {
    name: "3 Plan Domina",
    badge: "MÁXIMA EXPOSICIÓN",
    monthly: 850,
    yearly: 850 * 10,
    cta: "Dominar mi categoría",
    features: [
      "Todo lo del 2 Plan Impulsa, Más",
      "Primeros lugares garantizados",
      "Tu Negocio en Destacados",
	  "45 imágenes de productos o servicios",
      "12 motion flyers",
	  "12 diseños profesionales",
      "Promoción en redes sociales",
      "Asistente IA automático",
      "Hasta 24 boosts de visibilidad",
      "Soporte 24/7 prioritario",
    ]
  }
]

/* ========= Component ========= */
export default function PricingPlans() {
  const [yearly, setYearly] = useState(false)

  const formatPrice = (plan: Plan) => {
    if (plan.yearly && yearly) return `L.${plan.yearly}`
    if (plan.monthly && !yearly) return `L.${plan.monthly}`
    if (plan.yearly && !plan.monthly) return `L.${plan.yearly}`
    return ""
  }

  const period = (plan: Plan) => {
    if (!plan.monthly) return "/ año"
    return yearly ? "/ año" : "/ mes"
  }

  return (
    <section className="py-24 bg-gradient-to-b from-white to-slate-50">

      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-5xl font-extrabold text-slate-900">
          Planes de Membresía
        </h2>
        <p className="mt-3 text-slate-600">
          Más clientes • Más visibilidad • Más ventas
        </p>
      </div>

      {/* Toggle */}
      <div className="flex justify-center mb-12">
        <div className="flex items-center gap-4 bg-white shadow p-2 rounded-xl border">

          <span className={!yearly ? "font-bold" : "text-slate-500"}>Mensual</span>

          <button
            onClick={() => setYearly(!yearly)}
            className="w-14 h-7 bg-blue-600 rounded-full relative transition"
          >
            <span
              className={`absolute top-1 bg-white w-5 h-5 rounded-full transition ${
                yearly ? "left-8" : "left-1"
              }`}
            />
          </button>

          <span className={yearly ? "font-bold" : "text-slate-500"}>
            Anual
          </span>

          {yearly && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
              2 meses GRATIS
            </span>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 px-6">

        {plans.map((plan, i) => (
          <div
            key={i}
            className={`
              relative rounded-3xl p-8 flex flex-col transition-all duration-300
              hover:-translate-y-2 hover:shadow-2xl
              ${plan.highlight
                ? "bg-blue-600 text-white scale-105 shadow-2xl"
                : "bg-white shadow-xl"}
            `}
          >

            {/* Badge */}
            {plan.badge && (
              <span
                className={`
                  absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full
                  ${plan.highlight
                    ? "bg-yellow-400 text-black"
                    : "bg-slate-100 text-slate-700"}
                `}
              >
                {plan.highlight ? <Star /> : <Rocket />}
                <span className="ml-1">{plan.badge}</span>
              </span>
            )}

            {/* Title */}
            <h3 className="text-3xl font-bold mb-2">{plan.name}</h3>

            {/* Price */}
            <div className="mb-6">
              <span className="text-5xl font-extrabold">
                {formatPrice(plan)}
              </span>
              <span className="opacity-70 ml-2">{period(plan)}</span>
            </div>

            {/* Features */}
            <ul className="space-y-3 text-sm flex-1">
              {plan.features.map((f, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <Check />
                  {f}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              className={`
                mt-8 py-3 rounded-xl font-semibold transition
                ${plan.highlight
                  ? "bg-white text-blue-600 hover:bg-slate-100"
                  : "bg-slate-900 text-white hover:bg-black"}
              `}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <p className="text-center text-sm text-slate-500 mt-10">
        Sin contratos • Cancelas cuando quieras • Activación inmediata
      </p>
    </section>
  )
}
