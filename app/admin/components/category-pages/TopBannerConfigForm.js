"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

const emptyBanner = () => ({
  desktopImage: "",
  mobileImage: "",
  desktopFile: null,
  mobileFile: null,
  desktopPreview: "",
  mobilePreview: "",
  url: "",
  isActive: true,
});

/**
 * Top Banner input form — used inside Category Page Builder.
 */
export default function TopBannerConfigForm({
  categoryId,
  pageType,
  categoryName,
  onSaved,
  onCancel,
}) {
  const [banners, setBanners] = useState([emptyBanner()]);
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/category-topbanner?categoryId=${categoryId}`
        );
        const data = await res.json();
        if (data.success && data.data) {
          setStatus(data.data.status || "active");
          const rows = data.data.banners || [];
          setBanners(
            rows.length
              ? rows.map((b) => ({
                  desktopImage: b.desktopImage || "",
                  mobileImage: b.mobileImage || "",
                  desktopFile: null,
                  mobileFile: null,
                  desktopPreview: b.desktopImage || "",
                  mobilePreview: b.mobileImage || "",
                  url: b.url || "",
                  isActive: b.isActive !== false,
                }))
              : [emptyBanner()]
          );
        } else {
          setBanners([emptyBanner()]);
          setStatus("active");
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [categoryId]);

  const updateBanner = (index, patch) => {
    setBanners((prev) =>
      prev.map((b, i) => (i === index ? { ...b, ...patch } : b))
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    for (let i = 0; i < banners.length; i++) {
      if (!banners[i].desktopFile && !banners[i].desktopImage) {
        setError(`Banner #${i + 1}: desktop image required.`);
        return;
      }
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("categoryId", categoryId);
      fd.append("pageType", pageType);
      fd.append("status", status);
      fd.append(
        "bannersMeta",
        JSON.stringify(
          banners.map((b, i) => ({
            desktopImage: b.desktopImage || "",
            mobileImage: b.mobileImage || "",
            url: b.url || "",
            isActive: b.isActive !== false,
            order: i,
          }))
        )
      );
      banners.forEach((b, i) => {
        if (b.desktopFile) fd.append(`desktopImage_${i}`, b.desktopFile);
        if (b.mobileFile) fd.append(`mobileImage_${i}`, b.mobileFile);
      });

      const res = await fetch("/api/category-topbanner", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Save failed");
      onSaved?.(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#d72828]" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Top Banner</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Inputs for {categoryName || "this category"}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={status === "active"}
            onChange={(e) =>
              setStatus(e.target.checked ? "active" : "inactive")
            }
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[#d72828] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
        </label>
        <span className="text-sm font-medium">Set Active</span>
      </div>

      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Banners ({banners.length})</h4>
        <button
          type="button"
          onClick={() => setBanners((p) => [...p, emptyBanner()])}
          className="text-sm text-[#d72828] font-medium hover:underline inline-flex items-center gap-1"
        >
          <Icon icon="mdi:plus" /> Add another banner
        </button>
      </div>

      {banners.map((banner, index) => (
        <div
          key={index}
          className="rounded-xl border border-gray-200 p-4 space-y-3 bg-gray-50/60"
        >
          <div className="flex justify-between">
            <span className="text-sm font-medium">Banner #{index + 1}</span>
            {banners.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setBanners((p) => p.filter((_, i) => i !== index))
                }
                className="text-xs text-red-600"
              >
                Remove
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Banner Image (Desktop) *
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  updateBanner(index, {
                    desktopFile: file,
                    desktopPreview: URL.createObjectURL(file),
                  });
                }}
                className="w-full text-sm"
              />
              {banner.desktopPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={banner.desktopPreview}
                  alt=""
                  className="mt-2 h-20 w-full object-cover rounded border"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Mobile Banner Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  updateBanner(index, {
                    mobileFile: file,
                    mobilePreview: URL.createObjectURL(file),
                  });
                }}
                className="w-full text-sm"
              />
              {banner.mobilePreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={banner.mobilePreview}
                  alt=""
                  className="mt-2 h-20 w-full object-cover rounded border"
                />
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Banner URL
            </label>
            <input
              type="text"
              value={banner.url}
              onChange={(e) => updateBanner(index, { url: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="/category/... or https://..."
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={banner.isActive}
                onChange={(e) =>
                  updateBanner(index, { isActive: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[#d72828] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
            </label>
            <span className="text-sm">
              {banner.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      ))}

      <div className="flex justify-end gap-2 pt-2 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#d72828] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Top Banner"}
        </button>
      </div>
    </form>
  );
}
