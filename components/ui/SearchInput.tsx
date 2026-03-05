"use client"

import { useState } from "react"
import { Search, X } from "lucide-react"

interface SearchInputProps {
  placeholder?: string
  onSearch?: (value: string) => void
  className?: string
}

export default function SearchInput({
  placeholder = "Buscar...",
  onSearch,
  className = "",
}: SearchInputProps) {
  const [value, setValue] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    onSearch?.(newValue)
  }

  const clearInput = () => {
    setValue("")
    onSearch?.("")
  }

  return (
    <div className={`relative w-full max-w-sm ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {value && (
        <button
          onClick={clearInput}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
