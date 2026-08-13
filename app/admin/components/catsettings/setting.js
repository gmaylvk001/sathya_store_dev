"use client";
import { useEffect, useState, Fragment } from "react";

export default function CategoryBannerManager() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [formData, setFormData] = useState({
    categoryName: "",
    categorySlug: "",
    md5CatName: "",
    status: "Active",
    bannerName: "",
    bannerImage: null,
    redirectUrl: "",
    bannerStatus: "Active",
  });
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messageModal, setMessageModal] = useState(null); // ✅ success/error messages
  const [deleteModal, setDeleteModal] = useState(null); // ✅ confirmation modal

  const fetchCategories = async () => {
    const res = await fetch("/api/categories/banner");
    const data = await res.json();
    if (data.success) setCategories(data.categories);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleInputChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const openModal = (category, banner = null) => {
    setSelectedCategory(category);
    setSelectedBanner(banner);
    setFormData({
      categoryName: category?.category_name || "",
      categorySlug: category?.category_slug || "",
      md5CatName: category?.md5_cat_name || "",
      status: category?.status || "Active",
      bannerName: banner ? banner.banner_name : "",
      bannerImage: null,
      redirectUrl: banner ? banner.redirect_url : "",
      bannerStatus: banner ? banner.banner_status : "Active",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData();
    fd.append("category_name", formData.categoryName);
    fd.append("category_slug", formData.categorySlug);
    fd.append("md5_cat_name", formData.md5CatName);
    fd.append("status", formData.status);
    fd.append("banner_name", formData.bannerName);
    fd.append("redirect_url", formData.redirectUrl);
    fd.append("banner_status", formData.bannerStatus);

    if (formData.bannerImage) fd.append("bannerImage", formData.bannerImage);
    if (selectedCategory) fd.append("categoryId", selectedCategory._id);
    if (selectedBanner) fd.append("bannerId", selectedBanner._id);

    const res = await fetch("/api/categories/banner", {
      method: "POST",
      body: fd,
    });
    const data = await res.json();
    setLoading(false);

    if (data.success) {
      setMessageModal("Saved successfully!");
      closeModal();
      fetchCategories();
    } else {
      setMessageModal("Error saving data");
    }
  };

  // ✅ Instead of confirm(), open custom modal
  const handleDelete = (categoryId, bannerId = null) => {
    setDeleteModal({ categoryId, bannerId });
  };

  // ✅ Confirm deletion
  const confirmDelete = async () => {
    if (!deleteModal) return;
    const { categoryId, bannerId } = deleteModal;

    const res = await fetch("/api/categories/banner", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, bannerId }),
    });
    const data = await res.json();
    setDeleteModal(null);

    if (data.success) {
      setMessageModal("Deleted successfully!");
      fetchCategories();
    } else {
      setMessageModal("Error deleting data");
    }
  };

  const closeModal = () => {
    setSelectedCategory(null);
    setSelectedBanner(null);
    setFormData({
      categoryName: "",
      categorySlug: "",
      md5CatName: "",
      status: "Active",
      bannerName: "",
      bannerImage: null,
      redirectUrl: "",
      bannerStatus: "Active",
    });
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold">Manage Categories & Banners</h2>

      {/* ---- Table ---- */}
      <table className="w-full border-collapse border border-gray-300 bg-white shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-3 py-2 w-1/4">Category / Banner</th>
            <th className="border px-3 py-2 w-1/4">Redirect URL</th>
            <th className="border px-3 py-2 w-1/6">Status</th>
            <th className="border px-3 py-2 w-1/6">Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <Fragment key={category._id}>
              <tr className="bg-gray-50">
                <td className="border px-3 py-2 font-bold">
                  {category.category_name}
                </td>
                <td colSpan={2}></td>
                <td className="border px-3 py-2 text-right">
                  <button
                    onClick={() => openModal(category)}
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  >
                    + Add Banner
                  </button>
                </td>
              </tr>

              {category.banners?.map((banner) => (
                <tr key={banner._id}>
                  <td className="border px-3 py-2 text-center">
                    <img
                      src={banner.banner_image}
                      alt="banner"
                      className="h-12 w-24 object-contain mx-auto"
                    />
                  </td>
                  <td className="border px-3 py-2">{banner.redirect_url}</td>
                  <td className="border px-3 py-2 text-center">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        banner.banner_status === "Active"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {banner.banner_status}
                    </span>
                  </td>
                  <td className="border px-3 py-2 text-center">
                    <div className="space-x-2">
                      <button
                        onClick={() => openModal(category, banner)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category._id, banner._id)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>

      {/* ---- Add/Edit Modal ---- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-[500px] relative">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              ✖
            </button>
            <h3 className="text-lg font-semibold mb-4">
              {selectedBanner
                ? "Edit Banner"
                : selectedCategory
                ? "Add Banner"
                : "Add Category"}
            </h3>

            <form onSubmit={handleSave} className="space-y-3">
              <input
                type="text"
                placeholder="Banner Name"
                value={formData.bannerName}
                onChange={(e) => handleInputChange("bannerName", e.target.value)}
                className="w-full border px-2 py-1 rounded"
              />
              <p className="text-gray-500 text-sm mb-2">
                Category Banner Size: <span className="font-semibold">1248 × 390 px</span>
                </p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleInputChange("bannerImage", e.target.files[0])
                }
              />
              <input
                type="text"
                placeholder="Redirect URL"
                value={formData.redirectUrl}
                onChange={(e) => handleInputChange("redirectUrl", e.target.value)}
                className="w-full border px-2 py-1 rounded"
              />
              <select
                value={formData.bannerStatus}
                onChange={(e) =>
                  handleInputChange("bannerStatus", e.target.value)
                }
                className="w-full border px-2 py-1 rounded"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <button
                type="submit"
                disabled={loading}
                className="bg-[#d72828] text-white px-4 py-2 rounded hover:bg-[#d72828]"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ---- Delete Confirmation Modal ---- */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-[400px] text-center shadow-lg">
            <h3 className="text-lg font-semibold mb-4">
              Are you sure you want to delete?
            </h3>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setDeleteModal(null)}
                className="bg-gray-400 px-4 py-2 rounded text-white hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-600 px-4 py-2 rounded text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Message Modal ---- */}
      {messageModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-4 rounded-lg w-[300px] text-center shadow-lg">
            <p className="text-lg font-medium">{messageModal}</p>
            <button
              onClick={() => setMessageModal(null)}
              className="mt-4 bg-[#d72828] text-white px-4 py-2 rounded hover:bg-[#d72828]"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
