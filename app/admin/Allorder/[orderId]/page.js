'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { FaPhoneAlt, FaStore, FaCommentDots  } from "react-icons/fa";
import { MdDateRange } from "react-icons/md";
import { IoWalletSharp } from "react-icons/io5";
import { IoMdMail } from "react-icons/io";
import { TbTruckDelivery } from "react-icons/tb";
import { MdOutlineLocalShipping, MdDeliveryDining, MdContacts } from "react-icons/md";

const OrderDetails = () => {
  const params = useParams();
  const orderId = params?.orderId;
  const [isUpdating, setIsUpdating] = useState(false);
  const [stores, setStores] = useState([]);
  const [assignStoreId, setAssignStoreId] = useState("");
  const [assignRoleId, setAssignRoleId] = useState("");
  const [assignUserId, setAssignUserId] = useState("");
  const [assigningStore, setAssigningStore] = useState(false);
  const [assigningSalesPerson, setAssigningSalesPerson] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [roles, setRoles] = useState([]);
  const [systemUsers, setSystemUsers] = useState([]);
  const [remarks, setRemarks] = useState("");
  // FOR ORDER HISTORY
  const [status, setStatus] = useState("");
  const [comment, setComment] = useState("");

  const [order, setOrder] = useState(null);

  // const orderr = {
  //   history: [
  //     {
  //       date: '2025-07-22T12:00:00Z',
  //       comment: 'Order placed by user',
  //       status: 'Pending',
  //       customer_notified: true,
  //     },
  //     {
  //       date: '2025-07-23T08:30:00Z',
  //       comment: 'Order packed and ready to ship',
  //       status: 'Processing',
  //       customer_notified: false,
  //     },
  //     {
  //       date: '2025-07-23T14:00:00Z',
  //       comment: 'Order shipped via BlueDart',
  //       status: 'Shipped',
  //       customer_notified: true,
  //     },
  //   ],
  // };

  // 🔹 Fetch Stores
  useEffect(() => {
    fetch("/api/store_listings/get")
      .then(res => res.json())
      .then(data => {
        setStores(Array.isArray(data) ? data : data.data || []);
      })
      .catch(err => console.error("Store fetch error:", err));

    fetch("/api/roles/get")
      .then((res) => res.json())
      .then((data) => setRoles(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Roles fetch error:", err));

    fetch("/api/system_users/get")
      .then((res) => res.json())
      .then((data) => setSystemUsers(Array.isArray(data) ? data : []))
      .catch((err) => console.error("System users fetch error:", err));
  }, []);

  const addHistory = async () => {
    if (!status || !comment) {
      toast.error("Please select a status and add a comment");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/allorders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          comment,
          customer_notified: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("❌ Failed to update history:", data);
        toast.error("Failed to update history");
      } else {
        console.log("✅ History updated", data);
        setOrder(data);
        setStatus("");
        setComment("");
        toast.success("History updated successfully!");
      }
    } catch (err) {
      console.error("❌ Network error:", err);
      toast.error("Network error occurred");
    } finally {
      setIsUpdating(false);
    }
  };
  useEffect(() => {
    if (orderId) {
      fetch(`/api/orders_new/${orderId}`)
        .then(res => res.json())
        .then((data) => {
          setOrder(data);
          setAssignRoleId(data?.sales_person_role != null && data.sales_person_role !== "" ? String(data.sales_person_role) : "");
          setAssignUserId(data?.sales_person_id != null && data.sales_person_id !== "" ? String(data.sales_person_id) : "");
          setRemarks(data?.customer_comments != null ? String(data.customer_comments) : "");
        })
        .catch(err => console.error("Fetch error:", err));
    }
  }, [orderId]);

  const storeBranchCode = (store) =>
    String(store?.branch_code || store?.location_id || "").trim();

  useEffect(() => {
    if (!order || !stores.length) return;
    const currentCode = String(order.pickup_type || "").trim();
    if (!currentCode) return;
    const matched = stores.find((store) => storeBranchCode(store) === currentCode);
    if (matched) setAssignStoreId(String(matched._id));
  }, [order, stores]);

  const handleAssignStore = async () => {
    const store = stores.find((item) => String(item._id) === String(assignStoreId));
    const pickup_type = storeBranchCode(store);
    if (!assignStoreId) {
      toast.error("Please select a store");
      return;
    }
    if (!pickup_type) {
      toast.error("Selected store has no branch code");
      return;
    }

    setAssigningStore(true);
    try {
      const res = await fetch(`/api/orders_new/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickup_type }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to assign store");
        return;
      }
      setOrder((prev) => ({ ...prev, pickup_type }));
      toast.success(`Store assigned (${pickup_type})`);
    } catch (err) {
      console.error(err);
      toast.error("Network error occurred");
    } finally {
      setAssigningStore(false);
    }
  };

  const handleAssignSalesPerson = async () => {
    if (!assignRoleId || !assignUserId) {
      toast.error("Please select a role and user");
      return;
    }

    setAssigningSalesPerson(true);
    try {
      const res = await fetch(`/api/orders_new/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sales_person_role: assignRoleId,
          sales_person_id: assignUserId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to assign sales person");
        return;
      }
      setOrder((prev) => ({
        ...prev,
        sales_person_role: assignRoleId,
        sales_person_id: assignUserId,
      }));
      toast.success("Sales person assigned");
    } catch (err) {
      console.error(err);
      toast.error("Network error occurred");
    } finally {
      setAssigningSalesPerson(false);
    }
  };

  const handlePlaceOrder = async () => {
    setPlacingOrder(true);
    try {
      const res = await fetch(`/api/orders_new/${orderId}/wondersoft-send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remarks }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to place order");
        return;
      }
      if (data.api_status === "SUCCESS") {
        toast.success(data.api_reason || "Order placed");
      } else {
        toast.error(data.api_reason || data.api_status || "Place order failed");
      }
      const refreshed = await fetch(`/api/orders_new/${orderId}`).then((r) => r.json());
      if (refreshed && !refreshed.error) {
        setOrder(refreshed);
        setRemarks(refreshed.customer_comments != null ? String(refreshed.customer_comments) : remarks);
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error occurred");
    } finally {
      setPlacingOrder(false);
    }
  };




  if (!order) return <p className="text-center mt-10">Loading...</p>;

  const currentOrderNumber = String(order.order_number || order.orderNumber || "").trim();
  const roleUsers = systemUsers.filter((user) => {
    const roleId = user.role?._id || user.role;
    return assignRoleId && String(roleId) === String(assignRoleId);
  });


  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto bg-white">
      {/* Title */}
      <h2 className="text-2xl font-semibold text-gray-700">Orders</h2>
      <ToastContainer />

      {/* Top Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Order Details */}
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
                  <td className="p-2">{order.payment_id || 'Not available'}</td>
                </tr>
              )
              }
              <tr className="border-b">
                <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
                  <MdDateRange className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
                  Date: </td>
                <td className="p-2 ">{new Date(order.created_at || order.createdAt).toLocaleDateString()}</td>
              </tr>

              <tr className="border-b">
                <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
                  <MdDeliveryDining className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
                  Pickup:</td>
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
                  Shipping:</td>
                <td className="p-2"> Free Shipping</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Customer Details */}
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
                  Name:</td>
                <td className="p-2">{order.order_username}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
                  <FaPhoneAlt className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
                  Phone:</td>
                <td className="p-2">{order.order_phonenumber}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
                  <FaStore className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
                  store:</td>
                {/* <td className="p-2">{order.order_details?.[0]?.store_id}</td> */}
                <td className="p-2">
                  {
                    stores.find(s =>
                      String(s._id) === String(order?.order_details?.[0]?.store_id)
                    )?.organisation_name || ""
                  }
                </td>

              </tr>
              <tr className={order.customer_comments?.trim() ? "border-b" : ""}>
                <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
                  <IoMdMail className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
                  email:</td>
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

        {/* Options / Invoice */}
        <div className="bg-white shadow rounded overflow-hidden">
          <table className="w-full text-sm text-gray-700">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-2 text-left" colSpan={2}>Options</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2" colSpan={2}>
                  <textarea
                    className="w-full border rounded p-2 text-sm"
                    placeholder="Note: Maximum 150 characters allowed"
                    maxLength={150}
                    rows={3}
                  />
                </td>
              </tr>
              <tr>
                <td className="p-2" colSpan={2}>
                  <button className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600 w-full">
                    Generate Invoice
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <div className="border border-gray-200 rounded overflow-hidden bg-white">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-400 text-[10px] text-gray-500">i</span>
            Assign to store ({currentOrderNumber})
          </div>
          <div className="p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select store</label>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <select
                value={assignStoreId}
                onChange={(e) => setAssignStoreId(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
              >
                <option value="">Choose</option>
                {stores.map((store) => {
                  const code = storeBranchCode(store);
                  const label = store.title || store.organisation_name || store.store_name || store.name || "Store";
                  return (
                    <option key={store._id} value={store._id}>
                      {code ? `${label} (${code})` : label}
                    </option>
                  );
                })}
              </select>
              <button
                type="button"
                onClick={handleAssignStore}
                disabled={assigningStore}
                className="sm:w-56 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded text-sm font-medium disabled:opacity-50"
              >
                {assigningStore ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded overflow-hidden bg-white">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-400 text-[10px] text-gray-500">i</span>
            Assign Sales Person ({currentOrderNumber})
          </div>
          <div className="p-4">
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Role</label>
                <select
                  value={assignRoleId}
                  onChange={(e) => {
                    setAssignRoleId(e.target.value);
                    setAssignUserId("");
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
                >
                  <option value="">Choose</option>
                  {roles.map((role) => (
                    <option key={role._id} value={role._id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select User</label>
                <select
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  disabled={!assignRoleId}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:bg-gray-100"
                >
                  <option value="">Choose</option>
                  {roleUsers.map((user) => (
                    <option key={user._id} value={user._id}>
                      {[user.name, user.last_name].filter(Boolean).join(" ") || user.email || "User"}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleAssignSalesPerson}
                disabled={assigningSalesPerson}
                className="lg:w-56 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded text-sm font-medium disabled:opacity-50"
              >
                {assigningSalesPerson ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded overflow-hidden bg-white">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-400 text-[10px] text-gray-500">i</span>
            Remarks ({currentOrderNumber})
          </div>
          <div className="p-4">
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 resize-y"
                />
              </div>
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={placingOrder}
                className="lg:w-56 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded text-sm font-medium disabled:opacity-50"
              >
                {placingOrder ? "Placing..." : "PlaceOrder"}
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Order Info */}
      <div className="bg-white p-4 shadow rounded">
        <h3 className="font-semibold text-gray-600 border-b pb-2">Order #{order.order_number}</h3>
        {/* Address */}
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



        {/* Product Table */}
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
                // Log each item for debugging
                console.log(`Item ${i}:`, item);

                // Calculate the price - use order_amount if product_price is 0
                const itemPrice = item.product_price === 0 ? parseFloat(order.order_amount) : item.product_price;
                const totalPrice = item.quantity * itemPrice;

                return (
                  <tr key={i} className="border-b">
                    <td className="p-2">
                      {item.slug ? (
                        <a
                          href={`/product/${item.slug}`}
                          className="text-[#d72828] hover:text-[#c02020] hover:underline"
                        >
                          {item.product_name} - ({item.item_code.replace(/^ITEM/, "")})
                        </a>
                      ) : (
                        <span>
                          {item.product_name} - ({item.item_code.replace(/^ITEM/, "")})
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
                {/* <td className="p-2 text-right">₹0.00</td> */}
              </tr>
              <tr>
                <td colSpan="4" className="p-2 text-right">Shipping:</td>
                {/* <td className="p-2 text-right">₹{order.shipping_fee}</td> */}
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
    </div>
  );
};

export default OrderDetails;
