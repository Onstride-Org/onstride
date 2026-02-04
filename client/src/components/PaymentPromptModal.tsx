import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, CreditCard, Clock, Sparkles } from 'lucide-react';

interface PaymentPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTrial?: () => void;
}

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'For small operations getting started',
    features: ['Up to 6 horses', 'Basic scheduling', 'Horse profiles', 'Email support'],
    highlighted: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 99,
    description: 'For growing barns',
    features: ['Up to 15 horses', 'Full scheduling', 'Invoicing & payments', 'Client portal', 'Priority support'],
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 299,
    description: 'For growing operations',
    features: ['Up to 50 horses', 'Unlimited users', 'Advanced automation', 'Custom reports', 'API access'],
    highlighted: true,
    badge: 'Most popular',
  },
];

export default function PaymentPromptModal({ isOpen, onClose, onStartTrial }: PaymentPromptModalProps) {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState('starter');

  if (!isOpen) return null;

  const handleContinue = () => {
    if (selectedPlan === 'free') {
      // For free plan, just close and continue
      onClose();
    } else {
      // Navigate to subscription page for paid plans
      navigate('/app/settings/subscription', { state: { selectedPlan } });
      onClose();
    }
  };

  const handleStartFreeTrial = () => {
    if (onStartTrial) {
      onStartTrial();
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Choose Your Plan</h2>
            <p className="text-muted text-sm mt-1">Select the plan that best fits your barn's needs</p>
          </div>
          <button className="btn btn-ghost modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <div className="payment-prompt-plans">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`payment-plan-card ${selectedPlan === plan.id ? 'selected' : ''} ${plan.highlighted ? 'highlighted' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.badge && (
                  <div className="plan-badge">
                    <Sparkles size={12} />
                    {plan.badge}
                  </div>
                )}
                <div className="plan-header">
                  <h3 className="plan-name">{plan.name}</h3>
                  <div className="plan-price">
                    <span className="plan-currency">$</span>
                    <span className="plan-amount">{plan.price}</span>
                    <span className="plan-period">/mo</span>
                  </div>
                  <p className="plan-description">{plan.description}</p>
                </div>
                <ul className="plan-features">
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check size={16} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="plan-select-indicator">
                  {selectedPlan === plan.id ? (
                    <div className="selected-check">
                      <Check size={16} />
                    </div>
                  ) : (
                    <div className="unselected-circle" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="payment-prompt-info">
            <div className="info-item">
              <Clock size={18} />
              <span>14-day free trial on all paid plans</span>
            </div>
            <div className="info-item">
              <CreditCard size={18} />
              <span>No credit card required to start</span>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={handleStartFreeTrial}>
            Start with Free
          </button>
          <button className="btn btn-primary" onClick={handleContinue}>
            {selectedPlan === 'free' ? 'Continue with Free' : `Start ${plans.find(p => p.id === selectedPlan)?.name} Trial`}
          </button>
        </div>
      </div>
    </div>
  );
}
