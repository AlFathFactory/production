import { Button } from '../../../components/ui/Button'
import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'
import { SearchableNameCombobox } from '../../../components/ui/SearchableNameCombobox'
import { useDispenseRecipients } from '../../dispense/queries/dispenseQueries'
import { ProjectLotSelector } from '../../production/components/ProjectLotSelector'
import type { DispenseHistoryFilters as DispenseHistoryFilterValues } from '../../dispense/types'

interface DispenseHistoryFiltersProps {
  filters: DispenseHistoryFilterValues
  hasActiveFilters: boolean
  onDateFromChange: (value: string | null) => void
  onDateToChange: (value: string | null) => void
  onLotChange: (id: string | null) => void
  onProjectChange: (id: string | null) => void
  onProjectNumberChange: (id: string | null) => void
  onQueryChange: (value: string) => void
  onRecipientChange: (id: string | null, name: string) => void
  onRecipientNameChange: (value: string) => void
  onReset: () => void
  recipientDisplayName: string
}

export function DispenseHistoryFilters({
  filters,
  hasActiveFilters,
  onDateFromChange,
  onDateToChange,
  onLotChange,
  onProjectChange,
  onProjectNumberChange,
  onQueryChange,
  onRecipientChange,
  onRecipientNameChange,
  onReset,
  recipientDisplayName,
}: DispenseHistoryFiltersProps) {
  const recipientsQuery = useDispenseRecipients()

  return (
    <section className="reports-filter-panel" aria-label="DISPENSE history filters">
      <div className="reports-filter-grid reports-filter-grid--details">
        <SearchableNameCombobox
          emptyLabel="No saved people."
          inputId="dispense-history-person"
          isDisabled={recipientsQuery.isPending || recipientsQuery.isError}
          label="Person"
          onChange={(value) => onRecipientChange(null, value)}
          onSelect={(recipient) => onRecipientChange(recipient.id, recipient.name)}
          options={recipientsQuery.data ?? []}
          placeholder="Search saved people"
          value={recipientDisplayName}
        />
        <FormField label="Person Name Search" htmlFor="dispense-history-person-name">
          <Input
            id="dispense-history-person-name"
            placeholder="Search recipient names"
            type="search"
            value={filters.recipientName}
            onChange={(event) => onRecipientNameChange(event.target.value)}
          />
        </FormField>
        <FormField label="Date From" htmlFor="dispense-history-date-from">
          <Input
            id="dispense-history-date-from"
            max={filters.dateTo ?? undefined}
            type="date"
            value={filters.dateFrom ?? ''}
            onChange={(event) => onDateFromChange(event.target.value || null)}
          />
        </FormField>
        <FormField label="Date To" htmlFor="dispense-history-date-to">
          <Input
            id="dispense-history-date-to"
            min={filters.dateFrom ?? undefined}
            type="date"
            value={filters.dateTo ?? ''}
            onChange={(event) => onDateToChange(event.target.value || null)}
          />
        </FormField>
      </div>
      {recipientsQuery.isError ? (
        <p className="reports-filter-error" role="alert">
          People could not be loaded. <button type="button" onClick={() => void recipientsQuery.refetch()}>Retry</button>
        </p>
      ) : null}
      <ProjectLotSelector
        ariaLabel="DISPENSE history hierarchy filters"
        emptyOptionLabels={{ project: 'All Projects', projectNumber: 'All Project Numbers', lot: 'All Lots' }}
        idPrefix="dispense-history"
        lotId={filters.lotId}
        projectId={filters.projectId}
        projectNumberId={filters.projectNumberId}
        onLotChange={(id) => onLotChange(id)}
        onProjectChange={(id) => onProjectChange(id)}
        onProjectNumberChange={(id) => onProjectNumberChange(id)}
      />
      <FormField label="Article / Designation / Profile / Material" htmlFor="dispense-history-query">
        <Input
          id="dispense-history-query"
          placeholder="Search production items"
          type="search"
          value={filters.query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </FormField>
      {hasActiveFilters ? <Button className="reports-filters__reset" type="button" variant="secondary" onClick={onReset}>Reset Filters</Button> : null}
    </section>
  )
}
