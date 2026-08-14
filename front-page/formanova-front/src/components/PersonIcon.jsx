export default function PersonIcon({ size = 40, color = "var(--color-blue)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.4" />
      <path
        d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}