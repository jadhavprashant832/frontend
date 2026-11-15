import React from "react";
import { api, saveDownload } from "../../api/client.js";
import { DataTable, Feedback, Field, Loading, PageTitle, money, useApiAction } from "../shared/index.js";

const initialYear = String(new Date().getFullYear());

export default function OwnerMaintenanceHistory() {
  const [filters, setFilters] = React.useState({ quarter: "", year: "" });
  const [appliedFilters, setAppliedFilters] = React.useState({ quarter: "", year: "" });
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const action = useApiAction();
  const update = (key) => (event) => {
    setFilters((value) => ({ ...value, [key]: event.target.value }));
    setPage(1);
  };
  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page: String(page) });
      if (appliedFilters.quarter) query.set("quarter", appliedFilters.quarter);
      if (appliedFilters.year) query.set("year", appliedFilters.year);
      setData(await api.get(`/owner/maintenance/history?${query}`));
    } catch (error) {
      action.setError(error);
    } finally {
      setLoading(false);
    }
  }, [page, appliedFilters.quarter, appliedFilters.year]);
  React.useEffect(() => { load(); }, [load]);

  const downloadSlip = (row) => action.run(async () => {
    const blob = await api.blob(`/owner/maintenance/${row.id}/slip.pdf`);
    saveDownload(blob, `maintenance_${row.invoiceNo}.pdf`);
  }, "Maintenance slip downloaded.");

  return (
    <section>
      <PageTitle title="Maintenance history" description="Browse quarterly invoices and download available maintenance slips." />
      <Feedback error={action.error} success={action.success} />
      <div className="panel panel-default">
        <div className="panel-heading">Invoice history</div>
        <div className="panel-body">
          <form className="toolbar" onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setAppliedFilters(filters);
          }}>
            <Field label="Quarter"><select className="form-control" value={filters.quarter} onChange={update("quarter")}>
              <option value="">All quarters</option>{["Q1", "Q2", "Q3", "Q4"].map((item) => <option key={item}>{item}</option>)}
            </select></Field>
            <Field label="Year"><input className="form-control" type="number" min="2023" max="2100" value={filters.year} placeholder={initialYear} onChange={update("year")} /></Field>
            <button type="submit" className="btn btn-primary" disabled={loading}>Apply filters</button>
          </form>
          {data?.warnings?.length > 0 && <div className="alert alert-warning">{data.warnings.join(" ")}</div>}
          {loading ? <Loading /> : <DataTable empty="No maintenance invoices found." rows={data?.records ?? []} columns={[
            { key: "quarter", label: "Quarter" }, { key: "year", label: "Year" },
            { key: "invoiceNo", label: "Invoice" },
            { key: "finalAmount", label: "Invoice amount", render: (row) => money(row.finalAmount ?? row.totalAmount) },
            { key: "payedAmount", label: "Paid", render: (row) => money(row.payedAmount) },
            { key: "pendingAmount", label: "Pending", render: (row) => money(row.pendingAmount) },
            { key: "status", label: "Status" }, { key: "paymentDate", label: "Payment date" },
            { key: "paymentType", label: "Payment type" },
            { key: "slip", label: "Slip", render: (row) => row.status === "Paid" || Number(row.payedAmount) > 0
              ? <button className="btn btn-xs btn-default" onClick={() => downloadSlip(row)}>Download PDF</button>
              : "Not yet paid" },
          ]} />}
          {data?.totalPages > 1 && <div className="pagination-row">
            <span>{data.total} invoices · Page {data.page} of {data.totalPages}</span>
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
