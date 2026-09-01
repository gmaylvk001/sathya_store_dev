'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';

export default function AdminSider({ collapsed }) {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [hoveredSubmenu, setHoveredSubmenu] = useState(null);
  const [isHoveringSubmenu, setIsHoveringSubmenu] = useState(false);
  const [openMenus, setOpenMenus] = useState([]); // track expanded menus
  const router = useRouter();
  const submenuRef = useRef(null);

  const menuItems = [
    { icon: 'material-symbols:dashboard', label: 'Dashboard', link: 'dashboard' },
    { icon: 'material-symbols:category', label: 'Category', link: 'category' },
    {
      icon: 'mdi:package-variant-closed',
      label: 'Product',
      submenu: [
        { icon: 'mdi:format-list-bulleted', label: 'Product List', link: 'product', dotColor: 'bg-green-500' },
        { icon: 'mdi:tag-outline', label: 'Brand', link: 'brand', dotColor: 'bg-red-500' },
        { icon: 'mdi:upload', label: 'Bulk Upload', link: 'product/bulk_upload', dotColor: 'bg-yellow-500' },
        { icon: 'mdi:filter-variant', label: 'Filter Group', link: 'filter_group', dotColor: 'bg-yellow-500' },
        { icon: 'mdi:filter-outline', label: 'Filter', link: 'filter', dotColor: 'bg-yellow-500' },
        { icon: 'mdi:plus-box-outline', label: 'New Product', link: 'newproduct', dotColor: 'bg-green-500' }
      ]
    },
    // { icon: 'mdi:image-outline', label: 'Banner', link: 'design' },
    {
      icon: 'material-symbols:receipt-long',
          label: 'Sales',
    submenu: [
      { icon: 'mdi:truck-delivery', label: 'All Orders', link: 'Allorder', dotColor: 'bg-yellow-500' },
      { icon: 'mdi:home-import-outline', label: 'Home Delivery', link: 'homedelivery', dotColor: 'bg-yellow-500' },
      // { icon: 'mdi:cart-off', label: 'Abandant Order', link: 'abandantorder', dotColor: 'bg-yellow-500' },
      { icon: 'mdi:cart-off', label: 'Abandoned Order', link: 'abandonedorder', dotColor: 'bg-yellow-500' },
      // { icon: 'mdi:clock-outline', label: 'Home Delivery', link: 'order/home-delivery', dotColor: 'bg-yellow-500' },
      // { icon: 'mdi:clock-outline', label: 'Pending Order', link: 'order/pending-order', dotColor: 'bg-yellow-500' },
      { icon: 'mdi:cancel', label: 'Cancel Order', link: 'order/cancel-order', dotColor: 'bg-[#d72828]' },
      { icon: 'mdi:truck-delivery-outline', label: 'Shipped Order', link: 'shippedorder', dotColor: 'bg-green-500' }
    ]
  },

   {
      icon: 'material-symbols:receipt-long',
          label: 'Main Settings',
    submenu: [
      { icon: 'mdi:truck-delivery', label: 'Banner', link: 'main-cat', dotColor: 'bg-yellow-500' },
      { icon: 'mdi:truck-delivery', label: 'Category Flash', link: 'main-cat-flash', dotColor: 'bg-yellow-500' },
      { icon: 'mdi:truck-delivery', label: 'Category banner', link: 'main_cat_prod', dotColor: 'bg-yellow-500' },
      { icon: 'mdi:truck-delivery', label: 'Category Image', link: 'category-image-section', dotColor: 'bg-yellow-500' },
       { icon: 'mdi:truck-delivery', label: 'open box banner', link: 'openboxbanner', dotColor: 'bg-yellow-500' },
    ]
  },
    { icon: 'mdi:tag-outline', label: 'Offer', link: 'offer' },
    {
      icon: 'mdi:bullhorn-outline',
      label: 'Marketing',
      submenu: [
        {
          icon: 'mdi:gift-outline',
          label: 'Combo Offers',
          link: 'combo-offers',
          dotColor: 'bg-green-500',
        },
      ],
    },
    // { icon: 'mdi:heart-flash', label: 'Wishlist Mail Alerts', link: 'wishlist-mail' },
    { icon: "mdi:briefcase-account-outline", label: "Job Positions", link: "careers" },
    { icon: 'mdi:note-text-outline', label: 'Blog', link: 'blog' },
    // { icon: 'mdi:account-outline', label: 'User', link: 'user' },
    { icon: 'mdi:phone-outline', label: 'Contact Us', link: 'contact' },
    { icon: "mdi:briefcase-account-outline", label: "Feedback", link: "feedback_page" },
    { icon: 'material-symbols:reviews-rounded', label: 'Reviews', link: 'reviews' },
    {
  icon: 'mdi:file-chart-outline', // changed to reports icon
  label: 'Reports',
  submenu: [
    { icon: 'mdi:plus-box-outline', label: 'New Product', link: 'newproduct', dotColor: 'bg-green-500' },

  ]
},

    // ✅ Updated Settings with new icon + submenu
  {
    icon: 'mdi:cog-outline',  // changed from phone to settings cog
    label: 'Settings',
    submenu: [
      { icon: 'mdi:home-outline', label: 'Home Settings', link: 'homesettings', dotColor: 'bg-green-500' },
      { icon: 'mdi:view-dashboard-edit-outline', label: 'Category Settings', link: 'category-pages', dotColor: 'bg-green-500' },
      { icon: 'mdi:tag-multiple-outline', label: 'Brand Settings', link: 'brand-pages', dotColor: 'bg-green-500' },
      { icon: 'mdi:store-outline', label: 'Store Settings', link: 'store', dotColor: 'bg-yellow-500' },
      { icon: 'mdi:map', label: 'Mapbox Settings', link: 'mapbox', dotColor: 'bg-yellow-500' },
    ]
  },
  {
        icon: 'material-symbols:receipt-long',
            label: 'Users Settings',
      submenu: [
        { icon: 'mdi:account-outline', label: 'Users', link: 'user', dotColor: 'bg-yellow-500' },
        { icon: 'mdi:account-outline', label: 'System_Users',link: 'system_users', dotColor: 'bg-yellow-500' },
        {icon: 'mdi:shield-key-outline',label: 'Permissions',link: 'permissions',dotColor: 'bg-purple-500'},
        { icon: 'mdi:account-group-outline',label: 'Roles',link: 'roles',dotColor: 'bg-blue-500'}
      ]
  },
  // { icon: 'material-symbols:fact-check-outline', label: 'Audit', link: 'audit' },
    //     {
    //   icon: 'mdi:map-marker-outline',
    //   label: 'Store Location',
    //   submenu: [
       
    //     { icon: 'mdi:map-marker-radius-outline', label: 'Zone', link: 'zone', dotColor: 'bg-[#d72828]' },
    //   ]
    // }

  ];
  const handleCloseSubmenu = () => {
    setTimeout(() => {
      if (!isHoveringSubmenu) {
        setHoveredSubmenu(null);
      }
    }, 150);
  };

  // Close all submenus when clicking a main category without submenu
  useEffect(() => {
    const clickedMain = menuItems.find(item => item.label === activeMenu);
    if (clickedMain && !clickedMain.submenu) {
      setOpenMenus([]); // close all open submenus
    }
  }, [activeMenu]);

  return (
    <>
      <aside
        className={`h-screen bg-white border-r border-gray-200 fixed top-0 left-0 shadow z-50 overflow-y-scroll scrollbar-hide transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-52'
        }`}
      >
        {/* Logo */}
        <div
          className={`flex items-center px-4 py-4 border-b border-gray-200 ${
            collapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          {!collapsed ? (
            <a href="/" className="flex items-center space-x-2">
              <img src="/uploads/sathyalogo.webp" alt="Site Logo" className="h-9" />
              <span className="text-sm font-bold text-gray-700">Sathya Stores</span>
            </a>
          ) : (
            <img src="/uploads/sathyalogo.webp" alt="Site Logo" className="h-9" />
          )}
        </div>

        {/* Menu */}
        <nav className="mt-4">
          <ul className="px-2 space-y-1">
            {menuItems.map((item) =>
              item.submenu ? (
                <SidebarItemWithDropdown
                  key={item.label}
                  item={item}
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  collapsed={collapsed}
                  hoveredSubmenu={hoveredSubmenu}
                  setHoveredSubmenu={setHoveredSubmenu}
                  handleCloseSubmenu={handleCloseSubmenu}
                  openMenus={openMenus}
                  setOpenMenus={setOpenMenus}
                  router={router}
                />
              ) : (
                <SidebarItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  link={item.link}
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  collapsed={collapsed}
                  router={router}
                />
              )
            )}
          </ul>
        </nav>
      </aside>

      {/* Hover Submenu Box for collapsed mode */}
      {hoveredSubmenu && collapsed && (
        <div
          ref={submenuRef}
          className="absolute bg-white border border-gray-200 shadow-lg rounded-md p-2 z-50"
          style={{
            top: hoveredSubmenu.position.top,
            left: hoveredSubmenu.position.left
          }}
          onMouseEnter={() => setIsHoveringSubmenu(true)}
          onMouseLeave={() => {
            setIsHoveringSubmenu(false);
            setHoveredSubmenu(null);
          }}
        >
          <ul className="space-y-1">
            {hoveredSubmenu.items.map((sub) => (
              <li key={sub.label}>
                <button
                  onClick={() => {
                    setActiveMenu(sub.label);
                    setHoveredSubmenu(null);
                    router.push(`/admin/${sub.link}`);
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded text-sm space-x-3 ${
                    activeMenu === sub.label
                      ? 'bg-brandRed text-white'
                      : 'text-gray-700 hover:text-brandRed'
                  }`}
                >
                  <Icon icon={sub.icon} className="text-lg" />
                  <span>{sub.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function SidebarItem({ icon, label, link, activeMenu, setActiveMenu, collapsed, router }) {
  const active = activeMenu === label;
  return (
    <li>
      <button
        onClick={() => {
          setActiveMenu(label);
          router.push(`/admin/${link}`);
        }}
        className={`w-full flex items-center px-3 py-3 rounded-lg text-md font-medium transition-colors duration-200 ${
          active ? 'bg-brandRed text-white' : 'text-gray-700 hover:text-brandRed'
        } ${collapsed ? 'justify-center' : 'space-x-3'}`}
      >
        <Icon icon={icon} className={collapsed ? 'text-2xl' : 'text-xl'} />
        {!collapsed && <span>{label}</span>}
      </button>
    </li>
  );
}

function SidebarItemWithDropdown({
  item,
  activeMenu,
  setActiveMenu,
  collapsed,
  setHoveredSubmenu,
  handleCloseSubmenu,
  openMenus,
  setOpenMenus,
  router
}) {
  const ref = useRef(null);
  const isOpen = openMenus.includes(item.label);

  const handleMouseEnter = () => {
    if (collapsed && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHoveredSubmenu({
        label: item.label,
        items: item.submenu,
        position: {
          top: rect.top + 'px',
          left: rect.right + 'px'
        }
      });
    }
  };

  const toggleMenu = () => {
    if (isOpen) {
      setOpenMenus((prev) => prev.filter((menu) => menu !== item.label));
    } else {
      setOpenMenus((prev) => [...prev, item.label]);
    }
  };

  return (
    <li
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={collapsed ? handleCloseSubmenu : undefined}
    >
      {/* Parent button */}
      <button
        onClick={() => {
          if (collapsed) return; // collapsed uses hover
          toggleMenu();
        }}
        className={`w-full flex items-center px-3 py-3 rounded-lg text-md font-medium transition-colors duration-200 ${
          item.submenu.some((sub) => sub.label === activeMenu)
            ? 'bg-red-100 text-brandRed'
            : 'text-gray-700 hover:text-brandRed'
        } ${collapsed ? 'justify-center' : 'space-x-3'}`}
      >
        <Icon icon={item.icon} className={collapsed ? 'text-2xl' : 'text-xl'} />
        {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
        {!collapsed && (
          <Icon
            icon={isOpen ? 'mdi:chevron-down' : 'mdi:chevron-right'}
            className="text-lg"
          />
        )}
      </button>

      {/* Expanded mode submenu only if open */}
      {!collapsed && isOpen && (
        <ul className="ml-2 mt-1 space-y-1">
          {item.submenu.map((sub) => (
            <li key={sub.label}>
              <button
                onClick={() => {
                  setActiveMenu(sub.label);
                  router.push(`/admin/${sub.link}`);
                }}
                className={`w-full flex items-center px-3 py-2 rounded text-sm space-x-3 ${
                  activeMenu === sub.label
                    ? 'bg-brandRed text-white'
                    : 'text-gray-700 hover:text-brandRed'
                }`}
              >
                <Icon icon={sub.icon} className="text-lg" />
                <span>{sub.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
