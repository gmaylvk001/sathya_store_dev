"use client";

import React, { useState, useEffect } from "react";
import { MdCancel, MdLocalShipping } from "react-icons/md";
import { Icon } from '@iconify/react';
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
import DateRangePicker from '@/components/DateRangePicker';

import Link from "next/link";

export default function ShippedOrders() {
  const [activeTab, setActiveTab] = useState("shipped");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [alertMessage, setAlertMessage] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
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
  const handleDownloadInvoice = async (orderNumber) => {
    try {
      const response = await fetch(`/api/orders/invoice?order_id=${orderNumber}`);
  
      if (!response.ok) {
        let errorMsg = "Failed to download invoice";
        try {
          const errorData = await response.json();
          errorMsg = errorData?.error || errorMsg;
        } catch {
          // Ignore if response is not JSON
        }
        throw new Error(errorMsg);
      }
  
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
  
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice_${orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
  
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      alert(error.message || "Failed to download invoice. Please try again.");
    }
  };

  // Filter orders based on search term
  // const filteredOrders = orders.filter((order) =>
  //   order.order_number?.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  // Calculate pagination variables
  const pageCount = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);
 // Handle date change
  const handleDateChange = ({ startDate, endDate }) => {
    setDateFilter({ startDate, endDate });
    setCurrentPage(1); // Reset to first page when date changes
  };

  // Handle page change
  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= pageCount) {
      setCurrentPage(pageNumber);
    }
  };
const clearDateFilter = () => {
    setDateFilter({
      startDate: null,
      endDate: null
    });
    setCurrentPage(1);
  };

  const calculateOrderTotal = (order) => {
    if (!order.order_details) return order.order_amount || 0;
    
    const subtotal = order.order_details.reduce((sum, item) => {
      return sum + (item.product_price * item.quantity);
    }, 0);
    
    return subtotal;
  };

  return (
    <div className="container mx-auto p-4">
      {/* Alert Message */}
      {alertMessage && (
        <div className="bg-green-500 text-white px-4 py-2 rounded-md mb-4">
          {alertMessage}
        </div>
      )}

      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold">Shipped Order List</h2>
      </div>

      {loading ? (
        <p>Loading orders...</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-5 h-[500px] ">
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
                <th className="px-4 py-2">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => (
                  <tr key={order._id} className="text-center border">
                    <td className="px-4 py-2">{order.order_number || 'N/A'}</td>
                    <td className="px-4 py-2">{order.email_address || 'N/A'}</td>
                    <td className="px-4 py-2">{order.order_phonenumber || 'N/A'}</td>
                    <td className="px-4 py-2">₹{order.order_amount || 'N/A'}</td>
                    <td className="px-4 py-2 text-center">
                      <button
                        className="w-7 h-7 bg-orange-100 text-orange-600 rounded-full inline-flex items-center justify-center"
                        title="shipped"
                      >
                        <MdLocalShipping className="w-5 h-5" />
                      </button>
                    </td>
                   <td className="px-4 py-2 text-center">
                    <Link
                      href={`/admin/invoice/${order.order_number}`}
                      className="w-8 h-8 bg-red-100 text-red-600 rounded-full inline-flex items-center justify-center"
                      title="View Invoice"
                    >
                      <Icon icon="iconamoon:eye-light" width="20" height="20" />
                    </Link>
                  </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    No shipped orders found
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

      {/* Invoice Modal */}
      {isInvoiceModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">Invoice #{selectedOrder.order_number}</h2>
                <button 
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <MdCancel className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="font-semibold">Order Details</h3>
                  <p>Date: {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                  <p>Status: {selectedOrder.order_status}</p>
                  <p>Payment: {selectedOrder.payment_status}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Customer</h3>
                  <p>Name: {selectedOrder.order_username}</p>
                  <p>Email: {selectedOrder.email_address}</p>
                  <p>Phone: {selectedOrder.order_phonenumber}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Delivery Address</h3>
                <p className="whitespace-pre-line">{selectedOrder.order_deliveryaddress || 'Not specified'}</p>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Items</h3>
                <table className="w-full border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left">Product</th>
                      <th className="p-2 text-left">Model</th>
                      <th className="p-2 text-right">Price</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.order_details?.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{item.product_name}</td>
                        <td className="p-2">{item.model || '-'}</td>
                        <td className="p-2 text-right">₹{item.product_price}</td>
                        <td className="p-2 text-right">{item.quantity}</td>
                        <td className="p-2 text-right">₹{(item.product_price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between mb-2">
                    <span>Subtotal:</span>
                    <span>₹{calculateOrderTotal(selectedOrder).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Shipping:</span>
                    <span>₹0.00</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>₹{calculateOrderTotal(selectedOrder).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-4">
                <button 
                  onClick={() => handleDownloadInvoice(selectedOrder.order_number)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Download PDF
                </button>
                <button 
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}