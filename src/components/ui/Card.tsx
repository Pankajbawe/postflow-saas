import { type HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 ${hover ? 'transition-all duration-200 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20 hover:border-gray-300 dark:hover:border-gray-700' : ''} ${className ?? ''}`}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Card.displayName = 'Card';

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-5 border-b border-gray-100 dark:border-gray-800 ${className ?? ''}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-base font-semibold text-gray-900 dark:text-gray-50 ${className ?? ''}`} {...props}>
      {children}
    </h3>
  );
}

export function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-5 ${className ?? ''}`} {...props}>
      {children}
    </div>
  );
}
