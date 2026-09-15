import { FormField } from '../../../../components/ui/FormField'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner'
import { Select } from '../../../../components/ui/Select'

interface ImportFileStepProps {
  error: string | null
  fileName: string | null
  isDisabled: boolean
  isParsing: boolean
  onFileSelect: (file: File) => Promise<void>
  onSheetSelect: (sheetName: string) => void
  sheetName: string | null
  sheetNames: string[]
}

export function ImportFileStep({
  error,
  fileName,
  isDisabled,
  isParsing,
  onFileSelect,
  onSheetSelect,
  sheetName,
  sheetNames,
}: ImportFileStepProps) {
  return (
    <section className="production-import-file" aria-label="Workbook selection">
      <FormField label="Preparation workbook" htmlFor="production-import-file" hint=".xlsx or .xls, maximum 15 MB">
        <input
          accept=".xlsx,.xls"
          className="production-file-input"
          disabled={isDisabled}
          id="production-import-file"
          type="file"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            if (file) {
              void onFileSelect(file)
            }
            event.currentTarget.value = ''
          }}
        />
      </FormField>

      {isParsing ? <p className="production-import-file__status" role="status"><LoadingSpinner size="small" label="Parsing workbook" /> Parsing workbook…</p> : null}
      {fileName ? <p className="production-import-file__name"><span>File</span><strong>{fileName}</strong></p> : null}
      {sheetNames.length > 1 ? (
        <FormField label="Sheet" htmlFor="production-import-sheet">
          <Select id="production-import-sheet" disabled={isDisabled} value={sheetName ?? ''} onChange={(event) => onSheetSelect(event.target.value)}>
            {sheetNames.map((name) => <option key={name} value={name}>{name}</option>)}
          </Select>
        </FormField>
      ) : null}
      {sheetNames.length === 1 && sheetName ? <p className="production-import-file__name"><span>Sheet</span><strong>{sheetName}</strong></p> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </section>
  )
}
