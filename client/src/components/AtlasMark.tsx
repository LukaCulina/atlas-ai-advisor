interface AtlasMarkProps {
  size?: number;
}

export function AtlasMark({ size = 16 }: AtlasMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden="true"
      className="atlas-mark"
    >
      <circle cx="16" cy="16" r="15" fill="#2563eb" />
      <path d="M16 6 L20.5 16 L16 16 Z" fill="#ffffff" />
      <path d="M16 6 L11.5 16 L16 16 Z" fill="#cfe0ff" />
      <path d="M16 26 L20.5 16 L16 16 Z" fill="#1d4ed8" />
      <path d="M16 26 L11.5 16 L16 16 Z" fill="#1e40af" />
      <circle cx="16" cy="16" r="1.6" fill="#0f1b26" />
    </svg>
  );
}
