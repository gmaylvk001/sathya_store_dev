"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function CancelledOrders() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [openActionId, setOpenActionId] = useState(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState("");
  const actionMenuRef = useRef(null);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setOpenActionId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch("/api/cancel_orders/requests", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setAlertMessage(data.message || "Error fetching cancel requests");
        setRequests([]);
      } else {
        setRequests(Array.isArray(data.requests) ? data.requests : []);
      }
    } catch (error) {
      console.error("Error fetching cancel requests:", error);
      setAlertMessage("Error fetching cancel requests");
    }
    setLoading(false);
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    const pad = (n) => String(n).padStart(2, "0");
    let hours = d.getHours();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(hours)}:${pad(d.getMinutes())} ${ampm}`;
  };

  const filteredRequests = requests.filter((row) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      row.order_number?.toLowerCase().includes(q) ||
      row.customer_name?.toLowerCase().includes(q) ||
      row.reason?.toLowerCase().includes(q)
    );
  });

  const pageCount = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= pageCount) {
      setCurrentPage(pageNumber);
    }
  };

  const openImport = () => {
    setImportFile(null);
    setImportResult(null);
    setImportError("");
    setIsImportOpen(true);
  };

  const closeImport = () => {
    if (isImporting) return;
    setIsImportOpen(false);
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    setImportError("");
    setImportResult(null);

    if (!importFile) {
      setImportError("Please choose an Excel or CSV file");
      return;
    }
    const name = importFile.name.toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".xls") && !name.endsWith(".csv")) {
      setImportError("Only .xlsx, .xls and .csv files are allowed");
      return;
    }

    const data = new FormData();
    data.append("file", importFile);
    setIsImporting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/cancel_orders/import", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: data,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        setImportError(result?.error || result?.details || "Import failed");
        return;
      }
      setImportResult(result);
      setImportFile(null);
      fetchRequests();
    } catch (error) {
      console.error("Cancel orders import error:", error);
      setImportError("Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  const handleView = (row) => {
    setOpenActionId(null);
    if (!row.order_ref_id) {
      setAlertMessage(`Order ${row.order_number} not found in orders`);
      return;
    }
    router.push(`/admin/Allorder/${row.order_ref_id}`);
  };

  return (
    <div className="container mx-auto">
      {alertMessage && (
        <div className="bg-red-500 text-white px-4 py-2 rounded-md mb-4 flex justify-between items-center">
          <span>{alertMessage}</span>
          <button type="button" onClick={() => setAlertMessage(null)} className="ml-4 font-bold">
            ×
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold">Cancel Request Orders</h2>
        <button
          type="button"
          onClick={openImport}
          className="p-2 border border-red-500 text-red-500 hover:bg-red-50 rounded-md transition text-sm"
        >
          Import Excel/CSV
        </button>
      </div>

      {isImportOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-5 rounded-lg w-[28rem] max-w-[95vw] relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-center">Import Cancel Orders</h2>
            <button
              type="button"
              onClick={closeImport}
              className="absolute top-3 right-3 text-red-500 text-xl"
              aria-label="Close"
            >
              ×
            </button>

            <p className="text-sm text-gray-600 mt-4 mb-2">
              Import exist <b>cancel_orders</b> records. Columns: <b>id</b>, order_number, order_id,
              customer_id, order_status, reason, comments, created_at, updated_at.
              Column <b>id</b> is saved as <b>exist_id</b>; rows with an id that was already imported are skipped.
              Dates like <b>21-09-2026 17:28</b> are kept as they are; empty dates use today.
            </p>
            <div className="flex gap-4 mb-3 text-sm">
              <a href="/api/cancel_orders/import/sample" className="text-red-500 hover:underline">
                Download Excel sample
              </a>
              <a href="/api/cancel_orders/import/sample?format=csv" className="text-red-500 hover:underline">
                Download CSV sample
              </a>
            </div>

            <form onSubmit={handleImportSubmit}>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="w-full border p-2 mb-3 rounded"
              />
              <button
                type="submit"
                disabled={isImporting}
                className="bg-red-500 text-white px-4 py-2 rounded w-full disabled:opacity-50"
              >
                {isImporting ? "Importing..." : "Import File"}
              </button>
            </form>

            {importError && (
              <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2">
                {importError}
              </div>
            )}

            {importResult && (
              <div className="mt-4 text-sm space-y-1">
                <div className="bg-green-50 border border-green-200 text-green-700 rounded px-3 py-2 mb-2">
                  {importResult.message}
                </div>
                <p>Total rows: {importResult.totalRows || 0}</p>
                <p>Added: {importResult.addedCount || 0}</p>
                <p>Skipped existing: {importResult.skippedExistingCount || 0}</p>
                <p>Invalid: {importResult.invalidCount || 0}</p>
                {importResult.skippedRows?.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto border rounded p-2 text-gray-600">
                    {importResult.skippedRows.map((item, index) => (
                      <div key={index}>
                        Row {item.row}: id {item.exist_id} ({item.order_number}) already exists
                      </div>
                    ))}
                  </div>
                )}
                {importResult.errors?.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto border rounded p-2 text-red-600">
                    {importResult.errors.map((item, index) => (
                      <div key={index}>Row {item.row}: {item.error}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-5 overflow-x-auto border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Order ID, customer or reason..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>

        <hr className="border-t border-gray-200 mb-4" />

        <table className="w-full border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2">Action</th>
              <th className="p-2">Order ID</th>
              <th className="p-2">Customer Name</th>
              <th className="p-2">Order Status</th>
              <th className="p-2">Reason</th>
              <th className="p-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  Loading cancel requests...
                </td>
              </tr>
            ) : paginatedRequests.length > 0 ? (
              paginatedRequests.map((row) => (
                <tr key={row._id} className="border-t hover:bg-gray-50">
                  <td
                    className="px-3 py-2 relative"
                    ref={openActionId === row._id ? actionMenuRef : null}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenActionId(openActionId === row._id ? null : row._id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border border-gray-300 rounded bg-gray-100 hover:bg-gray-200"
                    >
                      Action
                      <span className="text-[10px]">▼</span>
                    </button>
                    {openActionId === row._id && (
                      <div className="absolute left-3 top-10 z-20 min-w-[120px] bg-white border border-gray-200 rounded shadow-md py-1">
                        <button
                          type="button"
                          className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100"
                          onClick={() => handleView(row)}
                        >
                          View
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">{row.order_number || "-"}</td>
                  <td className="px-3 py-2">{row.customer_name || "-"}</td>
                  <td className="px-3 py-2">{row.order_status || "-"}</td>
                  <td className="px-3 py-2">{row.reason || "-"}</td>
                  <td className="px-3 py-2">{formatDateTime(row.created_at)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  No cancel requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex justify-between items-center mt-6 flex-wrap gap-3">
          <div className="text-sm text-gray-600">
            Showing {filteredRequests.length > 0 ? startIndex + 1 : 0} to{" "}
            {Math.min(startIndex + itemsPerPage, filteredRequests.length)} of{" "}
            {filteredRequests.length} entries
          </div>

          {pageCount > 1 && (
            <div className="pagination flex items-center space-x-1">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 border border-gray-300 rounded-md ${
                  currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-black bg-white hover:bg-gray-100"
                }`}
                aria-label="Previous page"
              >
                «
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => paginate(page)}
                  className={`px-3 py-1.5 border border-gray-300 rounded-md ${
                    currentPage === page ? "bg-red-500 text-white" : "text-black bg-white hover:bg-gray-100"
                  }`}
                  aria-label={`Page ${page}`}
                  aria-current={currentPage === page ? "page" : undefined}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === pageCount}
                className={`px-3 py-1.5 border border-gray-300 rounded-md ${
                  currentPage === pageCount ? "text-gray-400 cursor-not-allowed" : "text-black bg-white hover:bg-gray-100"
                }`}
                aria-label="Next page"
              >
                »
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
