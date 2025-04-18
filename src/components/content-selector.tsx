"use client"

import { useState } from "react"

interface ContentSelectorProps {
  selectedOption: string
  onOptionChange: (option: string) => void
}

export default function ContentSelector({ selectedOption, onOptionChange }: ContentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const options = [
    { id: "main", label: "Main Content" },
    { id: "body", label: "Entire Page" },
  ]

  const toggleDropdown = () => setIsOpen(!isOpen)

  const handleOptionSelect = (optionId: string) => {
    onOptionChange(optionId)
    setIsOpen(false)
  }

  const selectedLabel = options.find((opt) => opt.id === selectedOption)?.label || options[0].label

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleDropdown}
        className="px-4 py-2 bg-white text-[#51b0ef] border-2 border-[#51a3ef] rounded-full font-medium text-sm hover:bg-[#f4feff] focus:outline-none"
      >
        {selectedLabel}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-10">
          <ul className="py-1">
            {options.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => handleOptionSelect(option.id)}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    selectedOption === option.id
                      ? "bg-[#f9f4ff] text-[#519bef] font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
