import React from "react";
import { EmptyState } from "./Feedback.jsx";

export default function DataTable({ columns, rows, empty, rowKey = "id" }) {
  if (!rows?.length) return <EmptyState>{empty}</EmptyState>;
  return (
    <div className="table-responsive">
      <table className="table table-striped table-bordered portal-table">
        <thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row[rowKey] ?? index}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render ? column.render(row) : (row[column.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
