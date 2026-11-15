import React from "react";
import { api } from "../../api/client.js";
import { DataTable, Feedback, Field, Loading, PageTitle, money, useApiAction } from "../shared/index.js";

const categories = [
  "Security Agency", "Housing Agency", "Housekeeping Agency", "Lift Maintenance",
  "Generator Maintenance", "Electricity", "Water", "Repairs and Maintenance", "Other",
];
const methods = ["", "Cash", "Bank Transfer", "Cheque", "UPI", "Other"];
const today = new Date().toISOString().slice(0, 10);
const emptyForm = {
  expenseMonth: today.slice(0, 7), category: categories[0], vendorName: "",
  billNumber: "", billDate: today, amount: "", paymentStatus: "Paid",
  paymentMethod: "Cash", description: "",
};

export default function MainSocietyExpenses() {
  const [form, setForm] = React.useState(emptyForm);
  const [filter, setFilter] = React.useState({ month: today.slice(0, 7), category: "" });
  const [report, setReport] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const action = useApiAction();
  const updateForm = (key) => (event) => setForm((value) => ({ ...value, [key]: event.target.value }));
  const updateFilter = (key) => (event) => setFilter((value) => ({ ...value, [key]: event.target.value }));

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ month: filter.month });
      if (filter.category) query.set("category", filter.category);
      setReport(await api.get(`/admin/expenses/main?${query}`));
    } catch (error) {
      action.setError(error);
    } finally {
      setLoading(false);
    }
  }, [filter.month, filter.category]);
  React.useEffect(() => { load(); }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    const result = await action.run(() => api.post("/admin/expenses/main", {
      ...form, amount: Number(form.amount),
    }), "Society expense recorded.");
    if (result) {
      setForm(emptyForm);
      setFilter({ month: form.expenseMonth, category: "" });
    }
  };

  return (
    <section>
      <PageTitle title="Main society expenses" description="Record monthly society expenditure and filter the expense ledger." />
      <Feedback error={action.error} success={action.success} />
      <div className="panel panel-default">
        <div className="panel-heading">Add society expense</div>
        <div className="panel-body">
          <form onSubmit={submit} className="form-grid">
            <Field label="Expense month"><input className="form-control" type="month" required value={form.expenseMonth} onChange={updateForm("expenseMonth")} /></Field>
            <Field label="Category"><select className="form-control" value={form.category} onChange={updateForm("category")}>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select></Field>
            <Field label="Vendor / agency"><input className="form-control" maxLength="255" required value={form.vendorName} onChange={updateForm("vendorName")} /></Field>
            <Field label="Bill number"><input className="form-control" maxLength="100" value={form.billNumber} onChange={updateForm("billNumber")} /></Field>
            <Field label="Bill date"><input className="form-control" type="date" required value={form.billDate} onChange={updateForm("billDate")} /></Field>
            <Field label="Amount (₹)"><input className="form-control" type="number" min="0.01" step="0.01" required value={form.amount} onChange={updateForm("amount")} /></Field>
            <Field label="Payment status"><select className="form-control" value={form.paymentStatus} onChange={updateForm("paymentStatus")}>
              {["Paid", "Pending"].map((status) => <option key={status}>{status}</option>)}
            </select></Field>
            <Field label="Payment method"><select className="form-control" value={form.paymentMethod} onChange={updateForm("paymentMethod")}>
              {methods.map((method) => <option key={method} value={method}>{method || "Not specified"}</option>)}
            </select></Field>
            <Field label="Description"><textarea className="form-control" rows="3" maxLength="2000" required value={form.description} onChange={updateForm("description")} /></Field>
            <div className="form-actions"><button className="btn btn-primary" disabled={action.busy}>Record society expense</button></div>
          </form>
        </div>
      </div>
      <div className="panel panel-default">
        <div className="panel-heading">Monthly expense report</div>
        <div className="panel-body">
          <div className="toolbar">
            <Field label="Month"><input className="form-control" type="month" required value={filter.month} onChange={updateFilter("month")} /></Field>
            <Field label="Category"><select className="form-control" value={filter.category} onChange={updateFilter("category")}>
              <option value="">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}
            </select></Field>
            <button className="btn btn-primary" onClick={load} disabled={loading}>Run report</button>
            {report && <strong className="report-total">Total: {money(report.total)}</strong>}
          </div>
          {loading ? <Loading /> : <DataTable empty="No society expenses match this month and category." rows={report?.records ?? []} columns={[
            { key: "billDate", label: "Bill date" }, { key: "expenseMonth", label: "Month" },
            { key: "category", label: "Category" }, { key: "vendorName", label: "Vendor" },
            { key: "billNumber", label: "Bill number" },
            { key: "amount", label: "Amount", render: (row) => money(row.amount) },
            { key: "paymentStatus", label: "Status" }, { key: "paymentMethod", label: "Method" },
            { key: "description", label: "Description" },
          ]} />}
        </div>
      </div>
    </section>
  );
}
