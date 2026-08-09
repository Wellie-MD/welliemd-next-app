import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { BookOpen, CircleHelp, LogOut, Menu, User, X } from "lucide-react";
import { useAuth } from "@/features/auth";
import { useViewerIdentity } from "@/features/auth/hooks/use-viewer-identity";
import { useBranding } from "@/features/branding/hooks/useBranding";

const items = [
  { label: "My Program", path: "/dashboard/my-program", icon: BookOpen },
  { label: "Profile", path: "/dashboard/profile", icon: User },
  { label: "Help", path: "/dashboard/help", icon: CircleHelp },
];

function CorporateNav({ close }: { close?: () => void }) {
  return <nav className="space-y-1 p-3">{items.map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} onClick={close} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}><Icon className="h-4 w-4" />{label}</NavLink>)}<div className="mt-4 border-t pt-4"><NavLink to="/dashboard/my-program#orientation-modules" onClick={close} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"><BookOpen className="h-4 w-4" />Education <span className="ml-auto rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">Live</span></NavLink></div></nav>;
}

export default function CorporateEmployeeLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const { logout } = useAuth();
  const viewer = useViewerIdentity();
  const { logos } = useBranding();
  return <div className="min-h-screen bg-slate-50 text-slate-950">
    <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b bg-white/95 px-4 backdrop-blur lg:px-6"><div className="flex items-center gap-3"><button className="rounded-lg border p-2 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu className="h-4 w-4" /></button>{logos?.square && !logoFailed ? <img src={logos.square} onError={() => setLogoFailed(true)} alt="Employer program" className="h-8 w-auto" /> : <span className="font-semibold">WellieMD Corporate</span>}</div><div className="text-right"><p className="text-[10px] font-semibold uppercase tracking-wider text-blue-700">Corporate pilot</p><p className="text-xs text-slate-500">Employee program portal</p></div></header>
    <aside className="fixed bottom-0 left-0 top-16 hidden w-60 border-r bg-white lg:flex lg:flex-col"><CorporateNav /><div className="mt-auto border-t p-4"><div className="mb-3 text-sm"><p className="font-medium">{viewer.fullName}</p><p className="text-xs text-slate-500">Employee</p></div><button onClick={() => void logout()} className="flex items-center gap-2 text-sm text-red-600"><LogOut className="h-4 w-4" />Sign out</button></div></aside>
    {mobileOpen && <><button className="fixed inset-0 z-50 bg-black/40" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" /><aside className="fixed bottom-0 left-0 top-0 z-[60] w-72 bg-white shadow-xl"><div className="flex items-center justify-between border-b p-4"><span className="font-semibold">Corporate program</span><button onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X className="h-5 w-5" /></button></div><CorporateNav close={() => setMobileOpen(false)} /></aside></>}
    <main className="pt-16 lg:pl-60"><div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8"><Outlet /></div></main>
  </div>;
}
