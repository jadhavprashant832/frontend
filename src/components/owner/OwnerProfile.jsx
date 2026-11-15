import React from "react";
import { api } from "../../api/client.js";
import { Feedback, Field, Loading, PageTitle, useApiAction } from "../shared/index.js";

const emptyProfile = { name: "", mobile: "", email: "", flatSize: "", flatType: "", adharCard: "", panCard: "" };

export default function OwnerProfile() {
  const [form, setForm] = React.useState(emptyProfile);
  const [loading, setLoading] = React.useState(true);
  const action = useApiAction();
  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const { profile } = await api.get("/owner/profile");
      setForm({
        name: profile.ownerName, mobile: profile.mobile, email: profile.email,
        flatSize: profile.flatSize, flatType: profile.flatType,
        adharCard: profile.adharCard, panCard: profile.panCard,
      });
    } catch (error) {
      action.setError(error);
    } finally {
      setLoading(false);
    }
  }, []);
  React.useEffect(() => { load(); }, [load]);
  const update = (key) => (event) => setForm((value) => ({ ...value, [key]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    const result = await action.run(() => api.put("/owner/profile", form), "Profile updated.");
    if (result) load();
  };

  return (
    <section>
      <PageTitle title="My profile" description="Review and update your registered owner details." />
      <Feedback error={action.error} success={action.success} />
      {loading ? <Loading /> : <div className="panel panel-default">
        <div className="panel-heading">Owner details</div>
        <div className="panel-body">
          <form onSubmit={submit} className="form-grid">
            {[
              ["name", "Full name", "text", 50], ["mobile", "Mobile", "tel", 15],
              ["email", "Email", "email", 50], ["flatSize", "Flat size", "text", 5],
              ["flatType", "Flat type", "text", 15], ["adharCard", "Aadhaar", "text", 20],
              ["panCard", "PAN", "text", 15],
            ].map(([key, label, type, maxLength]) => <Field key={key} label={label}>
              <input className="form-control" type={type} required maxLength={maxLength}
                value={form[key] ?? ""} onChange={update(key)} />
            </Field>)}
            <div className="form-actions"><button className="btn btn-primary" disabled={action.busy}>Save profile</button></div>
          </form>
        </div>
      </div>}
    </section>
  );
}
