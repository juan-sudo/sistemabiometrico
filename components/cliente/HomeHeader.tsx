import Image from "next/image"
import Link from "next/link"

export function HomeHeader() {
  return (
    <header className="relative z-20 w-full">
      <div
        className="
          mx-auto flex max-w-7xl items-center justify-between
          rounded-2xl border border-white/40
          bg-white/70 px-6 py-4
          shadow-md backdrop-blur-md
        "
      >
        {/* LOGO + TITLE */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo-muni.png"
            alt="Municipalidad"
            width={40}
            height={40}
            className="rounded"
          />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-gray-800">
              Municipalidad
            </p>
            <p className="text-xs text-gray-500">
              Consulta de Agua Potable
            </p>
          </div>
        </Link>

        {/* NAV */}
        <nav className="flex items-center gap-3">
          <Link
            href="/"
            className="
              rounded-lg px-3 py-2 text-sm font-medium text-gray-700
              transition hover:bg-teal-700 text-white
            "
          >
            Inicio
          </Link>

          <Link
            href="/clientebuscaragua"
            className="
              rounded-lg bg-blue-600 px-4 py-2
              text-sm font-medium text-white
              transition hover:bg-blue-500
            "
          >
            Consultar recibo
          </Link>
        </nav>
      </div>
    </header>
  )
}


