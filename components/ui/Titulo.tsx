// components/ui/Titulo.tsx
"use client"

interface TituloProps {
  texto: string
  className?: string
}

export default function Titulo({ texto, className = "" }: TituloProps) {
  return (
    <h1 className={`text-2xl font-bold ${className}`}>
      {texto}
    </h1>
  )
}
