interface EmptyStateCardProps {
  title: string;
  description: string;
}

export function EmptyStateCard({ title, description }: EmptyStateCardProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-500">{description}</div>
    </div>
  );
}
