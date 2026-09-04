"use client";

import React, { useState, useEffect } from "react";
import { MdCancel } from "react-icons/md";
import { Icon } from '@iconify/react';
import DateRangePicker from '@/components/DateRangePicker';
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
export default function CancelledOrders() {
  const [activeTab, setActiveTab] = useState("cancelled");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [alertMessage, setAlertMessage] = useState(null);
  const itemsPerPage = 20;
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null
  });
  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when search term changes
  }, [searchTerm]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/orders/getorder?status=${activeTab}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      } else {
        console.error("API Error:", data.error);
        setAlertMessage("Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setAlertMessage("Error fetching orders");
    }
    setLoading(false);
  };
  // Handle date change
  const handleDateChange = ({ startDate, endDate }) => {
    setDateFilter({ startDate, endDate });
    setCurrentPage(1); // Reset to first page when date changes
  };

  // Filter orders based on search term
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.order_number
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ||
      order.payment_status?.toLowerCase() === statusFilter.toLowerCase();

    // Apply date filter
    let matchesDate = true;
    if (dateFilter.startDate && dateFilter.endDate && order.createdAt) {
      const orderDate = new Date(order.createdAt);
      const startDate = new Date(dateFilter.startDate);
      const endDate = new Date(dateFilter.endDate);
      matchesDate = orderDate >= startDate && orderDate <= endDate;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });
  // Calculate pagination variables
  const pageCount = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  const clearDateFilter = () => {
    setDateFilter({
      startDate: null,
      endDate: null
    });
    setCurrentPage(1);
  };

  // Handle page change
  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= pageCount) {
      setCurrentPage(pageNumber);
    }
  };



  return (
    <div className="container mx-auto">
      {/* Alert Message */}
      {alertMessage && (
        <div className="bg-green-500 text-white px-4 py-2 rounded-md mb-4">
          {alertMessage}
        </div>
      )}

      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold">Cancelled Order List</h2>
      </div>

      {loading ? (
        <p>Loading orders...</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-5 overflow-x-auto border border-gray-200">
          {/* Search */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-4">
            {/* Search Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              >
                <option value="All">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
            {/* Date Range Filter */}
            <div>
              <div className="w-full col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <DateRangePicker onDateChange={handleDateChange} />
                  </div>
                  {/* {(dateFilter.startDate || dateFilter.endDate) && (
                                             <button
                                               onClick={clearDateFilter}
                                               className="p-2 text-sm text-red-600 hover:text-red-800 bg-red-50 rounded-md"
                                               title="Clear date filter"
                                             >
                                               <Icon icon="mdi:close-circle-outline" className="w-5 h-5" />
                                             </button>
                                           )} */}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-t border-gray-200 mb-4" />

          {/* Orders Table */}
          <table className="w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2">Order ID</th>
                <th className="p-2">Email</th>
                <th className="p-2">Mobile</th>
                <th className="p-2">Price</th>
                <th className="p-2">Status</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => (
                  <tr key={order._id} className="text-center border">
                    <td className=" px-4 py-2">{order.order_number || 'N/A'}</td>
                    <td className=" px-4 py-2">{order.email_address || 'N/A'}</td>
                    <td className=" px-4 py-2">{order.order_phonenumber || 'N/A'}</td>
                    <td className=" px-4 py-2">{order.order_amount || 'N/A'}</td>
                    <td className="px-4 py-2">
                      <span className="bg-red-100 text-red-600 rounded-full font-medium text-sm px-3 py-1 inline-block capitalize">
                        {order.order_status || 'N/A'}
                      </span>
                    </td>

                    <td className="px-4 py-2 text-center">
                      <button
                        className="w-7 h-7 bg-pink-100 text-pink-600 rounded-full inline-flex items-center justify-center"
                        title="Cancel"
                      >
                        <MdCancel className="w-5 h-5" />
                      </button>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    No cancelled orders founding
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="flex justify-between items-center mt-6 flex-wrap gap-3">
              <div className="text-sm text-gray-600">
                Showing {filteredOrders.length > 0 ? startIndex + 1 : 0} to{" "}
                {Math.min(startIndex + itemsPerPage, filteredOrders.length)} of{" "}
                {filteredOrders.length} entries
              </div>

              <div className="pagination flex items-center space-x-1">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 border border-gray-300 rounded-md ${currentPage === 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-black bg-white hover:bg-gray-100"
                    }`}
                  aria-label="Previous page"
                >
                  «
                </button>

                {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => paginate(page)}
                    className={`px-3 py-1.5 border border-gray-300 rounded-md ${currentPage === page
                        ? "bg-red-500 text-white"
                        : "text-black bg-white hover:bg-gray-100"
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
                  className={`px-3 py-1.5 border border-gray-300 rounded-md ${currentPage === pageCount
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-black bg-white hover:bg-gray-100"
                    }`}
                  aria-label="Next page"
                >
                  »
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}