import React from 'react';

interface DebugInfoProps {
  isVisible?: boolean;
}

const DebugInfo: React.FC<DebugInfoProps> = ({ isVisible = false }) => {
  if (!isVisible || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const envInfo = {
    NODE_ENV: process.env.NODE_ENV,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Not Set',
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not Set',
    UserAgent: navigator.userAgent,
    Location: window.location.href,
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div className="space-y-1">
        {Object.entries(envInfo).map(([key, value]) => (
          <div key={key}>
            <span className="font-mono text-yellow-400">{key}:</span>{' '}
            <span className="font-mono text-green-400">{String(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebugInfo;
