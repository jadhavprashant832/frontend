import React from "react";
import { api } from "../../api/client.js";
import { Feedback, Field, PageTitle, money, useApiAction } from "../shared/index.js";

const feeFields = [
  ["shareCapital", "Share capital"], ["registrationFee", "Registration fee"],
  ["transferFee", "Transfer fee"], ["monthlyMaintenance", "Monthly maintenance"],
  ["festivalFee", "Festival fee"], ["sinkingFund", "Sinking fund"],
  ["educationFee", "Education fee"], ["otherFee", "Other fee"],
];
const initialForm = Object.fromEntries([
  ["quarter", "Q1"], ["year", String(new Date().getFullYear())], ["noOfMonths", "3"],
  ...feeFields.map(([key]) => [key, "0"]), ["payedAmount", "0"],
  ["paymentType", "Cash"], ["transactionId", ""],
]);

export default function MaintenanceBilling() {
  const [owners, setOwners] = React.useState([]);
  const [ownerPage, setOwnerPage] = React.useState(1);
  const [ownerPageCount, setOwnerPageCount] = React.useState(1);
  const [ownersLoading, setOwnersLoading] = React.useState(false);
  const [flatNo, setFlatNo] = React.useState("");
  const [owner, setOwner] = React.useState(null);
  const [form, setForm] = React.useState(initialForm);
  const action = useApiAction();

  React.useEffect(() => {
    let active = true;
    setOwnersLoading(true);
    api.get(`/admin/owners?page=${ownerPage}&pageSize=100`)
      .then((response) => {
        if (!active) return;
        setOwners(response.items);
        setOwnerPageCount(Math.max(1, response.totalPages));
      })
      .catch((error) => { if (active) action.setError(error); })
      .finally(() => { if (active) setOwnersLoading(false); });
    return () => { active = false; };
  }, [ownerPage]);

  const updateForm = (key) => (event) => setForm((value) => ({ ...value, [key]: event.target.value }));
  const selectFlat = async (event) => {
    const selected = owners.find((item) => String(item.flatNo) === event.target.value);
    setFlatNo(event.target.value);
    setOwner(selected ?? null);
    if (!selected) return;
    try {
      const response = await api.get(`/admin/maintenance/schedule?flatType=${encodeURIComponent(selected.flatType)}`);
      setForm((value) => Object.fromEntries([
        ...Object.entries(value).filter(([key]) => !feeFields.some(([fee]) => fee === key)),
        ...feeFields.map(([key]) => [key, String(response.details[key] ?? 0)]),
      ]));
    } catch (error) {
      action.setError(error);
    }
  };
  const numeric = (key) => Number(form[key] || 0);
  const base = feeFields.reduce((total, [key]) => total + numeric(key), 0);
  const total = base * Number(form.noOfMonths || 0);
  const previous = Number(owner?.pendingAmount ?? 0);
  const finalAmount = total + previous;
  const pending = finalAmount - numeric("payedAmount");

  const submit = async (event) => {
    event.preventDefault();
    if (!owner) return;
    const body = {
      flatNo: owner.flatNo,
      quarter: form.quarter,
      year: Number(form.year),
      noOfMonths: Number(form.noOfMonths),
      ...Object.fromEntries(feeFields.map(([key]) => [key, numeric(key)])),
      payedAmount: numeric("payedAmount"),
      paymentType: form.paymentType,
      transactionId: form.transactionId,
    };
    const result = await action.run(() => api.post("/admin/maintenance/invoices", body),
      "Maintenance invoice generated.");
    if (result) action.setSuccess(`Invoice ${result.invoiceNo} created. Outstanding balance: ${money(result.pendingAmount)}.`);
  };

  return (
    <section>
      <PageTitle title="Owner maintenance" description="Generate a quarterly invoice or record an initial payment for an owner." />
      <Feedback error={action.error} success={action.success} />
      <div className="panel panel-default">
        <div className="panel-heading">Create maintenance invoice</div>
        <div className="panel-body">
          <form onSubmit={submit}>
            <div className="form-grid">
              <Field label="Owner / flat">
                <select className="form-control" required value={owners.some((item) => String(item.flatNo) === flatNo) ? flatNo : ""}
                  disabled={ownersLoading} onChange={selectFlat}>
                  <option value="">Select flat</option>
                  {owners.map((item) => <option key={item.flatNo} value={item.flatNo}>
                    {item.flatNo} · {item.ownerName} ({item.flatType})
                  </option>)}
                </select>
              </Field>
              <Field label="Quarter"><select className="form-control" value={form.quarter} onChange={updateForm("quarter")}>
                {["Q1", "Q2", "Q3", "Q4"].map((item) => <option key={item}>{item}</option>)}
              </select></Field>
              <Field label="Year"><input className="form-control" type="number" min="2023" max="2100" required value={form.year} onChange={updateForm("year")} /></Field>
              <Field label="Months (1–3)"><select className="form-control" value={form.noOfMonths} onChange={updateForm("noOfMonths")}>
                {[1, 2, 3].map((item) => <option key={item}>{item}</option>)}
              </select></Field>
            </div>
            {ownerPageCount > 1 && <div className="pagination-row owner-picker-pagination">
              <span>Owner page {ownerPage} of {ownerPageCount}</span>
              <div>
                <button type="button" className="btn btn-default" disabled={ownerPage <= 1 || ownersLoading}
                  onClick={() => setOwnerPage(ownerPage - 1)}>Previous owners</button>
                <button type="button" className="btn btn-default" disabled={ownerPage >= ownerPageCount || ownersLoading}
                  onClick={() => setOwnerPage(ownerPage + 1)}>Next owners</button>
              </div>
            </div>}
            {owner && <div className="owner-balance">
              <span><strong>{owner.ownerName}</strong> · Flat {owner.flatNo} · {owner.mobile} · {owner.email}</span>
              <span>Previous outstanding: <strong>{money(previous)}</strong></span>
            </div>}
            <h3 className="subheading">Charge breakdown per month</h3>
            <div className="form-grid">
              {feeFields.map(([key, label]) => <Field key={key} label={`${label} (₹)`}>
                <input className="form-control" type="number" min="0" step="0.01" required value={form[key]} onChange={updateForm(key)} />
              </Field>)}
            </div>
            <h3 className="subheading">Payment details</h3>
            <div className="form-grid">
              <Field label="Amount paid (₹)"><input className="form-control" type="number" min="0" step="0.01" required value={form.payedAmount} onChange={updateForm("payedAmount")} /></Field>
              <Field label="Payment type"><select className="form-control" value={form.paymentType} onChange={updateForm("paymentType")}>
                {["Cash", "Card", "Online"].map((item) => <option key={item}>{item}</option>)}
              </select></Field>
              <Field label="Transaction ID"><input className="form-control" maxLength="100" value={form.transactionId} onChange={updateForm("transactionId")} /></Field>
            </div>
            <div className="amount-summary">
              <span>Current charges <strong>{money(total)}</strong></span>
              <span>Final amount <strong>{money(finalAmount)}</strong></span>
              <span>Outstanding after payment <strong>{money(pending)}</strong></span>
            </div>
            <div className="form-actions"><button className="btn btn-primary" disabled={action.busy || !owner}>
              {action.busy ? "Creating..." : "Create invoice"}
            </button></div>
          </form>
        </div>
      </div>
    </section>
  );
}
