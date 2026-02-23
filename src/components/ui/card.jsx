export function Card({ className = "", children }) {
  return (
    <div className={`bg-slate-800 border border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ className = "", children }) {
  return <div className={className}>{children}</div>;
}