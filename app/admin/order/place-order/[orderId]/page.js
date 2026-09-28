"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { FaPhoneAlt, FaStore, FaCommentDots } from "react-icons/fa";
import { MdDateRange } from "react-icons/md";
import { IoWalletSharp } from "react-icons/io5";
import { IoMdMail } from "react-icons/io";
import { MdOutlineLocalShipping, MdDeliveryDining, MdContacts } from "react-icons/md";

const OrderDetails = () => {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId;
  const [stores, setStores] = useState([]);
  const [order, setOrder] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // FOR ORDER HISTORY
  const [status, setStatus] = useState("");
  const [comment, setComment] = useState("");
  const [showHistoryCommentModal, setShowHistoryCommentModal] = useState(false);
  const [historyCommentDraft, setHistoryCommentDraft] = useState("");
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(null);

  useEffect(() => {
    fetch("/api/store/get")
      .then((res) => res.json())
      .then((data) => setStores(Array.isArray(data) ? data : data.data || []))
      .catch((err) => console.error("Store fetch error:", err));
  }, []);

  useEffect(() => {
    if (orderId) {
      fetch(`/api/orders_new/${orderId}`)
        .then((res) => res.json())
        .then((data) => setOrder(data))
        .catch((err) => console.error("Fetch error:", err));
    }
  }, [orderId]);

  // Admin Add Order History
  const addHistory = async () => {
    if (!status) {
      toast.error("Please select a status");
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      toast.error("Please login again");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/orders_new/${orderId}/add-history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          comment,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        toast.error(data?.message || "Failed to add history");
        return;
      }

      toast.success(data.message || "Order History Added Successfully!");
      setStatus("");
      setComment("");

      const refreshed = await fetch(`/api/orders_new/${orderId}`).then((r) => r.json());
      if (refreshed && !refreshed.error) {
        setOrder(refreshed);
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const openHistoryCommentModal = (entry, index) => {
    setSelectedHistoryIndex(index);
    setHistoryCommentDraft(entry?.comment != null ? String(entry.comment) : "");
    setShowHistoryCommentModal(true);
  };

  const closeHistoryCommentModal = () => {
    setShowHistoryCommentModal(false);
    setSelectedHistoryIndex(null);
    setHistoryCommentDraft("");
  };

  // Save comment to order_history_comments (users_id = logged-in admin)
  const saveHistoryComment = async () => {
    const entry =
      selectedHistoryIndex != null && Array.isArray(order?.order_history)
        ? order.order_history[selectedHistoryIndex]
        : null;

    const commentText = String(historyCommentDraft || "").trim();
    if (!commentText) {
      toast.error("Please enter a comment");
      return;
    }
    if (!entry) {
      toast.error("History row not selected");
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      toast.error("Please login again");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch("/api/order_history_comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_number: order?.order_number || entry.order_number || "",
          order_status: entry.status || entry.order_status || "",
          comment: commentText,
          order_history_id: entry._id || null,
          order_id: order?._id || null,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.message || "Failed to save comment");
        return;
      }

      toast.success("Comment saved");
      closeHistoryCommentModal();
    } catch (err) {
      console.error(err);
      toast.error("Network error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const historyRows = Array.isArray(order?.order_history) ? order.order_history : [];

  if (!order) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto bg-white">
      <ToastContainer />
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-700">Place Orders</h2>
        <button
          onClick={() => router.push("/admin/order/place-order")}
          className="text-sm text-white bg-gray-600 hover:bg-gray-700 px-3 py-1.5 rounded-md"
        >
          Back
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white shadow rounded overflow-hidden">
          <table className="w-full text-sm text-gray-700">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-2 text-left" colSpan={4}>Order Details</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
                  <IoWalletSharp className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
                  Payment:
                </td>
                <td className="p-2">{order.payment_method}</td>
              </tr>
              {order.payment_method == "online" && (
                <tr className="border-b">
                  <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
                    <IoWalletSharp className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
                    Payment Id:
                  </td>
                  <td className="p-2">{order.payment_id || "Not available"}</td>
                </tr>
              )}
              <tr className="border-b">
                <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
                  <MdDateRange className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
                  Date:
                </td>
                <td className="p-2">{new Date(order.created_at || order.createdAt).toLocaleDateString()}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
                  <MdDeliveryDining className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
                  Pickup:
                </td>
                <td className="p-2">
                  {order.delivery_type === "store" ? (
                    <span className="py-0.5 text-white px-2 bg-red-500 rounded">{order.delivery_type}</span>
                  ) : (
                    order.delivery_type
                  )}
                </td>
              </tr>
              <tr>
                <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
                  <MdOutlineLocalShipping className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
                  Shipping:
                </td>
                <td className="p-2">Free Shipping</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-white shadow rounded overflow-hidden">
          <table className="w-full text-sm text-gray-700">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-2 text-left" colSpan={2}>Customer Details</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
                  <MdContacts className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
                  Name:
                </td>
                <td className="p-2">{order.order_username}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
                  <FaPhoneAlt className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
                  Phone:
                </td>
                <td className="p-2">{order.order_phonenumber}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
                  <FaStore className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
                  store:
                </td>
                <td className="p-2">
                  {
                    stores.find((s) =>
                      String(s._id) === String(order?.order_details?.[0]?.store_id)
                    )?.organisation_name || ""
                  }
                </td>
              </tr>
              <tr className={order.customer_comments?.trim() ? "border-b" : ""}>
                <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
                  <IoMdMail className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
                  email:
                </td>
                <td className="p-2">{order.email_address}</td>
              </tr>
              {order.customer_comments?.trim() && (
                <tr className="border-b">
                  <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
                    <FaCommentDots className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
                    Comments:
                  </td>
                  <td className="p-2">{order.customer_comments}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white shadow rounded overflow-hidden">
          <table className="w-full text-sm text-gray-700">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-2 text-left" colSpan={2}>Order Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 font-semibold text-gray-700">Status:</td>
                <td className="p-2">{order.order_status}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-4 shadow rounded">
        <h3 className="font-semibold text-gray-600 border-b pb-2">Order #{order.order_number}</h3>
        <div className="mt-4">
          <table className="w-full border text-sm text-gray-700">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-2 text-left">Delivery Address</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2">{order.order_deliveryaddress}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <table className="w-full border text-sm text-gray-700">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-2 text-left">Product</th>
                <th className="p-2 text-left">Model</th>
                <th className="p-2 text-center">Qty</th>
                <th className="p-2 text-right">Unit Price</th>
                <th className="p-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.order_details?.map((item, i) => {
                const itemPrice = Number(item.product_price) === 0
                  ? parseFloat(order.order_amount)
                  : Number(item.product_price);
                const totalPrice = (item.quantity || 0) * (itemPrice || 0);

                return (
                  <tr key={i} className="border-b">
                    <td className="p-2">
                      {item.slug ? (
                        <a
                          href={`/product/${item.slug}`}
                          className="text-[#d72828] hover:text-[#c02020] hover:underline"
                        >
                          {item.product_name} - ({(item.item_code || "").replace(/^ITEM/, "")})
                        </a>
                      ) : (
                        <span>
                          {item.product_name} - ({(item.item_code || "").replace(/^ITEM/, "")})
                        </span>
                      )}
                    </td>
                    <td className="p-2">{item.model}</td>
                    <td className="p-2 text-center">{item.quantity}</td>
                    <td className="p-2 text-right text-red-600">₹{itemPrice}</td>
                    <td className="p-2 text-right text-red-600">₹{totalPrice}</td>
                  </tr>
                );
              })}
              {(order.order_item || []).map((item, index) =>
                item.extendedWarranty > 0 && (
                  <tr key={index} className="font-semibold">
                    <td colSpan="4" className="p-2 text-right text-[#d72828]">
                      Extended Warranty:
                    </td>
                    <td className="p-2 text-right text-red-600">
                      ₹{item.extendedWarranty}
                    </td>
                  </tr>
                )
              )}
              <tr className="font-semibold">
                <td colSpan="4" className="p-2 text-right">Sub-Total:</td>
                <td className="p-2 text-right">₹{order.order_amount}</td>
              </tr>
              <tr>
                <td colSpan="4" className="p-2 text-right">Shipping:</td>
                <td className="p-2 text-right">₹0.00</td>
              </tr>
              <tr className="font-bold bg-gray-100">
                <td colSpan="4" className="p-2 text-right">Total:</td>
                <td className="p-2 text-right">₹{order.order_amount}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Order History */}
      <div className="bg-white p-4 shadow rounded space-y-6">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="font-semibold text-gray-600">Order History</h3>
          <button
            type="button"
            className="bg-red-500 text-white px-4 py-1.5 rounded text-sm font-medium"
          >
            History
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border text-gray-700">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-2 text-left">Date Added</th>
                <th className="p-2 text-left">Comment</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-center">Customer Notified</th>
              </tr>
            </thead>
            <tbody>
              {historyRows.length === 0 ? (
                <tr className="border-b">
                  <td className="p-3 text-gray-400 text-center" colSpan={4}>
                    No history yet
                  </td>
                </tr>
              ) : (
                historyRows.map((entry, i) => (
                  <tr key={entry._id || i} className="border-b">
                    <td className="p-2 whitespace-nowrap">
                      {entry.date || entry.created_at
                        ? new Date(entry.date || entry.created_at).toLocaleDateString("en-GB")
                        : "—"}
                    </td>
                    <td className="p-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-gray-700">{entry.comment || ""}</span>
                        <button
                          type="button"
                          onClick={() => openHistoryCommentModal(entry, i)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2.5 py-1 rounded whitespace-nowrap shrink-0"
                        >
                          Add Comment
                        </button>
                      </div>
                    </td>
                    <td className="p-2">{entry.status || entry.order_status || "—"}</td>
                    <td className="p-2 text-center">
                      {entry.notify != null
                        ? Number(entry.notify)
                        : entry.customer_notified != null
                          ? Number(entry.customer_notified)
                          : 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div>
          <h4 className="font-semibold text-gray-600 border-b pb-2">Add Order History</h4>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
            >
              <option value="">Choose</option>
              {(() => {
                const current = String(order?.order_status || "").trim().toLowerCase();
                const isFinal = current === "cancelled" || current === "canceled" || current === "complete";
                const cancelDisabled =
                  isFinal || current === "billed";
                const completeDisabled = isFinal;
                return (
                  <>
                    <option value="Cancelled" disabled={cancelDisabled}>
                      Cancelled{cancelDisabled ? " (not allowed)" : ""}
                    </option>
                    <option value="Complete" disabled={completeDisabled}>
                      Complete{completeDisabled ? " (not allowed)" : ""}
                    </option>
                  </>
                );
              })()}
            </select>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              rows={4}
              placeholder=""
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={addHistory}
              disabled={isUpdating}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
            >
              Add History
            </button>
          </div>
        </div>
      </div>

      {/* Order History Comment Modal */}
      {showHistoryCommentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeHistoryCommentModal}
          />
          <div className="relative bg-white rounded-md shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Order History Comment
              </h3>
              <button
                type="button"
                onClick={closeHistoryCommentModal}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none px-1"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="px-4 py-5">
              <div className="flex gap-3 items-start">
                <label className="text-sm text-gray-700 pt-2 w-20 shrink-0">
                  Comment
                </label>
                <textarea
                  value={historyCommentDraft}
                  onChange={(e) => setHistoryCommentDraft(e.target.value)}
                  rows={5}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-md">
              <button
                type="button"
                onClick={closeHistoryCommentModal}
                className="px-4 py-2 text-sm rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
              <button
                type="button"
                onClick={saveHistoryComment}
                disabled={isUpdating}
                className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {isUpdating ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
