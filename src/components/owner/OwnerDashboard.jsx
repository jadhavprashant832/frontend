import React from "react";
import { api } from "../../api/client.js";
import { Feedback, Loading, PageTitle, money } from "../shared/index.js";

export default function OwnerDashboard({ onNavigate }) {
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(null);
  React.useEffect(() => {
    api.get("/owner/dashboard").then(setData).catch(setError);
  }, []);

  if (error) return <><PageTitle title="Dashboard" /><Feedback error={error} /></>;
  if (!data) return <Loading />;
  const owner = data.owner;
  const latest = data.latestMaintenance;
  return (
    <section>
      <PageTitle title={`Welcome, ${owner.ownerName}`} description={`Owner dashboard · Flat ${owner.flatNo}`} />
      <div className="summary-grid">
        <article className="summary-card"><span>Flat</span><strong>{owner.flatNo}</strong><small>{owner.flatType} · {owner.flatSize}</small></article>
        <article className="summary-card"><span>Outstanding balance</span><strong>{money(owner.pendingAmount)}</strong><small>Account balance</small></article>
        <article className="summary-card"><span>Latest invoice</span><strong>{latest?.invoiceNo ?? "—"}</strong><small>{latest ? `${latest.quarter} ${latest.year} · ${latest.status}` : "No invoices yet"}</small></article>
        <article className="summary-card"><span>Latest amount</span><strong>{latest ? money(latest.finalAmount) : "—"}</strong><small>{latest ? `Pending ${money(latest.pendingAmount)}` : "Maintenance charges"}</small></article>
      </div>
      <div className="panel panel-default">
        <div className="panel-heading">Quick links</div>
        <div className="panel-body quick-links">
          <button className="btn btn-primary" onClick={() => onNavigate("history")}>Maintenance history</button>
          <button className="btn btn-default" onClick={() => onNavigate("vehicles")}>Manage vehicles</button>
          <button className="btn btn-default" onClick={() => onNavigate("profile")}>Update profile</button>
          <button className="btn btn-default" onClick={() => onNavigate("payments")}>Payment history</button>
        </div>
      </div>
    </section>
  );
}
