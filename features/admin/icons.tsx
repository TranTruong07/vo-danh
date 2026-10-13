export type AdminIconName = "dashboard" | "characters" | "questions" | "orders" | "products" | "users" | "qr" | "arrow" | "logout" | "search" | "menu" | "close" | "chart" | "settings";
export function AdminIcon({ name }: { name: AdminIconName }) {
  const paths: Record<AdminIconName, React.ReactNode> = {
    settings: <><path d="M4 7h16M4 17h16" /><circle cx="9" cy="7" r="3" fill="currentColor" /><circle cx="15" cy="17" r="3" fill="currentColor" /></>,
    questions: <><path d="M4 4h16v12H9l-5 4V4Z" /><path d="M10 8a2 2 0 1 1 3 1.7c-.8.4-1 1-1 1.3M12 13h.01" /></>,
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    characters: <><rect x="4" y="3" width="16" height="18" rx="3" /><circle cx="12" cy="9" r="3" /><path d="M7 18c0-5 10-5 10 0" /></>,
    orders: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6" /></>,
    products: <><path d="m12 3 9 5v9l-9 5-9-5V8l9-5ZM3 8l9 5 9-5M12 13v9M7 6l10 5" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M18 15c3 0 3 4 3 6" /></>,
    qr: <><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" /><path d="M7 7h3v3H7zM14 7h3v3h-3zM7 14h3v3H7zM14 14h3m-3 0v3h3" /></>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    logout: <><path d="M10 4H4v16h6M9 12h12m-4-4 4 4-4 4" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    chart: <><path d="M4 3v17h17M7 15l4-5 4 3 5-8" /></>,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
