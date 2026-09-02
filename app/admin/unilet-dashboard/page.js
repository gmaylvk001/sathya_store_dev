"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function KarnatakaUniletDashboardPage() {
  const [stats, setStats] = useState({
    productsCount: 0,
    ordersCount: 0,
    usersCount: 0,
    loading: true,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const [prodRes, orderRes, userRes] = await Promise.all([
          fetch('/api/admin/owner-product?region=karnataka'),
          fetch('/api/allorders'),
          fetch('/api/users/get'),
        ]);

        const prodData = await prodRes.json();
        const orderData = await orderRes.json();
        const userData = await userRes.json();

        setStats({
          productsCount: prodData.count || prodData.data?.length || 0,
          ordersCount: Array.isArray(orderData) ? orderData.length : 0,
          usersCount: Array.isArray(userData) ? userData.length : 0,
          loading: false,
        });
      } catch (e) {
        setStats((prev) => ({ ...prev, loading: false }));
      }
    }

    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏬</span>
            <h1 className="text-2xl font-bold">Karnataka Unilet Store Dashboard</h1>
          </div>
          <p className="text-amber-100 text-sm mt-1">
            Dedicated Management Portal for Karnataka State & Unilet Store Products, Pricing, Stock, and Orders.
          </p>
        </div>
        <div className="px-4 py-2 bg-amber-800/60 backdrop-blur-md rounded-xl text-xs font-semibold uppercase tracking-wider border border-amber-400/30">
          Role: KARNATAKA_UNILET_ADMIN
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Link href="/admin/unilet-products" className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Unilet Products</p>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-2">
                {stats.loading ? '...' : stats.productsCount}
              </h2>
              <p className="text-xs text-amber-600 mt-1 font-medium">Manage Pricing & Stock →</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 text-2xl">
              🛍️
            </div>
          </div>
        </Link>

        <Link href="/admin/unilet-orders" className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Karnataka Orders</p>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-2">
                {stats.loading ? '...' : stats.ordersCount}
              </h2>
              <p className="text-xs text-amber-600 mt-1 font-medium">View Order Details →</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 text-2xl">
              📦
            </div>
          </div>
        </Link>

        <Link href="/admin/unilet-users" className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Karnataka Users</p>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-2">
                {stats.loading ? '...' : stats.usersCount}
              </h2>
              <p className="text-xs text-amber-600 mt-1 font-medium">View Registered Users →</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 text-2xl">
              👥
            </div>
          </div>
        </Link>
      </div>

      {/* Features Quick Actions */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-gray-800 border-b pb-3">Karnataka Unilet Quick Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/admin/unilet-products" className="p-4 border rounded-xl hover:bg-amber-50/50 transition flex items-center gap-4">
            <span className="text-2xl">🏷️</span>
            <div>
              <h4 className="font-semibold text-gray-900">Offer Pricing & Stock Management</h4>
              <p className="text-xs text-gray-500">Update offer prices and inventory stock specifically for Karnataka Unilet store.</p>
            </div>
          </Link>
          <Link href="/admin/unilet-orders" className="p-4 border rounded-xl hover:bg-amber-50/50 transition flex items-center gap-4">
            <span className="text-2xl">🚚</span>
            <div>
              <h4 className="font-semibold text-gray-900">Order Delivery & Status Workflow</h4>
              <p className="text-xs text-gray-500">Process, ship, and update status for Karnataka customer orders.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
