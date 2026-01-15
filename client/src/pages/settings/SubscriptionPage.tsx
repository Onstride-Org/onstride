import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subscriptionsApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { SubscriptionPlan, BarnSubscription, SubscriptionTier } from '../../types';

export default function SubscriptionPage() {
  const { currentBarnId } = useAuthStore();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<BarnSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSubscriptionData = async () => {
    try {
      const [plansRes, currentRes] = await Promise.all([
        subscriptionsApi.getPlans(),
        subscriptionsApi.getCurrent(),
      ]);
      setPlans(plansRes.plans || []);
      setCurrentSubscription(currentRes);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptionData();
  }, [currentBarnId]);

  const handleUpgrade = async (tier: SubscriptionTier) => {
    try {
      const response = await subscriptionsApi.createCheckoutSession({
        tier,
        billingInterval: 'monthly',
      });
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await subscriptionsApi.createPortalSession();
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (error) {
      console.error('Failed to open billing portal:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  return (
    <div className="page subscription-page">
      <div className="page-header">
        <Link to="/settings" className="back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          Back to Settings
        </Link>
        <h1 className="page-title">Subscription</h1>
      </div>

      <div className="subscription-content">
        {/* Current Plan Card */}
        {currentSubscription && (
          <div className="card current-plan-card">
            <div className="card-header">
              <h3 className="card-title">Current Plan</h3>
              <span className={`badge badge-${currentSubscription.status === 'active' ? 'success' : 'warning'}`}>
                {currentSubscription.status}
              </span>
            </div>
            <div className="card-content">
              <div className="current-plan-info">
                <h2 className="plan-name capitalize">{currentSubscription.tier}</h2>
                <p className="plan-interval">
                  Billed {currentSubscription.billingInterval}
                </p>
                {currentSubscription.currentPeriodEnd && (
                  <p className="plan-renewal">
                    Next billing date: {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="usage-stats">
                <h4>Current Usage</h4>
                <div className="usage-items">
                  <div className="usage-item">
                    <span className="usage-label">Horses</span>
                    <span className="usage-value">{currentSubscription.currentHorseCount}</span>
                  </div>
                  <div className="usage-item">
                    <span className="usage-label">Users</span>
                    <span className="usage-value">{currentSubscription.currentUserCount}</span>
                  </div>
                  <div className="usage-item">
                    <span className="usage-label">Lessons this month</span>
                    <span className="usage-value">{currentSubscription.currentMonthLessonCount}</span>
                  </div>
                </div>
              </div>

              {currentSubscription.tier !== 'free' && (
                <button className="btn btn-outline" onClick={handleManageBilling}>
                  Manage Billing
                </button>
              )}
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <h2 className="plans-title">Available Plans</h2>
        <div className="plans-grid">
          {plans.map((plan) => (
            <div
              key={plan.tier}
              className={`plan-card ${plan.isPopular ? 'popular' : ''} ${currentSubscription?.tier === plan.tier ? 'current' : ''}`}
            >
              {plan.isPopular && <div className="popular-badge">Most Popular</div>}

              <div className="plan-header">
                <h3 className="plan-name">{plan.name}</h3>
                <p className="plan-description">{plan.description}</p>
              </div>

              <div className="plan-price">
                <span className="price-amount">
                  ${(plan.monthlyPriceCents / 100).toFixed(0)}
                </span>
                <span className="price-period">/month</span>
              </div>

              <ul className="plan-features">
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                  Up to {plan.maxHorses === -1 ? 'Unlimited' : plan.maxHorses} horses
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                  Up to {plan.maxUsers === -1 ? 'Unlimited' : plan.maxUsers} users
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                  {plan.maxLessonsPerMonth === -1 ? 'Unlimited' : plan.maxLessonsPerMonth} lessons/month
                </li>
                {plan.hasBilling && (
                  <li>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                    Billing & Invoicing
                  </li>
                )}
                {plan.hasAiFeatures && (
                  <li>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                    AI Features
                  </li>
                )}
                {plan.hasMultiBarn && (
                  <li>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                    Multi-Barn Support
                  </li>
                )}
                {plan.hasBranding && (
                  <li>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                    Custom Branding
                  </li>
                )}
                {plan.hasApiAccess && (
                  <li>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                    API Access
                  </li>
                )}
              </ul>

              <div className="plan-action">
                {currentSubscription?.tier === plan.tier ? (
                  <button className="btn btn-outline" disabled>
                    Current Plan
                  </button>
                ) : (
                  <button
                    className={`btn ${plan.isPopular ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => handleUpgrade(plan.tier)}
                  >
                    {plan.tier === 'free' ? 'Downgrade' : 'Upgrade'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Frequently Asked Questions</h3>
          </div>
          <div className="card-content">
            <div className="faq-list">
              <div className="faq-item">
                <h4>Can I change plans at any time?</h4>
                <p>Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
              </div>
              <div className="faq-item">
                <h4>What happens if I exceed my limits?</h4>
                <p>You'll be notified when approaching your limits. To continue adding horses or users, you'll need to upgrade your plan.</p>
              </div>
              <div className="faq-item">
                <h4>Is there a free trial?</h4>
                <p>All paid plans come with a 14-day free trial. No credit card required to start.</p>
              </div>
              <div className="faq-item">
                <h4>How do I cancel my subscription?</h4>
                <p>You can cancel anytime from the billing portal. Your access continues until the end of your billing period.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
