import React from "react";
import { api, saveDownload } from "../../api/client.js";
import { DataTable, Feedback, Loading, PageTitle, money, useApiAction } from "../shared/index.js";

const now = new Date();
const defaultQuarter = `Q${Math.floor(now.getMonth() / 3) + 1}`;

export default function AdminDashboard() {
  const [quarter, setQuarter] = React.useState(defaultQuarter);
  const [year, setYear] = React.useState(now.getFullYear());
  const [pageSize, setPageSize] = React.useState(10);
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const action = useApiAction();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.get(`/admin/dashboard?quarter=${quarter}&year=${year}`));
      setPage(1);
    } catch (error) {
      action.setError(error);
    } finally {
      setLoading(false);
    }
  }, [quarter, year]);

  React.useEffect(() => { load(); }, [load]);
  const owners = data?.owners ?? [];
  const pages = Math.max(1, Math.ceil(owners.length / pageSize));
  const shown = owners.slice((page - 1) * pageSize, page * pageSize);

  const download = () => action.run(async () => {
    const file = await api.blob(`/admin/maintenance/status.xlsx?quarter=${quarter}&year=${year}`);
    saveDownload(file, `maintenance_status_${quarter}_${year}.xlsx`);
  }, "Maintenance status spreadsheet downloaded.");

  return (
    <section>
      <PageTitle title="Dashboard" description="Quarterly maintenance status across all registered flats."
        actions={<button className="btn btn-success" onClick={download} disabled={action.busy}>
          <span className="fa fa-download" /> Download XLSX
        </button>} />
      <Feedback error={action.error} success={action.success} />
      <div className="panel panel-default">
        <div className="panel-heading">Maintenance status</div>
        <div className="panel-body">
          <div className="toolbar">
            <label>Quarter
              <select className="form-control" value={quarter} onChange={(event) => setQuarter(event.target.value)}>
                {["Q1", "Q2", "Q3", "Q4"].map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>Year
              <input className="form-control" type="number" min="2024" max={now.getFullYear() + 5}
                value={year} onChange={(event) => setYear(Number(event.target.value))} />
            </label>
            <button className="btn btn-primary" onClick={load} disabled={loading}>Apply filters</button>
            <label>Rows
              <select className="form-control" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
                {[10, 25, 50].map((size) => <option key={size}>{size}</option>)}
              </select>
            </label>
          </div>
          {loading ? <Loading /> : <DataTable
            empty="No owners have been registered."
            rowKey="flatNo"
            rows={shown}
            columns={[
              { key: "flatNo", label: "Flat" },
              { key: "ownerName", label: "Owner" },
              { key: "flatType", label: "Type" },
              { key: "mobile", label: "Mobile" },
              { key: "email", label: "Email" },
              { key: "status", label: "Status", render: (row) => row.status ?? "—" },
              { key: "totalAmount", label: "Amount", render: (row) => row.totalAmount == null ? "—" : money(row.totalAmount) },
            ]}
          />}
          {owners.length > pageSize && (
            <div className="pagination-row">
              <span>{owners.length} flats · Page {page} of {pages}</span>
              <div>
                <button className="btn btn-default" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
                <button className="btn btn-default" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
