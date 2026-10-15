import type { HTMLAttributes } from 'react';

/** The standard surface: card colour, 28px radius, soft shadow in light, none in dark. */
export function Card({ className = '', ...rest }: HTMLAttributes<HTMLElement>) {
  return <section className={`card ${className}`} {...rest} />;
}
