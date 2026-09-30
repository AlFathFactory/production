import { useEffect, useRef, useState } from 'react'

import { FormField } from './FormField'
import { Input } from './Input'

export interface SearchableNameOption {
  id: string
  name: string
}

interface SearchableNameComboboxProps<T extends SearchableNameOption> {
  addLabel?: (name: string) => string
  emptyLabel: string
  inputId: string
  isDisabled?: boolean
  label: string
  onAdd?: () => void
  onChange: (value: string) => void
  onSelect?: (option: T) => void
  options: T[]
  placeholder: string
  required?: boolean
  value: string
}

export function normalizeSearchableName(value: string): string {
  return value.trim().toLocaleLowerCase()
}

export function SearchableNameCombobox<T extends SearchableNameOption>({
  addLabel,
  emptyLabel,
  inputId,
  isDisabled = false,
  label,
  onAdd,
  onChange,
  onSelect,
  options,
  placeholder,
  required = false,
  value,
}: SearchableNameComboboxProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const search = normalizeSearchableName(value)
  const filteredOptions = search
    ? options.filter((option) => normalizeSearchableName(option.name).includes(search))
    : options
  const hasExactMatch = options.some((option) => normalizeSearchableName(option.name) === search)
  const canAdd = Boolean(onAdd && search && !hasExactMatch)
  const resultsId = `${inputId}-results`

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  return (
    <FormField label={label} htmlFor={inputId}>
      <div className="searchable-name-combobox" ref={rootRef}>
        <Input
          aria-autocomplete="list"
          aria-controls={resultsId}
          aria-expanded={isOpen}
          autoComplete="off"
          disabled={isDisabled}
          id={inputId}
          placeholder={placeholder}
          required={required}
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
          <div className="searchable-name-combobox__menu" id={resultsId} role="listbox">
            <div className="searchable-name-combobox__options">
              {filteredOptions.map((option) => (
                <button
                  aria-selected={normalizeSearchableName(option.name) === search}
                  className={`searchable-name-combobox__option ${normalizeSearchableName(option.name) === search ? 'searchable-name-combobox__option--selected' : ''}`.trim()}
                  key={option.id}
                  role="option"
                  type="button"
                  onClick={() => {
                    onChange(option.name)
                    onSelect?.(option)
                    setIsOpen(false)
                  }}
                >
                  {option.name}
                </button>
              ))}
              {filteredOptions.length === 0 && !canAdd ? <p className="searchable-name-combobox__empty">{emptyLabel}</p> : null}
            </div>
            {canAdd ? (
              <button
                className="searchable-name-combobox__add"
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  onAdd?.()
                }}
              >
                {addLabel?.(value.trim()) ?? `Add ${value.trim()}`}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </FormField>
  )
}
