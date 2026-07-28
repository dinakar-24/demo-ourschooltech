interface EyesRefreshAnimationProps {
  visible: boolean;
}

export function EyesRefreshAnimation({ visible }: EyesRefreshAnimationProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center gap-4 bg-background">
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="29" fill="#fff" stroke="#5a5ce6" strokeWidth="3" />
        <circle cx="32" cy="32" r="6" fill="#000" style={{ animation: 'eyeOrbit 1.4s linear infinite' }} />
      </svg>
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="29" fill="#fff" stroke="#5a5ce6" strokeWidth="3" />
        <circle cx="32" cy="32" r="6" fill="#000" style={{ animation: 'eyeOrbit 1.4s linear 0.2s infinite' }} />
      </svg>
    </div>
  );
}
