export default function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-gray-200 dark:bg-gray-800 rounded ${className}`}
      style={{ animation: 'skeleton-pulse 1.4s ease-in-out infinite' }}
    />
  );
}
