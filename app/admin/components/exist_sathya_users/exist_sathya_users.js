import React, { useState, useEffect } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import DateRangePicker from "@/components/DateRangePicker";

const emptyForm = {
  exist_id: "",
  first_name: "",
  last_name: "",
  store_id: "",
  role_id: "",
  zone_id: "",
  email: "",
  phone: "",
  password: "",
  notify_pincode: "",
  notify_status: 0,
  confirmed: "",
};

export default function ExistSathyaUsersComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [formData, setFormData] = useState(emptyForm);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/exist_sathya_users/get");
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching exist sathya users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (user) => {
    setFormData({
      exist_id: user.exist_id || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      store_id: user.store_id || "",
      role_id: user.role_id || "",
      zone_id: user.zone_id || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      notify_pincode: user.notify_pincode || "",
      notify_status: user.notify_status ?? 0,
      confirmed: user.confirmed ?? "",
    });
    setCurrentUserId(user._id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleToggleSelect = (userId) => {
    const id = String(userId);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDelete = async (userId) => {
    try {
      const response = await axios.delete("/api/exist_sathya_users/delete", {
        data: { userId },
      });
      setSelectedIds((prev) => prev.filter((id) => id !== String(userId)));

      if (response.data.success) {
        setAlertMessage("✅ User deleted successfully!");
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
        fetchUsers();
      } else {
        setAlertMessage("❌ Error deleting user");
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      }
    } catch (error) {
      setAlertMessage("❌ Error deleting user");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        exist_id: formData.exist_id || null,
        first_name: formData.first_name || null,
        last_name: formData.last_name || null,
        store_id: formData.store_id || null,
        role_id: formData.role_id || null,
        zone_id: formData.zone_id || null,
        email: formData.email || null,
        phone: formData.phone,
        notify_pincode: formData.notify_pincode || null,
        notify_status: formData.notify_status === "" ? 0 : Number(formData.notify_status),
        confirmed: formData.confirmed === "" ? null : Number(formData.confirmed),
      };

      if (isEditMode) {
        if (formData.password) {
          payload.password = formData.password;
        }
        await axios.put("/api/exist_sathya_users/edit", {
          userId: currentUserId,
          ...payload,
        });
        setAlertMessage("✅ User updated successfully!");
      } else {
        if (formData.password) {
          payload.password = formData.password;
        }
        await axios.post("/api/exist_sathya_users/add", payload);
        setAlertMessage("✅ User added successfully!");
      }

      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false);
        setIsModalOpen(false);
      }, 3000);

      fetchUsers();
      setTimeout(() => {
        resetForm();
      }, 3000);
    } catch (error) {
      setAlertMessage(error.response?.data?.error || "❌ Error processing request");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setIsEditMode(false);
    setCurrentUserId(null);
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) {
      setAlertMessage("❌ Please choose an Excel (.xlsx) or CSV (.csv) file");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    const name = importFile.name.toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".csv")) {
      setAlertMessage("❌ Only .xlsx and .csv files are allowed");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    const data = new FormData();
    data.append("excel", importFile);
    setIsImporting(true);
    setImportResult(null);

    try {
      const response = await axios.post("/api/exist_sathya_users/import", data);
      setImportResult(response.data);
      setAlertMessage(response.data.message || "✅ Import completed");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 4000);
      setImportFile(null);
      fetchUsers();
    } catch (error) {
      setAlertMessage(error.response?.data?.error || "❌ Import failed");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    } finally {
      setIsImporting(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchQuery === "" ||
      (user.exist_id && String(user.exist_id).toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.first_name && user.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.last_name && user.last_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.phone && user.phone.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchesDate = true;
    if (dateFilter.startDate && dateFilter.endDate && user.created_at) {
      const userDate = new Date(user.created_at);
      const startDate = new Date(dateFilter.startDate);
      const endDate = new Date(dateFilter.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      matchesDate = userDate >= startDate && userDate <= endDate;
    }

    return matchesSearch && matchesDate;
  });

  const totalEntries = filteredUsers.length;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const startEntry = indexOfFirstItem + 1;
  const endEntry = Math.min(indexOfLastItem, totalEntries);
  const currentPageIds = currentUsers.map((user) => String(user._id));
  const allCurrentSelected =
    currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id));

  const toggleSelectCurrentPage = () => {
    if (allCurrentSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
      return;
    }
    setSelectedIds((prev) => [...new Set([...prev, ...currentPageIds])]);
  };

  const selectAllFiltered = () => {
    setSelectedIds(filteredUsers.map((user) => String(user._id)));
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${selectedIds.length} selected user(s)? This cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

    setIsBulkDeleting(true);
    try {
      const response = await axios.delete("/api/exist_sathya_users/delete", {
        data: { userIds: selectedIds },
      });

      setAlertMessage(`✅ ${response.data.message || "Users deleted successfully!"}`);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      setSelectedIds([]);
      setCurrentPage(1);
      fetchUsers();
    } catch (error) {
      setAlertMessage(error.response?.data?.error || "❌ Error deleting users");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleDateChange = ({ startDate, endDate }) => {
    setDateFilter({ startDate, endDate });
    setCurrentPage(1);
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-600">
          Showing {startEntry} to {endEntry} of {filteredUsers.length} entries
        </div>
        <div className="pagination flex items-center space-x-1">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1.5 border border-gray-300 rounded-md ${
              currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-black bg-white hover:bg-gray-100"
            }`}
          >
            «
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => paginate(i + 1)}
              className={`px-3 py-1.5 border border-gray-300 rounded-md ${
                currentPage === i + 1 ? "bg-red-500 text-white" : "text-black bg-white hover:bg-gray-100"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1.5 border border-gray-300 rounded-md ${
              currentPage === totalPages ? "text-gray-400 cursor-not-allowed" : "text-black bg-white hover:bg-gray-100"
            }`}
          >
            »
          </button>
        </div>
      </div>
    );
  };

  const modalTitle = isEditMode ? "Edit Exist User" : "Add Exist User";
  const submitButtonText = isEditMode ? "Update User" : "Add User";

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-5 mt-5">
        <h2 className="text-2xl font-bold">Sathya Exist Users</h2>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="bg-white shadow-md rounded-lg p-5 mb-5 overflow-x-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <DateRangePicker onDateChange={handleDateChange} />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setImportResult(null);
                    setImportFile(null);
                    setIsImportOpen(true);
                  }}
                  className="p-2 border border-red-500 text-red-500 hover:bg-red-50 rounded-md transition"
                >
                  Import Excel/CSV
                </button>
                <button
                  onClick={() => {
                    resetForm();
                    setIsModalOpen(true);
                  }}
                  className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition"
                >
                  + Add User
                </button>
              </div>
            </div>
            {showAlert && !isModalOpen && !isImportOpen && (
              <div className="bg-green-500 text-white px-4 py-2 rounded-md mb-4 text-center">{alertMessage}</div>
            )}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {selectedIds.length > 0 && (
                <>
                  <span className="text-sm text-gray-700">{selectedIds.length} selected</span>
                  <button
                    onClick={handleBulkDelete}
                    disabled={isBulkDeleting}
                    className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition disabled:opacity-50"
                  >
                    {isBulkDeleting ? "Deleting..." : "Delete selected"}
                  </button>
                </>
              )}
              {filteredUsers.length > 0 && selectedIds.length !== filteredUsers.length && (
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  className="p-2 border border-gray-300 hover:bg-gray-50 rounded-md transition text-sm"
                >
                  Select all {filteredUsers.length}
                </button>
              )}
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="p-2 border border-gray-300 hover:bg-gray-50 rounded-md transition text-sm"
                >
                  Clear
                </button>
              )}
            </div>
            <hr className="border-t border-gray-200 mb-4" />
            <table className="w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 w-10">
                    <input
                      type="checkbox"
                      checked={allCurrentSelected}
                      onChange={toggleSelectCurrentPage}
                      disabled={currentUsers.length === 0}
                    />
                  </th>
                  <th className="p-2">Exist ID</th>
                  <th className="p-2">First Name</th>
                  <th className="p-2">Last Name</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Phone</th>
                  <th className="p-2">Store ID</th>
                  <th className="p-2">Role ID</th>
                  <th className="p-2">Notify Status</th>
                  <th className="p-2">Created At</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length > 0 ? (
                  currentUsers.map((user, index) => (
                    <tr key={user._id || index} className="text-center border-b">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(String(user._id))}
                          onChange={() => handleToggleSelect(user._id)}
                        />
                      </td>
                      <td className="p-2">{user.exist_id || "-"}</td>
                      <td className="p-2 font-bold">{user.first_name || "-"}</td>
                      <td className="p-2">{user.last_name || "-"}</td>
                      <td className="p-2">{user.email || "-"}</td>
                      <td className="p-2">{user.phone || "-"}</td>
                      <td className="p-2">{user.store_id || "-"}</td>
                      <td className="p-2">{user.role_id || "-"}</td>
                      <td className="p-2">{user.notify_status ?? 0}</td>
                      <td className="p-2">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2 justify-center">
                          <button
                            onClick={() => handleEdit(user)}
                            className="w-7 h-7 bg-red-100 text-red-600 rounded-full inline-flex items-center justify-center"
                            title="Edit"
                          >
                            <Icon icon="mingcute:edit-line" />
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="w-7 h-7 bg-pink-100 text-pink-600 rounded-full inline-flex items-center justify-center"
                            title="Delete"
                          >
                            <Icon icon="mingcute:delete-2-line" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" className="p-2 text-center text-gray-500">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
            {renderPagination()}
          </div>
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-5 rounded-lg w-[28rem] relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-center">{modalTitle}</h2>
            <button
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="absolute top-3 right-3 text-red-500 text-xl"
            >
              ×
            </button>
            {showAlert && (
              <div className="bg-green-500 text-white px-4 py-2 rounded-md mb-4 text-center">{alertMessage}</div>
            )}
            <form onSubmit={handleSubmit} className="mt-4">
              <input type="text" name="exist_id" placeholder="Exist ID (optional)" value={formData.exist_id} onChange={handleChange} className="w-full border p-2 mb-2 rounded" />
              <input type="text" name="first_name" placeholder="First Name (optional)" value={formData.first_name} onChange={handleChange} className="w-full border p-2 mb-2 rounded" />
              <input type="text" name="last_name" placeholder="Last Name (optional)" value={formData.last_name} onChange={handleChange} className="w-full border p-2 mb-2 rounded" />
              <input type="email" name="email" placeholder="Email (optional)" value={formData.email} onChange={handleChange} className="w-full border p-2 mb-2 rounded" />
              <input type="tel" name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} className="w-full border p-2 mb-2 rounded" required />
              <input
                type="password"
                name="password"
                placeholder={isEditMode ? "Password (leave blank to keep)" : "Password (optional)"}
                value={formData.password}
                onChange={handleChange}
                className="w-full border p-2 mb-2 rounded"
              />
              <input type="text" name="store_id" placeholder="Store ID (optional)" value={formData.store_id} onChange={handleChange} className="w-full border p-2 mb-2 rounded" />
              <input type="text" name="role_id" placeholder="Role ID (optional)" value={formData.role_id} onChange={handleChange} className="w-full border p-2 mb-2 rounded" />
              <input type="text" name="zone_id" placeholder="Zone ID (optional)" value={formData.zone_id} onChange={handleChange} className="w-full border p-2 mb-2 rounded" />
              <input type="text" name="notify_pincode" placeholder="Notify Pincode (optional)" value={formData.notify_pincode} onChange={handleChange} className="w-full border p-2 mb-2 rounded" />
              <input type="number" name="notify_status" placeholder="Notify Status (default 0)" value={formData.notify_status} onChange={handleChange} className="w-full border p-2 mb-2 rounded" />
              <input type="number" name="confirmed" placeholder="Confirmed (optional)" value={formData.confirmed} onChange={handleChange} className="w-full border p-2 mb-2 rounded" />
              <button type="submit" className="bg-red-500 text-white px-4 py-2 rounded w-full mt-2">
                {submitButtonText}
              </button>
            </form>
          </div>
        </div>
      )}

      {isImportOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-5 rounded-lg w-[28rem] relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-center">Import Excel / CSV</h2>
            <button
              onClick={() => {
                setIsImportOpen(false);
                setImportFile(null);
                setImportResult(null);
              }}
              className="absolute top-3 right-3 text-red-500 text-xl"
            >
              ×
            </button>
            {showAlert && (
              <div className="bg-green-500 text-white px-4 py-2 rounded-md mb-4 text-center">{alertMessage}</div>
            )}
            <p className="text-sm text-gray-600 mt-4 mb-2">
              Required column: <b>phone</b>.
              Optional: <b>exist_id</b> (or <b>id</b>), <b>first_name</b>, <b>email</b>, <b>password</b> and other columns can be empty.
            </p>
            <a
              href="/api/exist_sathya_users/import/sample"
              className="inline-block text-sm text-red-500 hover:underline mb-3"
            >
              Download sample file
            </a>
            <form onSubmit={handleImportSubmit}>
              <input
                type="file"
                accept=".xlsx,.csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="w-full border p-2 mb-3 rounded"
                required
              />
              <button
                type="submit"
                disabled={isImporting}
                className="bg-red-500 text-white px-4 py-2 rounded w-full disabled:opacity-50"
              >
                {isImporting ? "Importing..." : "Import File"}
              </button>
            </form>
            {importResult && (
              <div className="mt-4 text-sm">
                <p>Added: {importResult.addedCount || 0}</p>
                <p>Skipped existing emails: {importResult.skippedExistingCount || 0}</p>
                <p>Other skipped: {(importResult.skippedCount || 0) - (importResult.skippedExistingCount || 0)}</p>
                {importResult.skippedEmails?.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto border rounded p-2 text-gray-600">
                    {importResult.skippedEmails.map((item, index) => (
                      <div key={index}>Row {item.row}: {item.email} already exists (not inserted)</div>
                    ))}
                  </div>
                )}
                {importResult.errors?.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto border rounded p-2 text-red-600">
                    {importResult.errors.map((item, index) => (
                      <div key={index}>Row {item.row}: {item.error}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
