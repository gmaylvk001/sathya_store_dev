"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";

export default function CreateLaunchProduct() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    product_name: "",
    products: "",
    stock_status: "Choose",
    status: "Choose",
    page_design: "Choose",
  });
  
  const [desktopImages, setDesktopImages] = useState([]);
  const [mobileImages, setMobileImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const desktopInputRef = useRef(null);
  const mobileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddDesktopFiles = () => {
    if (desktopInputRef.current && desktopInputRef.current.files.length > 0) {
      const filesArray = Array.from(desktopInputRef.current.files);
      setDesktopImages((prev) => [...prev, ...filesArray]);
      desktopInputRef.current.value = "";
    } else {
      toast.info("Please select a file first before clicking Add");
    }
  };

  const handleAddMobileFiles = () => {
    if (mobileInputRef.current && mobileInputRef.current.files.length > 0) {
      const filesArray = Array.from(mobileInputRef.current.files);
      setMobileImages((prev) => [...prev, ...filesArray]);
      mobileInputRef.current.value = "";
    } else {
      toast.info("Please select a file first before clicking Add");
    }
  };

  const removeDesktopImage = (index) => {
    setDesktopImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeMobileImage = (index) => {
    setMobileImages((prev) => prev.filter((_, i) => i !== index));
  };

  const getSafeObjectUrl = (file) => {
    if (!file) return "";
    try {
      return URL.createObjectURL(file);
    } catch (e) {
      return "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const form = new FormData();
      Object.keys(formData).forEach((key) => {
        form.append(key, formData[key]);
      });
      desktopImages.forEach((img) => form.append("desktop_images", img));
      mobileImages.forEach((img) => form.append("mobile_images", img));

      const res = await fetch("/api/admin/design/new-product-launch", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Created successfully");
        router.push("/admin/design/new-product-launch");
      } else {
        toast.error(data.message || "Failed to create");
      }
    } catch (err) {
      toast.error("An error occurred during creation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-white shadow-sm rounded-lg">
      <div className="mb-6 border-b border-gray-200 pb-3">
        <h1 className="text-2xl font-normal text-gray-800">Create Launch Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center">
          <label className="w-full md:w-1/4 text-sm font-medium text-gray-700 mb-1 md:mb-0">Product Name</label>
          <div className="w-full md:w-3/4">
            <input
              type="text"
              name="product_name"
              value={formData.product_name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition"
              required
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row">
          <label className="w-full md:w-1/4 text-sm font-medium text-gray-700 mb-1 md:mb-0 mt-2">Products</label>
          <div className="w-full md:w-3/4">
            <textarea
              name="products"
              value={formData.products}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:border-blue-500 transition"
            ></textarea>
          </div>
        </div>

        <div className="flex flex-col md:flex-row">
          <label className="w-full md:w-1/4 text-sm font-medium text-gray-700 mb-1 md:mb-0 mt-2">Desktop Image Upload</label>
          <div className="w-full md:w-3/4 border border-gray-200 rounded p-4 bg-gray-50">
            <p className="text-sm text-gray-500 mb-2">Image upload (Multiple allowed)</p>
            <div className="flex bg-white rounded border border-gray-300 overflow-hidden mb-3">
              <input
                type="file"
                multiple
                ref={desktopInputRef}
                className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:border-0 file:border-r file:border-gray-300 file:text-sm file:font-semibold file:bg-gray-100 hover:file:bg-gray-200 cursor-pointer"
                accept="image/*"
              />
              <button 
                type="button" 
                onClick={handleAddDesktopFiles}
                className="px-6 py-2 bg-[#337ab7] text-white text-sm font-medium hover:bg-blue-700 transition"
              >
                Add
              </button>
            </div>
            {desktopImages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {desktopImages.map((file, i) => {
                  const objUrl = getSafeObjectUrl(file);
                  return (
                    <div key={i} className="relative group border rounded p-1 bg-white">
                      {objUrl && <img src={objUrl} alt="" className="h-16 object-contain" />}
                      <button type="button" onClick={() => removeDesktopImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition">x</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row">
          <label className="w-full md:w-1/4 text-sm font-medium text-gray-700 mb-1 md:mb-0 mt-2">Mobile Image Upload</label>
          <div className="w-full md:w-3/4 border border-gray-200 rounded p-4 bg-gray-50">
            <p className="text-sm text-gray-500 mb-2">Image upload (Multiple allowed)</p>
            <div className="flex bg-white rounded border border-gray-300 overflow-hidden mb-3">
              <input
                type="file"
                multiple
                ref={mobileInputRef}
                className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:border-0 file:border-r file:border-gray-300 file:text-sm file:font-semibold file:bg-gray-100 hover:file:bg-gray-200 cursor-pointer"
                accept="image/*"
              />
              <button 
                type="button" 
                onClick={handleAddMobileFiles}
                className="px-6 py-2 bg-[#337ab7] text-white text-sm font-medium hover:bg-blue-700 transition"
              >
                Add
              </button>
            </div>
            {mobileImages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {mobileImages.map((file, i) => {
                  const objUrl = getSafeObjectUrl(file);
                  return (
                    <div key={i} className="relative group border rounded p-1 bg-white">
                      {objUrl && <img src={objUrl} alt="" className="h-16 object-contain" />}
                      <button type="button" onClick={() => removeMobileImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition">x</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center">
          <label className="w-full md:w-1/4 text-sm font-medium text-gray-700 mb-1 md:mb-0">Stock Status</label>
          <div className="w-full md:w-3/4">
            <select
              name="stock_status"
              value={formData.stock_status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition"
            >
              <option value="Choose">Choose</option>
              <option value="In Stock">In Stock</option>
              <option value="Out Of Stock">Out Of Stock</option>
              <option value="Pre-Book">Pre-Book</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center">
          <label className="w-full md:w-1/4 text-sm font-medium text-gray-700 mb-1 md:mb-0">Status</label>
          <div className="w-full md:w-3/4">
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition"
            >
              <option value="Choose">Choose</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-start">
          <label className="w-full md:w-1/4 text-sm font-medium text-gray-700 mb-1 md:mb-0 mt-2">Page Design</label>
          <div className="w-full md:w-3/4">
            <select
              name="page_design"
              value={formData.page_design}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition"
            >
              <option value="Choose">Choose</option>
              <option value="Old Design (Classic Pre-book)">Old Design (Classic Pre-book)</option>
              <option value="New Design">New Design</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">Old design keeps the classic pre-book page. New design uses the iPlanet gallery + overview layout.</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Link
            href="/admin/design/new-product-launch"
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-[#5cb85c] text-white rounded text-sm font-medium hover:bg-green-600 transition disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
