import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  TestTubes,
  Compass,
  Package,
  CreditCard,
  Newspaper,
  User,
  HelpCircle,
  LogOut,
  X,
  Stethoscope,
  LucideIcon,
} from "lucide-react";
import { useAuth } from "@/features/auth";
import { useViewerIdentity } from "@/features/auth/hooks/use-viewer-identity";

interface NavigationItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

const navigationItems: NavigationItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: MessageSquare, label: "Messages", path: "/dashboard/messages" },
  { icon: Stethoscope, label: "Treatments", path: "/dashboard/treatments" },
  { icon: Calendar, label: "Visits", path: "/dashboard/appointments" },
  { icon: TestTubes, label: "Labs", path: "/dashboard/labs" },
  { icon: Compass, label: "Explore Treatments", path: "/dashboard/explore" },
  { icon: Package, label: "Orders", path: "/dashboard/orders" },
  { icon: CreditCard, label: "Billing", path: "/dashboard/billing" },
  { icon: Newspaper, label: "Resources", path: "/dashboard/blog" },
  { icon: User, label: "Profile", path: "/dashboard/profile" },
  { icon: HelpCircle, label: "Help", path: "/dashboard/help" },
];

interface SidebarProps {
  isMobile: boolean;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ isMobile, isMobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const { user, logout, isImpersonated } = useAuth();
  const bannerH = isImpersonated ? 44 : 0;
  const viewerIdentity = useViewerIdentity();

  useEffect(() => {
    onMobileClose();
  }, [location.pathname, onMobileClose]);

  const NavItem = ({ item }: { item: NavigationItem }) => {
    const Icon = item.icon;
    const isActive =
      location.pathname === item.path ||
      (item.path !== "/dashboard" && location.pathname.startsWith(item.path));

    return (
      <NavLink
        to={item.path}
        end={item.path === "/dashboard"}
        onClick={isMobile ? onMobileClose : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          gap: isMobile ? 12 : 10,
          padding: isMobile ? "11px 10px" : "10px 10px",
          borderRadius: "var(--km-rs)",
          cursor: "pointer",
          color: isActive ? "var(--km-ac)" : "var(--km-tm)",
          background: isActive ? "var(--km-acp)" : "transparent",
          fontSize: 13,
          fontWeight: 500,
          transition: "all 0.18s",
          marginBottom: 1,
          textDecoration: "none",
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = "var(--km-s2)";
            e.currentTarget.style.color = "var(--km-t)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--km-tm)";
          }
        }}
      >
        <Icon size={16} style={{ flexShrink: 0 }} />
        <span>{item.label}</span>
      </NavLink>
    );
  };

  /* ─── DESKTOP SIDEBAR ─── */
  if (!isMobile) {
    return (
      <aside
        style={{
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          position: "fixed",
          top: 60 + bannerH,
          left: 0,
          width: 240,
          height: `calc((var(--app-vh, 1vh) * 100) - 60px - ${bannerH}px)`,
          background: "var(--km-s1)",
          borderRight: "1px solid var(--km-b)",
          overflowY: "auto",
          zIndex: 50,
        }}
      >
        <nav style={{ padding: "10px 8px", flex: 1 }}>
          {navigationItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: 12, borderTop: "1px solid var(--km-b)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: 10,
              borderRadius: "var(--km-rs)",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--km-s2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #4f8ef7, #a78bfa)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {viewerIdentity.initials}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--km-t)" }}>{viewerIdentity.fullName}</div>
              <div style={{ fontSize: 11, color: "var(--km-tm)" }}>{viewerIdentity.label}</div>
            </div>
          </div>

          {!isImpersonated && (
            <button
              onClick={() => logout()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: 10,
                borderRadius: "var(--km-rs)",
                cursor: "pointer",
                color: "var(--km-re)",
                fontSize: 13,
                fontWeight: 500,
                transition: "background 0.2s",
                marginTop: 2,
                width: "100%",
                background: "transparent",
                border: "none",
                fontFamily: "'Outfit', sans-serif",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--km-rep)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <LogOut size={15} />
              Sign out
            </button>
          )}
        </div>
      </aside>
    );
  }

  /* ─── MOBILE SIDEBAR (drawer) ─── */
  if (!isMobileOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)",
          zIndex: 200,
        }}
        onClick={onMobileClose}
      />

      {/* Drawer */}
      <nav
        style={{
          position: "fixed",
          top: bannerH,
          left: 0,
          width: 285,
          height: `calc((var(--app-vh, 1vh) * 100) - ${bannerH}px)`,
          background: "var(--km-s1)",
          borderRight: "1px solid var(--km-b)",
          zIndex: 300,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 16px 16px",
            borderBottom: "1px solid var(--km-b)",
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "var(--km-tm)" }}>
            Menu
          </span>
          <button
            onClick={onMobileClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              border: "1px solid var(--km-b)",
              background: "var(--km-s2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--km-tm)",
              transition: "all 0.2s",
            }}
          >
            <X size={13} />
          </button>
        </div>

        {/* User section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            padding: 16,
            borderBottom: "1px solid var(--km-b)",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #4f8ef7, #a78bfa)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 14,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {viewerIdentity.initials}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--km-t)" }}>{viewerIdentity.fullName}</div>
            <div style={{ fontSize: 11, color: "var(--km-tm)", marginTop: 1 }}>{viewerIdentity.label}</div>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ padding: 8, flex: 1 }}>
          {navigationItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--km-b)" }}>
          {!isImpersonated && (
            <button
              onClick={() => logout()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: 10,
                borderRadius: "var(--km-rs)",
                cursor: "pointer",
                color: "var(--km-re)",
                fontSize: 13,
                fontWeight: 500,
                transition: "background 0.2s",
                width: "100%",
                background: "transparent",
                border: "none",
                fontFamily: "'Outfit', sans-serif",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--km-rep)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <LogOut size={15} />
              Sign out
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
