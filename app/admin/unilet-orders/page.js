"use client";
import OrdersTable from "../components/allorder/allorder";

export default function KarnatakaUniletOrdersPage() {
  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-amber-900 flex items-center gap-2">
            <span>📍</span> Karnataka Unilet Orders Management
          </h1>
          <p className="text-xs text-amber-700 mt-1">
            Displaying strictly scoped Karnataka state & Unilet store customer orders.
          </p>
        </div>
        <span className="px-3 py-1 bg-amber-600 text-white font-semibold text-xs rounded-full">
          KARNATAKA UNILET SCOPE
        </span>
      </div>
      <OrdersTable />
    </div>
  );
}
