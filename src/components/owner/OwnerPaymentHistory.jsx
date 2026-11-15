import React from "react";
import { api, saveDownload } from "../../api/client.js";
import { DataTable, Feedback, Loading, PageTitle, money, useApiAction } from "../shared/index.js";

export default function OwnerPaymentHistory() {
  const [payments, setPayments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const action = useApiAction();
  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/owner/maintenance/payments");
      setPayments(response.payments);
    } catch (error) {
      action.setError(error);
    } finally {
      setLoading(false);
    }
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const receipt = (row) => action.run(async () => {
    const file = await api.blob(`/owner/maintenance/payments/${row.id}/receipt.pdf`);
    saveDownload(file, `receipt_${row.receiptNo}.pdf`);
  }, "Payment receipt downloaded.");

  return (
    <section>
      <PageTitle title="Payment history" description="Review partial and completed maintenance payments." />
      <Feedback error={action.error} success={action.success} />
      <div className="panel panel-default">
        <div className="panel-heading">Maintenance payments</div>
        <div className="panel-body">
          {loading ? <Loading /> : <DataTable empty="No maintenance payments recorded." rows={payments} columns={[
            { key: "createdAt", label: "Date" }, { key: "invoiceNo", label: "Invoice" },
            { key: "receiptNo", label: "Receipt" },
            { key: "amount", label: "Paid", render: (row) => money(row.amount) },
            { key: "previousBalance", label: "Previous balance", render: (row) => money(row.previousBalance) },
            { key: "remainingBalance", label: "Remaining", render: (row) => money(row.remainingBalance) },
            { key: "paymentType", label: "Method" }, { key: "transactionId", label: "Transaction" },
            { key: "actions", label: "Receipt", render: (row) => <button className="btn btn-xs btn-default" onClick={() => receipt(row)}>Download PDF</button> },
          ]} />}
        </div>
      </div>
    </section>
  );
}
