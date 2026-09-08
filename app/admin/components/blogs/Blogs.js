"use client";

import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import ReactPaginate from "react-paginate";
import CustomQuill from "../blog/CustomQuill";

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState("list"); // 'list' | 'create' | 'edit'
  
  const [formData, setFormData] = useState({
    _id: null,
    blogTitle: "",
    slug: "",
    stores: [],
    isAllStores: false,
    category: "",
    shortDescription: "",
    description: "",
    faqs: [],
    author: "",
    readingTime: "",
    publishDate: "",
    bannerImage: "",
    featuredImage: "",
    metaTitle: "",
    metaKeywords: "",
    metaDescription: "",
    status: "Active",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 20;

  // Fetch Data
  const fetchBlogs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/blogs-new");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setBlogs(data.data);
      }
    } catch (err) {
      console.error("Error fetching blogs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories/get");
      const data = await res.json();
      if (data && Array.isArray(data.data)) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchStores = async () => {
    try {
      const res = await fetch("/api/stores");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setStores(data.data);
      }
    } catch (err) {
      console.error("Error fetching stores:", err);
    }
  };

  useEffect(() => {
    fetchBlogs();
    fetchCategories();
    fetchStores();
  }, []);

  // Form handling
  const generateSlug = (name = "") =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      blogTitle: title,
      slug: generateSlug(title),
    }));
  };

  const handleOpenCreate = () => {
    setFormData({
      _id: null,
      blogTitle: "",
      slug: "",
      stores: [],
      isAllStores: false,
      category: "",
      shortDescription: "",
      description: "",
      faqs: [],
      author: "",
      readingTime: "",
      publishDate: "",
      bannerImage: "",
      featuredImage: "",
      metaTitle: "",
      metaKeywords: "",
      metaDescription: "",
      status: "Active",
    });
    setView("create");
  };

  const handleOpenEdit = (item) => {
    setFormData({
      _id: item._id,
      blogTitle: item.blogTitle || "",
      slug: item.slug || "",
      stores: item.stores || [],
      isAllStores: item.isAllStores || false,
      category: item.category || "",
      shortDescription: item.shortDescription || "",
      description: item.description || "",
      faqs: item.faqs || [],
      author: item.author || "",
      readingTime: item.readingTime || "",
      publishDate: item.publishDate ? new Date(item.publishDate).toISOString().split('T')[0] : "",
      bannerImage: item.bannerImage || "",
      featuredImage: item.featuredImage || "",
      metaTitle: item.metaTitle || "",
      metaKeywords: item.metaKeywords || "",
      metaDescription: item.metaDescription || "",
      status: item.status || "Active",
    });
    setView("edit");
  };

  const handleStoreSelection = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map((opt) => opt.value);
    setFormData({ ...formData, stores: selectedOptions });
  };

  // FAQ Handling
  const addFaq = () => {
    setFormData((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { question: "", answer: "" }],
    }));
  };

  const updateFaq = (index, field, value) => {
    const newFaqs = [...formData.faqs];
    newFaqs[index][field] = value;
    setFormData({ ...formData, faqs: newFaqs });
  };

  const removeFaq = (index) => {
    const newFaqs = formData.faqs.filter((_, i) => i !== index);
    setFormData({ ...formData, faqs: newFaqs });
  };

  // File Upload Handling
  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append("image", file);

    try {
      const res = await fetch("/api/blogs-new/upload", {
        method: "POST",
        body: data,
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setFormData((prev) => ({ ...prev, [fieldName]: result.savedImage }));
      } else {
        alert(result.error || "Failed to upload image");
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      alert("Error uploading image");
    }
  };

  // Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.blogTitle.trim()) {
      alert("Blog Title is required");
      return;
    }

    const endpoint = view === "create" ? "/api/blogs-new/add" : "/api/blogs-new/update";
    const method = view === "create" ? "POST" : "PUT";

    try {
      setIsSubmitting(true);
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        await fetchBlogs();
        setView("list");
        setSuccessMessage(view === "create" ? "Blog Created Successfully" : "Blog Updated Successfully");
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      } else {
        alert(result.error || "Failed to save blog");
      }
    } catch (error) {
      console.error("Error saving blog:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!blogToDelete) return;
    try {
      const res = await fetch("/api/blogs-new/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: blogToDelete }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setSuccessMessage("Blog Deleted Successfully");
        setShowSuccessModal(true);
        fetchBlogs();
      } else {
        alert(result.error || "Failed to delete");
      }
    } catch (err) {
      console.error("Error deleting:", err);
    } finally {
      setShowConfirmationModal(false);
      setBlogToDelete(null);
      setTimeout(() => setShowSuccessModal(false), 2000);
    }
  };

  // Pagination & Filtering
  const filteredBlogs = blogs.filter((b) =>
    (b.blogTitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.slug || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pageCount = Math.ceil(filteredBlogs.length / itemsPerPage);
  const totalEntries = filteredBlogs.length;
  const startEntry = currentPage * itemsPerPage + 1;
  const endEntry = Math.min((currentPage + 1) * itemsPerPage, totalEntries);

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-5 mt-5">
        <h2 className="text-3xl font-light text-gray-700">
          {view === "list" ? "Blogs" : view === "create" ? "Create Blog" : "Edit Blog"}
        </h2>
      </div>

      {view === "list" && (
        <div className="bg-white shadow-sm border rounded-lg p-5 overflow-x-auto border-gray-200">
          <div className="flex justify-between items-center mb-5">
            <div className="relative">
              <input
                type="text"
                placeholder="Search ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border px-3 py-1.5 rounded w-64 focus:outline-none focus:border-blue-400"
              />
              <span className="absolute right-2 top-2 text-gray-400">
                <Icon icon="ic:baseline-search" />
              </span>
            </div>
            <div>
              <button
                onClick={handleOpenCreate}
                className="border px-3 py-1.5 rounded bg-white text-gray-600 hover:bg-gray-50 flex items-center gap-1"
              >
                <Icon icon="ic:baseline-add" className="text-lg" /> New Blog
              </button>
            </div>
          </div>

          <table className="w-full border border-gray-200">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-700">
                <th className="p-3 text-left pl-4 font-semibold w-16">#</th>
                <th className="p-3 text-left font-semibold">Blog Title</th>
                <th className="p-3 text-left font-semibold">Slug</th>
                <th className="p-3 text-left font-semibold w-32">Status</th>
                <th className="p-3 text-left font-semibold w-32">Created</th>
                <th className="p-3 text-center font-semibold w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-gray-500">Loading...</td>
                </tr>
              ) : filteredBlogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-gray-500">No blogs found.</td>
                </tr>
              ) : (
                filteredBlogs
                  .slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
                  .map((b, idx) => (
                    <tr key={b._id} className="border-b hover:bg-gray-50">
                      <td className="p-3 pl-4">{totalEntries - (currentPage * itemsPerPage + idx)}</td>
                      <td className="p-3 text-blue-500 cursor-pointer hover:underline" onClick={() => handleOpenEdit(b)}>
                        {b.blogTitle}
                      </td>
                      <td className="p-3">{b.slug}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${b.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3">{formatDate(b.createdAt)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 justify-center">
                          <button
                            onClick={() => handleOpenEdit(b)}
                            className="px-2 py-1 border rounded text-gray-600 hover:bg-gray-100 flex items-center gap-1"
                            title="Edit"
                          >
                            <Icon icon="lucide:edit" className="text-sm" /> Edit
                          </button>
                          <button
                            onClick={() => {
                              setBlogToDelete(b._id);
                              setShowConfirmationModal(true);
                            }}
                            className="px-2 py-1 border rounded bg-red-500 text-white hover:bg-red-600 flex items-center gap-1"
                            title="Delete"
                          >
                            <Icon icon="mingcute:delete-2-line" className="text-sm" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>

          {filteredBlogs.length > 0 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">
                Showing {totalEntries > 0 ? startEntry : 0} to {endEntry} of {totalEntries} entries
              </div>
              <ReactPaginate
                previousLabel={"«"}
                nextLabel={"»"}
                breakLabel={"..."}
                pageCount={pageCount}
                marginPagesDisplayed={2}
                pageRangeDisplayed={5}
                onPageChange={handlePageClick}
                containerClassName={"flex items-center space-x-1"}
                activeClassName={"bg-blue-500 text-white border-blue-500"}
                pageClassName={"page-item"}
                pageLinkClassName={"px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-100"}
                previousClassName={"page-item"}
                previousLinkClassName={"px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-100"}
                nextClassName={"page-item"}
                nextLinkClassName={"px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-100"}
              />
            </div>
          )}
        </div>
      )}

      {(view === "create" || view === "edit") && (
        <div className="bg-white shadow-sm border rounded-lg p-8 border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-[200px_1fr] gap-4 items-start">
              <label className="font-semibold text-gray-700 mt-2">Blog Title</label>
              <input
                type="text"
                className="w-full border rounded p-2 focus:outline-none focus:border-blue-400"
                value={formData.blogTitle}
                onChange={handleTitleChange}
                required
              />
            </div>

            <div className="grid grid-cols-[200px_1fr] gap-4 items-start">
              <label className="font-semibold text-gray-700 mt-2">Slug</label>
              <div>
                <input
                  type="text"
                  className="w-full border rounded p-2 bg-gray-50 text-gray-600"
                  value={formData.slug}
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-generated from title on save. Frontend URL: /blog-listing/{formData.slug || "{slug}"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-[200px_1fr] gap-4 items-start">
              <label className="font-semibold text-gray-700 mt-2">Stores</label>
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={formData.isAllStores}
                    onChange={(e) => setFormData({ ...formData, isAllStores: e.target.checked })}
                  />
                  <span>All Stores</span>
                </label>
                <select
                  multiple
                  disabled={formData.isAllStores}
                  value={formData.stores}
                  onChange={handleStoreSelection}
                  className={`w-full border rounded p-2 h-48 focus:outline-none ${formData.isAllStores ? 'bg-gray-100 text-gray-400' : 'bg-white focus:border-blue-400'}`}
                >
                  {stores.map((s) => (
                    <option key={s._id} value={s.organisation_name}>{s.organisation_name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Use Ctrl/Cmd to select multiple stores. If "All Stores" is checked, manual selection is ignored.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-[200px_1fr] gap-4 items-start">
              <label className="font-semibold text-gray-700 mt-2">Category</label>
              <select
                className="w-full border rounded p-2 focus:outline-none focus:border-blue-400 bg-white"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c.category_name}>{c.category_name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-[200px_1fr] gap-4 items-start">
              <label className="font-semibold text-gray-700 mt-2">Short Description</label>
              <textarea
                rows="4"
                className="w-full border rounded p-2 focus:outline-none focus:border-blue-400"
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
              ></textarea>
            </div>

            <div className="grid grid-cols-[200px_1fr] gap-4 items-start">
              <label className="font-semibold text-gray-700 mt-2">Description</label>
              <div className="bg-white">
                <CustomQuill
                  value={formData.description}
                  onChange={(val) => setFormData({ ...formData, description: val })}
                  placeholder="Enter blog description..."
                />
              </div>
            </div>

            <hr className="my-6" />

            <div className="space-y-4">
              <h3 className="text-xl font-light text-gray-700">Frequently Asked Questions</h3>
              <p className="text-sm text-gray-500">These will be shown as an FAQ accordion on the blog detail page. Leave a row's question/answer empty to skip it.</p>
              
              {formData.faqs.map((faq, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <input
                    type="text"
                    placeholder="Question"
                    className="flex-1 border rounded p-2 focus:outline-none focus:border-blue-400"
                    value={faq.question}
                    onChange={(e) => updateFaq(index, "question", e.target.value)}
                  />
                  <textarea
                    rows="2"
                    placeholder="Answer"
                    className="flex-1 border rounded p-2 focus:outline-none focus:border-blue-400"
                    value={faq.answer}
                    onChange={(e) => updateFaq(index, "answer", e.target.value)}
                  ></textarea>
                  <button
                    type="button"
                    onClick={() => removeFaq(index)}
                    className="bg-red-500 text-white p-2 rounded hover:bg-red-600 mt-1"
                  >
                    <Icon icon="mingcute:close-line" className="text-xl" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addFaq}
                className="border px-3 py-1.5 rounded bg-white text-gray-600 hover:bg-gray-50 flex items-center gap-1"
              >
                + Add FAQ
              </button>
            </div>

            <hr className="my-6" />

            <div className="grid grid-cols-[200px_1fr] gap-4 items-start">
              <label className="font-semibold text-gray-700 mt-2">Author</label>
              <input
                type="text"
                className="w-full border rounded p-2 focus:outline-none focus:border-blue-400"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-[200px_1fr] gap-4 items-start">
              <label className="font-semibold text-gray-700 mt-2">Reading Time (mins)</label>
              <input
                type="number"
                className="w-full border rounded p-2 focus:outline-none focus:border-blue-400"
                value={formData.readingTime}
                onChange={(e) => setFormData({ ...formData, readingTime: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-[200px_1fr] gap-4 items-start">
              <label className="font-semibold text-gray-700 mt-2">Publish Date</label>
              <input
                type="date"
                className="w-full border rounded p-2 focus:outline-none focus:border-blue-400"
                value={formData.publishDate}
                onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-[200px_1fr] gap-4 items-start">
              <label className="font-semibold text-gray-700 mt-2">Banner Image (1920×460)</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  onChange={(e) => handleFileUpload(e, "bannerImage")}
                  className="border rounded p-1 bg-gray-50"
                  accept="image/*"
                />
                {formData.bannerImage && <span className="text-xs text-green-600 truncate max-w-xs">{formData.bannerImage}</span>}
              </div>
            </div>

            <div className="grid grid-cols-[200px_1fr] gap-4 items-start">
              <label className="font-semibold text-gray-700 mt-2">Featured Image (534×259)</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  onChange={(e) => handleFileUpload(e, "featuredImage")}
                  className="border rounded p-1 bg-gray-50"
                  accept="image/*"
                />
                {formData.featuredImage && <span className="text-xs text-green-600 truncate max-w-xs">{formData.featuredImage}</span>}
              </div>
            </div>

            <hr className="my-6" />

            <div className="space-y-4">
              <h3 className="text-xl font-light text-gray-700">SEO Details</h3>
              
              <div className="grid grid-cols-[200px_1fr] gap-4 items-start">
                <label className="font-semibold text-gray-700 mt-2">Meta Title</label>
                <input
                  type="text"
                  className="w-full border rounded p-2 focus:outline-none focus:border-blue-400"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-[200px_1fr] gap-4 items-start">
                <label className="font-semibold text-gray-700 mt-2">Meta Keywords</label>
                <textarea
                  rows="3"
                  className="w-full border rounded p-2 focus:outline-none focus:border-blue-400"
                  value={formData.metaKeywords}
                  onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
                ></textarea>
              </div>

              <div className="grid grid-cols-[200px_1fr] gap-4 items-start">
                <label className="font-semibold text-gray-700 mt-2">Meta Description</label>
                <textarea
                  rows="3"
                  className="w-full border rounded p-2 focus:outline-none focus:border-blue-400"
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                ></textarea>
              </div>
            </div>

            <div className="grid grid-cols-[200px_1fr] gap-4 items-start">
              <label className="font-semibold text-gray-700 mt-2">Status</label>
              <select
                className="w-full border rounded p-2 focus:outline-none focus:border-blue-400 bg-white"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="flex gap-3 pt-6 pb-4 border-t">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded shadow-sm transition-colors"
              >
                Save Blog
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className="border px-6 py-2 rounded text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this blog?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfirmationModal(false);
                  setBlogToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 shadow-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 text-center shadow-xl">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <Icon icon="mdi:check" className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-lg font-medium text-gray-900">{successMessage}</p>
          </div>
        </div>
      )}

    </div>
  );
}
