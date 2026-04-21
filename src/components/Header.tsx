import { useRef, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { UserProfileDropdown } from "./common/user-profile-dropdown";
import { NotificationsDropdown } from "./common/notifications-dropdown";
import { useAuth } from "@/features/auth";
import { useDropdown } from "@/contexts/DropdownContext";
import { env } from "@/config/env";
import { useBranding } from "@/features/branding/hooks/useBranding";
import { useTheme } from "next-themes";

interface HeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
  showMenuButton?: boolean;
  isMobile?: boolean;
}

export default function Header({ onMenuClick, isSidebarOpen, showMenuButton = false, isMobile = false }: HeaderProps) {
  const { isAuthenticated } = useAuth();
  const { closeAll } = useDropdown();
  const { logos } = useBranding();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        closeAll();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeAll]);

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        zIndex: 40,
        width: "100%",
        background: isDark ? "rgba(10,10,10,0.9)" : "rgba(244,242,238,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--km-b)",
        padding: isMobile ? "0 12px" : "0 20px",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div ref={headerRef} style={{ display: "contents" }}>
        {/* Left: hamburger + brand */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12 }}>
          {showMenuButton && (
            <button
              onClick={onMenuClick}
              style={{
                width: 32,
                height: 32,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                cursor: "pointer",
                borderRadius: 8,
                border: "1px solid var(--km-b)",
                background: "var(--km-s2)",
                transition: "all 0.2s",
              }}
              aria-label="Toggle menu"
            >
              <span style={{ display: "block", width: 14, height: 1.5, background: "var(--km-tm)", borderRadius: 2 }} />
              <span style={{ display: "block", width: 14, height: 1.5, background: "var(--km-tm)", borderRadius: 2 }} />
              <span style={{ display: "block", width: 14, height: 1.5, background: "var(--km-tm)", borderRadius: 2 }} />
            </button>
          )}

          {logos?.square ? (
            <img src={logos.square} alt={env.VITE_APP_NAME} style={{ height: 28, width: "auto", objectFit: "contain", filter: isDark ? "brightness(0) invert(1)" : "none" }} />
          ) : (
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 500, color: "var(--km-t)" }}>
              {env.VITE_APP_NAME}
            </span>
          )}
        </div>

        {/* Right: theme + notifications + user */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 8 }}>
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="km-nbtn"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid var(--km-b)",
              background: "var(--km-s2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--km-tm)",
              transition: "all 0.2s",
            }}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* Notifications */}
          <NotificationsDropdown />

          {/* User chip */}
          {isAuthenticated && (
            <UserProfileDropdown className="" compact={isMobile} />
          )}
        </div>
      </div>
    </header>
  );
}
