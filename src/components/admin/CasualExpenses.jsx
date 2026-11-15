import React from "react";
import { api } from "../../api/client.js";
import { DataTable, Feedback, Field, Loading, PageTitle, money, useApiAction } from "../shared/index.js";

const today = new Date().toISOString().slice(0, 10);
const emptyForm = {
  expenseName: "", type: "INDIVIDUAL", reason: "", description: "",
  whoDidIt: "", price: "", billDate: today, submitDate: today,
};

export default function CasualExpenses() {
  const [form, setForm] = React.useState(emptyForm);
  const [range, setRange] = React.useState({ startDate: today.slice(0, 8) + "01", endDate: today });
  const [report, setReport] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const action = useApiAction();
  const updateForm = (key) => (event) => setForm((value) => ({ ...value, [key]: event.target.value }));
  const updateRange = (key) => (event) => setRange((value) => ({ ...value, [key]: event.target.value }));

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setReport(await api.get(`/admin/expenses/casual?${new URLSearchParams(range)}`));
    } catch (error) {
      action.setError(error);
    } finally {
      setLoading(false);
    }
  }, [range.startDate, range.endDate]);
  React.useEffect(() => { load(); }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    const result = await action.run(() => api.post("/admin/expenses/casual", {
      ...form, price: Number(form.price),
    }), "Casual expense recorded.");
    if (result) {
      setForm(emptyForm);
      load();
    }
  };

  return (
    <section>
      <PageTitle title="Casual expenses" description="Record one-off expenses and review reports by bill date." />
      <Feedback error={action.error} success={action.success} />
      <div className="panel panel-default">
        <div className="panel-heading">Add expense</div>
        <div className="panel-body">
          <form onSubmit={submit} className="form-grid">
            <Field label="Expense name"><input className="form-control" maxLength="50" required value={form.expenseName} onChange={updateForm("expenseName")} /></Field>
            <Field label="Type"><select className="form-control" value={form.type} onChange={updateForm("type")}>
              <option value="INDIVIDUAL">Individual</option><option value="SOCIETY_FUNDS">Society funds</option><option>Other</option>
            </select></Field>
            <Field label="Reason"><input className="form-control" maxLength="250" required value={form.reason} onChange={updateForm("reason")} /></Field>
            <Field label="Description"><input className="form-control" maxLength="250" required value={form.description} onChange={updateForm("description")} /></Field>
            <Field label="Paid / submitted by"><input className="form-control" maxLength="50" required value={form.whoDidIt} onChange={updateForm("whoDidIt")} /></Field>
            <Field label="Price (₹)"><input className="form-control" type="number" min="0.01" step="0.01" required value={form.price} onChange={updateForm("price")} /></Field>
            <Field label="Bill date"><input className="form-control" type="date" required value={form.billDate} onChange={updateForm("billDate")} /></Field>
            <Field label="Submission date"><input className="form-control" type="date" required value={form.submitDate} onChange={updateForm("submitDate")} /></Field>
            <div className="form-actions"><button className="btn btn-primary" disabled={action.busy}>Record expense</button></div>
          </form>
        </div>
      </div>
      <div className="panel panel-default">
        <div className="panel-heading">Expense report</div>
        <div className="panel-body">
          <div className="toolbar">
            <Field label="From"><input className="form-control" type="date" value={range.startDate} onChange={updateRange("startDate")} /></Field>
            <Field label="To"><input className="form-control" type="date" value={range.endDate} onChange={updateRange("endDate")} /></Field>
            <button className="btn btn-primary" onClick={load} disabled={loading}>Run report</button>
            {report && <strong className="report-total">Total: {money(report.total)}</strong>}
          </div>
          {loading ? <Loading /> : <DataTable empty="No casual expenses in this date range." rows={report?.records ?? []} columns={[
            { key: "billDate", label: "Bill date" }, { key: "expenseName", label: "Expense" },
            { key: "type", label: "Type" }, { key: "reason", label: "Reason" },
            { key: "description", label: "Description" }, { key: "whoDidIt", label: "Submitted by" },
            { key: "price", label: "Amount", render: (row) => money(row.price) },
            { key: "submitDate", label: "Submitted on" },
          ]} />}
        </div>
      </div>
    </section>
  );
}
