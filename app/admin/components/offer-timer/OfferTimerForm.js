"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OFFER_TIMER_STATES, toDateTimeLocal } from "@/lib/offerTimer";

const emptyForm = {
  offerTitle: "",
  startDate: "",
  endDate: "",
  offerViewStates: ["all"],
  timerDisplayStatus: "Yes",
  offerHeading: "",
  offerDescription: "",
};

export default function OfferTimerForm({ timerId = null }) {
  const router = useRouter();
  const isEditMode = Boolean(timerId);
  const [formData, setFormData] = useState(emptyForm);
  const [displayId, setDisplayId] = useState("");
  const [topBannerFile, setTopBannerFile] = useState(null);
  const [popupFile, setPopupFile] = useState(null);
  const [topBannerPreview, setTopBannerPreview] = useState(null);
  const [popupPreview, setPopupPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!timerId) return;

    const fetchTimer = async () => {
      try {
        const response = await fetch(`/api/offer-timer/${timerId}`);
        const result = await response.json();
        if (!response.ok) {
          setError(result.error || "Offer timer not found");
          return;
        }
        const timer = result.data;
        const states = timer.offerViewStates || [];
        setDisplayId(timer.timerId);
        setFormData({
          offerTitle: timer.offerTitle || "",
          startDate: toDateTimeLocal(timer.startDate),
          endDate: toDateTimeLocal(timer.endDate),
          offerViewStates: states.includes("all") || !states.length ? ["all"] : states.filter((item) => item !== "all"),
          timerDisplayStatus: timer.timerDisplayStatus || "Yes",
          offerHeading: timer.offerHeading || "",
          offerDescription: timer.offerDescription || "",
        });
        if (timer.topBanner) setTopBannerPreview(`/uploads/OfferTimers/${timer.topBanner}`);
        if (timer.dealsPopupImage) setPopupPreview(`/uploads/OfferTimers/${timer.dealsPopupImage}`);
      } catch (err) {
        setError("Failed to load offer timer");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimer();
  }, [timerId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStateToggle = (value) => {
    setFormData((prev) => {
      if (value === "all") {
        return {
          ...prev,
          offerViewStates: prev.offerViewStates.includes("all") ? [] : ["all"],
        };
      }

      const withoutAll = prev.offerViewStates.filter((item) => item !== "all");
      const alreadySelected = withoutAll.includes(value);
      return {
        ...prev,
        offerViewStates: alreadySelected
          ? withoutAll.filter((item) => item !== value)
          : [...withoutAll, value],
      };
    });
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (field === "topBanner") {
      setTopBannerFile(file);
      setTopBannerPreview(preview);
      const image = new window.Image();
      image.onload = () => {
        if (image.width !== 1578 || image.height !== 117) {
          setError("Top banner recommended size is 1578px * 117px");
        }
      };
      image.src = preview;
      return;
    }
    setPopupFile(file);
    setPopupPreview(preview);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError("End date must be after start date");
      setIsSaving(false);
      return;
    }

    try {
      const data = new FormData();
      if (isEditMode) data.append("id", timerId);
      data.append("offerTitle", formData.offerTitle);
      data.append("startDate", formData.startDate);
      data.append("endDate", formData.endDate);
      data.append("timerDisplayStatus", formData.timerDisplayStatus);
      data.append("offerHeading", formData.offerHeading);
      data.append("offerDescription", formData.offerDescription);
      formData.offerViewStates.forEach((state) => data.append("offerViewStates", state));
      if (topBannerFile) data.append("topBanner", topBannerFile);
      if (popupFile) data.append("dealsPopupImage", popupFile);

      const response = await fetch(isEditMode ? "/api/offer-timer/update" : "/api/offer-timer/add", {
        method: isEditMode ? "PUT" : "POST",
        body: data,
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Failed to save offer timer");
        return;
      }
      router.push("/admin/offer-timer");
    } catch (err) {
      setError("Failed to save offer timer");
    } finally {
      setIsSaving(false);
    }
  };

  const isAllSelected = formData.offerViewStates.includes("all");
  const hasSpecificStates = formData.offerViewStates.some((item) => item !== "all");

  if (isLoading) {
    return <p className="mt-5">Loading...</p>;
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-5 mt-5">
        <h2 className="text-3xl font-light text-gray-700">
          {isEditMode ? "Edit Offers Timer" : "Create Offers Timer"}
        </h2>
        <button
          type="button"
          onClick={() => router.push("/admin/offer-timer")}
          className="border px-3 py-1.5 rounded hover:bg-gray-50"
        >
          Back to list
        </button>
      </div>

      <div className="bg-white shadow-sm border rounded-lg p-6 max-w-4xl">
        {error && <div className="mb-4 bg-red-50 text-red-600 px-4 py-2 rounded">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isEditMode && (
            <div className="flex items-center">
              <label className="w-1/4 text-sm font-semibold text-gray-700">ID</label>
              <input value={displayId} readOnly className="w-3/4 border rounded p-2 bg-gray-100 cursor-not-allowed" />
            </div>
          )}

          <div className="flex items-center">
            <label className="w-1/4 text-sm font-semibold text-gray-700">Offer Title</label>
            <input
              name="offerTitle"
              value={formData.offerTitle}
              onChange={handleChange}
              className="w-3/4 border rounded p-2"
              required
            />
          </div>

          <div className="flex items-center">
            <label className="w-1/4 text-sm font-semibold text-gray-700">Start Date</label>
            <input
              type="datetime-local"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-3/4 border rounded p-2"
              required
            />
          </div>

          <div className="flex items-center">
            <label className="w-1/4 text-sm font-semibold text-gray-700">End Date</label>
            <input
              type="datetime-local"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="w-3/4 border rounded p-2"
              required
            />
          </div>

          <div className="flex items-start">
            <label className="w-1/4 text-sm font-semibold text-gray-700 pt-1">States</label>
            <div className="w-3/4 flex flex-wrap gap-4">
              {!hasSpecificStates && (
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={() => handleStateToggle("all")}
                  />
                  All
                </label>
              )}
              {!isAllSelected && OFFER_TIMER_STATES.map((item) => (
                <label key={item.value} className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.offerViewStates.includes(item.value)}
                    onChange={() => handleStateToggle(item.value)}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <label className="w-1/4 text-sm font-semibold text-gray-700">Timer Display Status</label>
            <select
              name="timerDisplayStatus"
              value={formData.timerDisplayStatus}
              onChange={handleChange}
              className="w-3/4 border rounded p-2"
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          <div className="flex items-center">
            <label className="w-1/4 text-sm font-semibold text-gray-700">Offer Heading</label>
            <input
              name="offerHeading"
              value={formData.offerHeading}
              onChange={handleChange}
              className="w-3/4 border rounded p-2"
            />
          </div>

          <div className="flex items-start">
            <label className="w-1/4 text-sm font-semibold text-gray-700 pt-2">Offer Description</label>
            <textarea
              name="offerDescription"
              value={formData.offerDescription}
              onChange={handleChange}
              rows={4}
              className="w-3/4 border rounded p-2"
            />
          </div>

          <div className="flex items-start">
            <label className="w-1/4 text-sm font-semibold text-gray-700 pt-2">Top Banner Image</label>
            <div className="w-3/4">
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "topBanner")} />
              <p className="text-red-500 text-sm mt-1">Size 1578px * 117px</p>
              {topBannerPreview && (
                <img src={topBannerPreview} alt="Top banner" className="mt-2 max-w-full h-auto border" />
              )}
            </div>
          </div>

          <div className="flex items-start">
            <label className="w-1/4 text-sm font-semibold text-gray-700 pt-2">Deals Popup Image</label>
            <div className="w-3/4">
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "popup")} />
              {popupPreview && (
                <img src={popupPreview} alt="Deals popup" className="mt-2 max-w-xs h-auto border" />
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.push("/admin/offer-timer")}
              className="border px-4 py-2 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
