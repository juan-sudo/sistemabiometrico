import Image from "next/image"

export function WaterHeroImage() {
  return (
    <div className="relative flex w-full max-w-3xl items-center justify-center md:w-3/5">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-600/10 to-transparent" />

      <Image
        src="/muni-foto.avif"
        width={1200}
        height={800}
        className="relative hidden rounded-2xl shadow-2xl md:block"
        alt="Municipalidad - Consulta de recibos de agua"
      />

      <Image
        src="/muni-foto.avif"
        width={600}
        height={700}
        className="relative block rounded-2xl shadow-xl md:hidden"
        alt="Municipalidad - Consulta de recibos de agua"
      />
    </div>
  )
}
