import { useNavigate } from 'react-router-dom'

import { Button } from '../ui/Button'
import { PageHeader } from './PageHeader'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <section className="placeholder-page">
      <PageHeader title="Page not found" description="The requested page does not exist." />
      <div className="placeholder-page__message">
        <p>Use the dashboard to continue working in Production Control.</p>
        <Button type="button" onClick={() => navigate('/')}>Back to Dashboard</Button>
      </div>
    </section>
  )
}
