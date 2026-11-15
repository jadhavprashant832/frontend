import React from "react";
import { api } from "../../api/client.js";
import { DataTable, Feedback, Field, Loading, PageTitle, useApiAction } from "../shared/index.js";

const initialForm = { name: "", mobile: "", email: "", flatType: "", flatSize: "" };

export default function OwnerAccounts() {
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [form, setForm] = React.useState(initialForm);
  const action = useApiAction();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.get(`/admin/owners?page=${page}&pageSize=25`));
    } catch (error) {
      action.setError(error);
    } finally {
      setLoading(false);
    }
  }, [page]);
  React.useEffect(() => { load(); }, [load]);

  const startEdit = (owner) => {
    setEditing(owner);
    setForm({ name: owner.ownerName, mobile: owner.mobile, email: owner.email,
      flatType: owner.flatType, flatSize: owner.flatSize });
    action.setError(null);
    action.setSuccess("");
  };
  const submit = async (event) => {
    event.preventDefault();
    const result = await action.run(() => api.put(`/admin/owners/${editing.flatNo}`, form),
      "Owner account updated.");
    if (result) {
      setEditing(null);
      load();
    }
  };
  const remove = async (owner) => {
    if (!window.confirm(`Delete the owner account for flat ${owner.flatNo}?`)) return;
    const result = await action.run(() => api.delete(`/admin/owners/${owner.flatNo}`),
      "Owner account deleted.");
    if (result) load();
  };

  return (
    <section>
      <PageTitle title="User management" description="View and manage owner accounts." />
      <Feedback error={action.error} success={action.success} />
      {editing && (
        <div className="panel panel-default">
          <div className="panel-heading">Update owner · Flat {editing.flatNo}</div>
          <div className="panel-body">
            <form onSubmit={submit} className="form-grid">
              {[
                ["name", "Owner name"], ["mobile", "Mobile"], ["email", "Email"],
                ["flatType", "Flat type"], ["flatSize", "Flat size"],
              ].map(([key, label]) => (
                <Field key={key} label={label}>
                  <input className="form-control" required value={form[key]}
                    onChange={(event) => setForm((value) => ({ ...value, [key]: event.target.value }))} />
                </Field>
              ))}
              <div className="form-actions">
                <button className="btn btn-primary" disabled={action.busy}>Save owner</button>
                <button type="button" className="btn btn-default" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </form>
            <p className="muted small">Aadhaar and PAN are shown in the account list and are not changed by the legacy admin update action.</p>
          </div>
        </div>
      )}
      <div className="panel panel-default">
        <div className="panel-heading">Registered owners</div>
        <div className="panel-body">
          {loading ? <Loading /> : (
            <DataTable empty="No owner accounts found." rowKey="flatNo" rows={data?.items ?? []} columns={[
              { key: "flatNo", label: "Flat" }, { key: "ownerName", label: "Name" },
              { key: "email", label: "Email" }, { key: "mobile", label: "Mobile" },
              { key: "flatType", label: "Type" }, { key: "flatSize", label: "Size" },
              { key: "adharCard", label: "Aadhaar" }, { key: "panCard", label: "PAN" },
              { key: "actions", label: "Actions", render: (owner) => (
                <div className="button-group">
                  <button className="btn btn-xs btn-primary" onClick={() => startEdit(owner)}>Update</button>
                  <button className="btn btn-xs btn-danger" onClick={() => remove(owner)}>Delete</button>
                </div>
              ) },
            ]} />
          )}
          {data?.totalPages > 1 && <div className="pagination-row">
            <span>{data.total} owners · Page {data.page} of {data.totalPages}</span>
            <div>
              <button className="btn btn-default" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              <button className="btn btn-default" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </div>}
        </div>
      </div>
    </section>
  );
}
