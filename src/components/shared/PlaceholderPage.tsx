import { PageHeader } from './PageHeader'

interface PlaceholderPageProps {
  title: string
  description: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="placeholder-page">
      <PageHeader title={title} />
      <div className="placeholder-page__message">
        <p>{description}</p>
        <span>Implementation will be added in a later task.</span>
      </div>
    </section>
  )
}
