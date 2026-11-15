import React from "react";

export function Feedback({ error, success }) {
  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <strong>{error.message}</strong>
        {error.details && Object.keys(error.details).length > 0 && (
          <ul className="feedback-details">
            {Object.entries(error.details).map(([field, message]) => (
              <li key={field}><strong>{field}:</strong> {message}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }
  if (success) return <div className="alert alert-success" role="status">{success}</div>;
  return null;
}

export function PageTitle({ title, description, actions }) {
  return (
    <div className="page-title">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function Loading({ label = "Loading..." }) {
  return <div className="loading-state" role="status">{label}</div>;
}

export function EmptyState({ children = "No records found." }) {
  return <div className="empty-state">{children}</div>;
}

export function Field({ label, children, hint }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      {children}
      {hint && <small className="help-block">{hint}</small>}
    </div>
  );
}

export function money(value) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric)
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(numeric)
    : "-";
}

export function dateInputValue(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function useApiAction() {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState("");
  const run = async (action, successMessage = "") => {
    setBusy(true);
    setError(null);
    setSuccess("");
    try {
      const result = await action();
      if (successMessage) setSuccess(successMessage);
      return result;
    } catch (caught) {
      setError(caught);
      return null;
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, success, run, setError, setSuccess };
}
