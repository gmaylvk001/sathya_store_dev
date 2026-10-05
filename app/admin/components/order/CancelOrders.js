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
      </div>

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
