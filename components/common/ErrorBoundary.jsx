'use client';

import React from 'react';
import PropTypes from 'prop-types';

/**
 * Resilient Error Boundary
 * Catches rendering exceptions in isolated subtrees and renders a graceful fallback (defaulting to null)
 * to prevent breaking the overall page layout or checkout funnel.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (this.props.onError && typeof this.props.onError === 'function') {
      try {
        this.props.onError(error, errorInfo);
      } catch {}
    } else {
      console.warn('[ErrorBoundary] Caught subtree error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback !== undefined ? this.props.fallback : null;
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
  fallback: PropTypes.node,
  onError: PropTypes.func,
};
