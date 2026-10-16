'use client';

import React from 'react';
import PropTypes from 'prop-types';
import { MdSecurity } from 'react-icons/md';
import ErrorBoundary from '@/components/common/ErrorBoundary';

/**
 * Inner Price Details Card
 * Displays order pricing summary, discounts, and Total Amount Payable.
 */
function CartPriceDetailsInner({
  totalMRP = 0,
  totalDiscounts = 0,
  finalTotal = 0,
  deliveryFee = 0,
  onCheckout = null,
  isCheckoutDisabled = false,
  className = '',
}) {
  const safeMRP = typeof totalMRP === 'number' && !isNaN(totalMRP) ? totalMRP : 0;
  const safeDiscounts = typeof totalDiscounts === 'number' && !isNaN(totalDiscounts) ? totalDiscounts : 0;
  const safeFinalTotal = typeof finalTotal === 'number' && !isNaN(finalTotal) ? finalTotal : 0;
  const safeDeliveryFee = typeof deliveryFee === 'number' && !isNaN(deliveryFee) ? deliveryFee : 0;

  return (
    <div
      data-testid="order-price-details-card"
      className={`bg-white rounded-xl border border-gray-200/80 p-5 shadow-2xs w-full ${className}`}
    >
      <h2 className="text-gray-500 font-bold text-xs sm:text-sm border-b border-gray-200/80 pb-3.5 uppercase tracking-wider">
        Order Price Details
      </h2>

      <div className="flex flex-col gap-3.5 py-4 text-xs sm:text-sm text-gray-800">
        {/* Total MRP */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total MRP (incl. of all taxes)</span>
          <span className="font-semibold text-gray-900">
            ₹{Number(safeMRP).toLocaleString('en-IN')}
          </span>
        </div>

        {/* Delivery Charges */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Delivery Charges</span>
          {safeDeliveryFee === 0 ? (
            <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs">
              FREE
            </span>
          ) : (
            <span className="font-semibold text-gray-900">
              ₹{Number(safeDeliveryFee).toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Bag Savings & Discounts */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Bag Savings & Discounts</span>
          <span className="font-semibold text-emerald-600">
            {safeDiscounts > 0 ? `-₹${Number(safeDiscounts).toLocaleString('en-IN')}` : '₹0'}
          </span>
        </div>

        {/* Total Amount Payable */}
        <div className="border-t border-dashed border-gray-200 pt-3.5 flex justify-between items-center text-base font-extrabold text-gray-900">
          <span>Total Amount Payable</span>
          <span
            data-testid="total-amount-payable-value"
            className="text-lg sm:text-xl font-black text-[#d72828]"
          >
            ₹{Number(safeFinalTotal).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Savings Callout Banner */}
      {safeDiscounts > 0 && (
        <div className="bg-emerald-50 text-emerald-800 font-semibold text-xs sm:text-sm p-3 rounded-lg border border-emerald-200/80 text-center mb-4 flex items-center justify-center gap-1.5">
          <svg
            className="w-4 h-4 text-emerald-600 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>You will save ₹{Number(safeDiscounts).toLocaleString('en-IN')} on this order</span>
        </div>
      )}

      {/* Sticky/Prominent Place Order CTA Button */}
      <button
        type="button"
        onClick={() => {
          if (typeof onCheckout === 'function') {
            onCheckout();
          }
        }}
        disabled={isCheckoutDisabled}
        aria-label="Proceed to Checkout"
        className="w-full bg-[#d72828] hover:bg-[#b91c1c] active:bg-[#991b1b] text-white font-extrabold py-3.5 rounded-lg uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-200 text-sm text-center block cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Proceed to Checkout →
      </button>

      {/* Security Guarantee */}
      <div className="border-t border-gray-100 pt-4 mt-4 flex items-center gap-3 text-gray-500 text-xs leading-tight">
        <MdSecurity className="text-3xl text-gray-400 flex-shrink-0" />
        <span>Safe and 100% secure payments. Guaranteed authentic products & easy returns.</span>
      </div>
    </div>
  );
}

CartPriceDetailsInner.propTypes = {
  totalMRP: PropTypes.number,
  totalDiscounts: PropTypes.number,
  finalTotal: PropTypes.number,
  deliveryFee: PropTypes.number,
  onCheckout: PropTypes.func,
  isCheckoutDisabled: PropTypes.bool,
  className: PropTypes.string,
};

/**
 * Public CartPriceDetails component wrapped in ErrorBoundary for strict isolation
 */
export default function CartPriceDetails(props) {
  return (
    <ErrorBoundary
      fallback={
        <div className="bg-white rounded-xl border border-red-200 p-5 text-center text-sm text-gray-700">
          <p className="font-bold text-red-600 mb-2">Price details temporarily unavailable</p>
          <button
            type="button"
            onClick={props.onCheckout}
            className="w-full bg-[#d72828] text-white py-3 rounded-lg font-bold"
          >
            Proceed to Checkout →
          </button>
        </div>
      }
    >
      <CartPriceDetailsInner {...props} />
    </ErrorBoundary>
  );
}
