export function ToolIcon({ name, iconUrl, size = 36, round = false }: { name: string; iconUrl?: string | null; size?: number; round?: boolean }) {
  const shape = round ? 'rounded-full' : 'rounded-xl';
  if (iconUrl) {
    return <img src={iconUrl} alt="" width={size} height={size} className={`shrink-0 ${shape} bg-surface object-cover`} style={{ width: size, height: size }} />;
  }
  return (
    <span aria-hidden="true" className={`grid shrink-0 place-items-center ${shape} bg-surface font-semibold text-accent`} style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
