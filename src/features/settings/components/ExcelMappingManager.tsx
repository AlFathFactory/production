import { useEffect, useMemo, useState } from 'react'

import { Button } from '../../../components/ui/Button'
import { CheckboxField } from '../../../components/ui/CheckboxField'
import { Dialog } from '../../../components/ui/Dialog'
import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import {
  useCreateDesignationMapping,
  useCreateDesignationType,
  useDeleteDesignationMapping,
  useDeleteDesignationType,
  useDesignationMappingSettings,
  useDesignationTypeSettings,
  useUpdateDesignationMapping,
  useUpdateDesignationType,
} from '../queries/designationMappingSettingsQueries'
import type { DesignationMappingInput, DesignationMappingSetting, DesignationTypeInput, DesignationTypeSetting } from '../types'

function typeForm(item: DesignationTypeSetting | null): DesignationTypeInput {
  return item ? { name: item.name, isActive: item.isActive, sortOrder: item.sortOrder } : { name: '', isActive: true, sortOrder: 10 }
}

function mappingForm(item: DesignationMappingSetting | null, typeId: string): DesignationMappingInput {
  return item ? { code: item.code, typeId: item.typeId, isActive: item.isActive, sortOrder: item.sortOrder } : { code: '', typeId, isActive: true, sortOrder: 10 }
}

function TypeDialog({ item, names, isSaving, error, onClose, onSubmit }: {
  item: DesignationTypeSetting | null
  names: Set<string>
  isSaving: boolean
  error: string | null
  onClose: () => void
  onSubmit: (values: DesignationTypeInput) => void
}) {
  const [values, setValues] = useState(() => typeForm(item))
  useEffect(() => setValues(typeForm(item)), [item])
  const normalizedName = values.name.trim().toUpperCase()
  const duplicate = Boolean(normalizedName) && names.has(normalizedName) && normalizedName !== item?.name.trim().toUpperCase()
  const canSave = Boolean(normalizedName) && !duplicate
  return <Dialog isOpen title={item ? 'Edit Designation Type' : 'Add Designation Type'} onClose={onClose} isCloseDisabled={isSaving}>
    <form className="entity-form" onSubmit={(event) => { event.preventDefault(); if (canSave) onSubmit({ ...values, name: values.name.trim() }) }}>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {duplicate ? <p className="form-error" role="alert">A designation type with this name already exists.</p> : null}
      <FormField label="Type Name" htmlFor="designation-type-name"><Input id="designation-type-name" value={values.name} required disabled={isSaving} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} /></FormField>
      <FormField label="Sort Order" htmlFor="designation-type-sort"><Input id="designation-type-sort" type="number" min={0} step={1} required disabled={isSaving} value={values.sortOrder} onChange={(event) => setValues((current) => ({ ...current, sortOrder: Number(event.target.value) }))} /></FormField>
      <CheckboxField id="designation-type-active" label="Active" checked={values.isActive} disabled={isSaving} onChange={(event) => setValues((current) => ({ ...current, isActive: event.target.checked }))} />
      <div className="entity-form__actions"><Button type="button" variant="secondary" disabled={isSaving} onClick={onClose}>Cancel</Button><Button type="submit" disabled={!canSave} isLoading={isSaving}>{item ? 'Save Changes' : 'Add Type'}</Button></div>
    </form>
  </Dialog>
}

function MappingDialog({ item, activeTypes, codes, isSaving, error, onClose, onSubmit }: {
  item: DesignationMappingSetting | null
  activeTypes: DesignationTypeSetting[]
  codes: Set<string>
  isSaving: boolean
  error: string | null
  onClose: () => void
  onSubmit: (values: DesignationMappingInput) => void
}) {
  const [values, setValues] = useState(() => mappingForm(item, activeTypes[0]?.id ?? ''))
  useEffect(() => setValues(mappingForm(item, activeTypes[0]?.id ?? '')), [item, activeTypes])
  const normalizedCode = values.code.trim().toUpperCase()
  const duplicate = Boolean(normalizedCode) && codes.has(normalizedCode) && normalizedCode !== item?.code
  const canSave = Boolean(normalizedCode && values.typeId) && !duplicate
  return <Dialog isOpen title={item ? 'Edit Designation Code Mapping' : 'Add Designation Code Mapping'} onClose={onClose} isCloseDisabled={isSaving}>
    <form className="entity-form" onSubmit={(event) => { event.preventDefault(); if (canSave) onSubmit({ ...values, code: normalizedCode }) }}>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {duplicate ? <p className="form-error" role="alert">A mapping for this designation code already exists.</p> : null}
      <FormField label="Designation Code" htmlFor="designation-mapping-code"><Input id="designation-mapping-code" value={values.code} required disabled={isSaving} onChange={(event) => setValues((current) => ({ ...current, code: event.target.value.toUpperCase() }))} /></FormField>
      <FormField label="Maps To" htmlFor="designation-mapping-type"><Select id="designation-mapping-type" value={values.typeId} disabled={isSaving || activeTypes.length === 0} onChange={(event) => setValues((current) => ({ ...current, typeId: event.target.value }))}><option value="">Select type</option>{activeTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</Select></FormField>
      {activeTypes.length === 0 ? <p className="form-error" role="alert">Create and activate a designation type before adding a mapping.</p> : null}
      <FormField label="Sort Order" htmlFor="designation-mapping-sort"><Input id="designation-mapping-sort" type="number" min={0} step={1} required disabled={isSaving} value={values.sortOrder} onChange={(event) => setValues((current) => ({ ...current, sortOrder: Number(event.target.value) }))} /></FormField>
      <CheckboxField id="designation-mapping-active" label="Active" checked={values.isActive} disabled={isSaving} onChange={(event) => setValues((current) => ({ ...current, isActive: event.target.checked }))} />
      <div className="entity-form__actions"><Button type="button" variant="secondary" disabled={isSaving} onClick={onClose}>Cancel</Button><Button type="submit" disabled={!canSave} isLoading={isSaving}>{item ? 'Save Changes' : 'Add Mapping'}</Button></div>
    </form>
  </Dialog>
}

export function ExcelMappingManager({ onBack }: { onBack: () => void }) {
  const typesQuery = useDesignationTypeSettings()
  const mappingsQuery = useDesignationMappingSettings()
  const createType = useCreateDesignationType()
  const updateType = useUpdateDesignationType()
  const deleteType = useDeleteDesignationType()
  const createMapping = useCreateDesignationMapping()
  const updateMapping = useUpdateDesignationMapping()
  const deleteMapping = useDeleteDesignationMapping()
  const [editingType, setEditingType] = useState<DesignationTypeSetting | null | undefined>(undefined)
  const [editingMapping, setEditingMapping] = useState<DesignationMappingSetting | null | undefined>(undefined)
  const [deletingType, setDeletingType] = useState<DesignationTypeSetting | null>(null)
  const [deletingMapping, setDeletingMapping] = useState<DesignationMappingSetting | null>(null)
  const types = typesQuery.data ?? []
  const mappings = mappingsQuery.data ?? []
  const activeTypes = useMemo(() => types.filter((type) => type.isActive), [types])
  const typeById = useMemo(() => new Map(types.map((type) => [type.id, type.name])), [types])
  const names = useMemo(() => new Set(types.map((type) => type.name.trim().toUpperCase())), [types])
  const codes = useMemo(() => new Set(mappings.map((mapping) => mapping.code)), [mappings])
  const typeSaving = createType.isPending || updateType.isPending
  const mappingSaving = createMapping.isPending || updateMapping.isPending
  const actionError = updateType.error ?? updateMapping.error

  const saveType = async (values: DesignationTypeInput) => {
    try { if (editingType) await updateType.mutateAsync({ id: editingType.id, input: values }); else await createType.mutateAsync(values); setEditingType(undefined) } catch { /* rendered in dialog */ }
  }
  const saveMapping = async (values: DesignationMappingInput) => {
    try { if (editingMapping) await updateMapping.mutateAsync({ id: editingMapping.id, input: values }); else await createMapping.mutateAsync(values); setEditingMapping(undefined) } catch { /* rendered in dialog */ }
  }

  return <section className="settings-routes settings-excel-mapping">
    <div className="settings-routes__header"><div><h2>Excel Mapping</h2><p>Manage designation types and exact designation-code mappings used by the Extraction Preview.</p></div><Button variant="secondary" onClick={onBack}>Back to Settings</Button></div>
    {actionError ? <p className="form-error" role="alert">{actionError.message}</p> : null}
    <section className="settings-excel-mapping__section"><div className="settings-routes__header"><div><h3>Designation Types</h3><p>Types available for mapping designation codes.</p></div><Button onClick={() => setEditingType(null)}>Add Type</Button></div>
      {typesQuery.isPending ? <p role="status">Loading designation types…</p> : typesQuery.error ? <p role="alert">{typesQuery.error.message} <Button variant="secondary" onClick={() => void typesQuery.refetch()}>Retry</Button></p> : <div className="settings-routes__table-wrap"><table className="settings-routes__table"><thead><tr><th>Type Name</th><th>Status</th><th>Sort Order</th><th>Actions</th></tr></thead><tbody>{types.length === 0 ? <tr><td colSpan={4}>No designation types are configured.</td></tr> : types.map((type) => <tr key={type.id}><td>{type.name}</td><td>{type.isActive ? 'Active' : 'Inactive'}</td><td>{type.sortOrder}</td><td><Button variant="secondary" onClick={() => setEditingType(type)}>Edit</Button> <Button variant="secondary" onClick={() => updateType.mutate({ id: type.id, input: { name: type.name, isActive: !type.isActive, sortOrder: type.sortOrder } })}>{type.isActive ? 'Deactivate' : 'Activate'}</Button> <Button variant="danger" onClick={() => setDeletingType(type)}>Delete</Button></td></tr>)}</tbody></table></div>}
    </section>
    <section className="settings-excel-mapping__section"><div className="settings-routes__header"><div><h3>Designation Code Mappings</h3><p>Codes are matched as exact, uppercase first tokens.</p></div><Button disabled={activeTypes.length === 0} onClick={() => setEditingMapping(null)}>Add Mapping</Button></div>
      {mappingsQuery.isPending ? <p role="status">Loading designation code mappings…</p> : mappingsQuery.error ? <p role="alert">{mappingsQuery.error.message} <Button variant="secondary" onClick={() => void mappingsQuery.refetch()}>Retry</Button></p> : <div className="settings-routes__table-wrap"><table className="settings-routes__table"><thead><tr><th>Code</th><th>Maps To</th><th>Status</th><th>Sort Order</th><th>Actions</th></tr></thead><tbody>{mappings.length === 0 ? <tr><td colSpan={5}>No designation code mappings are configured.</td></tr> : mappings.map((mapping) => <tr key={mapping.id}><td><code>{mapping.code}</code></td><td>{typeById.get(mapping.typeId) ?? 'Unavailable type'}</td><td>{mapping.isActive ? 'Active' : 'Inactive'}</td><td>{mapping.sortOrder}</td><td><Button variant="secondary" onClick={() => setEditingMapping(mapping)}>Edit</Button> <Button variant="secondary" onClick={() => updateMapping.mutate({ id: mapping.id, input: { code: mapping.code, typeId: mapping.typeId, isActive: !mapping.isActive, sortOrder: mapping.sortOrder } })}>{mapping.isActive ? 'Deactivate' : 'Activate'}</Button> <Button variant="danger" onClick={() => setDeletingMapping(mapping)}>Delete</Button></td></tr>)}</tbody></table></div>}
    </section>
    {editingType !== undefined ? <TypeDialog item={editingType} names={names} isSaving={typeSaving} error={createType.error?.message ?? updateType.error?.message ?? null} onClose={() => { setEditingType(undefined); createType.reset(); updateType.reset() }} onSubmit={(values) => void saveType(values)} /> : null}
    {editingMapping !== undefined ? <MappingDialog item={editingMapping} activeTypes={activeTypes} codes={codes} isSaving={mappingSaving} error={createMapping.error?.message ?? updateMapping.error?.message ?? null} onClose={() => { setEditingMapping(undefined); createMapping.reset(); updateMapping.reset() }} onSubmit={(values) => void saveMapping(values)} /> : null}
    <Dialog isOpen={Boolean(deletingType)} title="Delete Designation Type" onClose={() => setDeletingType(null)} isCloseDisabled={deleteType.isPending}><div className="entity-form"><p>Delete <strong>{deletingType?.name}</strong>?</p>{deleteType.error ? <p className="form-error" role="alert">{deleteType.error.message}</p> : null}<div className="entity-form__actions"><Button variant="secondary" disabled={deleteType.isPending} onClick={() => setDeletingType(null)}>Cancel</Button><Button variant="danger" isLoading={deleteType.isPending} onClick={() => deletingType && deleteType.mutate(deletingType.id, { onSuccess: () => setDeletingType(null) })}>Delete</Button></div></div></Dialog>
    <Dialog isOpen={Boolean(deletingMapping)} title="Delete Designation Code Mapping" onClose={() => setDeletingMapping(null)} isCloseDisabled={deleteMapping.isPending}><div className="entity-form"><p>Delete mapping <strong>{deletingMapping?.code}</strong>?</p>{deleteMapping.error ? <p className="form-error" role="alert">{deleteMapping.error.message}</p> : null}<div className="entity-form__actions"><Button variant="secondary" disabled={deleteMapping.isPending} onClick={() => setDeletingMapping(null)}>Cancel</Button><Button variant="danger" isLoading={deleteMapping.isPending} onClick={() => deletingMapping && deleteMapping.mutate(deletingMapping.id, { onSuccess: () => setDeletingMapping(null) })}>Delete</Button></div></div></Dialog>
  </section>
}
