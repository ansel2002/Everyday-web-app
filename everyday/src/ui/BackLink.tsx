import { href, type Route } from '../router';
import { Icon } from './Icon';

type Props = { to: Route; param?: string; label?: string; className?: string };

export function BackLink({ to, param, label = 'Back', className = '' }: Props) {
  return (
    <a className={`back-link ${className}`} href={href(to, param)}>
      <Icon name="back" />
      {label}
    </a>
  );
}
