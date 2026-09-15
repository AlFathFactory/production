import { useState, type FormEvent } from 'react'

import { Button } from '../../../components/ui/Button'
import { Dialog } from '../../../components/ui/Dialog'
import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { Textarea } from '../../../components/ui/Textarea'
import { productionRoutes } from '../constants'
import type { CreateProductionItemInput, CreateProductionItemFormValues, ProductionRoute } from '../types'

type NewMaterialValues = Omit<CreateProductionItemInput, 'createdBy' | 'lotId'>

const initialValues: CreateProductionItemFormValues = {
  article: '',
  designation: '',
  material: '',
  profile: '',
  remark: '',
  routing: null,
  totalQuantity: '',
  unitWeightKg: '',
}

function getFormError(values: CreateProductionItemFormValues): string | null {
  const totalQuantity = Number(values.totalQuantity)
  const unitWeightKg = values.unitWeightKg === '' ? null : Number(values.unitWeightKg)

  if (!values.article.trim()) {
    return 'Article is required.'
  }
  if (!values.routing) {
    return 'Route is required.'
  }
  if (!values.totalQuantity.trim() || !Number.isFinite(totalQuantity) || totalQuantity < 0) {
    return 'Total Quantity must be zero or greater.'
  }
  if (unitWeightKg !== null && (!Number.isFinite(unitWeightKg) || unitWeightKg < 0)) {
    return 'Unit Weight must be zero or greater.'
  }

  return null
}

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : 'The material could not be added. Please try again.'
}

interface AddMaterialDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: NewMaterialValues) => Promise<void>
}

export function AddMaterialDialog({ isOpen, onClose, onSubmit }: AddMaterialDialogProps) {
  const [values, setValues] = useState<CreateProductionItemFormValues>(initialValues)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const closeDialog = () => {
    if (isSubmitting) {
      return
    }
    setValues(initialValues)
    setError(null)
    onClose()
  }

  const updateValue = <Key extends keyof CreateProductionItemFormValues>(key: Key, value: CreateProductionItemFormValues[Key]) => {
    setValues((current) => ({ ...current, [key]: value }))
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formError = getFormError(values)

    if (formError || !values.routing) {
      setError(formError ?? 'Route is required.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await onSubmit({
        article: values.article,
        designation: values.designation,
        material: values.material,
        profile: values.profile,
        remark: values.remark,
        routing: values.routing,
        totalQuantity: Number(values.totalQuantity),
        unitWeightKg: values.unitWeightKg === '' ? null : Number(values.unitWeightKg),
      })
      setValues(initialValues)
      onClose()
    } catch (submissionError) {
      setError(messageFromError(submissionError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={closeDialog} title="Add Material">
      <form className="production-form" onSubmit={(event) => void submit(event)}>
        <p className="production-form__intro">Create a manual Production item for the selected lot.</p>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <div className="production-form__grid">
          <FormField label="Article *" htmlFor="material-article">
            <Input id="material-article" value={values.article} onChange={(event) => updateValue('article', event.target.value)} />
          </FormField>
          <FormField label="Route *" htmlFor="material-route">
            <Select
              id="material-route"
              value={values.routing ?? ''}
              onChange={(event) => updateValue('routing', (event.target.value || null) as ProductionRoute | null)}
            >
              <option value="">Select a route</option>
              {productionRoutes.map((route) => <option key={route} value={route}>{route}</option>)}
            </Select>
          </FormField>
          <FormField label="Total Quantity *" htmlFor="material-total-quantity">
            <Input id="material-total-quantity" min="0" step="any" type="number" value={values.totalQuantity} onChange={(event) => updateValue('totalQuantity', event.target.value)} />
          </FormField>
          <FormField label="Unit Weight (kg)" htmlFor="material-unit-weight">
            <Input id="material-unit-weight" min="0" step="any" type="number" value={values.unitWeightKg} onChange={(event) => updateValue('unitWeightKg', event.target.value)} />
          </FormField>
          <FormField label="Profile" htmlFor="material-profile">
            <Input id="material-profile" value={values.profile} onChange={(event) => updateValue('profile', event.target.value)} />
          </FormField>
          <FormField label="Designation" htmlFor="material-designation">
            <Input id="material-designation" value={values.designation} onChange={(event) => updateValue('designation', event.target.value)} />
          </FormField>
          <FormField label="Material" htmlFor="material-material">
            <Input id="material-material" value={values.material} onChange={(event) => updateValue('material', event.target.value)} />
          </FormField>
        </div>
        <FormField label="Remark" htmlFor="material-remark">
          <Textarea id="material-remark" value={values.remark} onChange={(event) => updateValue('remark', event.target.value)} />
        </FormField>
        <div className="entity-form__actions">
          <Button type="button" variant="secondary" disabled={isSubmitting} onClick={closeDialog}>Cancel</Button>
          <Button type="submit" isLoading={isSubmitting}>Add Material</Button>
        </div>
      </form>
    </Dialog>
  )
}
