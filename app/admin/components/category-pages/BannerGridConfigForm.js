"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";

const MIN_W = 1;
const MIN_H = 1;
const MAX_W = 600;
const MAX_H = 600;

function emptyBanner() {
  return {
    image: "",
    imageFile: null,
    imagePreview: "",
    url: "",
    width: null,
    height: null,
  };
}

function readImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const dims = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(img.src);
      resolve(dims);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Could not read image dimensions."));
    };
    img.src = URL.createObjectURL(file);
  });
}

function validateDimensions(width, height) {
  if (width > MAX_W || height > MAX_H) {
    return `Image must be below ${MAX_W}×${MAX_H}px. Got ${width}×${height}px.`;
  }
  if (width < MIN_W || height < MIN_H) {
    return `Invalid image size: ${width}×${height}px.`;
  }
  return null;
}

function readShowGap(value) {
  return value === true || value === "true" || value === 1;
}

/**
 * Admin: 2–4 equal-size banners with URL links.
 */
export default function BannerGridConfigForm({
  pageId,
  categoryName,
  instanceId,
  setLabel,
  existingSets = [],
  onAddNew,
  onEditSet,
  onDeleteSet,
  onBackToList,
  onSaved,
}) {
  const isListMode = !instanceId;
  const [name, setName] = useState("");
  const [status, setStatus] = useState("active");
  const [showGap, setShowGap] = useState(false);
  const [imageCount, setImageCount] = useState(4);
  const [banners, setBanners] = useState(
    Array.from({ length: 4 }, emptyBanner)
  );
  const [loading, setLoading] = useState(!isListMode);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const referenceDims = useRef(null);

  useEffect(() => {
    if (!instanceId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/category-banner-grid?instanceId=${instanceId}`
        );
        const data = await res.json();
        if (data.success && data.data) {
          const d = data.data;
          const count = [2, 3, 4].includes(d.imageCount) ? d.imageCount : 4;
          setName(d.name || "");
          setStatus(d.status || "active");
          setShowGap(readShowGap(d.showGap));
          setImageCount(count);
          const rows = [...(d.banners || [])].sort(
            (a, b) => (a.order ?? 0) - (b.order ?? 0)
          );
          setBanners(
            Array.from({ length: 4 }, (_, i) => {
              const b = rows[i];
              return b
                ? {
                    image: b.image || "",
                    imageFile: null,
                    imagePreview: b.image || "",
                    url: b.url || "",
                    width: null,
                    height: null,
                  }
                : emptyBanner();
            })
          );
          referenceDims.current = null;
        } else {
          setName("");
          setImageCount(4);
          setShowGap(false);
          setBanners(Array.from({ length: 4 }, emptyBanner));
          setStatus("active");
          referenceDims.current = null;
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [instanceId]);

  const handleImageCountChange = (count) => {
    setImageCount(count);
    setError("");
  };

  const updateBanner = (index, patch) => {
    setBanners((prev) =>
      prev.map((b, i) => (i === index ? { ...b, ...patch } : b))
    );
  };

  const pickBannerImage = async (index, file) => {
    if (!file) return;
    setError("");
    try {
      const { width, height } = await readImageDimensions(file);
      const dimErr = validateDimensions(width, height);
      if (dimErr) {
        setError(dimErr);
        return;
      }

      if (referenceDims.current) {
        const ref = referenceDims.current;
        if (ref.width !== width || ref.height !== height) {
          setError(
            `All images must be the same height and width. Expected ${ref.width}×${ref.height}px, got ${width}×${height}px.`
          );
          return;
        }
      } else {
        for (let i = 0; i < imageCount; i++) {
          if (i === index) continue;
          const b = banners[i];
          if (b.width && b.height) {
            if (b.width !== width || b.height !== height) {
              setError(
                `All images must be the same height and width. Image ${i + 1} is ${b.width}×${b.height}px.`
              );
              return;
            }
            referenceDims.current = { width: b.width, height: b.height };
            break;
          }
        }
        if (!referenceDims.current) {
          referenceDims.current = { width, height };
        }
      }

      updateBanner(index, {
        imageFile: file,
        imagePreview: URL.createObjectURL(file),
        width,
        height,
      });
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDeleteSet = async (setInstanceId, label) => {
    if (
      !window.confirm(
        `Delete "${label || "this set"}"? This cannot be undone.`
      )
    ) {
      return;
    }
    setDeletingId(setInstanceId);
    setError("");
    try {
      const res = await fetch(
        `/api/category-banner-grid?instanceId=${encodeURIComponent(setInstanceId)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Delete failed");
      onDeleteSet?.(setInstanceId);
    } catch (e) {
      setError(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");

    for (let i = 0; i < imageCount; i++) {
      if (!banners[i].imagePreview && !banners[i].image) {
        setError(`Banner image ${i + 1} is required.`);
        return;
      }
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("instanceId", instanceId);
      fd.append("pageId", pageId);
      fd.append("name", name.trim());
      fd.append("status", status);
      fd.append("showGap", showGap ? "true" : "false");
      fd.append("imageCount", String(imageCount));
      fd.append(
        "bannersMeta",
        JSON.stringify(
          banners.slice(0, imageCount).map((b) => ({
            image: b.image || "",
            url: b.url || "",
          }))
        )
      );
      banners.slice(0, imageCount).forEach((b, i) => {
        if (b.imageFile) fd.append(`bannerImage_${i}`, b.imageFile);
      });

      const res = await fetch("/api/category-banner-grid", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Save failed");
      if (data.data) {
        setShowGap(readShowGap(data.data.showGap));
      }
      onSaved?.(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const visibleBanners = banners.slice(0, imageCount);

  if (isListMode) {
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Banner Grid (2–4)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Add 2, 3, or 4 banners with links for{" "}
              <span className="font-medium text-gray-700">
                {categoryName || "this category"}
              </span>
              .
            </p>
            <p className="text-sm font-medium text-[#d72828] mt-2">
              All images must be the same height and width and below 600×600px.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddNew}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[#d72828] px-3 py-2 text-sm font-medium text-white hover:bg-[#b82222]"
          >
            <Icon icon="mdi:plus" className="text-base" />
            ADD NEW
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {existingSets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center text-sm text-gray-500">
            No banner grid sets yet. Click <strong>ADD NEW</strong>.
          </div>
        ) : (
          <ul className="space-y-2">
            {existingSets.map((s) => (
              <li
                key={s.instanceId}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-4 py-3 bg-gray-50/60"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {s.label}
                  </div>
                  {s.title ? (
                    <div className="text-xs text-gray-500 mt-0.5">{s.title}</div>
                  ) : null}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => onEditSet?.(s.instanceId)}
                    className="text-sm font-medium text-[#d72828] hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === s.instanceId}
                    onClick={() => handleDeleteSet(s.instanceId, s.label)}
                    className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                  >
                    {deletingId === s.instanceId ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#d72828]" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={onBackToList}
            className="inline-flex items-center gap-1 text-xs text-gray-500 mb-1 hover:text-gray-800"
          >
            <Icon icon="mdi:arrow-left" /> Back to sets
          </button>
          <h3 className="text-lg font-semibold text-gray-900">
            {setLabel || "New Banner Grid"}
          </h3>
          <p className="text-sm font-medium text-[#d72828] mt-2">
            All images must be the same height and width and below 600×600px.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddNew}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[#d72828] px-3 py-2 text-sm font-medium text-white hover:bg-[#b82222]"
        >
          <Icon icon="mdi:plus" className="text-base" />
          ADD NEW
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Section name (optional)
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Featured Offers"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-4">
        <label className="block text-sm font-semibold text-gray-900 mb-1">
          Gap between images
        </label>
        <p className="text-xs text-gray-500 mb-3">
          ON shows space between banners. OFF displays banners with no gap.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowGap(true)}
            className={`rounded-lg border px-6 py-2 text-sm font-semibold transition ${
              showGap
                ? "border-[#d72828] bg-[#d72828] text-white"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            ON
          </button>
          <button
            type="button"
            onClick={() => setShowGap(false)}
            className={`rounded-lg border px-6 py-2 text-sm font-semibold transition ${
              !showGap
                ? "border-[#d72828] bg-[#d72828] text-white"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            OFF
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of banners *
        </label>
        <div className="flex gap-2">
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleImageCountChange(n)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                imageCount === n
                  ? "border-[#d72828] bg-[#d72828] text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              {n} images
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 p-4 space-y-4 bg-gray-50/40">
        <h4 className="text-sm font-semibold text-gray-900">
          Banner images &amp; links
        </h4>
        <div
          className={`grid gap-3 ${
            imageCount === 2
              ? "grid-cols-1 sm:grid-cols-2"
              : imageCount === 3
                ? "grid-cols-1 sm:grid-cols-3"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          }`}
        >
          {visibleBanners.map((banner, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 bg-white p-3 space-y-2"
            >
              <div className="text-xs font-semibold text-gray-700">
                Banner {index + 1}
              </div>
              <input
                type="text"
                value={banner.url}
                onChange={(e) => updateBanner(index, { url: e.target.value })}
                placeholder="URL / slug"
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              />
              <input
                type="file"
                accept="image/*,.heic,.heif"
                onChange={(e) => pickBannerImage(index, e.target.files?.[0])}
                className="block w-full text-sm"
              />
              {banner.width && banner.height ? (
                <p className="text-[10px] text-gray-500">
                  {banner.width}×{banner.height}px
                </p>
              ) : null}
              {banner.imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={banner.imagePreview}
                  alt=""
                  className="mt-1 w-full max-h-[120px] object-contain rounded border bg-gray-50"
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>

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

      <div className="flex justify-end gap-2 pt-2 border-t">
        <button
          type="button"
          onClick={onBackToList}
          className="rounded-lg border px-4 py-2 text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#d72828] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
