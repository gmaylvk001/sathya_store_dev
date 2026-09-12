"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

  if (!order) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto bg-white">
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
    </div>
  );
};

export default OrderDetails;
