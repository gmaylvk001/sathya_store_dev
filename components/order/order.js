"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiChevronRight, FiClock, FiCheckCircle, FiTruck, FiShoppingBag, FiXCircle, FiRefreshCw } from 'react-icons/fi';
import { RiAccountCircleFill } from "react-icons/ri";
import { ToastContainer, toast } from 'react-toastify';
import { FaAddressBook } from "react-icons/fa";
import { HiShoppingBag } from "react-icons/hi2";
import { FaHeart } from "react-icons/fa6";
import { AuthModal } from '@/components/AuthModal';

const getImageUrl = (img) => {
  if (!img) return null;
  const str = String(img).trim();
  if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:')) return str;
  if (str.startsWith('/uploads/products/')) return str;
  if (str.startsWith('/')) return str;
  return `/uploads/products/${str}`;
};

export default function Order() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [orderCounts, setOrderCounts] = useState({ total: 0, exist: 0, newOrders: 0 });
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelComments, setCancelComments] = useState("");
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [fetchingOrders, setFetchingOrders] = useState(false);
  const itemsPerPage = 5;
  const router = useRouter();

  const loadOrders = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setShowAuthModal(true);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/orders/get`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders data');
      }
      const data = await response.json();
      const visible = data?.orders || [];
      const existOrders = visible.filter((order) => {
        const existId = order.exist_id;
        return existId !== undefined && existId !== null && String(existId).trim() !== "" && String(existId).toLowerCase() !== "null";
      });
      setOrderCounts({
        total: visible.length,
        exist: existOrders.length,
        newOrders: visible.length - existOrders.length,
      });
      const filtered = activeFilter === "cancelled"
        ? visible.filter((order) => String(order.order_status || "").toLowerCase() === "cancelled")
        : visible;
      setFilteredOrders(filtered || []);
      setCurrentPage(1);
    } catch (error) {
      toast.error("Failed to load orders data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadOrders();
  }, [activeFilter]);

  const handleFetchExistOrders = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setShowAuthModal(true);
      return;
    }

    setFetchingOrders(true);
    try {
      const response = await fetch("/api/orders/fetch-exist", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to fetch orders");
      }
      toast.success(data.message || "Orders fetched successfully");
      setLoading(true);
      await loadOrders();
    } catch (error) {
      toast.error(error.message || "Failed to fetch orders");
      console.error(error);
    } finally {
      setFetchingOrders(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getPaymentStatusLabel = (order) => {
    const raw = String(order.payment_status || "").trim();
    if (!raw) return "Not specified";
    const key = raw.toLowerCase();
    if (["paid", "captured", "success", "successful", "completed"].includes(key)) return "Paid";
    if (["pending", "created", "authorized", "payment_initialized", "unpaid"].includes(key)) return "Pending";
    if (["failed", "failure"].includes(key)) return "Failed";
    if (["cancelled", "canceled"].includes(key)) return "Cancelled";
    return raw;
  };

  const getPaymentMethodLabel = (order) => {
    const raw = String(
      order.payment_method || order.payment_type || order.payment_mode || ""
    ).trim();
    if (!raw) return "";
    const key = raw.toLowerCase();
    if (key === "cod" || key.includes("cash on delivery") || key.includes("cash on deliver")) {
      return "Cash on Delivery";
    }
    if (key === "online") return "Online";
    if (key === "emi") return "EMI";
    if (key.includes("pay at store") || key === "pay_at_store") return "Pay at Store";
    return raw;
  };

  const getPaymentStatusClass = (label) => {
    const key = String(label || "").toLowerCase();
    if (key === "paid") return "bg-green-100 text-green-800";
    if (key === "pending") return "bg-amber-100 text-amber-800";
    if (key === "failed" || key === "cancelled") return "bg-rose-100 text-rose-800";
    return "bg-gray-100 text-gray-700";
  };

  const getStatusKey = (status) => String(status || "").toLowerCase();

  const getStatusBadge = (status) => {
    const key = getStatusKey(status);
    const styles = {
      pending: "bg-amber-100 text-amber-800",
      cancelled: "bg-rose-100 text-rose-800",
      shipped: "bg-indigo-100 text-indigo-800",
      "order placed": "bg-cyan-100 text-cyan-800",
      failure: "bg-red-100 text-red-800",
      payment_initialized: "bg-slate-100 text-slate-800",
      "payment initiated": "bg-slate-100 text-slate-800",
      "order accepted": "bg-sky-100 text-sky-800",
      complete: "bg-green-100 text-green-800",
      ordered: "bg-blue-100 text-blue-800",
      billed: "bg-emerald-100 text-emerald-800",
    };
    const labels = {
      pending: "pending",
      cancelled: "cancelled",
      shipped: "shipped",
      "order placed": "Order Placed",
      failure: "Failure",
      payment_initialized: "payment_initialized",
      "payment initiated": "Payment Initiated",
      "order accepted": "Order Accepted",
      complete: "Complete",
      ordered: "ordered",
      billed: "Billed",
    };
    return {
      className: styles[key] || "bg-gray-100 text-gray-800",
      label: labels[key] || status || "pending",
    };
  };

  const handleBuyAgain = () => {
    router.push('/');
  };

  const CANCEL_REASONS = [
    { value: "price too high", label: "Item Price/shipping cost is too high" },
    { value: "bought elsewhere", label: "Bought it from somewhere else" },
    { value: "mistake", label: "Order placed by mistake" },
    { value: "change address", label: "Need to change shipping address" },
    { value: "others", label: "My reason is not listed" },
  ];

  const handleCancelClick = (order) => {
    setSelectedOrder(order);
    setCancelReason("");
    setCancelComments("");
    setCancelFeedback(null);
    setCancelSubmitting(false);
    setShowCancelConfirm(true);
  };

  const handleCancelConfirm = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (cancelSubmitting) return;

    if (!cancelReason.trim()) {
      setCancelFeedback({ type: "error", message: "Please select a reason" });
      return;
    }

    setCancelSubmitting(true);
    setCancelFeedback(null);

    try {
      const response = await fetch("/api/cancel_order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: cancelReason,
          comments: cancelComments,
          cancel_order_number: selectedOrder?.order_number || "",
          cancel_order_id: selectedOrder?._id || "",
          customer_id: selectedOrder?.user_id || "",
          order_status: selectedOrder?.order_status || "",
        }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.result || "something is wrong. Please try again later!");
      }

      const resultText = String(data?.result || "").trim();
      if (resultText === "Success") {
        setCancelFeedback({
          type: "success",
          message: "Thank you!. Your request has been sent.",
        });
        if (data?.order_status === "Cancelled") {
          setFilteredOrders((prev) =>
            prev.map((order) =>
              order._id === selectedOrder._id
                ? { ...order, order_status: "Cancelled" }
                : order
            )
          );
        }
        setTimeout(() => {
          setShowCancelConfirm(false);
          setSelectedOrder(null);
          setCancelReason("");
          setCancelComments("");
          setCancelFeedback(null);
          setCancelSubmitting(false);
        }, 2000);
        return;
      }

      setCancelFeedback({
        type: "error",
        message: resultText || data?.message || "something is wrong. Please try again later!",
      });
      setCancelSubmitting(false);
    } catch (error) {
      console.error(error);
      setCancelFeedback({
        type: "error",
        message: error.message || "something is wrong. Please try again later!",
      });
      setCancelSubmitting(false);
    }
  };

  const handleCancelReject = () => {
    if (cancelSubmitting) return;
    setShowCancelConfirm(false);
    setSelectedOrder(null);
    setCancelReason("");
    setCancelComments("");
    setCancelFeedback(null);
  };

  const pageCount = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const paginate = (page) => {
    if (page >= 1 && page <= pageCount) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <ToastContainer position="top-right" autoClose={5000} />
      
      
      {/* Mobile Header */}
      <div className="lg:hidden bg-white py-4 px-4 shadow-sm flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-800">My Orders</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFetchExistOrders}
            disabled={fetchingOrders}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium disabled:opacity-50"
          >
            <FiRefreshCw className={fetchingOrders ? "animate-spin" : ""} />
            {fetchingOrders ? "Fetching..." : "Fetch"}
          </button>
          <span className="inline-flex items-center px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
            LatesOrdersFetched
          </span>
        </div>
      </div>
      
      {/* Desktop Header */}
      <div className="hidden lg:block bg-red-50 py-6 px-8 flex justify-between items-center border-b border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800">My Orders</h2>
        <div className="flex items-center space-x-2 text-sm mt-1">
          <span className="text-gray-600">🏠 Home</span>
          <FiChevronRight className="text-gray-400" />
          <span className="text-gray-500">Shop</span>
          <FiChevronRight className="text-gray-400" />
          <span className="text-red-600 font-medium">Orders</span>
        </div>
      </div>

      <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Sidebar Navigation - Desktop */}
          <div className="hidden lg:block w-full lg:w-72 flex-shrink-0">
            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-red-600 transition-all duration-300 shadow-sm">
              <h3 className="text-lg font-semibold text-red-600 mb-6 pb-2 border-b border-gray-100">My Account</h3>
              <nav className="space-y-2">
                <Link href="/orders" className="w-full flex items-center gap-2 px-5 py-3 text-base font-medium text-gray-600 rounded-lg hover:text-red-600 hover:bg-red-50 hover:pl-6 transition-all">
                  <HiShoppingBag className="text-red-600 text-xl" />
                  <span>Orders</span>
                </Link>
                <Link href="/wishlist" className="w-full flex items-center gap-2 px-5 py-3 text-base font-medium text-gray-600 rounded-lg hover:text-red-600 hover:bg-red-50 hover:pl-6 transition-all">
                  <FaHeart className="text-red-600 text-xl" />
                  <span>Wishlist</span>
                </Link>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 hover:border-red-600 transition-all duration-300 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Your orders</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleFetchExistOrders}
                    disabled={fetchingOrders}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 disabled:opacity-50"
                    title="Fetch exist orders"
                  >
                    <FiRefreshCw className={fetchingOrders ? "animate-spin" : ""} />
                    {fetchingOrders ? "Fetching..." : "Fetch"}
                  </button>
                  <span className="inline-flex items-center px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                    LatesOrdersFetched
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 sm:mb-6">
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-xs text-gray-500">Total orders</p>
                  <p className="text-xl font-semibold text-gray-900">{orderCounts.total}</p>
                </div>
                <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                  <p className="text-xs text-blue-700">Exist orders</p>
                  <p className="text-xl font-semibold text-blue-800">{orderCounts.exist}</p>
                </div>
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="text-xs text-emerald-700">New website orders</p>
                  <p className="text-xl font-semibold text-emerald-800">{orderCounts.newOrders}</p>
                </div>
              </div>
              {/* Order Filters — All + Cancelled only.
                  To restore Pending / Shipped / Delivered tabs, uncomment them in the array below. */}
              <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6 pb-2 sm:pb-4 border-b border-gray-100 overflow-x-auto pb-2">
                {['all', /* 'pending', 'shipped', 'delivered', */ 'cancelled'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium flex items-center whitespace-nowrap ${
                      activeFilter === filter
                        ? filter === 'all'
                          ? 'bg-customBlue text-white'
                          : filter === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : filter === 'shipped'
                          ? 'bg-red-100 text-[#d72828]'
                          : filter === 'delivered'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {/* {filter === 'pending' && <FiClock className="mr-1" />} */}
                    {/* {filter === 'shipped' && <FiTruck className="mr-1" />} */}
                    {/* {filter === 'delivered' && <FiCheckCircle className="mr-1" />} */}
                    {filter === 'cancelled' && <FiXCircle className="mr-1" />}
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>

              {/* Orders List */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-customBlue mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading your orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <FiShoppingBag className="mx-auto text-4xl text-gray-300 mb-3 sm:mb-4" />
                  <h3 className="text-lg font-medium text-gray-700">No orders found</h3>
                  <p className="text-gray-500 mt-1 text-sm sm:text-base">
                    {activeFilter === 'all' 
                      ? "You haven't placed any orders yet" 
                      : `No ${activeFilter} orders found`}
                  </p>
                  <Link href="/products" className="mt-4 sm:mt-6 inline-block px-4 sm:px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {paginatedOrders.map((order) => {
                    const statusKey = getStatusKey(order.order_status);
                    const paymentLabel = getPaymentStatusLabel(order);
                    const paymentMethodLabel = getPaymentMethodLabel(order);
                    return (
                    <div key={order._id} className="p-3 sm:p-5 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        {/* Product Image */}
                        <div className="w-full sm:w-24 md:w-32 flex-shrink-0">
                          {order.order_item?.[0]?.image ? (
                            <img
                              src={getImageUrl(order.order_item[0].image)}
                              alt={order.order_item[0].product_name || 'Product'}
                              className="w-full h-24 sm:h-32 object-contain rounded-lg border border-gray-200"
                            />
                          ) : (
                            <div className="w-full h-24 sm:h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                              <FiShoppingBag className="text-xl sm:text-2xl text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Order Details */}
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4">
                            <div>
                              <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Order #{order.order_number}</p>
                              <h3 className="font-medium text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base">
                                {order.order_item?.[0]?.name || 'Product'}
                                {order.order_item?.length > 1 && ` + ${order.order_item.length - 1} more`}
                              </h3>
                                      {/* Warranty Data */}
{order.order_item?.some(item => item.warrantyData?.name) && (
  <div className="mb-2">
    {order.order_item.filter(item => item.warrantyData?.name).map((item, idx) => (
      <div key={idx} className="flex items-center gap-1 text-sm text-[#d72828] bg-red-50 px-2 py-1 rounded-md w-fit mb-1">
        🛡️ <span>{item.warrantyData.year} Yr Warranty</span>
        <span className="text-gray-500">— {item.warrantyData.name}</span>
        <span className="font-bold text-red-500 ml-1">₹{item.warrantyData.price}</span>
      </div>
    ))}
  </div>
)}
                               
                              <p className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">₹{order.order_amount}</p>
                            </div>

                            <div className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-medium self-start ${getStatusBadge(order.order_status).className}`}>
                              <span className="flex items-center">
                                {statusKey === "shipped" ? <FiTruck className="mr-1 text-xs" /> : null}
                                {statusKey === "cancelled" || statusKey === "failure" ? <FiXCircle className="mr-1 text-xs" /> : null}
                                {statusKey === "billed" || statusKey === "complete" || statusKey === "order accepted" ? <FiCheckCircle className="mr-1 text-xs" /> : null}
                                {statusKey === "pending" || statusKey === "payment_initialized" || statusKey === "payment initiated" || statusKey === "order placed" || statusKey === "ordered" ? <FiClock className="mr-1 text-xs" /> : null}
                                {getStatusBadge(order.order_status).label}
                              </span>
                            </div>
                          </div>

                          {/* Order Meta */}
                          <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                            <div className="flex items-center text-gray-600">
                              <FiTruck className="mr-2 text-gray-400 text-xs sm:text-sm" />
                              <span>
                                {statusKey === 'delivered'
                                  ? `Delivered on ${formatDateTime(order.updatedAt)}`
                                  : statusKey === 'shipped'
                                  ? `Shipped on ${formatDateTime(order.updatedAt)}`
                                  : statusKey === 'cancelled'
                                  ? `Cancelled on ${formatDateTime(order.cancelled_at || order.updatedAt)}`
                                  : statusKey === 'billed'
                                  ? `Billed on ${formatDateTime(order.updatedAt || order.createdAt)}`
                                  : `Order placed on ${formatDateTime(order.createdAt)}`}
                              </span>
                            </div>
                            <div className="text-gray-600 flex flex-wrap items-center gap-1 sm:gap-2">
                              <span>Payment:</span>
                              {paymentMethodLabel ? (
                                <span className="inline-flex items-center px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800">
                                  {paymentMethodLabel}
                                </span>
                              ) : null}
                              <span className={`inline-flex items-center px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${getPaymentStatusClass(paymentLabel)}`}>
                                {paymentLabel === "Paid" ? <FiCheckCircle className="mr-1 text-xs" /> : <FiClock className="mr-1 text-xs" />}
                                {paymentLabel}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3">
                            <button 
                              onClick={handleBuyAgain}
                              className="px-3 sm:px-4 py-1 sm:py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors flex items-center text-xs sm:text-sm"
                            >
                              <FiShoppingBag className="mr-1 sm:mr-2 text-xs sm:text-sm" />
                              Buy Again
                            </button>
                            {statusKey === 'pending' && (
                              <button 
                                onClick={() => handleCancelClick(order)}
                                className="px-3 sm:px-4 py-1 sm:py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors text-xs sm:text-sm"
                              >
                                Cancel Order
                              </button>
                            )}

                            {statusKey === "shipped" && (
                              <a href={`/product/${order.order_item[0].slug}#reviews`} target='_blank'>
                                <button className="px-3 sm:px-4 py-1 sm:py-2 bg-green-100 text-green-600 rounded-md hover:bg-green-200 transition-colors text-xs sm:text-sm">
                                  Write Review
                                </button>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}

              {!loading && filteredOrders.length > 0 && (
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
                      disabled={currentPage === pageCount || pageCount === 0}
                      className={`px-3 py-1.5 border border-gray-300 rounded-md ${
                        currentPage === pageCount || pageCount === 0
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
          </div>
        </div>
      </div>

      {/* Order Cancellation Request Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 relative shadow-xl">
            <button
              type="button"
              onClick={handleCancelReject}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl leading-none"
              aria-label="Close"
            >
              ×
            </button>

            <h3 className="text-xl font-semibold text-gray-800 mb-6 pr-8">
              Order Cancellation Request
            </h3>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Reason
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  disabled={cancelSubmitting}
                  className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:bg-gray-100"
                >
                  <option value="">Select Reason</option>
                  {CANCEL_REASONS.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments
                </label>
                <textarea
                  value={cancelComments}
                  onChange={(e) => setCancelComments(e.target.value)}
                  rows={4}
                  disabled={cancelSubmitting}
                  className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 resize-y disabled:bg-gray-100"
                />
              </div>

              {cancelFeedback && (
                <div
                  className={`text-sm rounded-md px-3 py-2 ${
                    cancelFeedback.type === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {cancelFeedback.message}
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={handleCancelConfirm}
                disabled={cancelSubmitting}
                className="px-8 py-2.5 bg-[#d72828] hover:bg-[#c02020] text-white text-sm font-bold uppercase tracking-wide rounded disabled:opacity-50"
              >
                {cancelSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            window.location.reload();
          }}
          error={authError}
        />
      )}
    </div>
  );
}