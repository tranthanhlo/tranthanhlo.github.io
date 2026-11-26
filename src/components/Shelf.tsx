// A titled row of cards that scrolls sideways
export function Shelf({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="my-4">
      <h2 className="pad mb-2 text-lg font-semibold lg:px-0">{title}</h2>
      <div className="no-scrollbar pad flex gap-3 overflow-x-auto lg:px-0">{children}</div>
    </section>
  );
}
