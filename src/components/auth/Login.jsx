import React from "react";
import { api } from "../../api/client.js";
import { Feedback, Field, useApiAction } from "../shared/Feedback.jsx";

export default function Login({ onLogin, onRegister }) {
  const [role, setRole] = React.useState("ADMIN");
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const action = useApiAction();

  const submit = async (event) => {
    event.preventDefault();
    const user = await action.run(() => api.post("/auth/login", { identifier, password, role }));
    if (user) onLogin(user);
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand"><span className="fa fa-building" /> Society Portal</div>
        <h1>Welcome back</h1>
        <p className="muted">Sign in to manage your society account.</p>
        <Feedback error={action.error} />
        <form onSubmit={submit}>
          <Field label="Sign in as">
            <select className="form-control" value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="ADMIN">Administrator</option>
              <option value="OWNER">Owner / resident</option>
            </select>
          </Field>
          <Field label={role === "ADMIN" ? "Username / email" : "Email address"}>
            <input className="form-control" autoComplete="username" required
              value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
          </Field>
          <Field label="Password">
            <input className="form-control" type="password" autoComplete="current-password" required
              value={password} onChange={(event) => setPassword(event.target.value)} />
          </Field>
          <button className="btn btn-primary btn-block" disabled={action.busy}>
            {action.busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
        {onRegister && <p className="auth-footer">New owner? <button className="link-button" onClick={onRegister}>Create an account</button></p>}
      </section>
    </main>
  );
}
