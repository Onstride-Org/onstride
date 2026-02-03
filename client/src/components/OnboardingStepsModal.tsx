import { X, CheckCircle2 } from 'lucide-react';

interface OnboardingStepsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  {
    title: 'Add your horses',
    description: 'Create horse profiles so everything is organized from day one.',
  },
  {
    title: 'Invite your team',
    description: 'Assign roles to trainers, groomers, and staff.',
  },
  {
    title: 'Schedule your first tasks',
    description: 'Start tracking lessons, care tasks, and reminders.',
  },
];

export default function OnboardingStepsModal({ isOpen, onClose }: OnboardingStepsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">First steps</h2>
          <button className="btn btn-ghost modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <p className="text-muted mb-4">
            Welcome to OnStride! Here are three quick steps to get set up.
          </p>
          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.title} className="card">
                <div className="card-body">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={20} />
                    <div>
                      <div className="font-medium">{step.title}</div>
                      <div className="text-muted text-sm">{step.description}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Get Started</button>
        </div>
      </div>
    </div>
  );
}
