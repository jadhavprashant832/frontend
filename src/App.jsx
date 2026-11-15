import React from "react";
import { api } from "./api/client.js";
import Login from "./components/auth/Login.jsx";
import OwnerRegistration from "./components/auth/OwnerRegistration.jsx";
import AdminDashboard from "./components/admin/AdminDashboard.jsx";
import OwnerAccounts from "./components/admin/OwnerAccounts.jsx";
import MaintenanceSchedule from "./components/admin/MaintenanceSchedule.jsx";
import MaintenanceBilling from "./components/admin/MaintenanceBilling.jsx";
import MaintenanceRecords from "./components/admin/MaintenanceRecords.jsx";
import CasualExpenses from "./components/admin/CasualExpenses.jsx";
import MainSocietyExpenses from "./components/admin/MainSocietyExpenses.jsx";
import OwnerDashboard from "./components/owner/OwnerDashboard.jsx";
import OwnerProfile from "./components/owner/OwnerProfile.jsx";
import OwnerVehicles from "./components/owner/OwnerVehicles.jsx";
import OwnerMaintenanceHistory from "./components/owner/OwnerMaintenanceHistory.jsx";
import OwnerPaymentHistory from "./components/owner/OwnerPaymentHistory.jsx";
import "./styles.css";

const adminNavigation = [
  { id: "dashboard", label: "Dashboard", icon: "fa-dashboard" },
  { id: "owners", label: "User management", icon: "fa-users" },
  { id: "schedule", label: "Maintenance details", icon: "fa-cog" },
  { id: "billing", label: "Owner maintenance", icon: "fa-file-text-o" },
  { id: "records", label: "Maintenance records", icon: "fa-search" },
  { id: "casual", label: "Casual expenses", icon: "fa-money" },
  { id: "main-expenses", label: "Society expenses", icon: "fa-university" },
];
const ownerNavigation = [
  { id: "dashboard", label: "Dashboard", icon: "fa-dashboard" },
  { id: "profile", label: "My profile", icon: "fa-user" },
  { id: "vehicles", label: "My vehicles", icon: "fa-car" },
  { id: "history", label: "Maintenance history", icon: "fa-file-text-o" },
  { id: "payments", label: "Payment history", icon: "fa-credit-card" },
];

export default function App() {
  const [user, setUser] = React.useState(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [authError, setAuthError] = React.useState(null);
  const [showRegistration, setShowRegistration] = React.useState(false);
  const [activePage, setActivePage] = React.useState("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [logoutError, setLogoutError] = React.useState(null);

  React.useEffect(() => {
    api.get("/auth/me")
      .then(setUser)
      .catch((error) => {
        if (error.status !== 401 && error.status !== 403) setAuthError(error);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  const login = (account) => {
    setUser(account);
    setActivePage("dashboard");
    setShowRegistration(false);
    setAuthError(null);
  };
  const logout = async () => {
    setLogoutError(null);
    try {
      await api.post("/auth/logout", {});
      setUser(null);
      setActivePage("dashboard");
    } catch (error) {
      setLogoutError(error);
    }
  };
  const navigate = (page) => {
    setActivePage(page);
    setMobileNavOpen(false);
  };

  if (authLoading) return <div className="app-loading"><span className="fa fa-circle-o-notch fa-spin" /> Checking your session...</div>;
  if (!user) {
    return (
      <>
        {authError && <div className="auth-global-error">{authError.message}</div>}
        {showRegistration
          ? <OwnerRegistration onBack={() => setShowRegistration(false)} />
          : <Login onLogin={login} onRegister={() => setShowRegistration(true)} />}
      </>
    );
  }

  const isAdmin = user.role === "ADMIN";
  const navigation = isAdmin ? adminNavigation : ownerNavigation;
  const active = navigation.find((item) => item.id === activePage) ?? navigation[0];
  const content = isAdmin ? {
    dashboard: <AdminDashboard />,
    owners: <OwnerAccounts />,
    schedule: <MaintenanceSchedule />,
    billing: <MaintenanceBilling />,
    records: <MaintenanceRecords />,
    casual: <CasualExpenses />,
    "main-expenses": <MainSocietyExpenses />,
  }[active.id] : {
    dashboard: <OwnerDashboard onNavigate={navigate} />,
    profile: <OwnerProfile />,
    vehicles: <OwnerVehicles />,
    history: <OwnerMaintenanceHistory />,
    payments: <OwnerPaymentHistory />,
  }[active.id];

  return (
    <div className="portal-shell">
      <header className="portal-topbar">
        <button className="mobile-menu" aria-label="Toggle navigation" onClick={() => setMobileNavOpen(!mobileNavOpen)}>
          <span className="fa fa-bars" />
        </button>
        <button className="topbar-brand" onClick={() => navigate("dashboard")}>
          <span className="fa fa-building" /> Society Portal
        </button>
        <div className="topbar-account">
          <span className="account-name">{user.displayName || user.identifier || (user.flatNo ? `Flat ${user.flatNo}` : "Administrator")}</span>
          <span className="account-role">{isAdmin ? "Administrator" : `Owner · Flat ${user.flatNo}`}</span>
          <button className="btn btn-default btn-sm" onClick={logout}><span className="fa fa-sign-out" /> Sign out</button>
        </div>
      </header>
      <div className="portal-layout">
        <aside className={`portal-sidebar ${mobileNavOpen ? "is-open" : ""}`}>
          <div className="sidebar-heading">{isAdmin ? "Administration" : "Resident services"}</div>
          <nav aria-label="Main navigation">
            {navigation.map((item) => (
              <button key={item.id} className={`sidebar-link ${active.id === item.id ? "is-active" : ""}`}
                onClick={() => navigate(item.id)}>
                <span className={`fa ${item.icon}`} /> {item.label}
              </button>
            ))}
          </nav>
          <div className="sidebar-footer"><span className="fa fa-shield" /> Secure society portal</div>
        </aside>
        <main className="portal-main">
          {logoutError && <div className="alert alert-danger" role="alert">
            <strong>Sign out failed:</strong> {logoutError.message}
          </div>}
          <div className="mobile-current-page">{active.label}</div>
          {content}
        </main>
      </div>
    </div>
  );
}
