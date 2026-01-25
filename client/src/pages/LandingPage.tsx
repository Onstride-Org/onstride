import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  CreditCard,
  Bell,
  Check,
  ChevronRight,
  Star,
  Shield,
  Zap,
  ArrowRight
} from 'lucide-react';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
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
    <div className="landing-page">
      {/* Navigation */}
      <nav className={`landing-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="landing-nav-container">
          <div className="landing-logo">
            <span className="logo-text">OnStride</span>
            <span className="beta-badge">BETA</span>
          </div>

          {/* Desktop Nav */}
          <div className="landing-nav-links">
            <button onClick={() => scrollToSection('features')} className="nav-link">Features</button>
            <button onClick={() => scrollToSection('pricing')} className="nav-link">Pricing</button>
            <button onClick={() => scrollToSection('founders')} className="nav-link">Founders Program</button>
          </div>

          <div className="landing-nav-actions">
            <Link to="/login" className="btn btn-ghost">Sign In</Link>
            <a href="#demo" className="btn btn-primary" onClick={(e) => { e.preventDefault(); scrollToSection('demo'); }}>
              Request Demo
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button className="landing-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="landing-mobile-menu">
            <button onClick={() => scrollToSection('features')} className="mobile-nav-link">Features</button>
            <button onClick={() => scrollToSection('pricing')} className="mobile-nav-link">Pricing</button>
            <button onClick={() => scrollToSection('founders')} className="mobile-nav-link">Founders Program</button>
            <hr />
            <Link to="/login" className="mobile-nav-link">Sign In</Link>
            <a href="#demo" className="btn btn-primary btn-block" onClick={(e) => { e.preventDefault(); scrollToSection('demo'); setIsMenuOpen(false); }}>
              Request Demo
            </a>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-headline">
                The Operating System for Modern Horse Barns
              </h1>
              <p className="hero-subheadline">
                Manage horses, staff, clients, and payments — all in one platform.
              </p>
              <div className="hero-ctas">
                <a href="#demo" className="btn btn-primary btn-lg" onClick={(e) => { e.preventDefault(); scrollToSection('demo'); }}>
                  Request a Demo
                  <ArrowRight size={20} />
                </a>
                <button onClick={() => scrollToSection('how-it-works')} className="btn btn-outline btn-lg">
                  See How It Works
                </button>
              </div>
              <p className="hero-trust-line">
                Built for professional barns. Designed to scale.
              </p>
            </div>
            <div className="hero-visual">
              <div className="hero-mockup">
                <div className="mockup-placeholder">
                  <span>Dashboard Preview</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem → Solution Section */}
      <section className="landing-section landing-problem">
        <div className="landing-container">
          <div className="section-header">
            <h2 className="section-headline">Barns Run on Paper. Businesses Don't.</h2>
            <p className="section-description">
              Most barns still rely on paper logs, scattered spreadsheets, and manual processes.
              Payments get missed. Schedules get lost. Staff and clients stay disconnected.
              It's time for something better.
            </p>
          </div>

          <div className="problem-grid">
            <div className="problem-item">
              <div className="problem-icon">
                <X size={24} />
              </div>
              <p>No centralized system for barn operations</p>
            </div>
            <div className="problem-item">
              <div className="problem-icon">
                <X size={24} />
              </div>
              <p>Manual billing and scheduling headaches</p>
            </div>
            <div className="problem-item">
              <div className="problem-icon">
                <X size={24} />
              </div>
              <p>Disconnected staff and client communication</p>
            </div>
          </div>

          <div className="solution-statement">
            <Check size={32} className="solution-check" />
            <p><strong>OnStride replaces all of this</strong> with one unified platform.</p>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="landing-section landing-features">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-label">Features</span>
            <h2 className="section-headline">Everything Your Barn Needs</h2>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <LayoutDashboard size={28} />
              </div>
              <h3>Barn & Horse Management</h3>
              <p>Complete profiles, health records, documents, and ride logs for every horse in your care.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Users size={28} />
              </div>
              <h3>Staff & Client Portals</h3>
              <p>Role-based access ensures everyone sees exactly what they need — nothing more, nothing less.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <CreditCard size={28} />
              </div>
              <h3>Billing & Payments</h3>
              <p>Automated invoicing, payment tracking, and financial reporting built for equine operations.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Bell size={28} />
              </div>
              <h3>Tasks & Automation</h3>
              <p>Schedule tasks, send reminders, and keep your entire team aligned without the chaos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="landing-section landing-how-it-works">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-label">How It Works</span>
            <h2 className="section-headline">Up and Running in Minutes</h2>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-visual">
                <div className="step-placeholder"></div>
              </div>
              <h3>Create Your Barn</h3>
              <p>Set up your barn profile with your details and preferences.</p>
            </div>

            <div className="step-connector">
              <ChevronRight size={24} />
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-visual">
                <div className="step-placeholder"></div>
              </div>
              <h3>Add Horses & People</h3>
              <p>Invite staff, add clients, and create profiles for every horse.</p>
            </div>

            <div className="step-connector">
              <ChevronRight size={24} />
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-visual">
                <div className="step-placeholder"></div>
              </div>
              <h3>Manage Everything</h3>
              <p>Run your entire operation from one unified dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why OnStride Section */}
      <section className="landing-section landing-why">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-label">Why OnStride</span>
            <h2 className="section-headline">Built Specifically for the Equine Industry</h2>
          </div>

          <div className="why-grid">
            <div className="why-item">
              <Star size={24} className="why-icon" />
              <div>
                <h4>Designed Around Real Barn Workflows</h4>
                <p>Every feature is built from the ground up for how barns actually operate.</p>
              </div>
            </div>

            <div className="why-item">
              <Shield size={24} className="why-icon" />
              <div>
                <h4>Secure, Modern Infrastructure</h4>
                <p>Enterprise-grade security with a modern SaaS architecture you can trust.</p>
              </div>
            </div>

            <div className="why-item">
              <Zap size={24} className="why-icon" />
              <div>
                <h4>Scales With Your Operation</h4>
                <p>From small training barns to large boarding facilities — OnStride grows with you.</p>
              </div>
            </div>

            <div className="why-item">
              <Check size={24} className="why-icon" />
              <div>
                <h4>Eliminates Manual Processes</h4>
                <p>No more blind spots, missed tasks, or lost paperwork.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="landing-section landing-comparison">
        <div className="landing-container">
          <div className="section-header">
            <h2 className="section-headline">Why Barns Are Switching to OnStride</h2>
          </div>

          <div className="comparison-table">
            <div className="comparison-column comparison-old">
              <h3>Traditional Tools</h3>
              <ul>
                <li><X size={18} /> Paper logs and binders</li>
                <li><X size={18} /> Scattered spreadsheets</li>
                <li><X size={18} /> Disconnected software</li>
                <li><X size={18} /> Manual billing processes</li>
                <li><X size={18} /> No real-time visibility</li>
              </ul>
            </div>

            <div className="comparison-divider">
              <span>vs</span>
            </div>

            <div className="comparison-column comparison-new">
              <h3>OnStride</h3>
              <ul>
                <li><Check size={18} /> Centralized system</li>
                <li><Check size={18} /> Automated workflows</li>
                <li><Check size={18} /> Role-based access</li>
                <li><Check size={18} /> Integrated payments</li>
                <li><Check size={18} /> AI-driven insights</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="landing-section landing-pricing">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-label">Pricing</span>
            <h2 className="section-headline">Flexible Plans for Every Size Operation</h2>
            <p className="section-description">Start free. Scale as your barn grows.</p>
          </div>

          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="pricing-header">
                <h3>Free</h3>
                <div className="pricing-amount">
                  <span className="price">$0</span>
                  <span className="period">/month</span>
                </div>
              </div>
              <p className="pricing-description">Perfect for getting started</p>
              <ul className="pricing-features">
                <li><Check size={16} /> Core features</li>
                <li><Check size={16} /> Up to 6 horses</li>
                <li><Check size={16} /> Basic reporting</li>
                <li><Check size={16} /> Email support</li>
              </ul>
              <a href="#demo" className="btn btn-outline btn-block" onClick={(e) => { e.preventDefault(); scrollToSection('demo'); }}>
                Get Started
              </a>
            </div>

            <div className="pricing-card">
              <div className="pricing-header">
                <h3>Starter</h3>
                <div className="pricing-amount">
                  <span className="price">$99</span>
                  <span className="period">/month</span>
                </div>
              </div>
              <p className="pricing-description">For growing operations</p>
              <ul className="pricing-features">
                <li><Check size={16} /> Everything in Free</li>
                <li><Check size={16} /> Up to 15 horses</li>
                <li><Check size={16} /> Select AI features</li>
                <li><Check size={16} /> Priority support</li>
              </ul>
              <a href="#demo" className="btn btn-outline btn-block" onClick={(e) => { e.preventDefault(); scrollToSection('demo'); }}>
                Request Demo
              </a>
            </div>

            <div className="pricing-card pricing-featured">
              <div className="pricing-badge">Most Popular</div>
              <div className="pricing-header">
                <h3>Business</h3>
                <div className="pricing-amount">
                  <span className="price-prefix">Starting at</span>
                  <span className="price">$500</span>
                  <span className="period">/month</span>
                </div>
              </div>
              <p className="pricing-description">Full-featured for serious operations</p>
              <ul className="pricing-features">
                <li><Check size={16} /> Everything in Starter</li>
                <li><Check size={16} /> Unlimited horses & users</li>
                <li><Check size={16} /> Full AI Smart Manager</li>
                <li><Check size={16} /> Advanced automation</li>
                <li><Check size={16} /> Custom integrations</li>
              </ul>
              <a href="#demo" className="btn btn-primary btn-block" onClick={(e) => { e.preventDefault(); scrollToSection('demo'); }}>
                Book a Demo
              </a>
            </div>

            <div className="pricing-card">
              <div className="pricing-header">
                <h3>Enterprise</h3>
                <div className="pricing-amount">
                  <span className="price">Custom</span>
                </div>
              </div>
              <p className="pricing-description">For large-scale operations</p>
              <ul className="pricing-features">
                <li><Check size={16} /> Everything in Business</li>
                <li><Check size={16} /> Custom features</li>
                <li><Check size={16} /> Dedicated support</li>
                <li><Check size={16} /> SLA guarantees</li>
                <li><Check size={16} /> On-premise options</li>
              </ul>
              <a href="#demo" className="btn btn-outline btn-block" onClick={(e) => { e.preventDefault(); scrollToSection('demo'); }}>
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Founders Program Section */}
      <section id="founders" className="landing-section landing-founders">
        <div className="landing-container">
          <div className="founders-card">
            <div className="founders-content">
              <span className="founders-label">Limited Availability</span>
              <h2 className="founders-headline">OnStride Founders Program</h2>
              <p className="founders-subheadline">Early partners shaping the future of OnStride.</p>

              <p className="founders-description">
                We're inviting a limited number of barns to join our Founders Program. As a founding member,
                you'll receive full platform access as features launch, priority support, and exclusive benefits.
              </p>

              <ul className="founders-benefits">
                <li><Check size={20} /> Full access to all new features while enrolled</li>
                <li><Check size={20} /> Priority support and direct feedback channel</li>
                <li><Check size={20} /> Invitations to future OnStride events</li>
                <li><Check size={20} /> Automatic entry into giveaways</li>
              </ul>

              <p className="founders-scarcity">
                <strong>Limited to 50 founding barns.</strong> Once full, this program closes.
              </p>

              <a href="#demo" className="btn btn-primary btn-lg" onClick={(e) => { e.preventDefault(); scrollToSection('demo'); }}>
                Apply for Founders Access
                <ArrowRight size={20} />
              </a>
            </div>

            <div className="founders-visual">
              <div className="founders-placeholder">
                <Star size={48} />
                <span>Founders</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section id="demo" className="landing-section landing-final-cta">
        <div className="landing-container">
          <div className="final-cta-content">
            <h2>Ready to Modernize Your Barn?</h2>
            <p>Join the next generation of equine operations.</p>

            <form className="demo-form" onSubmit={(e) => { e.preventDefault(); alert('Demo request submitted! We\'ll be in touch soon.'); }}>
              <div className="demo-form-row">
                <input type="text" placeholder="Your Name" required className="form-input" />
                <input type="email" placeholder="Email Address" required className="form-input" />
              </div>
              <div className="demo-form-row">
                <input type="text" placeholder="Barn Name" className="form-input" />
                <select className="form-select" defaultValue="">
                  <option value="" disabled>Number of Horses</option>
                  <option value="1-10">1-10</option>
                  <option value="11-25">11-25</option>
                  <option value="26-50">26-50</option>
                  <option value="51-100">51-100</option>
                  <option value="100+">100+</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-lg btn-block">
                Request a Demo
                <ArrowRight size={20} />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="landing-logo">
                <span className="logo-text">OnStride</span>
              </div>
              <p>&copy; {new Date().getFullYear()} OnStride. All rights reserved.</p>
            </div>

            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <button onClick={() => scrollToSection('features')}>Features</button>
                <button onClick={() => scrollToSection('pricing')}>Pricing</button>
                <button onClick={() => scrollToSection('how-it-works')}>How It Works</button>
              </div>

              <div className="footer-column">
                <h4>Company</h4>
                <a href="#">About</a>
                <a href="#">Blog</a>
                <a href="#">Careers</a>
              </div>

              <div className="footer-column">
                <h4>Contact</h4>
                <a href="mailto:hello@onstride.io">hello@onstride.io</a>
                <a href="#">Support</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <a href="#">Terms of Service</a>
            <span className="footer-divider">|</span>
            <a href="#">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
