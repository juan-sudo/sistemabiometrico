import { ArrowRightIcon } from "@heroicons/react/24/outline"
import Link from "next/link"
import { lusitana } from "@/app/ui/fonts"

export function WaterInfoCard() {
  return (
    <div className="flex w-full max-w-xl flex-col justify-center gap-6 rounded-2xl border border-white/40 bg-white/80 px-8 py-12 shadow-xl backdrop-blur-md md:w-2/5">

      <h1
        className={`${lusitana.className} text-3xl font-semibold tracking-tight text-gray-800 md:text-4xl`}
      >
        Consulta tu recibo de agua
      </h1>

      <p className="text-gray-600 leading-relaxed md:text-lg">
        Consulta de forma rápida y segura tu
        <span className="font-medium text-blue-600"> servicio de agua potable</span>.
        Revisa tus montos pendientes, fechas de vencimiento y estado de cuenta.
      </p>

      <Link
        href="/clientebuscaragua"
        className="group mt-2 inline-flex items-center gap-3 self-start rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 md:text-base"
      >
        Consultar Agua
        <ArrowRightIcon className="w-5 transition-transform group-hover:translate-x-1" />
      </Link>

      <span className="text-xs text-gray-400">
        Atención disponible las 24 horas
      </span>
    </div>
  )
}
