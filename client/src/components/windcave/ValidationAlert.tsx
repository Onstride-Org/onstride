import { AlertCircle } from 'lucide-react';

interface ValidationAlertProps {
  missingFields: string[];
}

export default function ValidationAlert({ missingFields }: ValidationAlertProps) {
  if (missingFields.length === 0) return null;

  return (
    <div className="validation-alert">
      <AlertCircle size={18} />
      <div>
        <strong>Missing required fields:</strong>
        <ul>
          {missingFields.map((field, index) => (
            <li key={index}>{field}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
