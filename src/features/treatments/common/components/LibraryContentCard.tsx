import { Link } from "react-router-dom";
import { ChevronRight, Clock, CheckCircle2 } from "lucide-react";

interface LibraryContentCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  stat: React.ReactNode;
  listItems: React.ReactNode[];
  recentText: React.ReactNode;
  href: string;
  actionLabel: string;
  tone?: "blue" | "teal" | "purple" | "indigo";
}

const toneClasses = {
  blue: "bg-blue-50 text-blue-700",
  teal: "bg-teal-50 text-teal-700",
  purple: "bg-purple-50 text-purple-700",
  indigo: "bg-indigo-50 text-indigo-700",
};

export function LibraryContentCard({
  title,
  subtitle,
  icon,
  stat,
  listItems,
  recentText,
  href,
  actionLabel,
  tone = "blue",
}: LibraryContentCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start gap-4 border-b border-slate-100 p-5">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4 text-sm text-slate-700">
          {stat}
        </div>

        <ul className="mb-6 flex flex-col gap-3">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto rounded-lg bg-slate-50 p-3 text-sm text-slate-600 flex items-start gap-2">
           <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
           <div>{recentText}</div>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/50 p-4">
        <Link
          to={href}
          className="group flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
        >
          {actionLabel}
          <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
