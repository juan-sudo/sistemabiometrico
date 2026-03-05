"use client"

import { useState } from "react"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { lusitana } from "@/app/ui/fonts"
import { ModalDeudaCliente } from "@/components/cliente/modals/ModalDeudaCliente"
import { HomeHeader } from "@/components/cliente/HomeHeader"

function WaterDebtSearchCard() {
  const [value, setValue] = useState("")
  const [openModal, setOpenModal] = useState(false)

  return (
    <>
      <div className="flex w-full flex-col justify-center rounded-2xl border border-white/40 bg-white/80 px-8 py-12 shadow-xl backdrop-blur-md">

        <h2
          className={`${lusitana.className} text-2xl font-semibold tracking-tight text-gray-800 md:text-3xl`}
        >
          Consulta tu deuda de agua
        </h2>

        <p className="text-gray-600 md:text-base">
          Ingresa tu{" "}
          <span className="font-medium text-blue-600">
            código de usuario, DNI o número de suministro
          </span>
        </p>

        {/* INPUT */}
        <div className="relative">
          <input
            type="text"
            placeholder="Ej: 00124578"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 text-sm text-gray-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 md:text-base"
          />
          <MagnifyingGlassIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        </div>

        {/* BUTTON */}
        <button
          onClick={() => setOpenModal(true)}
          disabled={!value}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-500 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-blue-300 md:text-base"
        >
          Consultar deuda
        </button>

        <span className="text-xs text-gray-400">
          Información protegida · Acceso seguro
        </span>
      </div>

      {/* MODAL */}
      <ModalDeudaCliente
        open={openModal}
        onClose={() => setOpenModal(false)}
        value={value}
      />
    </>
  )
}

export default function Page() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4 py-6 sm:p-8">
     <HomeHeader />
      <section className="relative z-10 mt-6 flex flex-1 flex-col items-center gap-8 md:flex-row">
        <WaterDebtSearchCard />
      </section>
    </main>
  )
}
