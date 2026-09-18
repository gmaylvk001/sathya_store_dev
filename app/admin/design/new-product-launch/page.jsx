"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { Icon } from "@iconify/react";

export default function LaunchProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/admin/design/new-product-launch");
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      } else {
        toast.error("Failed to fetch products");
      }
    } catch (err) {
      toast.error("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this launch product?")) return;
    
    try {
      const res = await fetch(`/api/admin/design/new-product-launch/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Deleted successfully");
        setProducts(products.filter((p) => p._id !== id));
      } else {
        toast.error(data.message || "Failed to delete");
      }
    } catch (err) {
      toast.error("Error deleting product");
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-white shadow-sm rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-normal text-gray-800">New Product Launch</h1>
      </div>
      
      <div className="flex justify-end mb-4">
        <Link 
          href="/admin/design/new-product-launch/create"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded text-sm bg-white hover:bg-gray-50 text-gray-700 font-medium shadow-sm transition"
        >
          <Icon icon="mdi:plus" className="mr-2 text-lg font-bold" />
          New Launch Product
        </Link>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-[13px] border-b border-gray-200">
              <th className="p-3 font-medium">Id</th>
              <th className="p-3 font-medium">Title</th>
              <th className="p-3 font-medium">Design</th>
              <th className="p-3 font-medium">Redirect URL</th>
              <th className="p-3 font-medium">Products</th>
              <th className="p-3 font-medium">Stock Status</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="p-4 text-center text-gray-500">Loading...</td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-4 text-center text-gray-500">No launch products found.</td>
              </tr>
            ) : (
              products.map((p, index) => {
                const designLabel = p.page_design && p.page_design.includes("Old Design") ? "Old" : p.page_design && p.page_design.includes("New Design") ? "New" : p.page_design || "";
                
                return (
                  <tr key={p._id} className="border-b border-gray-100 hover:bg-gray-50 transition text-[13px] text-gray-700">
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3">{p.product_name}</td>
                    <td className="p-3">{designLabel}</td>
                    <td className="p-3">
                      <a href={`https://www.sathya.store/new_launching_product/${p.slug}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                        https://www.sathya.store/new_launching_product/{p.slug}
                      </a>
                    </td>
                    <td className="p-3 max-w-[200px] truncate" title={p.products}>{p.products}</td>
                    <td className="p-3">{p.stock_status}</td>
                    <td className="p-3">{p.status}</td>
                    <td className="p-3">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <Link 
                          href={`/admin/design/new-product-launch/edit/${p._id}`}
                          className="inline-flex items-center px-2 py-1 text-xs border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-700 transition"
                        >
                          <Icon icon="mdi:square-edit-outline" className="mr-1 text-sm" /> Edit
                        </Link>
                        <button 
                          onClick={() => handleDelete(p._id)}
                          className="inline-flex items-center px-2 py-1 text-xs border border-red-300 rounded bg-brandRed text-white hover:bg-red-700 transition"
                        >
                          <Icon icon="mdi:delete-outline" className="mr-1 text-sm" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
