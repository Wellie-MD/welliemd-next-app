interface StatusPillProps {
  children: React.ReactNode;
  tone?: "green" | "yellow" | "slate" | "blue";
}

const toneClasses = {
  green: "border-green-200 bg-green-50 text-green-700",
  yellow: "border-yellow-200 bg-yellow-50 text-yellow-700",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
};

export function StatusPill({ children, tone = "slate" }: StatusPillProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
