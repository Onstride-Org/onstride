import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <img src="/gl-logo.png" alt="GL Horses" className="logo-img logo-img-lg" />
          </div>
          <h1 className="auth-title">GL Horses</h1>
          <p className="auth-subtitle">Barn Management Made Simple</p>
        </div>
        {children}
      </div>
    </div>
  );
}
