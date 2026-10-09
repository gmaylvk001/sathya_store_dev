"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import AdminPageShell from "../components/AdminPageShell";

export default function AdminPaymentOffersPage() {
  const [offers, setOffers] = useState([]);
  const [banks, setBanks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ALL"); // ALL | BANK_OFFER | EMI_OFFER
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const initialFormState = {
    bank: "",
    title: "",
    description: "",
    offerType: "BANK_OFFER",
    discountType: "PERCENTAGE",
    discountValue: 7.5,
    maxDiscountLimit: 15000,
    minOrderValue: 5000,
    cardType: "ALL",
    emiTenureMonths: 6,
    emiAnnualRate: 14,
    emiIsNoCost: false,
    isActive: true,
    priority: 80,
  };

  const [formData, setFormData] = useState(initialFormState);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const fetchOffersData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/payment-offers");
      const data = await res.json();
      if (data.success) {
        setOffers(data.data || []);
        setBanks(data.banks || []);
        if (data.banks?.length > 0 && !formData.bank) {
          setFormData((prev) => ({ ...prev, bank: data.banks[0]._id }));
        }
      }
    } catch (err) {
      console.error("Failed to load offers:", err);
      showToast("Error loading payment offers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffersData();
  }, []);

  const handleToggleStatus = async (offerId, currentStatus) => {
    try {
      const res = await fetch("/api/payment-offers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: offerId, isActive: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOffers((prev) =>
          prev.map((o) =>
            o._id === offerId ? { ...o, isActive: !currentStatus } : o
          )
        );
        showToast("Offer status updated");
      }
    } catch (err) {
      console.error("Status toggle error:", err);
      showToast("Failed to update status");
    }
  };

  const handleDeleteOffer = async (offerId) => {
    if (!window.confirm("Are you sure you want to delete this payment offer?")) {
      return;
    }
    try {
      const res = await fetch(`/api/payment-offers?id=${offerId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setOffers((prev) => prev.filter((o) => o._id !== offerId));
        showToast("Payment offer deleted successfully");
      }
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Failed to delete offer");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.bank) {
      alert("Please select a bank");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        bank: formData.bank,
        title: formData.title || formData.description,
        description: formData.description,
        offerType: formData.offerType,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue) || 0,
        maxDiscountLimit: Number(formData.maxDiscountLimit) || 0,
        minOrderValue: Number(formData.minOrderValue) || 0,
        cardType: formData.cardType,
        emiDetails: {
          tenureMonths: Number(formData.emiTenureMonths) || 0,
          annualInterestRate: Number(formData.emiAnnualRate) || 0,
          isNoCost: Boolean(formData.emiIsNoCost),
        },
        isActive: Boolean(formData.isActive),
        priority: Number(formData.priority) || 0,
      };

      const res = await fetch("/api/payment-offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setFormData(initialFormState);
        fetchOffersData();
        showToast("Payment offer created successfully!");
      } else {
        alert(data.error || "Failed to create offer");
      }
    } catch (err) {
      console.error("Create offer error:", err);
      showToast("Error creating payment offer");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered list
  const filteredOffers = offers.filter((o) => {
    if (activeTab !== "ALL" && o.offerType !== activeTab) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = (o.name || o.title || "").toLowerCase().includes(q);
      const matchDesc = (o.description || "").toLowerCase().includes(q);
      const matchBank = (o.bank?.name || o.bank?.code || "").toLowerCase().includes(q);
      return matchName || matchDesc || matchBank;
    }
    return true;
  });

  return (
    <AdminPageShell>
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-gray-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg animate-in fade-in">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Payment Offers & EMI Master
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure partner bank instant discounts, No-Cost EMI, and standard EMI schemes displayed on Product Details Pages.
          </p>
        </div>
        <button
          onClick={() => {
            if (banks.length > 0 && !formData.bank) {
              setFormData((prev) => ({ ...prev, bank: banks[0]._id }));
            }
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#d81b60] hover:bg-[#c2185b] text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <span className="text-sm leading-none">+</span> Add Payment Offer
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 my-4">
        {/* Tabs */}
        <div className="inline-flex p-1 bg-gray-100 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${activeTab === "ALL"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-500 hover:text-gray-900"
              }`}
          >
            All Offers ({offers.length})
          </button>
          <button
            onClick={() => setActiveTab("BANK_OFFER")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${activeTab === "BANK_OFFER"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-500 hover:text-gray-900"
              }`}
          >
            Bank Instant Discounts (
            {offers.filter((o) => o.offerType === "BANK_OFFER").length})
          </button>
          <button
            onClick={() => setActiveTab("EMI_OFFER")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${activeTab === "EMI_OFFER"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-500 hover:text-gray-900"
              }`}
          >
            EMI Plans ({offers.filter((o) => o.offerType === "EMI_OFFER").length})
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search bank or offer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 pl-3 pr-8 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-hidden focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-left text-xs text-gray-600">
          <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-700 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3">Bank</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Offer Title / Terms</th>
              <th className="px-4 py-3">Discount / EMI Details</th>
              <th className="px-4 py-3">Min Order</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-400">
                  Loading payment offers...
                </td>
              </tr>
            ) : filteredOffers.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-400">
                  No payment offers found. Click &quot;Add Payment Offer&quot; above to create one.
                </td>
              </tr>
            ) : (
              filteredOffers.map((offer) => {
                const bank = offer.bank || {};
                const isEmi = offer.offerType === "EMI_OFFER";
                return (
                  <tr key={offer._id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Bank */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {bank.logoUrl ? (
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-white border border-gray-200 flex items-center justify-center shrink-0">
                            <Image
                              src={bank.logoUrl}
                              alt={bank.name || "Bank"}
                              width={24}
                              height={24}
                              className="w-full h-full object-contain"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-[9px] text-gray-700">
                            {bank.code || "BANK"}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-gray-900">
                            {bank.name || bank.code || "Partner Bank"}
                          </div>
                          <div className="text-[10px] text-gray-400 uppercase">
                            {bank.code || ""}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isEmi ? (
                        offer.emiDetails?.isNoCost ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            No-Cost EMI
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            Standard EMI
                          </span>
                        )
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Bank Discount
                        </span>
                      )}
                    </td>

                    {/* Offer Title & Description */}
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-bold text-gray-900 line-clamp-1">
                        {offer.title || offer.name}
                      </div>
                      <div className="text-[11px] text-gray-500 line-clamp-1">
                        {offer.description || "-"}
                      </div>
                    </td>

                    {/* Discount or EMI Details */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isEmi ? (
                        <div>
                          <div className="font-bold text-gray-900">
                            {offer.emiDetails?.tenureMonths || 6} Months Tenure
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {offer.emiDetails?.isNoCost
                              ? "0% Interest (Subvention)"
                              : `${offer.emiDetails?.annualInterestRate || 14}% p.a. Reducing Rate`}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-bold text-[#059669]">
                            {offer.discountType === "PERCENTAGE"
                              ? `${offer.discountValue}% Instant Discount`
                              : `Flat ₹${Number(offer.discountValue).toLocaleString("en-IN")}`}
                          </div>
                          {offer.maxDiscountLimit > 0 && (
                            <div className="text-[10px] text-gray-500">
                              Capped at ₹{Number(offer.maxDiscountLimit).toLocaleString("en-IN")}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Min Order Value */}
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-700">
                      ₹{Number(offer.minOrderValue || 0).toLocaleString("en-IN")}
                    </td>

                    {/* Status Toggle */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(offer._id, offer.isActive)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${offer.isActive
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${offer.isActive ? "bg-green-600" : "bg-gray-400"
                            }`}
                        />
                        {offer.isActive ? "Active" : "Disabled"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDeleteOffer(offer._id)}
                        className="text-red-500 hover:text-red-700 font-semibold text-xs ml-2 cursor-pointer"
                        title="Delete offer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE OFFER MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-base font-extrabold text-gray-900">
                Add New Payment Offer
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              {/* Bank Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Partner Bank *
                </label>
                <select
                  required
                  value={formData.bank}
                  onChange={(e) =>
                    setFormData({ ...formData, bank: e.target.value })
                  }
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:border-blue-500"
                >
                  {banks.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Offer Type Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Offer Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, offerType: "BANK_OFFER" })
                    }
                    className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${formData.offerType === "BANK_OFFER"
                        ? "border-[#d81b60] bg-pink-50 text-[#d81b60]"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                      }`}
                  >
                    💳 Bank Instant Discount
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, offerType: "EMI_OFFER" })
                    }
                    className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${formData.offerType === "EMI_OFFER"
                        ? "border-[#d81b60] bg-pink-50 text-[#d81b60]"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                      }`}
                  >
                    📅 EMI Offer
                  </button>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Offer Title / Label *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Bank Cards 7.5% Instant Discount"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Description / Marketing Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. 7.5% Instant Discount up to ₹15,000 on HDFC Cards"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:border-blue-500"
                />
              </div>

              {/* Conditional: Bank Offer Fields */}
              {formData.offerType === "BANK_OFFER" && (
                <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Discount Type
                      </label>
                      <select
                        value={formData.discountType}
                        onChange={(e) =>
                          setFormData({ ...formData, discountType: e.target.value })
                        }
                        className="w-full text-xs p-2 bg-white border border-gray-300 rounded-lg"
                      >
                        <option value="PERCENTAGE">Percentage (%)</option>
                        <option value="FLAT">Flat Rupee (₹)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Discount Value *
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={formData.discountValue}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discountValue: e.target.value,
                          })
                        }
                        className="w-full text-xs p-2 bg-white border border-gray-300 rounded-lg"
                        placeholder="7.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Max Discount Limit (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.maxDiscountLimit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxDiscountLimit: e.target.value,
                          })
                        }
                        className="w-full text-xs p-2 bg-white border border-gray-300 rounded-lg"
                        placeholder="15000 (0 for unlimited)"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Card Type
                      </label>
                      <select
                        value={formData.cardType}
                        onChange={(e) =>
                          setFormData({ ...formData, cardType: e.target.value })
                        }
                        className="w-full text-xs p-2 bg-white border border-gray-300 rounded-lg"
                      >
                        <option value="ALL">All (Credit / Debit / NetBanking)</option>
                        <option value="CREDIT">Credit Card Only</option>
                        <option value="DEBIT">Debit Card Only</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional: EMI Offer Fields */}
              {formData.offerType === "EMI_OFFER" && (
                <div className="p-3.5 bg-purple-50/50 border border-purple-100 rounded-xl space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Tenure (Months) *
                      </label>
                      <select
                        value={formData.emiTenureMonths}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emiTenureMonths: e.target.value,
                          })
                        }
                        className="w-full text-xs p-2 bg-white border border-gray-300 rounded-lg"
                      >
                        <option value="3">3 Months</option>
                        <option value="6">6 Months</option>
                        <option value="9">9 Months</option>
                        <option value="12">12 Months</option>
                        <option value="18">18 Months</option>
                        <option value="24">24 Months</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Annual Interest Rate (% p.a.)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.emiAnnualRate}
                        disabled={formData.emiIsNoCost}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emiAnnualRate: e.target.value,
                          })
                        }
                        className={`w-full text-xs p-2 bg-white border border-gray-300 rounded-lg ${formData.emiIsNoCost ? "opacity-50" : ""
                          }`}
                        placeholder="14"
                      />
                    </div>
                  </div>

                  <div className="pt-1">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.emiIsNoCost}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emiIsNoCost: e.target.checked,
                            emiAnnualRate: e.target.checked ? 0 : 14,
                          })
                        }
                        className="w-4 h-4 text-[#d81b60] rounded border-gray-300"
                      />
                      <span className="text-xs font-bold text-gray-800">
                        Is No-Cost EMI (0% interest subsidized by merchant)
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Min Order Value */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Minimum Order Value (₹)
                </label>
                <input
                  type="number"
                  value={formData.minOrderValue}
                  onChange={(e) =>
                    setFormData({ ...formData, minOrderValue: e.target.value })
                  }
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg"
                  placeholder="5000"
                />
              </div>

              {/* Priority & Status */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Display Priority (0 - 100)
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-full text-xs p-2 border border-gray-300 rounded-lg"
                    placeholder="80"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="w-4 h-4 text-green-600 rounded"
                    />
                    <span className="text-xs font-bold text-gray-800">
                      Active immediately
                    </span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#d81b60] hover:bg-[#c2185b] rounded-lg transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Create Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
