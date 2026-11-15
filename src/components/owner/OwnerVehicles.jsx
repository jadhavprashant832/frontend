import React from "react";
import { api } from "../../api/client.js";
import { DataTable, Feedback, Field, Loading, PageTitle, useApiAction } from "../shared/index.js";

const emptyVehicle = { vehicleType: "Two Wheeler", registrationNumber: "", makeModel: "", color: "" };

export default function OwnerVehicles() {
  const [vehicles, setVehicles] = React.useState([]);
  const [vehicle, setVehicle] = React.useState(emptyVehicle);
  const [editingId, setEditingId] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const action = useApiAction();
  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/owner/vehicles");
      setVehicles(response.vehicles);
    } catch (error) {
      action.setError(error);
    } finally {
      setLoading(false);
    }
  }, []);
  React.useEffect(() => { load(); }, [load]);
  const update = (key) => (event) => setVehicle((value) => ({ ...value, [key]: event.target.value }));
  const clearForm = () => { setEditingId(null); setVehicle(emptyVehicle); };

  const submit = async (event) => {
    event.preventDefault();
    const operation = editingId
      ? () => api.put(`/owner/vehicles/${editingId}`, vehicle)
      : () => api.post("/owner/vehicles", vehicle);
    const result = await action.run(operation, editingId ? "Vehicle updated." : "Vehicle added.");
    if (result) {
      clearForm();
      load();
    }
  };
  const edit = (row) => {
    setEditingId(row.vehicleId);
    setVehicle({
      vehicleType: row.vehicleType, registrationNumber: row.registrationNumber,
      makeModel: row.makeModel, color: row.color ?? "",
    });
    action.setError(null);
    action.setSuccess("");
  };
  const remove = async (row) => {
    if (!window.confirm(`Remove vehicle ${row.registrationNumber}?`)) return;
    const result = await action.run(() => api.delete(`/owner/vehicles/${row.vehicleId}`), "Vehicle removed.");
    if (result) load();
  };

  return (
    <section>
      <PageTitle title="My vehicles" description="Manage the vehicles registered to your flat." />
      <Feedback error={action.error} success={action.success} />
      <div className="panel panel-default">
        <div className="panel-heading">{editingId ? "Update vehicle" : "Register vehicle"}</div>
        <div className="panel-body">
          <form onSubmit={submit} className="form-grid">
            <Field label="Vehicle type"><select className="form-control" value={vehicle.vehicleType} onChange={update("vehicleType")}>
              {["Car", "Motorcycle", "Scooter", "Bicycle", "Other"].map((item) => <option key={item}>{item}</option>)}
            </select></Field>
            <Field label="Registration number"><input className="form-control" maxLength="30" required value={vehicle.registrationNumber} onChange={update("registrationNumber")} /></Field>
            <Field label="Make and model"><input className="form-control" maxLength="100" required value={vehicle.makeModel} onChange={update("makeModel")} /></Field>
            <Field label="Color"><input className="form-control" maxLength="50" value={vehicle.color} onChange={update("color")} /></Field>
            <div className="form-actions">
              <button className="btn btn-primary" disabled={action.busy}>{editingId ? "Save changes" : "Add vehicle"}</button>
              {editingId && <button type="button" className="btn btn-default" onClick={clearForm}>Cancel</button>}
            </div>
          </form>
        </div>
      </div>
      <div className="panel panel-default">
        <div className="panel-heading">Registered vehicles</div>
        <div className="panel-body">
          {loading ? <Loading /> : <DataTable empty="No vehicles registered." rowKey="vehicleId" rows={vehicles} columns={[
            { key: "vehicleType", label: "Type" }, { key: "registrationNumber", label: "Registration" },
            { key: "makeModel", label: "Make / model" }, { key: "color", label: "Color" },
            { key: "actions", label: "Actions", render: (row) => <div className="button-group">
              <button className="btn btn-xs btn-primary" onClick={() => edit(row)}>Update</button>
              <button className="btn btn-xs btn-danger" onClick={() => remove(row)}>Delete</button>
            </div> },
          ]} />}
        </div>
      </div>
    </section>
  );
}
