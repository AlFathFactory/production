import { useEffect, useState } from 'react'

import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { CheckboxField } from '../../components/ui/CheckboxField'
import { Dialog } from '../../components/ui/Dialog'
import { FormField } from '../../components/ui/FormField'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import type { ProductionRoute } from '../production/types'
import {
  useCreateRouteAssignmentOption,
  useDeleteRouteAssignmentOption,
  useRouteAssignmentOptions,
  useUpdateRouteAssignmentOption,
} from './queries/routeAssignmentOptionsQueries'
import type { BomRouteAssignmentOption, CreateBomRouteAssignmentOptionInput } from './types'

const SYSTEM_ROUTES: readonly ProductionRoute[] = ['BEND', 'NO BEND', 'ROD', 'ROLLING', 'LADDER', 'OTHER']

type FormValues = CreateBomRouteAssignmentOptionInput

function routeForm(option: BomRouteAssignmentOption | null, unusedRoutes: readonly ProductionRoute[]): FormValues {
  return option
    ? { route: option.route, label: option.label, isActive: option.isActive, sortOrder: option.sortOrder }
    : { route: unusedRoutes[0] ?? 'BEND', label: '', isActive: true, sortOrder: 10 }
}

function RouteOptionDialog({ option, unusedRoutes, isSaving, error, onClose, onSubmit }: {
  option: BomRouteAssignmentOption | null
  unusedRoutes: readonly ProductionRoute[]
  isSaving: boolean
  error: string | null
  onClose: () => void
  onSubmit: (values: FormValues) => void
}) {
  const [values, setValues] = useState(() => routeForm(option, unusedRoutes))
  useEffect(() => setValues(routeForm(option, unusedRoutes)), [option, unusedRoutes])
  const isEditing = option !== null
  const canSave = values.label.trim().length > 0 && (isEditing || unusedRoutes.length > 0)

  return <Dialog isOpen title={isEditing ? 'Edit Route Option' : 'Add Route Option'} onClose={onClose} isCloseDisabled={isSaving}>
    <form className="entity-form" onSubmit={(event) => { event.preventDefault(); if (canSave) onSubmit(values) }}>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <FormField label="Label" htmlFor="route-option-label">
        <Input id="route-option-label" value={values.label} required disabled={isSaving} placeholder="Bending" onChange={(event) => setValues((current) => ({ ...current, label: event.target.value }))} />
      </FormField>
      <FormField label="System Route" htmlFor="route-option-route">
        <Select id="route-option-route" value={values.route} disabled={isSaving || isEditing || unusedRoutes.length === 0} onChange={(event) => setValues((current) => ({ ...current, route: event.target.value as ProductionRoute }))}>
          {(isEditing ? [option.route] : unusedRoutes).map((route) => <option key={route} value={route}>{route}</option>)}
        </Select>
        <p className="form-field__hint">Changing the label does not change the Production workflow route.</p>
      </FormField>
      <FormField label="Sort Order" htmlFor="route-option-sort-order">
        <Input id="route-option-sort-order" type="number" value={values.sortOrder} min={0} step={1} required disabled={isSaving} onChange={(event) => setValues((current) => ({ ...current, sortOrder: Number(event.target.value) }))} />
      </FormField>
      <CheckboxField id="route-option-active" label="Active" checked={values.isActive} disabled={isSaving} onChange={(event) => setValues((current) => ({ ...current, isActive: event.target.checked }))} />
      <div className="entity-form__actions"><Button type="button" variant="secondary" disabled={isSaving} onClick={onClose}>Cancel</Button><Button type="submit" disabled={!canSave} isLoading={isSaving}>{isEditing ? 'Save Changes' : 'Add Route'}</Button></div>
    </form>
  </Dialog>
}

export function SettingsPage() {
  const optionsQuery = useRouteAssignmentOptions()
  const createMutation = useCreateRouteAssignmentOption()
  const updateMutation = useUpdateRouteAssignmentOption()
  const deleteMutation = useDeleteRouteAssignmentOption()
  const [isManagingRoutes, setIsManagingRoutes] = useState(false)
  const [editing, setEditing] = useState<BomRouteAssignmentOption | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<BomRouteAssignmentOption | null>(null)
  const options = optionsQuery.data ?? []
  const unusedRoutes = SYSTEM_ROUTES.filter((route) => !options.some((option) => option.route === route))
  const formError = createMutation.error?.message ?? updateMutation.error?.message ?? null

  async function save(values: FormValues) {
    try {
      if (editing) {
        const { label, isActive, sortOrder } = values
        await updateMutation.mutateAsync({ id: editing.id, input: { label, isActive, sortOrder } })
      }
      else await createMutation.mutateAsync(values)
      setEditing(undefined)
    } catch { /* the mutation error is rendered in the dialog */ }
  }

  return <section className="settings-page">
    <PageHeader title="Settings" description="Administration settings for BOM extraction." />
    {!isManagingRoutes ? <div className="settings-cards">
      <section className="settings-card"><h2>Route Assignment</h2><p>Manage the route options shown during BOM extraction.</p><Button onClick={() => setIsManagingRoutes(true)}>Manage Routes</Button></section>
      <section className="settings-card"><h2>Excel Mapping</h2><p>Configure BOM Excel column mappings.</p><Button disabled variant="secondary">Coming Later</Button></section>
    </div> : <section className="settings-routes">
      <div className="settings-routes__header"><div><h2>Route Assignment</h2><p>Labels are what users see. System routes remain fixed Production workflow values.</p></div><div><Button variant="secondary" onClick={() => setIsManagingRoutes(false)}>Back to Settings</Button><Button disabled={unusedRoutes.length === 0} onClick={() => setEditing(null)}>Add Route</Button></div></div>
      {optionsQuery.isPending ? <p role="status">Loading route options…</p> : optionsQuery.error ? <p role="alert">{optionsQuery.error.message} <Button variant="secondary" onClick={() => void optionsQuery.refetch()}>Retry</Button></p> : <div className="settings-routes__table-wrap"><table className="settings-routes__table"><thead><tr><th>Label</th><th>System Route</th><th>Status</th><th>Sort Order</th><th>Actions</th></tr></thead><tbody>
        {options.length === 0 ? <tr><td colSpan={5}>No route options are configured.</td></tr> : options.map((option) => <tr key={option.id}><td>{option.label}</td><td><code>{option.route}</code></td><td>{option.isActive ? 'Active' : 'Inactive'}</td><td>{option.sortOrder}</td><td><Button variant="secondary" onClick={() => setEditing(option)}>Edit</Button> <Button variant="danger" onClick={() => setDeleting(option)}>Delete</Button></td></tr>)}
      </tbody></table></div>}
    </section>}
    {editing !== undefined ? <RouteOptionDialog option={editing} unusedRoutes={unusedRoutes} isSaving={createMutation.isPending || updateMutation.isPending} error={formError} onClose={() => { setEditing(undefined); createMutation.reset(); updateMutation.reset() }} onSubmit={(values) => void save(values)} /> : null}
    <Dialog isOpen={Boolean(deleting)} title="Delete Route Option" onClose={() => setDeleting(null)} isCloseDisabled={deleteMutation.isPending}><div className="entity-form"><p>Delete <strong>{deleting?.label}</strong>? It will no longer be selectable for future extractions. Historical Production and extraction records are not changed.</p>{deleteMutation.error ? <p className="form-error" role="alert">{deleteMutation.error.message}</p> : null}<div className="entity-form__actions"><Button variant="secondary" disabled={deleteMutation.isPending} onClick={() => setDeleting(null)}>Cancel</Button><Button variant="danger" isLoading={deleteMutation.isPending} onClick={() => deleting && deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}>Delete</Button></div></div></Dialog>
  </section>
}
