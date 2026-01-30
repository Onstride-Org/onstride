import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  BarChart3,
  Users,
  Calendar,
  CreditCard,
  FileText,
  Shield,
  Zap,
  Clock,
  Star,
  ChevronRight
} from 'lucide-react';

// Demo booking form data interface
interface DemoFormData {
  isDecisionMaker: string;
  discipline: string;
  horseCount: string;
  barnName: string;
  userName: string;
  email: string;
  selectedDate: string;
  selectedTime: string;
}

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAnnouncementClosed, setIsAnnouncementClosed] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openDemoModal = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setShowDemoModal(true);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <div className={`landing-page ${!isAnnouncementClosed ? 'has-announcement' : ''}`}>
      {/* Announcement Bar */}
      {!isAnnouncementClosed && (
        <div className="announcement-bar">
          <div className="announcement-content">
            <span className="announcement-text">
              Join our BETA now for early access
            </span>
            <a 
              href="#demo" 
              className="announcement-link"
              onClick={(e) => { 
                e.preventDefault(); 
                scrollToSection('demo'); 
              }}
            >
              Sign up
              <ArrowRight size={14} />
            </a>
          </div>
          <button 
            className="announcement-close"
            onClick={() => setIsAnnouncementClosed(true)}
            aria-label="Close announcement"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Navigation - Linear-style minimal */}
      <nav className={`landing-nav ${isScrolled ? 'scrolled' : ''} ${!isAnnouncementClosed ? 'with-announcement' : ''}`}>
        <div className="landing-nav-container">
          <Link to="/" className="landing-logo">
            <span className="logo-text">OnStride</span>
            <span className="beta-badge">BETA</span>
          </Link>

          <div className="landing-nav-links">
            <button onClick={() => scrollToSection('platform')} className="nav-link">Platform</button>
            <button onClick={() => scrollToSection('features')} className="nav-link">Features</button>
            <button onClick={() => scrollToSection('pricing')} className="nav-link">Pricing</button>
          </div>

          <div className="landing-nav-actions">
            <Link to="/login" className="nav-link">Sign in</Link>
            <button className="btn btn-primary" onClick={openDemoModal}>
              Get a Demo
            </button>
          </div>

          <button className="landing-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="landing-mobile-menu">
            <button onClick={() => scrollToSection('platform')} className="mobile-nav-link">Platform</button>
            <button onClick={() => scrollToSection('features')} className="mobile-nav-link">Features</button>
            <button onClick={() => scrollToSection('pricing')} className="mobile-nav-link">Pricing</button>
            <div className="mobile-menu-divider" />
            <Link to="/login" className="mobile-nav-link">Sign in</Link>
            <button className="btn btn-primary btn-block" onClick={(e) => { openDemoModal(e); setIsMenuOpen(false); }}>
              Get a Demo
            </button>
          </div>
        )}
      </nav>

      {/* Hero - ServiceTitan structure, Linear polish */}
      <section className="landing-hero">
        <div className="landing-container">
          <div className="hero-content-wrapper">
            <div className="hero-content">
              <h1 className="hero-headline">
                The #1 software for<br />
                <span className="hero-highlight">modern horse barns</span>
              </h1>
              <p className="hero-subheadline">
                Run your entire equine operation from one platform. Manage horses, coordinate staff, engage clients, and grow revenue—all in one place.
              </p>
              <div className="hero-email-form">
                <button className="btn btn-primary btn-lg hero-cta-button" onClick={openDemoModal}>
                  Book a Demo
                  <ArrowRight size={18} />
                </button>
              </div>
              <div className="hero-social-proof">
                <div className="social-proof-item">
                  <div className="social-proof-stars">
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                  </div>
                  <span className="social-proof-rating">4.8</span>
                  <span className="social-proof-label">Capterra</span>
                </div>
                <div className="social-proof-item">
                  <div className="social-proof-stars">
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                  </div>
                  <span className="social-proof-rating">4.9</span>
                  <span className="social-proof-label">Software Advice</span>
                </div>
              </div>
            </div>
            <div className="hero-visual">
              <img src="/hero.png" alt="OnStride platform" className="hero-image" />
            </div>
          </div>
        </div>
      </section>

      {/* Platform Overview - ServiceTitan style */}
      <section id="platform" className="landing-section">
        <div className="landing-container">
          <div className="section-header section-header-wide">
            <span className="section-eyebrow">The Platform</span>
            <h2 className="section-headline">
              One operating system.<br />Your entire operation.
            </h2>
            <p className="section-description">
              From horse health records to client billing, from staff scheduling to revenue insights—everything your barn needs, unified in one intelligent platform.
            </p>
          </div>

          <div className="platform-grid">
            <div className="platform-card platform-card-featured">
              <div className="platform-card-content">
                <div className="platform-icon">
                  <BarChart3 size={24} />
                </div>
                <h3>Complete Visibility</h3>
                <p>See your entire operation at a glance. Track horses, monitor tasks, and stay on top of payments from a single dashboard.</p>
                <ul className="platform-features">
                  <li><Check size={16} /> Real-time dashboard</li>
                  <li><Check size={16} /> Performance analytics</li>
                  <li><Check size={16} /> Custom reports</li>
                </ul>
              </div>
              <div className="platform-card-visual">
                <img src="/CompleteVisibilityImage.png" alt="OnStride mobile dashboard" className="platform-image" />
              </div>
            </div>

            <div className="platform-card">
              <div className="platform-icon">
                <Users size={24} />
              </div>
              <h3>Team Coordination</h3>
              <p>Role-based access for owners, managers, trainers, and boarders. Everyone sees exactly what they need.</p>
            </div>

            <div className="platform-card">
              <div className="platform-icon">
                <CreditCard size={24} />
              </div>
              <h3>Automated Billing</h3>
              <p>Generate invoices, track payments, and manage recurring charges without the manual work.</p>
            </div>

            <div className="platform-card">
              <div className="platform-icon">
                <Calendar size={24} />
              </div>
              <h3>Smart Scheduling</h3>
              <p>Coordinate lessons, farrier visits, vet appointments, and daily tasks in one calendar.</p>
            </div>

            <div className="platform-card">
              <div className="platform-icon">
                <FileText size={24} />
              </div>
              <h3>Horse Records</h3>
              <p>Complete profiles with health records, documents, and ride logs for every horse.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Deep Dive */}
      <section id="features" className="landing-section landing-section-alt">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-eyebrow">Features</span>
            <h2 className="section-headline">Everything you need to<br />run a professional barn</h2>
          </div>

          <div className="features-showcase">
            <div className="feature-row">
              <div className="feature-content">
                <div className="feature-badge">Horse Management</div>
                <h3>Complete horse profiles at your fingertips</h3>
                <p>Store everything about each horse in one place—health records, documents, feeding schedules, and training notes. Access it all from any device.</p>
                <ul className="feature-list">
                  <li><Check size={18} /> Health & vaccination tracking</li>
                  <li><Check size={18} /> Document storage</li>
                  <li><Check size={18} /> Ride logs & training notes</li>
                  <li><Check size={18} /> Owner information</li>
                </ul>
              </div>
              <div className="feature-visual">
                <img src="/horseProfile.png" alt="Horse profile management" className="feature-image" />
              </div>
            </div>

            <div className="feature-row feature-row-reverse">
              <div className="feature-content">
                <div className="feature-badge">Scheduling & Tasks</div>
                <h3>Never miss an appointment again</h3>
                <p>Manage lessons, coordinate vendors, and assign daily tasks to your team. Automated reminders keep everyone on track.</p>
                <ul className="feature-list">
                  <li><Check size={18} /> Lesson scheduling</li>
                  <li><Check size={18} /> Task assignment</li>
                  <li><Check size={18} /> Automated reminders</li>
                  <li><Check size={18} /> Vendor coordination</li>
                </ul>
              </div>
              <div className="feature-visual">
                <img src="/calendar.png" alt="Calendar and scheduling" className="feature-image" />
              </div>
            </div>

            <div className="feature-row">
              <div className="feature-content">
                <div className="feature-badge">Billing & Payments</div>
                <h3>Get paid faster, stress less</h3>
                <p>Automate invoicing, track payments, and manage recurring charges. Know exactly who owes what, and when.</p>
                <ul className="feature-list">
                  <li><Check size={18} /> Automated invoicing</li>
                  <li><Check size={18} /> Payment tracking</li>
                  <li><Check size={18} /> Recurring charges</li>
                  <li><Check size={18} /> Financial reports</li>
                </ul>
              </div>
              <div className="feature-visual">
                <img src="/invoice.png" alt="Billing and invoices" className="feature-image" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why OnStride */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-eyebrow">Why OnStride</span>
            <h2 className="section-headline">Built for how barns<br />actually work</h2>
          </div>

          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">
                <Zap size={24} />
              </div>
              <h4>Purpose-built for equine</h4>
              <p>Not a generic tool adapted for horses. Every feature designed specifically for barn operations.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">
                <Clock size={24} />
              </div>
              <h4>Save hours every week</h4>
              <p>Automate the tedious work. Spend more time with horses and clients, less time on paperwork.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">
                <Shield size={24} />
              </div>
              <h4>Secure & reliable</h4>
              <p>Enterprise-grade security with 99.9% uptime. Your data is safe and always accessible.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">
                <Users size={24} />
              </div>
              <h4>Happy clients</h4>
              <p>Give boarders and lesson clients a professional experience with their own portal access.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing - Webflow style */}
      <section id="pricing" className="landing-section landing-section-alt">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-eyebrow">Pricing</span>
            <h2 className="section-headline">Simple, transparent pricing</h2>
            <p className="section-description">Start free. Upgrade when you're ready.</p>
          </div>

          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="pricing-card-header">
                <h3 className="pricing-tier">Free</h3>
                <p className="pricing-tier-desc">For small operations getting started</p>
                <div className="pricing-amount">
                  <span className="pricing-currency">$</span>
                  <span className="pricing-value">0</span>
                  <span className="pricing-period">/month</span>
                </div>
              </div>
              <div className="pricing-card-body">
                <ul className="pricing-features">
                  <li><Check size={18} /> Up to 6 horses</li>
                  <li><Check size={18} /> Basic scheduling</li>
                  <li><Check size={18} /> Horse profiles</li>
                  <li><Check size={18} /> Email support</li>
                </ul>
                <button className="btn btn-outline btn-block" onClick={openDemoModal}>
                  Get started free
                </button>
              </div>
            </div>

            <div className="pricing-card">
              <div className="pricing-card-header">
                <h3 className="pricing-tier">Starter</h3>
                <p className="pricing-tier-desc">For growing barns</p>
                <div className="pricing-amount">
                  <span className="pricing-currency">$</span>
                  <span className="pricing-value">99</span>
                  <span className="pricing-period">/month</span>
                </div>
              </div>
              <div className="pricing-card-body">
                <ul className="pricing-features">
                  <li><Check size={18} /> Up to 15 horses</li>
                  <li><Check size={18} /> Full scheduling</li>
                  <li><Check size={18} /> Invoicing & payments</li>
                  <li><Check size={18} /> Client portal</li>
                  <li><Check size={18} /> Priority support</li>
                </ul>
                <button className="btn btn-outline btn-block" onClick={openDemoModal}>
                  Start trial
                </button>
              </div>
            </div>

            <div className="pricing-card pricing-card-featured">
              <div className="pricing-badge">Most popular</div>
              <div className="pricing-card-header">
                <h3 className="pricing-tier">Pro</h3>
                <p className="pricing-tier-desc">For growing operations</p>
                <div className="pricing-amount">
                  <span className="pricing-currency">$</span>
                  <span className="pricing-value">299</span>
                  <span className="pricing-period">/month</span>
                </div>
              </div>
              <div className="pricing-card-body">
                <ul className="pricing-features">
                  <li><Check size={18} /> Up to 50 horses</li>
                  <li><Check size={18} /> Unlimited users</li>
                  <li><Check size={18} /> Advanced automation</li>
                  <li><Check size={18} /> Custom reports</li>
                  <li><Check size={18} /> Priority support</li>
                  <li><Check size={18} /> API access</li>
                </ul>
                <button className="btn btn-primary btn-block" onClick={openDemoModal}>
                  Get a demo
                </button>
              </div>
            </div>

            <div className="pricing-card pricing-card-enterprise">
              <div className="pricing-card-header">
                <h3 className="pricing-tier">Enterprise</h3>
                <p className="pricing-tier-desc">For large-scale operations</p>
                <div className="pricing-amount">
                  <span className="pricing-value pricing-custom">Custom</span>
                </div>
              </div>
              <div className="pricing-card-body">
                <ul className="pricing-features">
                  <li><Check size={18} /> Unlimited everything</li>
                  <li><Check size={18} /> Custom integrations</li>
                  <li><Check size={18} /> SLA guarantees</li>
                  <li><Check size={18} /> Dedicated onboarding</li>
                  <li><Check size={18} /> Account manager</li>
                  <li><Check size={18} /> White-glove support</li>
                </ul>
                <button className="btn btn-primary btn-block" onClick={openDemoModal}>
                  Contact sales
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founders Program */}
      <section id="founders" className="landing-section">
        <div className="landing-container">
          <div className="founders-banner">
            <div className="founders-content">
              <div className="founders-eyebrow">
                <Sparkles size={16} />
                <span>Limited availability</span>
              </div>
              <h2 className="founders-headline">Join the Founders Program</h2>
              <p className="founders-description">
                Be one of the first 50 barns to shape the future of OnStride. Get full platform access,
                priority support, and exclusive benefits as an early partner.
              </p>
              <ul className="founders-perks">
                <li><Check size={18} /> Full access to all features</li>
                <li><Check size={18} /> Direct feedback channel</li>
                <li><Check size={18} /> Priority support</li>
                <li><Check size={18} /> Founding member pricing</li>
              </ul>
              <button className="btn btn-primary btn-lg" onClick={openDemoModal}>
                Apply now
                <ArrowRight size={18} />
              </button>
            </div>
            <div className="founders-visual">
              <div className="founders-badge-large">
                <Sparkles size={32} />
                <span>Founder</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="demo" className="landing-section landing-cta">
        <div className="landing-container">
          <div className="cta-content">
            <div className="cta-eyebrow">
              <Sparkles size={16} />
              <span>See it in action</span>
            </div>
            <h2 className="cta-headline">Ready to transform your barn?</h2>
            <p className="cta-description">Get a personalized demo and see how OnStride can streamline your entire operation.</p>

            <button className="btn btn-primary btn-lg" onClick={openDemoModal}>
              Book Your Demo
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Demo Booking Modal */}
      {showDemoModal && (
        <DemoBookingModal onClose={() => setShowDemoModal(false)} />
      )}

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link to="/" className="landing-logo">
                <span className="logo-text">OnStride</span>
              </Link>
              <p className="footer-tagline">The operating system for modern horse barns.</p>
            </div>

            <div className="footer-links-group">
              <div className="footer-column">
                <h4>Product</h4>
                <button onClick={() => scrollToSection('platform')}>Platform</button>
                <button onClick={() => scrollToSection('features')}>Features</button>
                <button onClick={() => scrollToSection('pricing')}>Pricing</button>
              </div>
              <div className="footer-column">
                <h4>Company</h4>
                <a href="#">About</a>
                <a href="#">Blog</a>
                <a href="#">Careers</a>
              </div>
              <div className="footer-column">
                <h4>Support</h4>
                <a href="mailto:hello@onstride.io">Contact</a>
                <a href="#">Help Center</a>
                <a href="#">Status</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} OnStride. All rights reserved.</p>
            <div className="footer-legal">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Multi-step Demo Booking Modal
function DemoBookingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<DemoFormData>({
    isDecisionMaker: '',
    discipline: '',
    horseCount: '',
    barnName: '',
    userName: '',
    email: '',
    selectedDate: '',
    selectedTime: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const disciplines = [
    'Hunters',
    'Jumpers',
    'Dressage',
    'Racing',
    'Polo',
    'Western',
    'Eventing',
    'Reining',
    'Barrel Racing',
    'Trail Riding',
    'Other'
  ];

  const horseCounts = [
    '1-5',
    '6-10',
    '11-25',
    '26-50',
    '51-100',
    '100+'
  ];

  const availableTimes = [
    '9:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '1:00 PM',
    '2:00 PM',
    '3:00 PM',
    '4:00 PM',
    '5:00 PM'
  ];

  // Generate next 14 days for date selection
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      // Skip weekends
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push(date);
      }
    }
    return dates;
  };

  const formatDateValue = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const totalSteps = 6;

  const canProceed = () => {
    switch (step) {
      case 1: return formData.isDecisionMaker !== '';
      case 2: return formData.discipline !== '';
      case 3: return formData.horseCount !== '';
      case 4: return formData.barnName.trim() !== '';
      case 5: return formData.userName.trim() !== '' && formData.email.trim() !== '';
      case 6: return formData.selectedDate !== '' && formData.selectedTime !== '';
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < totalSteps && canProceed()) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;

    setIsSubmitting(true);

    // Save to localStorage for use when creating account
    localStorage.setItem('demoFormData', JSON.stringify(formData));

    // Simulate API call - in production, this would send to your backend
    try {
      // You would typically call your API here:
      // await api.post('/demo-requests', formData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSuccess(true);
    } catch (error) {
      console.error('Failed to submit demo request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal demo-modal" onClick={(e) => e.stopPropagation()}>
          <div className="demo-modal-success">
            <div className="success-icon-large">
              <Check size={48} />
            </div>
            <h2>Demo Scheduled!</h2>
            <p>
              We've received your demo request for {formData.selectedDate} at {formData.selectedTime}.
            </p>
            <p className="success-details">
              A confirmation email has been sent to <strong>{formData.email}</strong>.
              Our team will reach out shortly to confirm your appointment.
            </p>
            <button className="btn btn-primary btn-lg" onClick={onClose}>
              Got it!
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal demo-modal" onClick={(e) => e.stopPropagation()}>
        <div className="demo-modal-header">
          <div className="demo-progress">
            <div className="demo-progress-bar" style={{ width: `${(step / totalSteps) * 100}%` }} />
          </div>
          <button className="btn btn-ghost demo-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="demo-modal-body">
          {/* Step 1: Decision Maker */}
          {step === 1 && (
            <div className="demo-step">
              <h2>Are you the decision maker for your barn?</h2>
              <p className="demo-step-desc">We want to ensure we speak with the right person.</p>
              <div className="demo-options">
                <button
                  className={`demo-option ${formData.isDecisionMaker === 'yes' ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, isDecisionMaker: 'yes' })}
                >
                  <span className="demo-option-icon">✓</span>
                  <span className="demo-option-label">Yes, I am the owner/manager</span>
                </button>
                <button
                  className={`demo-option ${formData.isDecisionMaker === 'no' ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, isDecisionMaker: 'no' })}
                >
                  <span className="demo-option-icon">→</span>
                  <span className="demo-option-label">No, I'll need to involve someone else</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Discipline */}
          {step === 2 && (
            <div className="demo-step">
              <h2>What's your barn's main discipline?</h2>
              <p className="demo-step-desc">This helps us customize your demo experience.</p>
              <div className="demo-options demo-options-grid">
                {disciplines.map((disc) => (
                  <button
                    key={disc}
                    className={`demo-option demo-option-sm ${formData.discipline === disc ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, discipline: disc })}
                  >
                    {disc}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Horse Count */}
          {step === 3 && (
            <div className="demo-step">
              <h2>How many horses are in your barn?</h2>
              <p className="demo-step-desc">We'll show you features relevant to your barn size.</p>
              <div className="demo-options demo-options-grid">
                {horseCounts.map((count) => (
                  <button
                    key={count}
                    className={`demo-option demo-option-sm ${formData.horseCount === count ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, horseCount: count })}
                  >
                    {count} horses
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Barn Name */}
          {step === 4 && (
            <div className="demo-step">
              <h2>What's your barn's name?</h2>
              <p className="demo-step-desc">We'll personalize your demo with this info.</p>
              <div className="demo-input-group">
                <input
                  type="text"
                  className="form-input form-input-lg"
                  placeholder="Enter your barn name"
                  value={formData.barnName}
                  onChange={(e) => setFormData({ ...formData, barnName: e.target.value })}
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Step 5: Contact Info */}
          {step === 5 && (
            <div className="demo-step">
              <h2>How can we reach you?</h2>
              <p className="demo-step-desc">We'll send confirmation and reminder emails.</p>
              <div className="demo-input-group">
                <input
                  type="text"
                  className="form-input form-input-lg"
                  placeholder="Your name"
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  autoFocus
                />
                <input
                  type="email"
                  className="form-input form-input-lg"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Step 6: Schedule */}
          {step === 6 && (
            <div className="demo-step">
              <h2>Pick a time for your demo</h2>
              <p className="demo-step-desc">Choose a date and time that works for you.</p>

              <div className="demo-calendar">
                <h4>Select a date</h4>
                <div className="demo-dates">
                  {getAvailableDates().map((date) => (
                    <button
                      key={formatDateValue(date)}
                      className={`demo-date ${formData.selectedDate === formatDateValue(date) ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, selectedDate: formatDateValue(date) })}
                    >
                      <span className="demo-date-day">{date.getDate()}</span>
                      <span className="demo-date-weekday">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    </button>
                  ))}
                </div>

                {formData.selectedDate && (
                  <>
                    <h4>Select a time</h4>
                    <div className="demo-times">
                      {availableTimes.map((time) => (
                        <button
                          key={time}
                          className={`demo-time ${formData.selectedTime === time ? 'selected' : ''}`}
                          onClick={() => setFormData({ ...formData, selectedTime: time })}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="demo-modal-footer">
          {step > 1 && (
            <button className="btn btn-ghost" onClick={handleBack}>
              <ArrowLeft size={18} />
              Back
            </button>
          )}
          <div className="demo-step-indicator">
            Step {step} of {totalSteps}
          </div>
          {step < totalSteps ? (
            <button
              className="btn btn-primary"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Continue
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule Demo'}
              {!isSubmitting && <Check size={18} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
