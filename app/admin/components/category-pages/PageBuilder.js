"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import {
  COMPONENT_TYPES,
  getAvailableComponents,
  getComponentMeta,
  getInstanceLabels,
  PAGE_TYPE_LABELS,
} from "@/lib/categoryPageComponents/registry";
import TopBannerConfigForm from "./TopBannerConfigForm";
import ImageCarouselConfigForm from "./ImageCarouselConfigForm";
import ProductCarouselConfigForm from "./ProductCarouselConfigForm";
import BannerSideProductsConfigForm from "./BannerSideProductsConfigForm";
import BannerFourProductsConfigForm from "./BannerFourProductsConfigForm";

/**
 * Page Builder:
 * - Top Banner: one per page (carousel for many images)
 * - Future components: allowMultiple → add many instances, each on Order page
 */
export default function PageBuilder() {
  const { id } = useParams();
  const router = useRouter();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [configType, setConfigType] = useState(null);
  const [configInstanceId, setConfigInstanceId] = useState(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/category-pages/${id}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setPage(data.page);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) load();
  }, [id, load]);

  const available = getAvailableComponents();
  const components = page?.components || [];
  const instanceLabels = getInstanceLabels(components);
  const countByType = components.reduce((acc, c) => {
    acc[c.type] = (acc[c.type] || 0) + 1;
    return acc;
  }, {});

  const selectComponent = async (type) => {
    setMessage("");
    const meta = getComponentMeta(type);

    // allowMultiple: open component page (list + ADD NEW) — do not auto-create
    if (meta?.allowMultiple) {
      setConfigType(type);
      setConfigInstanceId(null);
      return;
    }

    try {
      const res = await fetch(`/api/category-pages/${id}/components`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setPage(data.page);
      setConfigType(type);
      setConfigInstanceId(data.instance?.instanceId || null);
      if (data.alreadyExists) {
        setMessage("Top Banner already on this page — editing existing carousel.");
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const addNewCarouselSet = async () => {
    setMessage("");
    try {
      const res = await fetch(`/api/category-pages/${id}/components`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: COMPONENT_TYPES.IMAGE_CAROUSEL }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setPage(data.page);
      setConfigType(COMPONENT_TYPES.IMAGE_CAROUSEL);
      setConfigInstanceId(data.instance?.instanceId || null);
    } catch (e) {
      alert(e.message);
    }
  };

  const addNewProductCarouselSet = async () => {
    setMessage("");
    try {
      const res = await fetch(`/api/category-pages/${id}/components`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: COMPONENT_TYPES.PRODUCT_CAROUSEL }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setPage(data.page);
      setConfigType(COMPONENT_TYPES.PRODUCT_CAROUSEL);
      setConfigInstanceId(data.instance?.instanceId || null);
    } catch (e) {
      alert(e.message);
    }
  };

  const addNewBannerSideProductsSet = async () => {
    setMessage("");
    try {
      const res = await fetch(`/api/category-pages/${id}/components`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: COMPONENT_TYPES.BANNER_SIDE_PRODUCTS }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setPage(data.page);
      setConfigType(COMPONENT_TYPES.BANNER_SIDE_PRODUCTS);
      setConfigInstanceId(data.instance?.instanceId || null);
    } catch (e) {
      alert(e.message);
    }
  };

  const addNewBannerFourProductsSet = async () => {
    setMessage("");
    try {
      const res = await fetch(`/api/category-pages/${id}/components`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: COMPONENT_TYPES.BANNER_FOUR_PRODUCTS }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setPage(data.page);
      setConfigType(COMPONENT_TYPES.BANNER_FOUR_PRODUCTS);
      setConfigInstanceId(data.instance?.instanceId || null);
    } catch (e) {
      alert(e.message);
    }
  };

  const openEditInstance = (c) => {
    setConfigType(c.type);
    setConfigInstanceId(c.instanceId);
    setMessage("");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#d72828]" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error || "Not found"}</p>
        <Link href="/admin/category-pages" className="text-[#d72828] text-sm">
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <Link
            href="/admin/category-pages"
            className="inline-flex items-center gap-1 text-sm text-gray-500 mb-2"
          >
            <Icon icon="mdi:arrow-left" /> Category Pages
          </Link>
          <h1 className="text-2xl font-semibold">Page Builder</h1>
          <p className="text-sm text-gray-500 mt-1">
            <span className="font-medium text-gray-800">{page.categoryName}</span>
            {" · "}
            {PAGE_TYPE_LABELS[page.pageType] || page.pageType}
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/admin/category-pages/${id}/order`)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
        >
          <Icon icon="mdi:drag" className="text-lg" />
          Drag &amp; Drop Order
        </button>
      </div>

      {message && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Component screenshot gallery */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border p-4 shadow-sm sticky top-4">
            <h2 className="text-sm font-semibold mb-1">Components</h2>
            <p className="text-xs text-gray-500 mb-4">
              Select a component image to open its page. Image Carousel shows
              existing sets; use ADD NEW to create another.
            </p>
            <div className="space-y-3">
              {available.map((comp) => {
                const count = countByType[comp.type] || 0;
                const added = count > 0;
                return (
                  <button
                    key={comp.type}
                    type="button"
                    onClick={() => selectComponent(comp.type)}
                    className={`w-full text-left rounded-xl border overflow-hidden transition hover:border-[#d72828] ${
                      configType === comp.type
                        ? "border-[#d72828] ring-1 ring-[#d72828]"
                        : "border-gray-200"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={comp.preview}
                      alt={comp.label}
                      className="w-full h-24 object-cover bg-gray-100"
                    />
                    <div className="px-3 py-2 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium">{comp.label}</div>
                        <div className="text-[11px] text-gray-500 line-clamp-2">
                          {comp.description}
                        </div>
                        {comp.allowMultiple && (
                          <div className="text-[10px] text-[#d72828] mt-1">
                            Can add multiple sets
                          </div>
                        )}
                      </div>
                      {added && (
                        <span className="shrink-0 text-[10px] uppercase bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                          {comp.allowMultiple
                            ? `${count} set${count > 1 ? "s" : ""}`
                            : "Added"}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-gray-400 mt-4">
              More components will appear here later with their own screenshots
              and input forms.
            </p>
          </div>
        </div>

        {/* Config / canvas */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border p-5 shadow-sm min-h-[320px]">
            {!configType ? (
              <div className="py-16 text-center text-sm text-gray-500">
                Select a component screenshot on the left to configure inputs.
                <div className="mt-4 text-xs text-gray-400">
                  On this page: {components.length} component instance(s)
                </div>
                {components.length > 0 && (
                  <ul className="mt-4 space-y-1 text-left max-w-md mx-auto">
                    {[...components]
                      .sort((a, b) => a.order - b.order)
                      .map((c) => (
                        <li
                          key={c.instanceId}
                          className="flex items-center justify-between text-sm border rounded-lg px-3 py-2"
                        >
                          <span>
                            {instanceLabels[c.instanceId] ||
                              getComponentMeta(c.type)?.label ||
                              c.type}
                          </span>
                          <button
                            type="button"
                            className="text-[#d72828] text-xs"
                            onClick={() => openEditInstance(c)}
                          >
                            Edit
                          </button>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            ) : configType === COMPONENT_TYPES.TOP_BANNER ? (
              <TopBannerConfigForm
                categoryId={page.categoryId}
                pageType={page.pageType}
                categoryName={page.categoryName}
                onCancel={() => {
                  setConfigType(null);
                  setConfigInstanceId(null);
                }}
                onSaved={() => {
                  setMessage("Top Banner carousel saved.");
                  setConfigType(null);
                  setConfigInstanceId(null);
                  load();
                }}
              />
            ) : configType === COMPONENT_TYPES.IMAGE_CAROUSEL ? (
              <ImageCarouselConfigForm
                key={configInstanceId || "list"}
                pageId={page._id}
                instanceId={configInstanceId}
                setLabel={
                  configInstanceId
                    ? instanceLabels[configInstanceId]
                    : null
                }
                existingSets={[...components]
                  .filter((c) => c.type === COMPONENT_TYPES.IMAGE_CAROUSEL)
                  .sort((a, b) => a.order - b.order)
                  .map((c) => ({
                    instanceId: c.instanceId,
                    title: c.title || "",
                    label:
                      instanceLabels[c.instanceId] ||
                      c.title ||
                      "Image Carousel",
                  }))}
                onAddNew={addNewCarouselSet}
                onEditSet={(instanceId) => {
                  setConfigInstanceId(instanceId);
                  setMessage("");
                }}
                onDeleteSet={() => {
                  setMessage("Image Carousel set deleted.");
                  load();
                }}
                onBackToList={() => {
                  setConfigInstanceId(null);
                  load();
                }}
                onSaved={() => {
                  setMessage("Image Carousel set saved.");
                  setConfigInstanceId(null);
                  load();
                }}
              />
            ) : configType === COMPONENT_TYPES.PRODUCT_CAROUSEL ? (
              <ProductCarouselConfigForm
                key={configInstanceId || "product-list"}
                pageId={page._id}
                categoryId={page.categoryId}
                categoryName={page.categoryName}
                instanceId={configInstanceId}
                setLabel={
                  configInstanceId
                    ? instanceLabels[configInstanceId]
                    : null
                }
                existingSets={[...components]
                  .filter((c) => c.type === COMPONENT_TYPES.PRODUCT_CAROUSEL)
                  .sort((a, b) => a.order - b.order)
                  .map((c) => ({
                    instanceId: c.instanceId,
                    title: c.title || "",
                    label:
                      instanceLabels[c.instanceId] ||
                      c.title ||
                      "Product Carousel",
                  }))}
                onAddNew={addNewProductCarouselSet}
                onEditSet={(instanceId) => {
                  setConfigInstanceId(instanceId);
                  setMessage("");
                }}
                onDeleteSet={() => {
                  setMessage("Product Carousel set deleted.");
                  load();
                }}
                onBackToList={() => {
                  setConfigInstanceId(null);
                  load();
                }}
                onSaved={() => {
                  setMessage("Product Carousel set saved.");
                  setConfigInstanceId(null);
                  load();
                }}
              />
            ) : configType === COMPONENT_TYPES.BANNER_SIDE_PRODUCTS ? (
              <BannerSideProductsConfigForm
                key={configInstanceId || "bsp-list"}
                pageId={page._id}
                categoryId={page.categoryId}
                categoryName={page.categoryName}
                instanceId={configInstanceId}
                setLabel={
                  configInstanceId
                    ? instanceLabels[configInstanceId]
                    : null
                }
                existingSets={[...components]
                  .filter(
                    (c) => c.type === COMPONENT_TYPES.BANNER_SIDE_PRODUCTS
                  )
                  .sort((a, b) => a.order - b.order)
                  .map((c) => ({
                    instanceId: c.instanceId,
                    title: c.title || "",
                    label:
                      instanceLabels[c.instanceId] ||
                      c.title ||
                      "Banner + Side + Products",
                  }))}
                onAddNew={addNewBannerSideProductsSet}
                onEditSet={(instanceId) => {
                  setConfigInstanceId(instanceId);
                  setMessage("");
                }}
                onDeleteSet={() => {
                  setMessage("Banner + Side + Products set deleted.");
                  load();
                }}
                onBackToList={() => {
                  setConfigInstanceId(null);
                  load();
                }}
                onSaved={() => {
                  setMessage("Banner + Side + Products set saved.");
                  setConfigInstanceId(null);
                  load();
                }}
              />
            ) : configType === COMPONENT_TYPES.BANNER_FOUR_PRODUCTS ? (
              <BannerFourProductsConfigForm
                key={configInstanceId || "bfp-list"}
                pageId={page._id}
                categoryId={page.categoryId}
                categoryName={page.categoryName}
                instanceId={configInstanceId}
                setLabel={
                  configInstanceId
                    ? instanceLabels[configInstanceId]
                    : null
                }
                existingSets={[...components]
                  .filter(
                    (c) => c.type === COMPONENT_TYPES.BANNER_FOUR_PRODUCTS
                  )
                  .sort((a, b) => a.order - b.order)
                  .map((c) => ({
                    instanceId: c.instanceId,
                    title: c.title || "",
                    label:
                      instanceLabels[c.instanceId] ||
                      c.title ||
                      "Banner + 4 Images + Products",
                  }))}
                onAddNew={addNewBannerFourProductsSet}
                onEditSet={(instanceId) => {
                  setConfigInstanceId(instanceId);
                  setMessage("");
                }}
                onDeleteSet={() => {
                  setMessage("Banner + 4 Images + Products set deleted.");
                  load();
                }}
                onBackToList={() => {
                  setConfigInstanceId(null);
                  load();
                }}
                onSaved={() => {
                  setMessage("Banner + 4 Images + Products set saved.");
                  setConfigInstanceId(null);
                  load();
                }}
              />
            ) : (
              <p className="text-sm text-gray-500">
                Form for this component comes next. Instance:{" "}
                {configInstanceId || "—"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
