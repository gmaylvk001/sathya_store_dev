"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DateRangePicker from "@/components/DateRangePicker";

export default function PlaceOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [alertMessage, setAlertMessage] = useState(null);
  const itemsPerPage = 20;
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null,
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/orders_new");
      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      setOrders(list.filter((order) => order.order_status === "Order Placed"));
    } catch (error) {
      console.error("Error fetching orders:", error);
      setAlertMessage("Error fetching orders");
    }
    setLoading(false);
  };

  const handleDateChange = ({ startDate, endDate }) => {
    setDateFilter({ startDate, endDate });
    setCurrentPage(1);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.order_number
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    let matchesDate = true;
    if (dateFilter.startDate && dateFilter.endDate && (order.created_at || order.createdAt)) {
      const orderDate = new Date(order.created_at || order.createdAt);
      const startDate = new Date(dateFilter.startDate);
      const endDate = new Date(dateFilter.endDate);
      matchesDate = orderDate >= startDate && orderDate <= endDate;
    }

    const matchesPayment = !paymentMethod
      || order.payment_method?.toLowerCase() === paymentMethod.toLowerCase();

    return matchesSearch && matchesDate && matchesPayment;
  });

  const pageCount = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= pageCount) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="container mx-auto">
      {alertMessage && (
        <div className="bg-green-500 text-white px-4 py-2 rounded-md mb-4">
          {alertMessage}
        </div>
      )}

      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold">Place Orders</h2>
      </div>

      {loading ? (
        <p>Loading orders...</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-5 overflow-x-auto border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment method</label>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              >
                <option value="">All Payment Methods</option>
                <option value="online">Online</option>
                <option value="cod">COD</option>
              </select>
            </div>

            <div>
              <div className="w-full col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <DateRangePicker onDateChange={handleDateChange} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-t border-gray-200 mb-4" />

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
                    <td className=" px-4 py-2">{order.order_number || "N/A"}</td>
                    <td className=" px-4 py-2">{order.email_address || "N/A"}</td>
                    <td className=" px-4 py-2">{order.order_phonenumber || "N/A"}</td>
                    <td className=" px-4 py-2">{order.order_amount || "N/A"}</td>
                    <td className="px-4 py-2">
                      <span className="bg-blue-100 text-blue-700 rounded-full font-medium text-sm px-3 py-1 inline-block">
                        {order.order_status || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => router.push(`/admin/order/place-order/${order._id}`)}
                        className="text-sm text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-md"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    No placed orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

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
                  className={`px-3 py-1.5 border border-gray-300 rounded-md ${
                    currentPage === 1
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
                    className={`px-3 py-1.5 border border-gray-300 rounded-md ${
                      currentPage === page
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
                  className={`px-3 py-1.5 border border-gray-300 rounded-md ${
                    currentPage === pageCount
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
