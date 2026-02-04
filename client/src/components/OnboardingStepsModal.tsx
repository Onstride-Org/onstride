import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle2, ChevronRight, Users, Calendar, PawPrint } from 'lucide-react';
import { horsesApi, usersApi, tasksApi } from '../services/api';

interface OnboardingStepsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StepStatus {
  horses: boolean;
  team: boolean;
  tasks: boolean;
}

export default function OnboardingStepsModal({ isOpen, onClose }: OnboardingStepsModalProps) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<StepStatus>({
    horses: false,
    team: false,
    tasks: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      checkCompletionStatus();
    }
  }, [isOpen]);

  const checkCompletionStatus = async () => {
    setIsLoading(true);
    try {
      const [horsesRes, usersRes, tasksRes] = await Promise.all([
        horsesApi.getAll({ limit: 1 }).catch(() => ({ data: [] })),
        usersApi.getAll({ limit: 10 }).catch(() => ({ data: [] })),
        tasksApi.getAll({ limit: 1 }).catch(() => ({ data: [] })),
      ]);

      setStatus({
        horses: (horsesRes.data?.length || 0) > 0,
        team: (usersRes.data?.length || 0) > 1, // More than just the owner
        tasks: (tasksRes.data?.length || 0) > 0,
      });
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    {
      key: 'horses' as const,
      title: 'Add your horses',
      description: 'Create horse profiles so everything is organized from day one.',
      path: '/app/horses',
      icon: PawPrint,
    },
    {
      key: 'team' as const,
      title: 'Invite your team',
      description: 'Assign roles to trainers, groomers, and staff.',
      path: '/app/users',
      icon: Users,
    },
    {
      key: 'tasks' as const,
      title: 'Schedule your first tasks',
      description: 'Start tracking lessons, care tasks, and reminders.',
      path: '/app/tasks',
      icon: Calendar,
    },
  ];

  const handleStepClick = (path: string) => {
    onClose();
    navigate(path);
  };

  const completedCount = Object.values(status).filter(Boolean).length;
  const allComplete = completedCount === steps.length;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Getting Started</h2>
            <p className="text-muted text-sm" style={{ marginTop: '4px' }}>
              {allComplete
                ? "You're all set!"
                : `${completedCount} of ${steps.length} steps completed`}
            </p>
          </div>
          <button className="btn btn-ghost modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="spinner spinner-md"></div>
            </div>
          ) : (
            <div className="onboarding-steps">
              {steps.map((step) => {
                const isComplete = status[step.key];
                const Icon = step.icon;
                return (
                  <button
                    key={step.key}
                    className={`onboarding-step ${isComplete ? 'complete' : ''}`}
                    onClick={() => handleStepClick(step.path)}
                  >
                    <div className={`onboarding-step-icon ${isComplete ? 'complete' : ''}`}>
                      {isComplete ? (
                        <CheckCircle2 size={24} />
                      ) : (
                        <Icon size={24} />
                      )}
                    </div>
                    <div className="onboarding-step-content">
                      <div className="onboarding-step-title">{step.title}</div>
                      <div className="onboarding-step-desc">{step.description}</div>
                    </div>
                    <ChevronRight size={20} className="onboarding-step-arrow" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            {allComplete ? 'Done' : 'I\'ll do this later'}
          </button>
        </div>
      </div>
    </div>
  );
}
