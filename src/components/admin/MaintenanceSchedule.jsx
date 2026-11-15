import React from "react";
import { api } from "../../api/client.js";
import { Feedback, Field, Loading, PageTitle, useApiAction } from "../shared/index.js";

const flatTypes = ["1BHK", "2BHK", "3BHK", "4BHK"];
const feeFields = [
  ["shareCapital", "Share capital"], ["registrationFee", "Registration fee"],
  ["transferFee", "Transfer fee"], ["monthlyMaintenance", "Monthly maintenance"],
  ["festivalFee", "Festival fee"], ["sinkingFund", "Sinking fund"],
  ["educationFee", "Education fee"], ["otherFee", "Other fee"],
];
const emptyFees = Object.fromEntries(feeFields.map(([key]) => [key, "0"]));

export default function MaintenanceSchedule() {
  const [flatType, setFlatType] = React.useState("1BHK");
  const [fees, setFees] = React.useState(emptyFees);
  const [loading, setLoading] = React.useState(false);
  const action = useApiAction();

  const load = React.useCallback(async () => {
    setLoading(true);
    action.setError(null);
    try {
      const response = await api.get(`/admin/maintenance/schedule?flatType=${encodeURIComponent(flatType)}`);
      setFees(Object.fromEntries(feeFields.map(([key]) => [key, String(response.details[key] ?? 0)])));
    } catch (error) {
      setFees(emptyFees);
      action.setError(error);
    } finally {
      setLoading(false);
    }
  }, [flatType]);
  React.useEffect(() => { load(); }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    const body = Object.fromEntries(Object.entries(fees).map(([key, value]) => [key, Number(value)]));
    const result = await action.run(
      () => api.put(`/admin/maintenance/schedule/${encodeURIComponent(flatType)}`, body),
      "Maintenance fee schedule updated.",
    );
    if (result) load();
  };

  return (
    <section>
      <PageTitle title="Maintenance details" description="Configure the fee schedule used to calculate quarterly invoices." />
      <Feedback error={action.error} success={action.success} />
      <div className="panel panel-default">
        <div className="panel-heading">Fee schedule</div>
        <div className="panel-body">
          <div className="form-grid form-grid-narrow">
            <Field label="Flat type">
              <select className="form-control" value={flatType} onChange={(event) => setFlatType(event.target.value)}>
                {flatTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </Field>
          </div>
          {loading ? <Loading /> : <form onSubmit={submit} className="form-grid">
            {feeFields.map(([key, label]) => (
              <Field key={key} label={`${label} (₹)`}>
                <input className="form-control" type="number" min="0" step="0.01" required value={fees[key]}
                  onChange={(event) => setFees((value) => ({ ...value, [key]: event.target.value }))} />
              </Field>
            ))}
            <div className="form-actions"><button className="btn btn-primary" disabled={action.busy}>Save schedule</button></div>
          </form>}
        </div>
      </div>
    </section>
  );
}
