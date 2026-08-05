"use client";

import React, { useEffect, useState, useMemo } from "react";
import { FaPlus, FaMinus, FaEdit } from "react-icons/fa";
import { Icon } from "@iconify/react";
import DateRangePicker from "@/components/DateRangePicker";
import dynamic from "next/dynamic";
import Link from "next/link";
import { components } from "react-select";
import { Check } from "react-feather";
const Select = dynamic(() => import("react-select"), { ssr: false });

// ✅ Custom Option with tick symbol
const CustomOption = (props) => (
  <components.Option {...props}>
    <div className="flex items-center justify-between">
      <span>{props.label}</span>
      {props.isSelected && <Check size={16} className="text-green-600" />}
    </div>
  </components.Option>
);
export default function CategoryComponent() {
  const [categories, setCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [filters, setFilters] = useState([]);
  const [showUpdateAlert, setShowUpdateAlert] = useState(false);
  const [updateAlertMessage, setUpdateAlertMessage] = useState("");
  const [updateErrorMessage, setUpdateErrorMessage] = useState("");
  const [updateImageError, setUpdateImageError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState(""); // "active" | "inactive" | ""
  const [searchQuery, setSearchQuery] = useState("");
  const [imageError, setImageError] = useState("");
  const [newCategory, setNewCategory] = useState({
    category_name: "",
    meta_title: "",
    meta_description: "",
    meta_keyword: "",
    parentid: "none",
    status: "Active",
    image: null,
    navImage: null,
    selectedFilters: [],
    content: "", 
    icon_image: null,
  });
  const [categoryToUpdate, setCategoryToUpdate] = useState({
    _id: "",
    category_name: "",
    meta_title: "",
    meta_description: "",
    meta_keyword: "",
    parentid: "none",
    status: "Active",
    image: null,
    existingImage: null,
    navImage: null,
    existingNavImage: null,
    selectedFilters: [],
    existingFilters: [],
    content: "", 
    existingContent: "", 
    icon_image: null,
    existingIconImage: null,
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null,
  });

  const clearDateFilter = () => {
    setDateFilter({
      startDate: null,
      endDate: null,
    });
    setCurrentPage(0);
  };

  const [imagePreview, setImagePreview] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 20;

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories/get");
      const data = await response.json();
      setCategories(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setIsLoading(false);
    }
  };

  // Fetch filters from API - same as product page
  const fetchFilter = async () => {
    try {
      const response = await fetch("/api/filter");
      const result = await response.json();

      if (result.error) {
        console.error("Error fetching filters:", result.error);
        return;
      }

      const data = result.data;

      // Group filters by filter_group name
      const groupedFilters = {};

      data.forEach((filter) => {
        const groupName = filter.filter_group_name || "Other Filters";
        if (!groupedFilters[groupName]) groupedFilters[groupName] = [];

        groupedFilters[groupName].push({
          value: filter._id,
          label: filter.filter_name,
          groupLabel: groupName, // Add groupLabel for search
        });
      });

      // Convert grouped data into format React-Select can understand
      const filterOptions = Object.entries(groupedFilters).map(
        ([group, options]) => ({
          label: group,
          options,
        }),
      );

      setFilters(filterOptions);
    } catch (error) {
      console.error("Error fetching filters:", error.message);
    }
  };

  // Add this function after your fetchFilter function
  const fetchCategoryFilters = async (categoryId) => {
    try {
      console.log("Fetching filters for category:", categoryId);

      const response = await fetch(
        `/api/categories/filters?categoryId=${categoryId}`,
      );
      const result = await response.json();

      console.log("API Response:", result);

      let selectedFilterObjects = [];

      if (result.success && result.filters && result.filters.length > 0) {
        console.log("Raw filter IDs from DB:", result.filters);

        // Flatten all filter options from grouped filters
        const allFilterOptions = filters.flatMap(
          (group) => group.options || [],
        );
        console.log("Available filter options:", allFilterOptions);

        // Find the filter objects that match the filter IDs from database
        selectedFilterObjects = allFilterOptions.filter((option) =>
          result.filters.includes(option.value),
        );

        console.log("Selected filter objects:", selectedFilterObjects);
      } else {
        console.log("No filters found for this category");
      }

      return selectedFilterObjects;
    } catch (error) {
      console.error("Error fetching category filters:", error);
      return [];
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchFilter();
  }, []);

  // Export categories to Excel
  const exportCategories = async () => {
    const params = new URLSearchParams();

    if (searchQuery) params.append("search", searchQuery);
    if (statusFilter) params.append("status", statusFilter);

    if (dateFilter.startDate && dateFilter.endDate) {
      params.append("startDate", dateFilter.startDate);
      params.append("endDate", dateFilter.endDate);
    }

    const res = await fetch(`/api/categories/export?${params.toString()}`);
    const blob = await res.blob();

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "categories.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // When opening update modal, populate existing filters
  // When opening update modal, populate existing filters
  const handleEditClick = async (category) => {
    try {
      console.log(
        "Opening edit modal for category:",
        category._id,
        category.category_name,
      );
      console.log("category object:", category);
      console.log("navImage value:", category.navImage);
      console.log("Full category data:", JSON.stringify(category, null, 2));

      // First set the basic category data
      setCategoryToUpdate({
        ...category,
        existingImage: category.image?.replace(/^https?:\/\/[^/]+/, "") || null,
        existingNavImage: category.navImage?.replace(/^https?:\/\/[^/]+/, "") || null,
        selectedFilters: [], // Initialize as empty
        existingFilters: [],
        content: category.content || "", 
        existingContent: category.content || "", 
        existingIconImage: category.icon_url || null,
      });

      setIsUpdateModalOpen(true);

      // Then fetch and set the filters asynchronously
      const existingFilters = await fetchCategoryFilters(category._id);
      console.log("Setting filters for update:", existingFilters);

      setCategoryToUpdate((prev) => ({
        ...prev,
        selectedFilters: existingFilters,
        existingFilters: existingFilters,
      }));
    } catch (error) {
      console.error("Error in handleEditClick:", error);
      // Ensure modal opens even if filters fail
      if (!isUpdateModalOpen) {
        setIsUpdateModalOpen(true);
      }
    }
  };

  // Handle filter selection for new category
  const handleFilterChange = (selectedOptions) => {
    setNewCategory({ ...newCategory, selectedFilters: selectedOptions });
  };

  // Handle filter selection for update category
  const handleUpdateFilterChange = (selectedOptions) => {
    setCategoryToUpdate({
      ...categoryToUpdate,
      selectedFilters: selectedOptions,
    });
  };

  // Toggle subcategories
  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Handle input change
  const handleInputChange = (e) => {
    setNewCategory({ ...newCategory, [e.target.name]: e.target.value });
  };

  // Handle image upload
  // const handleImageChange = (e) => {
  //   const file = e.target.files[0];
  //   if (file) {
  //     setNewCategory((prev) => ({ ...prev, image: file }));
  //     setImagePreview(URL.createObjectURL(file));
  //   }
  // };
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    setImageError("");

    // AFTER (Optional):
    if (!file) {
      // No file selected - this is allowed now
      setNewCategory((prev) => ({ ...prev, image: null }));
      setImagePreview(null);
      return;
    }

    // Check image dimensions
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = function () {
      if (this.width !== 260 || this.height !== 240) {
        setImageError("Image must be exactly 260px width and 240px height");
        setNewCategory((prev) => ({ ...prev, image: null }));
        setImagePreview(null);
      } else {
        setNewCategory((prev) => ({ ...prev, image: file }));
        setImagePreview(img.src);
      }
    };

    img.onerror = function () {
      setImageError("Invalid image file");
    };
  };
  // Check if category name already exists
  const isCategoryNameExists = (categoryName) => {
    return categories.some(
      (category) =>
        category.category_name.toLowerCase() === categoryName.toLowerCase(),
    );
  };

  // Handle category submission
  const handleAddCategory = async (e) => {
    e.preventDefault();

    // Reset error messages
    setImageError("");
    setErrorMessage("");

    // Check if image is provided
    // if (!newCategory.image) {
    //   setImageError("Image is required and must be 260px width and 240px height");
    //   return;
    // }

    // AFTER (Optional - removed the required check):

    // Trim and check if category name is empty
    const trimmedCategoryName = newCategory.category_name.trim();
    if (!trimmedCategoryName) {
      setErrorMessage("Category name cannot be empty!");
      return;
    }

    // Check if category name already exists
    if (isCategoryNameExists(trimmedCategoryName)) {
      setErrorMessage("Category name already exists!");
      return;
    }

    const formData = new FormData();
    formData.append("category_name", trimmedCategoryName);
    formData.append("parentid", newCategory.parentid);
    formData.append("status", newCategory.status);
    formData.append("image", newCategory.image);
    formData.append("navImage", newCategory.navImage);
    formData.append("meta_title", newCategory.meta_title);
    formData.append("meta_description", newCategory.meta_description);
    formData.append("meta_keyword", newCategory.meta_keyword);
    formData.append("icon_image", newCategory.icon_image);

    // Send selected filters as JSON string
    formData.append(
      "selectedFilters",
      JSON.stringify(newCategory.selectedFilters.map((filter) => filter.value)),
    );

    formData.append("content", newCategory.content);

    // Only append image if provided
    if (newCategory.image) {
      formData.append("image", newCategory.image);
    }

    if (newCategory.navImage) {
      formData.append("navImage", newCategory.navImage);
    }

    try {
      const response = await fetch("/api/categories/add", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        setIsModalOpen(false);
        fetchCategories();

        // Reset form
        setNewCategory({
          category_name: "",
          meta_title: "",
          meta_description: "",
          meta_keyword: "",
          parentid: "none",
          status: "Active",
          image: null,
          navImage: null,
          content: "",
        });
        setImagePreview(null);

        // Show success alert (if you still want this as an alert)
        setAlertMessage("Category added successfully!");
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
        // Small delay optional
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        setErrorMessage(result.error || "Failed to add category");
        console.error("Error adding category:", result.error);
      }
    } catch (error) {
      setErrorMessage("Failed to add category. Please try again.");
      console.error("Error:", error);
    }
  };

  // Handle category update
  // const handleUpdateCategory = async (e) => {
  //   e.preventDefault();

  //   const formData = new FormData();
  //   formData.append("_id", categoryToUpdate._id);
  //   formData.append("category_name", categoryToUpdate.category_name);
  //   formData.append("parentid", categoryToUpdate.parentid);
  //   formData.append("status", categoryToUpdate.status);
  //   // if (categoryToUpdate.image instanceof File) {
  //   //   formData.append("image", categoryToUpdate.image);
  //   // }
  //    if (categoryToUpdate.image instanceof File) {
  //   const img = new Image();
  //   img.src = URL.createObjectURL(categoryToUpdate.image);

  //   await new Promise((resolve) => {
  //     img.onload = function() {
  //       if (this.width !== 96 || this.height !== 89) {
  //         setAlertMessage("Image must be exactly 96px width and 89px height");
  //         setShowAlert(true);
  //         setTimeout(() => setShowAlert(false), 3000);
  //         resolve(false);
  //       } else {
  //         resolve(true);
  //       }
  //     };

  //     img.onerror = function() {
  //       setAlertMessage("Invalid image file");
  //       setShowAlert(true);
  //       setTimeout(() => setShowAlert(false), 3000);
  //       resolve(false);
  //     };
  //   });
  // }

  //   formData.append("existingImage", categoryToUpdate.existingImage || "");

  //   try {
  //     const response = await fetch("/api/categories/update", {
  //       method: "PUT",
  //       body: formData,
  //     });

  //     const result = await response.json();
  //     if (response.ok) {
  //       setIsUpdateModalOpen(false);
  //       fetchCategories();
  //       setAlertMessage("Category updated successfully!");
  //       setShowAlert(true);
  //       setTimeout(() => setShowAlert(false), 3000);
  //     } else {
  //       console.error("Error updating category:", result.error);
  //       setAlertMessage(result.error || "Failed to update category");
  //       setShowAlert(true);
  //       setTimeout(() => setShowAlert(false), 3000);
  //     }
  //   } catch (error) {
  //     console.error("Error:", error);
  //     setAlertMessage("Failed to update category");
  //     setShowAlert(true);
  //     setTimeout(() => setShowAlert(false), 3000);
  //   }
  // };
  const handleUpdateCategory = async (e) => {
    e.preventDefault();

    // Reset error messages
    setUpdateImageError("");
    setUpdateErrorMessage("");

    // Trim and check if category name is empty
    const trimmedCategoryName = categoryToUpdate.category_name.trim();
    if (!trimmedCategoryName) {
      setErrorMessage("Category name cannot be empty!");
      return;
    }

    // Check if category name already exists
    // if (isCategoryNameExists(trimmedCategoryName)) {
    //   setErrorMessage("Category name already exists!");
    //   return;
    // }
    const formData = new FormData();
    formData.append("_id", categoryToUpdate._id);
    formData.append("category_name", trimmedCategoryName);
    formData.append("parentid", categoryToUpdate.parentid);
    formData.append("status", categoryToUpdate.status);
    formData.append("meta_title", categoryToUpdate.meta_title);
    formData.append("meta_description", categoryToUpdate.meta_description);
    formData.append("meta_keyword", categoryToUpdate.meta_keyword);
    if (categoryToUpdate.icon_image instanceof File) {
    formData.append("icon_image", categoryToUpdate.icon_image);
   }
   formData.append("existingIconImage", categoryToUpdate.existingIconImage || "");

    // Send selected filters as JSON string
    formData.append(
      "selectedFilters",
      JSON.stringify(
        categoryToUpdate.selectedFilters.map((filter) => filter.value),
      ),
    );

    formData.append("content", categoryToUpdate.content);

    // Check if a new image is being uploaded
    if (categoryToUpdate.image instanceof File) {
      const img = new Image();
      img.src = URL.createObjectURL(categoryToUpdate.image);

      const isValid = await new Promise((resolve) => {
        img.onload = function () {
          if (this.width !== 260 || this.height !== 240) {
            setUpdateImageError(
              "Image must be exactly 260px width and 240px height",
            );
            resolve(false);
          } else {
            resolve(true);
          }
        };

        img.onerror = function () {
          setUpdateImageError("Invalid image file");
          resolve(false);
        };
      });

      if (!isValid) return; // Block submission if image is invalid

      formData.append("image", categoryToUpdate.image);
    }

    formData.append("existingImage", categoryToUpdate.existingImage || "");

    // Check if a new nav image is being uploaded
    if (categoryToUpdate.navImage instanceof File) {
      formData.append("navImage", categoryToUpdate.navImage);
    }
    formData.append(
      "existingNavImage",
      categoryToUpdate.existingNavImage || "",
    );

    try {
      const response = await fetch("/api/categories/update", {
        method: "PUT",
        body: formData,
      });

      const result = await response.json();
      // if (response.ok) {
      //   setIsUpdateModalOpen(false);
      //   fetchCategories();
      //   setAlertMessage("Category updated successfully!");
      //   setShowAlert(true);
      //   setTimeout(() => setShowAlert(false), 3000);
      // } else {
      //   setUpdateErrorMessage(result.error || "Failed to update category");
      //   console.error("Error updating category:", result.error);
      // }
      if (!response.ok) {
        // Handle API errors (including duplicate category)
        setUpdateErrorMessage(result.error || "Failed to update category");
        return;
      }

      // Success case
      setIsUpdateModalOpen(false);
      fetchCategories();
      setAlertMessage("Category updated successfully!");
      setShowAlert(true);
      setTimeout(() => {
  setShowAlert(false);
  window.location.reload(); 
}, 1000);
    } catch (error) {
      setUpdateErrorMessage("Failed to update category. Please try again.");
    }
  };
  const handleUpdateImageChange = (e) => {
    const file = e.target.files[0];
    setUpdateImageError("");

    if (!file) {
      // If no file is selected, keep the existing image
      setCategoryToUpdate((prev) => ({ ...prev, image: null }));
      return;
    }

    // Check image dimensions
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = function () {
      if (this.width !== 260 || this.height !== 240) {
        setUpdateImageError(
          "Image must be exactly 260px width and 240px height",
        );
        setCategoryToUpdate((prev) => ({ ...prev, image: null }));
      } else {
        setCategoryToUpdate((prev) => ({ ...prev, image: file }));
      }
    };

    img.onerror = function () {
      setUpdateImageError("Invalid image file");
    };
  };
  const handleNavImageChange = async (e) => {
    const file = e.target.files[0];
    // You can add dimension checks here if needed
    setNewCategory((prev) => ({ ...prev, navImage: file }));
  };
  const handleUpdateNavImageChange = async (e) => {
    const file = e.target.files[0];
    setCategoryToUpdate((prev) => ({ ...prev, navImage: file }));
  };
  // Handle category deletion
  const handleDeleteCategory = async (categoryId) => {
    try {
      const response = await fetch("/api/categories/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId }),
      });

      const result = await response.json();
      if (response.ok) {
        fetchCategories();
        setAlertMessage("Category deleted successfully!");
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      } else {
        console.error("Error:", result.error);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setShowConfirmationModal(false);
      setCategoryToDelete(null);
    }
  };

  // Build category tree
  const buildCategoryTree = (categories, parentId = "none") => {
    return categories
      .filter((category) => category.parentid === parentId)
      .map((category) => ({
        ...category,
        children: buildCategoryTree(categories, category._id),
      }));
  };

  // Flatten category tree for pagination
  const flattenCategories = (
    categories,
    parentId = "none",
    level = 0,
    result = [],
  ) => {
    categories
      .filter((category) => category.parentid === parentId)
      .forEach((category) => {
        result.push({ ...category, level });
        if (expandedCategories[category._id]) {
          flattenCategories(categories, category._id, level + 1, result);
        }
      });
    return result;
  };

  useEffect(() => {
    if (searchQuery.trim() !== "") {
      // Find all categories that match the search
      const allCategories = flattenAllCategories(categories);
      const matchedCategories = allCategories.filter((category) =>
        category.category_name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
      );

      // Get all parent IDs of matched categories
      const parentIdsToExpand = new Set();
      matchedCategories.forEach((category) => {
        // Function to get all parent IDs of a category
        const getParentIds = (catId) => {
          const parentIds = [];
          let current = categories.find((c) => c._id === catId);
          while (current && current.parentid !== "none") {
            parentIds.push(current.parentid);
            current = categories.find((c) => c._id === current.parentid);
          }
          return parentIds;
        };

        getParentIds(category._id).forEach((parentId) =>
          parentIdsToExpand.add(parentId),
        );
      });

      // Expand all parent categories
      const newExpanded = { ...expandedCategories };
      parentIdsToExpand.forEach((parentId) => {
        newExpanded[parentId] = true;
      });
      setExpandedCategories(newExpanded);
    }
  }, [searchQuery, categories]);

  // Render category tree for dropdown
  const renderCategoryTree = (categories, level = 0) => {
    return categories.map((category) => (
      <div key={category._id} className="ml-4">
        <div
          className={`p-2 cursor-pointer ${
            newCategory.parentid === category._id ||
            categoryToUpdate.parentid === category._id
              ? "text-red-500 font-semibold"
              : "text-black"
          }`}
          onClick={() => {
            if (isUpdateModalOpen) {
              setCategoryToUpdate({
                ...categoryToUpdate,
                parentid: category._id,
              });
            } else {
              setNewCategory({ ...newCategory, parentid: category._id });
            }
          }}
        >
          {category.children.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleCategory(category._id);
              }}
              className="mr-2 text-red-500"
            >
              {expandedCategories[category._id] ? <FaMinus /> : <FaPlus />}
            </button>
          )}
          <span
            className={`font-semibold ${
              newCategory.parentid === category._id ||
              categoryToUpdate.parentid === category._id
                ? "text-red-500"
                : ""
            }`}
          >
            {category.category_name}
          </span>
        </div>
        {expandedCategories[category._id] &&
          renderCategoryTree(category.children, level + 1)}
      </div>
    ));
  };

  const getParentCategoryName = (parentId) => {
    if (parentId === "none") return "No Parent";
    const parentCategory = categories.find(
      (category) => category._id === parentId,
    );
    return parentCategory ? parentCategory.category_name : "Unknown";
  };

  const flattenAllCategories = (
    categories,
    parentId = "none",
    level = 0,
    result = [],
  ) => {
    categories
      .filter((category) => category.parentid === parentId)
      .forEach((category) => {
        result.push({ ...category, level });
        flattenAllCategories(categories, category._id, level + 1, result);
      });
    return result;
  };

  // Filter categories based on search, status, and date
  const filteredCategories = useMemo(() => {
    const flattened = flattenCategories(categories);
    return flattened.filter((category) => {
      // Search filter
      const matchesSearch =
        category.category_name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (category.category_slug &&
          category.category_slug
            .toLowerCase()
            .includes(searchQuery.toLowerCase()));

      // Status filter
      const matchesStatus =
        statusFilter === "" ||
        category.status.toLowerCase() === statusFilter.toLowerCase();

      // Date filter
      let matchesDate = true;
      if (dateFilter.startDate && dateFilter.endDate && category.createdAt) {
        const categoryDate = new Date(category.createdAt);
        const startDate = new Date(dateFilter.startDate);
        const endDate = new Date(dateFilter.endDate);
        endDate.setHours(23, 59, 59, 999); // Include the entire end day

        matchesDate = categoryDate >= startDate && categoryDate <= endDate;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [
    categories,
    searchQuery,
    statusFilter,
    dateFilter.startDate,
    dateFilter.endDate,
    expandedCategories,
  ]);

  // Handle date change
  const handleDateChange = ({ startDate, endDate }) => {
    setDateFilter({ startDate, endDate });
    setCurrentPage(0);
  };

  // Pagination logic
  const pageCount = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = filteredCategories.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage,
  );

  // Handle page change
  const paginate = (pageIndex) => {
    if (pageIndex >= 0 && pageIndex < pageCount) {
      setCurrentPage(pageIndex);
    }
  };

  // Reset current page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, statusFilter, dateFilter]);

  // Render category rows
  const renderCategoryRows = () => {
    if (paginatedCategories.length === 0) {
      return (
        <tr>
          <td colSpan="6" className="text-center p-4">
            No categories found
          </td>
        </tr>
      );
    }

    return paginatedCategories.map((category) => (
      <tr key={category._id} className="text-center border-b">
        <td className="flex items-center p-2">
          {categories.some((cat) => cat.parentid === category._id) && (
            <button
              type="button"
              onClick={() => toggleCategory(category._id)}
              className="mr-2 text-red-500"
              aria-label="Expand/Collapse"
            >
              {expandedCategories[category._id] ? <FaMinus /> : <FaPlus />}
            </button>
          )}
          <span
            style={{ paddingLeft: `${category.level * 20}px` }}
            className="font-medium"
          >
            {category.category_name}
          </span>
        </td>
        <td>
          <span className="text-primary-600">
            {category.category_slug || "N/A"}
          </span>
        </td>
        <td>{getParentCategoryName(category.parentid)}</td>
        <td>
          {category.image ? (
            <img
              src={category.image}
              alt="Category"
              className="h-8 mx-auto rounded-lg"
            />
          ) : (
            "No Image"
          )}
        </td>
        <td>
          {category.status === "Active" ? (
            <span className="bg-green-100 text-green-600 px-6 py-1.5 rounded-full font-medium text-sm">
              Active
            </span>
          ) : (
            <span className="bg-red-100 text-red-600 px-6 py-1.5 rounded-full font-medium text-sm">
              Inactive
            </span>
          )}
        </td>
        <td>
          <div className="flex items-center gap-2 justify-center">
            <button
              onClick={() => handleEditClick(category)}
              className="w-7 h-7 bg-red-100 text-red-600 rounded-full inline-flex items-center justify-center"
              title="Edit"
            >
              <FaEdit className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                setCategoryToDelete(category._id);
                setShowConfirmationModal(true);
              }}
              className="w-7 h-7 bg-pink-100 text-pink-600 rounded-full inline-flex items-center justify-center"
              title="Delete"
            >
              <Icon icon="mingcute:delete-2-line" />
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <div className="container mx-auto">
      {/* Alert Message */}
      {showAlert && (
        <div className="bg-green-500 text-white px-4 py-2 rounded-md mb-4 mt-5">
          {alertMessage}
        </div>
      )}

      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold">Category List</h2>
      </div>

      {isLoading ? (
        <p>Loading categories...</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-5 mb-5 overflow-x-auto">
          <div className="flex items-center justify-between mb-5">
            {/* LEFT SIDE */}
            <Link
              href="/admin/category/navcat"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition duration-150"
            >
              NavMenu
            </Link>

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition duration-150"
              >
                + Add Category
              </button>

              <button
                onClick={() => {
                  const params = new URLSearchParams({
                    search: searchQuery,
                    status: statusFilter,
                    startDate: dateFilter.startDate || "",
                    endDate: dateFilter.endDate || "",
                  });

                  window.location.href = `/api/categories/export?${params.toString()}`;
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Export Excel
              </button>
            </div>
          </div>
          {/* Search and Filter Section */}
          {/* Search and Filter Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end mb-4">
            {/* Search Input */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 2.5a7.5 7.5 0 010 15z"
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search Category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-md w-full text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Date Range Picker */}
            <div className="w-full col-span-1 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <div className="relative w-full max-w-sm">
                <DateRangePicker onDateChange={handleDateChange} />
                {/* {dateFilter.startDate && dateFilter.endDate && (
        <button 
          onClick={clearDateFilter}
          className="mt-2 text-sm text-red-600 hover:text-red-800"
        >
          Clear date filter
        </button>
      )} */}
              </div>
            </div>
          </div>

          {/* Categories Table */}
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2">Category Name</th>
                  <th className="p-2">Category Slug</th>
                  <th className="p-2">Parent</th>
                  <th className="p-2">Image</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>{renderCategoryRows()}</tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6 flex-wrap gap-3">
            <div className="text-sm text-gray-600">
              Showing{" "}
              {filteredCategories.length === 0
                ? 0
                : currentPage * itemsPerPage + 1}{" "}
              to{" "}
              {Math.min(
                (currentPage + 1) * itemsPerPage,
                filteredCategories.length,
              )}{" "}
              of {filteredCategories.length} entries
            </div>

            <div className="pagination flex items-center space-x-1">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 0}
                className={`px-3 py-1.5 border border-gray-300 rounded-md ${
                  currentPage === 0
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-black bg-white hover:bg-gray-100"
                }`}
                aria-label="Previous page"
              >
                «
              </button>

              {Array.from({ length: pageCount }, (_, i) => (
                <button
                  key={i}
                  onClick={() => paginate(i)}
                  className={`px-3 py-1.5 border border-gray-300 rounded-md ${
                    currentPage === i
                      ? "bg-red-500 text-white"
                      : "text-black bg-white hover:bg-gray-100"
                  }`}
                  aria-label={`Page ${i + 1}`}
                  aria-current={currentPage === i ? "page" : undefined}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === pageCount - 1 || pageCount === 0}
                className={`px-3 py-1.5 border border-gray-300 rounded-md ${
                  currentPage === pageCount - 1 || pageCount === 0
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-black bg-white hover:bg-gray-100"
                }`}
                aria-label="Next page"
              >
                »
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b-2 border-gray-300 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Add Category
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setNewCategory({
                    category_name: "",
                    meta_title: "",
                    meta_description: "",
                    meta_keyword: "",
                    parentid: "none",
                    status: "Active",
                    image: null,
                    navImage: null,
                    content: "",
                  });
                }}
                className="text-gray-400 hover:text-gray-700 focus:outline-none"
                aria-label="Close modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="px-6 py-6 overflow-y-auto flex-grow">
              <form onSubmit={handleAddCategory} className="space-y-5">
                {/* ALERT MESSAGE – moved here */}
                {/* {showAlert && (
                <div className="bg-green-500 text-white px-4 py-2 rounded-md">
                  {alertMessage}
                </div>
              )} */}

                <div>
                  <label
                    htmlFor="category_name"
                    className="block mb-1 text-sm font-semibold text-gray-700"
                  >
                    Category Name
                  </label>
                  <input
                    name="category_name"
                    value={newCategory.category_name}
                    onChange={handleInputChange}
                    id="category_name"
                    className="w-full rounded-md border p-2 focus:ring-2 focus:ring-red-400"
                    placeholder="Enter Category Name"
                    required
                  />
                  {errorMessage && (
                    <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="meta_title"
                    className="block mb-1 text-sm font-semibold text-gray-700"
                  >
                    Meta Title
                  </label>
                  <input
                    name="meta_title"
                    value={newCategory.meta_title}
                    onChange={handleInputChange}
                    id="meta_title"
                    className="w-full rounded-md border p-2 focus:ring-2 focus:ring-red-400"
                    placeholder="Enter Meta Title"
                    required
                  />

                  {errorMessage && (
                    <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="meta_keyword"
                    className="block mb-1 text-sm font-semibold text-gray-700"
                  >
                    Meta Keyword
                  </label>

                  <textarea
                    name="meta_keyword"
                    value={newCategory.meta_keyword || ""}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                    rows="2"
                  />

                  {errorMessage && (
                    <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="meta_description"
                    className="block mb-1 text-sm font-semibold text-gray-700"
                  >
                    Meta Description
                  </label>
                  <textarea
                    name="meta_description"
                    value={newCategory.meta_description || ""}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                    rows="2"
                  />
                  {errorMessage && (
                    <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-700">
                    Parent Category
                  </label>
                  <div className="border border-gray-300 rounded-md max-h-40 overflow-y-auto p-2">
                    <div>
                      <div
                        className={`p-2 cursor-pointer rounded-md font-semibold ${
                          newCategory.parentid === "none"
                            ? "bg-red-100 text-red-600"
                            : "text-gray-800 hover:bg-gray-100"
                        }`}
                        onClick={() =>
                          setNewCategory({ ...newCategory, parentid: "none" })
                        }
                      >
                        Category
                      </div>
                      {renderCategoryTree(buildCategoryTree(categories))}
                    </div>
                  </div>
                </div>
                {newCategory.parentid != "none" && (
                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-700">
                    Upload Image (260px X 240px) - Optional
                  </label>
                  <input
                    type="file"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-600
                    file:mr-3 file:py-1 file:px-3
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-red-50 file:text-red-700
                    hover:file:bg-red-100"
                  />
                  {imageError && (
                    <p className="text-red-500 text-sm mt-1">{imageError}</p>
                  )}
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mt-3 h-16 rounded-md object-contain mx-auto"
                    />
                  )}
                </div>
                )}
                {newCategory.parentid == "none" && (
                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-700">
                    Upload Navigation Image (210px X 370px)
                  </label>
                  <input
                    type="file"
                    onChange={handleNavImageChange}
                    className="block w-full text-sm text-gray-600
                    file:mr-3 file:py-1 file:px-3
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-red-50 file:text-red-700
                    hover:file:bg-red-100"
                  />
                </div>
                )}
                {/* Filter Selection for Update - EXACTLY LIKE PRODUCT PAGE */}
                <div className="border p-4 rounded">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filters
                  </label>
                  <Select
                    options={filters}
                    isMulti
                    hideSelectedOptions={false}
                    closeMenuOnSelect={false}
                    components={{ Option: CustomOption }}
                    value={newCategory.selectedFilters}
                    onChange={handleFilterChange}
                    placeholder="Select filters..."
                    filterOption={(option, inputValue) => {
                      // option.label is filter name, option.data.groupLabel is group name
                      const filterName = option.label?.toLowerCase() || "";
                      const groupLabel =
                        option.data?.groupLabel?.toLowerCase?.() || "";
                      const input = inputValue.toLowerCase();
                      // If input matches group label, show all options in that group
                      if (groupLabel && groupLabel.includes(input)) return true;
                      // Otherwise, match by filter name
                      return filterName.includes(input);
                    }}
                    styles={{
                      groupHeading: (base) => ({
                        ...base,
                        backgroundColor: "#f3f4f6",
                        color: "#1f2937",
                        fontWeight: 600,
                        padding: "8px 12px",
                        borderBottom: "1px solid #e5e7eb",
                        borderRadius: "4px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected
                          ? "#e6f4ea"
                          : state.isFocused
                          ? "#f9fafb"
                          : "white",
                        color: "#111827",
                        fontWeight: state.isSelected ? 600 : 400,
                      }),
                    }}
                  />
                </div>
                {/* Content Field - Add Category */}
                <div>
                  <label
                    htmlFor="content"
                    className="block mb-1 text-sm font-semibold text-gray-700"
                  >
                    Content
                  </label>
                  <textarea
                    name="content"
                    id="content"
                    value={newCategory.content}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        content: e.target.value,
                      })
                    }
                    rows="4"
                    className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-red-400"
                    placeholder="Enter category description or content..."
                  />
                </div>
                     <div>
       <label className="block mb-1 text-sm font-semibold text-gray-700">
    Icon Image 
  </label>
  <input
    type="file"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files[0];
      if (file) setNewCategory((prev) => ({ ...prev, icon_image: file }));
    }}
    className="block w-full text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
  />
  {newCategory.icon_image && (
    <img src={URL.createObjectURL(newCategory.icon_image)} className="mt-2 h-10 w-10 object-contain rounded" />
  )}
</div> 
      
                <div>
                  <label
                    htmlFor="status"
                    className="block mb-1 text-sm font-semibold text-gray-700"
                  >
                    Status
                  </label>
                  <select
                    name="status"
                    id="status"
                    value={newCategory.status}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-red-400"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="inline-block bg-red-600 text-white px-5 py-2 rounded-md text-sm font-semibold hover:bg-red-700 transition"
                >
                  Add Category
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Update Category Modal */}
      {isUpdateModalOpen && categoryToUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b-2 border-gray-300 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Update Category
              </h2>
              <button
                onClick={() => {
                  setIsUpdateModalOpen(false);
                  setUpdateErrorMessage("");
                  setUpdateImageError("");
                  setErrorMessage("");
                }}
                className="text-gray-400 hover:text-gray-700 focus:outline-none"
                aria-label="Close modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="px-6 py-6 overflow-y-auto flex-grow">
              <form onSubmit={handleUpdateCategory} className="space-y-5">
                {/* Error Messages */}
                {/* {updateErrorMessage && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md">
              {updateErrorMessage}
            </div>
          )} */}

                {/* Success Message */}
                {showUpdateAlert && (
                  <div className="bg-green-500 text-white px-4 py-2 rounded-md">
                    {updateAlertMessage}
                  </div>
                )}

                {/* Category Name */}
                <div>
                  <label
                    htmlFor="update_category_name"
                    className="block mb-1 text-sm font-semibold text-gray-700"
                  >
                    Category Name
                  </label>
                  <input
                    name="category_name"
                    value={categoryToUpdate.category_name}
                    onChange={(e) =>
                      setCategoryToUpdate({
                        ...categoryToUpdate,
                        category_name: e.target.value,
                      })
                    }
                    id="update_category_name"
                    className="w-full rounded-md border p-2 focus:ring-2 focus:ring-red-400"
                    placeholder="Enter Category Name"
                    required
                  />
                  {errorMessage && (
                    <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="update_meta_title"
                    className="block mb-1 text-sm font-semibold text-gray-700"
                  >
                    Meta Title
                  </label>
                  <input
                    name="meta_title"
                    value={categoryToUpdate.meta_title}
                    onChange={(e) =>
                      setCategoryToUpdate({
                        ...categoryToUpdate,
                        meta_title: e.target.value,
                      })
                    }
                    id="update_meta_title"
                    className="w-full rounded-md border p-2 focus:ring-2 focus:ring-red-400"
                    placeholder="Enter Meta Title"
                  />
                  {errorMessage && (
                    <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="update_meta_keyword"
                    className="block mb-1 text-sm font-semibold text-gray-700"
                  >
                    Meta Keyword
                  </label>
                  <textarea
                    name="meta_keyword"
                    value={categoryToUpdate.meta_keyword}
                    onChange={(e) =>
                      setCategoryToUpdate({
                        ...categoryToUpdate,
                        meta_keyword: e.target.value,
                      })
                    }
                    id="update_meta_keyword"
                    className="w-full rounded-md border p-2 focus:ring-2 focus:ring-red-400"
                    placeholder="Enter Meta Keyword"
                  />
                  {errorMessage && (
                    <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="update_meta_description"
                    className="block mb-1 text-sm font-semibold text-gray-700"
                  >
                    Meta Description
                  </label>
                  <textarea
                    name="meta_description"
                    value={categoryToUpdate.meta_description}
                    onChange={(e) =>
                      setCategoryToUpdate({
                        ...categoryToUpdate,
                        meta_description: e.target.value,
                      })
                    }
                    id="update_meta_description"
                    className="w-full rounded-md border p-2 focus:ring-2 focus:ring-red-400"
                    placeholder="Enter Meta Description"
                  />
                  {errorMessage && (
                    <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
                  )}
                </div>

                {/* Parent Category */}
                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-700">
                    Parent Category
                  </label>
                  <div className="border border-gray-300 rounded-md max-h-40 overflow-y-auto p-2">
                    <div>
                      <div
                        className={`p-2 cursor-pointer rounded-md font-semibold ${
                          categoryToUpdate.parentid === "none"
                            ? "bg-red-100 text-red-600"
                            : "text-gray-800 hover:bg-gray-100"
                        }`}
                        onClick={() =>
                          setCategoryToUpdate({
                            ...categoryToUpdate,
                            parentid: "none",
                          })
                        }
                      >
                        Category
                      </div>
                      {renderCategoryTree(buildCategoryTree(categories))}
                    </div>
                  </div>
                </div>

                {/* Image Upload */}
                {categoryToUpdate.parentid != "none" && (
                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-700">
                    Upload Image (260px X 240px)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpdateImageChange}
                    className="block w-full text-sm text-gray-600
                file:mr-3 file:py-1 file:px-3
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-red-50 file:text-red-700
                hover:file:bg-red-100"
                  />
                  {updateImageError && (
                    <p className="text-red-500 text-sm mt-1">
                      {updateImageError}
                    </p>
                  )}
                  {(categoryToUpdate.existingImage ||
                    categoryToUpdate.image) && (
                    <div className="mt-3 flex flex-col items-center">
                      <img
                        src={
                          categoryToUpdate.image instanceof File
                            ? URL.createObjectURL(categoryToUpdate.image)
                            : categoryToUpdate.existingImage
                        }
                        alt="Preview"
                        className="h-16 rounded-md object-contain"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Current Image Preview
                      </p>
                    </div>
                  )}
                </div>
                )}

                {/* Navigation Image Upload */}
                {categoryToUpdate.parentid == "none" && (
                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-700">
                    Upload Navigation Image (210px X 370px)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpdateNavImageChange}
                    className="block w-full text-sm text-gray-600
                file:mr-3 file:py-1 file:px-3
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-red-50 file:text-red-700
                hover:file:bg-red-100"
                  />
                  {updateImageError && (
                    <p className="text-red-500 text-sm mt-1">
                      {updateImageError}
                    </p>
                  )}
                  {(categoryToUpdate.existingNavImage ||
                    categoryToUpdate.navImage) && (
                    <div className="mt-3 flex flex-col items-center">
                      <img
                        src={
                          categoryToUpdate.navImage instanceof File
                            ? URL.createObjectURL(categoryToUpdate.navImage)
                            : categoryToUpdate.existingNavImage
                        }
                        alt="Preview"
                        className="h-16 rounded-md object-contain"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Current Navigation Image Preview
                      </p>
                    </div>
                  )}
                </div>
                )}
                {/* Filter Selection for Update - EXACTLY LIKE PRODUCT PAGE */}
                <div className="border p-4 rounded">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filters
                  </label>
                  <Select
                    options={filters}
                    isMulti
                    hideSelectedOptions={false}
                    closeMenuOnSelect={false}
                    components={{ Option: CustomOption }}
                    value={categoryToUpdate.selectedFilters}
                    onChange={handleUpdateFilterChange}
                    placeholder="Select filters..."
                    filterOption={(option, inputValue) => {
                      const filterName = option.label?.toLowerCase() || "";
                      const groupLabel =
                        option.data?.groupLabel?.toLowerCase?.() || "";
                      const input = inputValue.toLowerCase();
                      if (groupLabel && groupLabel.includes(input)) return true;
                      return filterName.includes(input);
                    }}
                    styles={{
                      groupHeading: (base) => ({
                        ...base,
                        backgroundColor: "#f3f4f6",
                        color: "#1f2937",
                        fontWeight: 600,
                        padding: "8px 12px",
                        borderBottom: "1px solid #e5e7eb",
                        borderRadius: "4px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected
                          ? "#e6f4ea"
                          : state.isFocused
                          ? "#f9fafb"
                          : "white",
                        color: "#111827",
                        fontWeight: state.isSelected ? 600 : 400,
                      }),
                    }}
                  />
                </div>

                {/* Content Field - Update Category */}
                <div>
                  <label
                    htmlFor="update_content"
                    className="block mb-1 text-sm font-semibold text-gray-700"
                  >
                    Content
                  </label>
                  <textarea
                    name="content"
                    id="update_content"
                    value={categoryToUpdate.content}
                    onChange={(e) =>
                      setCategoryToUpdate({
                        ...categoryToUpdate,
                        content: e.target.value,
                      })
                    }
                    rows="4"
                    className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-red-400"
                    placeholder="Enter category description or content..."
                  />
                </div>
     <div>
  <label className="block mb-1 text-sm font-semibold text-gray-700">
    Icon Image (optional)
  </label>
  <input
    type="file"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files[0];
      if (file) setCategoryToUpdate((prev) => ({ ...prev, icon_image: file }));
    }}
    className="block w-full text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
  />
  {(categoryToUpdate.existingIconImage || categoryToUpdate.icon_image) && (
    <img
      src={categoryToUpdate.icon_image instanceof File
        ? URL.createObjectURL(categoryToUpdate.icon_image)
        : categoryToUpdate.existingIconImage}
      className="mt-2 h-10 w-10 object-contain rounded"
    />
  )}
</div>

                {/* Status */}
                <div>
                  <label
                    htmlFor="update_status"
                    className="block mb-1 text-sm font-semibold text-gray-700"
                  >
                    Status
                  </label>
                  <select
                    name="status"
                    id="update_status"
                    value={categoryToUpdate.status}
                    onChange={(e) =>
                      setCategoryToUpdate({
                        ...categoryToUpdate,
                        status: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-red-400"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="inline-block bg-red-600 text-white px-5 py-2 rounded-md text-sm font-semibold hover:bg-red-700 transition w-full"
                >
                  Update Category
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Delete Category</h2>
            <p className="mb-4">
              Are you sure you want to delete this category?
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmationModal(false)}
                className="bg-gray-300 px-4 py-2 rounded-md"
              >
                No, Close
              </button>
              <button
                onClick={() => handleDeleteCategory(categoryToDelete)}
                className="bg-red-500 px-4 py-2 rounded-md text-white"
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
