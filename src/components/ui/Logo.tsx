import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface LogoProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ size = 'md', className, ...props }: LogoProps) {
  const sizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl'
  };
  
  return (
    <div className={cn('flex items-center gap-2', className)} {...props}>
      <div className="bg-primary text-primary-foreground rounded-xl p-2 shadow-soft">
        <svg className={cn('w-6 h-6', size === 'lg' && 'w-8 h-8', size === 'sm' && 'w-5 h-5')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className={cn('font-bold text-primary leading-none', sizes[size])}>
          Craftora
        </span>
        <span className="text-xs text-muted-foreground leading-none mt-0.5">
          Made with Heart
        </span>
      </div>
    </div>
  );
}
