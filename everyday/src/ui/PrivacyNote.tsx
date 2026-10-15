import { Icon } from './Icon';

export function PrivacyNote({ className = '' }: { className?: string }) {
  return (
    <p className={`privacy-note ${className}`}>
      <Icon name="lock" size={18} />
      Private. Encrypted on this device.
    </p>
  );
}
