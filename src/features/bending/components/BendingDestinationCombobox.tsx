import { useEffect, useRef, useState } from 'react'

import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'
import type { BendingDestination } from '../types'

interface BendingDestinationComboboxProps {
  destinations: BendingDestination[]
  isDisabled: boolean
  onAdd: () => void
  onChange: (destinationName: string) => void
  value: string
}

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase()
}

export function BendingDestinationCombobox({ destinations, isDisabled, onAdd, onChange, value }: BendingDestinationComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const search = normalized(value)
  const filteredDestinations = search
    ? destinations.filter((destination) => normalized(destination.name).includes(search))
    : destinations
  const hasExactMatch = destinations.some((destination) => normalized(destination.name) === search)
  const canAdd = Boolean(search && !hasExactMatch)

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  return (
    <FormField label="Destination *" htmlFor="bending-destination">
      <div className="bending-destination-combobox" ref={rootRef}>
        <Input
          aria-autocomplete="list"
          aria-controls="bending-destination-results"
          aria-expanded={isOpen}
          autoComplete="off"
          disabled={isDisabled}
          id="bending-destination"
          placeholder="Type to search Destinations"
          required
          role="combobox"
          type="search"
          value={value}
          onChange={(event) => {
            onChange(event.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setIsOpen(false)
          }}
        />
        {isOpen && !isDisabled ? (
          <div className="bending-destination-combobox__menu" id="bending-destination-results" role="listbox">
            <div className="bending-destination-combobox__options">
              {filteredDestinations.map((destination) => (
                <button
                  className={`bending-destination-combobox__option ${normalized(destination.name) === search ? 'bending-destination-combobox__option--selected' : ''}`.trim()}
                  key={destination.id}
                  role="option"
                  type="button"
                  aria-selected={normalized(destination.name) === search}
                  onClick={() => {
                    onChange(destination.name)
                    setIsOpen(false)
                  }}
                >
                  {destination.name}
                </button>
              ))}
              {filteredDestinations.length === 0 && !canAdd ? (
                <p className="bending-destination-combobox__empty">No saved Destinations.</p>
              ) : null}
            </div>
            {canAdd ? (
              <button
                className="bending-destination-combobox__add"
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  onAdd()
                }}
              >
                Add New Destination named &quot;{value.trim()}&quot;
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </FormField>
  )
}
