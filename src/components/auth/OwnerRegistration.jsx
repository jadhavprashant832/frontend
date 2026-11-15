import React from "react";
import { api } from "../../api/client.js";
import { Feedback, Field, useApiAction } from "../shared/Feedback.jsx";

export default function OwnerRegistration({ onBack }) {
  const action = useApiAction();
  const [form, setForm] = React.useState({
    flatNo: "", name: "", email: "", mobile: "", password: "",
  });
  const update = (key) => (event) => setForm((value) => ({ ...value, [key]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    const result = await action.run(
      () => api.post("/auth/register", { ...form, flatNo: Number(form.flatNo) }),
      "Registration completed. You can now sign in.",
    );
    if (result) setForm({ flatNo: "", name: "", email: "", mobile: "", password: "" });
  };
  return (
    <main className="auth-page">
      <section className="auth-card">
        <button className="link-button" onClick={onBack}><span className="fa fa-arrow-left" /> Back to sign in</button>
        <h1>Owner registration</h1>
        <p className="muted">Register your flat with the society.</p>
        <Feedback error={action.error} success={action.success} />
        <form onSubmit={submit}>
          <Field label="Flat number"><input className="form-control" type="number" min="1" required value={form.flatNo} onChange={update("flatNo")} /></Field>
          <Field label="Full name"><input className="form-control" maxLength="50" required value={form.name} onChange={update("name")} /></Field>
          <Field label="Email"><input className="form-control" type="email" maxLength="50" required value={form.email} onChange={update("email")} /></Field>
          <Field label="Mobile"><input className="form-control" maxLength="15" required value={form.mobile} onChange={update("mobile")} /></Field>
          <Field label="Password" hint="5–20 characters, uppercase and lowercase letters, number, and symbol.">
            <input className="form-control" type="password" minLength="5" maxLength="20" required value={form.password} onChange={update("password")} />
          </Field>
          <button className="btn btn-primary btn-block" disabled={action.busy}>{action.busy ? "Registering..." : "Register"}</button>
        </form>
      </section>
    </main>
  );
}
