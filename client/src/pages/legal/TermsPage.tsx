import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-primary-600 hover:underline mb-8">
          <ArrowLeft size={18} />
          Back to home
        </Link>
        <article className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 md:p-10">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Terms of Service</h1>
          <p className="text-neutral-500 text-sm mb-8">Last updated: February 2026</p>
          <div className="prose prose-neutral max-w-none">
            <p>
              Welcome to OnStride. By using our services, you agree to these Terms of Service.
              Please read them carefully.
            </p>
            <h2 className="text-lg font-semibold mt-6 mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using OnStride (&quot;the Service&quot;), you agree to be bound by these
              Terms of Service and our Privacy Policy. If you do not agree, do not use the Service.
            </p>
            <h2 className="text-lg font-semibold mt-6 mb-2">2. Description of Service</h2>
            <p>
              OnStride provides barn management software including horse records, scheduling,
              invoicing, and payment processing. We may update or discontinue features with notice
              where reasonable.
            </p>
            <h2 className="text-lg font-semibold mt-6 mb-2">3. Your Responsibilities</h2>
            <p>
              You are responsible for maintaining the security of your account, for all activity
              under your account, and for ensuring your use of the Service complies with applicable
              laws and these Terms.
            </p>
            <h2 className="text-lg font-semibold mt-6 mb-2">4. Payment Terms</h2>
            <p>
              Subscription and payment terms are set out in your plan and on the Subscription
              page. You agree to pay all fees due for your selected plan.
            </p>
            <h2 className="text-lg font-semibold mt-6 mb-2">5. Contact</h2>
            <p>
              For questions about these Terms, contact us at admin@onstrideapp.com.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
