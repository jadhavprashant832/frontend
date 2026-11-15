import React from "react";
import { api, saveDownload } from "../../api/client.js";
import { DataTable, Feedback, Field, Loading, PageTitle, money, useApiAction } from "../shared/index.js";

const current = new Date();
const defaultQuarter = `Q${Math.floor(current.getMonth() / 3) + 1}`;

export default function MaintenanceRecords() {
  const [filters, setFilters] = React.useState({ quarter: defaultQuarter, year: String(current.getFullYear()), flatNo: "" });
  const [records, setRecords] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [payment, setPayment] = React.useState({ amount: "", paymentType: "Cash", transactionId: "" });
  const [loading, setLoading] = React.useState(false);
  const action = useApiAction();
  const updateFilter = (key) => (event) => setFilters((value) => ({ ...value, [key]: event.target.value }));

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ quarter: filters.quarter, year: filters.year });
      if (filters.flatNo) query.set("flatNo", filters.flatNo);
      const data = await api.get(`/admin/maintenance?${query}`);
      setRecords(data.records);
      setSelected(null);
    } catch (error) {
      action.setError(error);
    } finally {
      setLoading(false);
    }
  }, [filters.quarter, filters.year, filters.flatNo]);
  React.useEffect(() => { load(); }, [load]);

  const makePayment = async (event) => {
    event.preventDefault();
    if (!selected) return;
    const result = await action.run(() => api.post("/admin/maintenance/payments", {
      flatNo: Number(selected.flatNo), maintenanceId: selected.id, amount: Number(payment.amount),
      paymentType: payment.paymentType, transactionId: payment.transactionId,
    }), "Partial payment recorded.");
    if (!result) return;
    const receipt = await action.run(async () => {
      const file = await api.blob(`/admin/maintenance/payments/${result.paymentId}/receipt.pdf`);
      saveDownload(file, `receipt_${result.receiptNo}.pdf`);
    });
    setPayment({ amount: "", paymentType: "Cash", transactionId: "" });
    load();
    return receipt;
  };

  const slip = (row) => action.run(async () => {
    const file = await api.blob(`/admin/maintenance/${row.id}/slip.pdf`);
    saveDownload(file, `maintenance_${row.invoiceNo}.pdf`);
  });

  return (
    <section>
      <PageTitle title="Maintenance records" description="Search invoices, view slips and record partial payments." />
      <Feedback error={action.error} success={action.success} />
      <div className="panel panel-default">
        <div className="panel-heading">Search maintenance</div>
        <div className="panel-body">
          <div className="toolbar">
            <Field label="Quarter"><select className="form-control" value={filters.quarter} onChange={updateFilter("quarter")}>
              {["Q1", "Q2", "Q3", "Q4"].map((item) => <option key={item}>{item}</option>)}
            </select></Field>
            <Field label="Year"><input className="form-control" type="number" min="2023" max="2100" value={filters.year} onChange={updateFilter("year")} /></Field>
            <Field label="Flat (optional)"><input className="form-control" value={filters.flatNo} onChange={updateFilter("flatNo")} /></Field>
            <button className="btn btn-primary" onClick={load} disabled={loading}>Search</button>
          </div>
          {loading ? <Loading /> : <DataTable empty="No maintenance records match this period." rows={records} columns={[
            { key: "flatNo", label: "Flat" }, { key: "name", label: "Owner" },
            { key: "quarter", label: "Quarter" }, { key: "year", label: "Year" },
            { key: "finalAmount", label: "Amount", render: (row) => money(row.finalAmount ?? row.totalAmount) },
            { key: "status", label: "Status" }, { key: "invoiceNo", label: "Invoice" },
            { key: "paymentType", label: "Payment" }, { key: "paymentTransactionId", label: "Transaction" },
            { key: "actions", label: "Actions", render: (row) => <div className="button-group">
              <button className="btn btn-xs btn-default" onClick={() => slip(row)}>Slip PDF</button>
              {row.isLatestInvoice && Number(row.pendingAmount) > 0 && <button className="btn btn-xs btn-primary" onClick={() => setSelected(row)}>Partial payment</button>}
            </div> },
          ]} />}
          <div className="form-actions">
            <button className="btn btn-success" onClick={() => action.run(async () => {
              const file = await api.blob(`/admin/maintenance/status.xlsx?quarter=${filters.quarter}&year=${filters.year}`);
              saveDownload(file, `maintenance_status_${filters.quarter}_${filters.year}.xlsx`);
            })}>Export quarter XLSX</button>
          </div>
        </div>
      </div>
      {selected && <div className="panel panel-default">
        <div className="panel-heading">Record partial payment · {selected.invoiceNo}</div>
        <div className="panel-body">
          <p>Outstanding amount: <strong>{money(selected.pendingAmount)}</strong></p>
          <form onSubmit={makePayment} className="form-grid form-grid-narrow">
            <Field label="Payment amount (₹)">
              <input className="form-control" type="number" min="0.01" max={selected.pendingAmount}
                step="0.01" required value={payment.amount}
                onChange={(event) => setPayment((value) => ({ ...value, amount: event.target.value }))} />
            </Field>
            <Field label="Payment type"><select className="form-control" value={payment.paymentType}
              onChange={(event) => setPayment((value) => ({ ...value, paymentType: event.target.value }))}>
              {["Cash", "Card", "Online"].map((item) => <option key={item}>{item}</option>)}
            </select></Field>
            <Field label="Transaction ID"><input className="form-control" maxLength="100" value={payment.transactionId}
              onChange={(event) => setPayment((value) => ({ ...value, transactionId: event.target.value }))} /></Field>
            <div className="form-actions">
              <button className="btn btn-primary" disabled={action.busy}>Record payment and download receipt</button>
              <button type="button" className="btn btn-default" onClick={() => setSelected(null)}>Cancel</button>
            </div>
          </form>
        </div>
      </div>}
    </section>
  );
}
