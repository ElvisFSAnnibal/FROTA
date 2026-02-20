export function Button({
  className = "",
  variant = "default",
  size = "md",
  children,
  ...props
}) {
  const baseStyles =
    "font-semibold rounded-lg transition-colors duration-200 cursor-pointer";

  const variants = {
    default:
      "bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed",
    destructive:
      "bg-red-500 hover:bg-red-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed",
  };

  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}