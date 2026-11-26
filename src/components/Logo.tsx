export function Logo({ size = 32 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-grid place-items-center rounded-lg bg-accent font-bold text-on-accent"
      style={{ width: size, height: size, fontSize: size * 0.68, lineHeight: 1 }}
    >
      L
    </span>
  );
}
