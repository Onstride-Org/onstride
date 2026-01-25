import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  X,
  ArrowRight,
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
  Star
} from 'lucide-react';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAnnouncementClosed, setIsAnnouncementClosed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
            <a href="#demo" className="btn btn-primary" onClick={(e) => { e.preventDefault(); scrollToSection('demo'); }}>
              Get a Demo
            </a>
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
            <a href="#demo" className="btn btn-primary btn-block" onClick={(e) => { e.preventDefault(); scrollToSection('demo'); setIsMenuOpen(false); }}>
              Get a Demo
            </a>
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
              <form className="hero-email-form" onSubmit={(e) => { e.preventDefault(); scrollToSection('demo'); }}>
                <input 
                  type="email" 
                  placeholder="Email" 
                  required 
                  className="hero-email-input"
                />
                <button type="submit" className="btn btn-primary btn-lg hero-cta-button">
                  Get Started
                  <ArrowRight size={18} />
                </button>
              </form>
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
                <a href="#demo" className="btn btn-outline btn-block" onClick={(e) => { e.preventDefault(); scrollToSection('demo'); }}>
                  Get started free
                </a>
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
                <a href="#demo" className="btn btn-outline btn-block" onClick={(e) => { e.preventDefault(); scrollToSection('demo'); }}>
                  Start trial
                </a>
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
                <a href="#demo" className="btn btn-primary btn-block" onClick={(e) => { e.preventDefault(); scrollToSection('demo'); }}>
                  Get a demo
                </a>
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
                <a href="#demo" className="btn btn-primary btn-block" onClick={(e) => { e.preventDefault(); scrollToSection('demo'); }}>
                  Contact sales
                </a>
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
              <a href="#demo" className="btn btn-primary btn-lg" onClick={(e) => { e.preventDefault(); scrollToSection('demo'); }}>
                Apply now
                <ArrowRight size={18} />
              </a>
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

            <form className="cta-form" onSubmit={(e) => { e.preventDefault(); alert('Demo request submitted! We\'ll be in touch soon.'); }}>
              <div className="cta-form-grid">
                <input type="text" placeholder="Your name" required className="form-input" />
                <input type="email" placeholder="Work email" required className="form-input" />
                <input type="text" placeholder="Barn name" className="form-input" />
                <select className="form-select" defaultValue="">
                  <option value="" disabled>Number of horses</option>
                  <option value="1-10">1-10</option>
                  <option value="11-25">11-25</option>
                  <option value="26-50">26-50</option>
                  <option value="51-100">51-100</option>
                  <option value="100+">100+</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-lg">
                Request a demo
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>
      </section>

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
