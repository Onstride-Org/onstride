import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, CreditCard, Clock, Sparkles } from 'lucide-react';
import { subscriptionsApi } from '../services/api';

interface PaymentPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTrial?: () => void; // kept for backwards compatibility
}

interface PlanData {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  highlighted: boolean;
  badge?: string;
}

// Fallback plans that match actual subscription tiers
const FALLBACK_PLANS: PlanData[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 15,
    description: 'For small barns getting started',
    features: ['Up to 15 horses', 'Up to 10 users', '50 lessons/month', 'Billing & Invoicing'],
    highlighted: false,
  },
  {
    id: 'business',
    name: 'Business',
    price: 99,
    description: 'For growing operations',
    features: ['Up to 50 horses', 'Up to 25 users', '200 lessons/month', 'Custom Branding', 'Priority support'],
    highlighted: true,
    badge: 'Most popular',
  },
  {
    id: 'business_pro',
    name: 'Business Pro',
    price: 299,
    description: 'Full platform for professional barns',
    features: ['Up to 150 horses', 'Up to 75 users', '500 lessons/month', 'AI Features', 'Multi-Barn Support', 'API Access'],
    highlighted: false,
  },
];

export default function PaymentPromptModal({ isOpen, onClose, onStartTrial: _onStartTrial }: PaymentPromptModalProps) {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState('starter');
  const [plans, setPlans] = useState<PlanData[]>(FALLBACK_PLANS);

  // Fetch real plans from API
  useEffect(() => {
    if (!isOpen) return;
    subscriptionsApi.getPlans().then((data: any) => {
      const apiPlans = Array.isArray(data) ? data : data?.plans || [];
      if (apiPlans.length > 0) {
        const mapped: PlanData[] = apiPlans
          .filter((p: any) => p.tier !== 'free' && !p.contactEmail)
          .map((p: any) => {
            const features: string[] = [];
            features.push(`Up to ${p.maxHorses === -1 ? 'Unlimited' : p.maxHorses} horses`);
            features.push(`Up to ${p.maxUsers === -1 ? 'Unlimited' : p.maxUsers} users`);
            features.push(`${p.maxLessonsPerMonth === -1 ? 'Unlimited' : p.maxLessonsPerMonth} lessons/month`);
            if (p.hasBilling) features.push('Billing & Invoicing');
            if (p.hasBranding) features.push('Custom Branding');
            if (p.hasAiFeatures) features.push('AI Features');
            if (p.hasMultiBarn) features.push('Multi-Barn Support');
            return {
              id: p.tier,
              name: p.name,
              price: p.monthlyPriceCents / 100,
              description: p.description,
              features,
              highlighted: p.isPopular || false,
              badge: p.isPopular ? 'Most popular' : undefined,
            };
          });
        if (mapped.length > 0) {
          setPlans(mapped);
        }
      }
    }).catch(() => { /* use fallback */ });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleContinue = () => {
    // Navigate to subscription page for plan selection + payment
    navigate('/app/settings/subscription', { state: { selectedPlan } });
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
              <span>Payments processed by Windcave</span>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={handleContinue}>
            {`Continue with ${plans.find(p => p.id === selectedPlan)?.name || 'Selected Plan'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
