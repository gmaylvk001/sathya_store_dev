"use client";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function VideoCardPage() {
  const [videoCards, setVideoCards] = useState([]);
  const [newVideoCard, setNewVideoCard] = useState({
    title: "",
    thumbnail_image: null,
    video_url: "",
    status: "Active",
  });
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [videoCardToDelete, setVideoCardToDelete] = useState(null);
  const [editingStates, setEditingStates] = useState({});

  // Fetch video cards
  const fetchVideoCards = async () => {
    try {
      const res = await fetch("/api/videocard");
      const data = await res.json();
      if (data.success) {
        setVideoCards(data.videoCards);
        const states = {};
        data.videoCards.forEach(videoCard => {
          states[videoCard._id] = {
            title: videoCard.title || "",
            video_url: videoCard.video_url || "",
            status: videoCard.status || "Active",
            thumbnail_image: null,
            hasChanges: false
          };
        });
        setEditingStates(states);
      }
    } catch (err) {
      setError("Failed to fetch video cards");
    }
  };

  useEffect(() => {
    fetchVideoCards();
  }, []);

  // Save new video card
  const handleSave = async () => {
    setError("");
    setImageError("");

    if (!newVideoCard.thumbnail_image) {
      setImageError("Please choose a thumbnail image.");
      return;
    }
    if (!newVideoCard.title || !newVideoCard.video_url) {
      setError("Title and video URL are required.");
      return;
    }

    const formData = new FormData();
    formData.append("thumbnail_image", newVideoCard.thumbnail_image);
    formData.append("title", newVideoCard.title);
    formData.append("video_url", newVideoCard.video_url);
    formData.append("status", newVideoCard.status);

    try {
      const res = await fetch("/api/videocard", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setNewVideoCard({
          title: "",
          thumbnail_image: null,
          video_url: "",
          status: "Active",
        });
        setShowAddForm(false);
        fetchVideoCards();
      } else {
        if (data.message.includes("pixels")) {
          setImageError(data.message);
        } else {
          setError(data.message || "Something went wrong.");
        }
      }
    } catch (err) {
      setError("Failed to save video card");
    }
  };

  // Update video card
  const handleUpdate = async (id, field, value) => {
    setError("");
    setImageError("");

    const formData = new FormData();
    formData.append("id", id);

    if (field === "thumbnail_image") {
      formData.append(field, value);
    } else {
      formData.append(field, value);
    }

    try {
      const res = await fetch("/api/videocard", {
        method: "PUT",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setEditingStates(prev => ({
          ...prev,
          [id]: {
            ...prev[id],
            [field]: field === "thumbnail_image" ? null : value,
            hasChanges: false
          }
        }));
        fetchVideoCards();
      } else {
        setError(data.message || "Update failed.");
      }
    } catch (err) {
      setError("Failed to update video card");
    }
  };

  // Handle input changes
  const handleInputChange = (id, field, value) => {
    setEditingStates(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
        hasChanges: true
      }
    }));
  };

  // Delete video card
  const handleDelete = async () => {
    if (!videoCardToDelete) return;

    try {
      await fetch("/api/videocard", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: videoCardToDelete._id }),
      });
      fetchVideoCards();
      closeDeleteModal();
    } catch (err) {
      setError("Failed to delete video card");
      closeDeleteModal();
    }
  };

  const openDeleteModal = (videoCard) => {
    setVideoCardToDelete(videoCard);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setVideoCardToDelete(null);
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-5 mt-5">
        <h2 className="text-2xl font-bold">Video Card Manager</h2>
        <Link
          href="/admin/homesettings"
          className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800 transition"
        >
          <ArrowLeft size={18} /> Back
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg p-5 overflow-x-auto">
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Add New Video Card */}
        <div className="mb-6">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              + Add New Video Card
            </button>
          ) : (
            <div className="border p-4 rounded-lg space-y-3">
              <h3 className="font-medium text-lg">Add New Video Card</h3>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  value={newVideoCard.title}
                  onChange={(e) =>
                    setNewVideoCard({ ...newVideoCard, title: e.target.value })
                  }
                  className="border px-2 py-1 rounded w-full"
                />
              </div>

              {/* Thumbnail Upload */}
              <div>
                <label className="block text-sm font-medium mb-1">Thumbnail Image *</label>
                <input
                  type="file"
                  onChange={(e) =>
                    setNewVideoCard({ ...newVideoCard, thumbnail_image: e.target.files[0] })
                  }
                  className="border px-2 py-1 rounded w-full"
                />
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-sm font-medium mb-1">Video URL *</label>
                <input
                  type="text"
                  value={newVideoCard.video_url}
                  onChange={(e) =>
                    setNewVideoCard({ ...newVideoCard, video_url: e.target.value })
                  }
                  className="border px-2 py-1 rounded w-full"
                />
              </div>

              {imageError && <p className="text-red-500 text-sm mt-1">{imageError}</p>}

              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={newVideoCard.status}
                  onChange={(e) =>
                    setNewVideoCard({ ...newVideoCard, status: e.target.value })
                  }
                  className="border px-2 py-1 rounded w-full"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setNewVideoCard({
                      title: "",
                      thumbnail_image: null,
                      video_url: "",
                      status: "Active",
                    });
                    setShowAddForm(false);
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Existing Video Cards */}
        <div className="space-y-4">
          {videoCards.map((videoCard) => (
            <div
              key={videoCard._id}
              className="flex flex-col md:flex-row items-center gap-4 border p-4 rounded-lg"
            >
              {/* Thumbnail */}
              <div className="flex flex-col items-center">
                <img
                  src={videoCard.thumbnail_image}
                  alt="thumbnail"
                  className="w-48 h-28 object-cover rounded mb-2"
                />
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      handleInputChange(videoCard._id, "thumbnail_image", e.target.files[0]);
                    }
                  }}
                  className="border rounded w-40 text-sm px-2 py-1 mb-2"
                />
                <button
                  onClick={() =>
                    handleUpdate(videoCard._id, "thumbnail_image", editingStates[videoCard._id]?.thumbnail_image)
                  }
                  disabled={!editingStates[videoCard._id]?.thumbnail_image}
                  className={`p-2 rounded flex items-center ${
                    editingStates[videoCard._id]?.thumbnail_image
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Save
                </button>
              </div>

              {/* Title */}
              <div className="flex flex-col md:flex-row gap-2 items-center flex-grow">
                <input
                  type="text"
                  value={editingStates[videoCard._id]?.title || videoCard.title || ""}
                  onChange={(e) => handleInputChange(videoCard._id, "title", e.target.value)}
                  className="border px-2 py-1 rounded flex-grow"
                  placeholder="Title"
                />
                <button
                  onClick={() =>
                    handleUpdate(videoCard._id, "title", editingStates[videoCard._id]?.title)
                  }
                  disabled={!editingStates[videoCard._id]?.hasChanges}
                  className={`p-2 rounded flex items-center ${
                    editingStates[videoCard._id]?.hasChanges
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Save
                </button>
              </div>

              {/* Video URL */}
              <div className="flex flex-col md:flex-row gap-2 items-center flex-grow">
                <input
                  type="text"
                  value={editingStates[videoCard._id]?.video_url || videoCard.video_url || ""}
                  onChange={(e) => handleInputChange(videoCard._id, "video_url", e.target.value)}
                  className="border px-2 py-1 rounded flex-grow"
                  placeholder="Video URL"
                />
                <button
                  onClick={() =>
                    handleUpdate(videoCard._id, "video_url", editingStates[videoCard._id]?.video_url)
                  }
                  disabled={!editingStates[videoCard._id]?.hasChanges}
                  className={`p-2 rounded flex items-center ${
                    editingStates[videoCard._id]?.hasChanges
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Save
                </button>
              </div>

              {/* Status */}
              <div className="flex flex-col md:flex-row gap-2 items-center">
                <select
                  value={editingStates[videoCard._id]?.status || videoCard.status || "Active"}
                  onChange={(e) => handleInputChange(videoCard._id, "status", e.target.value)}
                  className="border px-2 py-1 rounded"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <button
                  onClick={() =>
                    handleUpdate(videoCard._id, "status", editingStates[videoCard._id]?.status)
                  }
                  disabled={!editingStates[videoCard._id]?.hasChanges}
                  className={`p-2 rounded flex items-center ${
                    editingStates[videoCard._id]?.hasChanges
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Save
                </button>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => openDeleteModal(videoCard)}
                className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-xl font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-6">Are you sure you want to delete this video card?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
