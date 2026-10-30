import { useLocation, useNavigate } from 'react-router-dom'
import Icon from './Icons'

const steps = [
  { path: '/', label: 'Ukuran Banner' },
  { path: '/order', label: 'Kustomisasi & Desain' },
  { path: '/preview', label: 'Preview Desain' },
  { path: '/checkout', label: 'Checkout & Pengiriman' },
]

export default function Stepper() {
  const location = useLocation()
  const navigate = useNavigate()
  const currentIdx = steps.findIndex(s => s.path === location.pathname)

  return (
    <div className="stepper">
      {steps.map((step, i) => (
        <div key={step.path} style={{ display: 'contents' }}>
          <div
            className={`stepper-step ${i === currentIdx ? 'active' : ''} ${i < currentIdx ? 'completed' : ''}`}
            onClick={() => navigate(step.path)}
          >
            <div className="step-circle">
              {i < currentIdx ? <Icon name="check" size="sm" /> : i + 1}
            </div>
            <span>{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`stepper-line ${i < currentIdx ? 'completed' : ''}`} />
          )}
        </div>
      ))}
    </div>
  )
}
