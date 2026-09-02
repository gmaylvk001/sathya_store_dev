'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';

const menuItems = [
  { icon: 'material-symbols:dashboard', label: 'Dashboard', link: 'dashboard' },
  { icon: 'material-symbols:category', label: 'Category', link: 'category' },
  {
    icon: 'mdi:package-variant-closed',
    label: 'Product',
    submenu: [
      { icon: 'mdi:format-list-bulleted', label: 'Product List', link: 'product', dotColor: 'bg-green-500' },
      { icon: 'mdi:trademark', label: 'Brand', link: 'brand', dotColor: 'bg-red-500' },
      { icon: 'mdi:upload', label: 'Bulk Upload', link: 'product/bulk_upload', dotColor: 'bg-yellow-500' },
      { icon: 'mdi:filter-variant', label: 'Filter Group', link: 'filter_group', dotColor: 'bg-yellow-500' },
      { icon: 'mdi:filter-outline', label: 'Filter', link: 'filter', dotColor: 'bg-yellow-500' },
      { icon: 'mdi:plus-box-outline', label: 'New Product', link: 'newproduct', dotColor: 'bg-green-500' }
    ]
  },
  { icon: 'mdi:storefront-outline', label: 'Unilet Products', link: 'unilet-products' },
  {
    icon: 'mdi:cart-outline',
    label: 'Sales',
    submenu: [
      { icon: 'mdi:clipboard-list-outline', label: 'All Orders', link: 'Allorder', dotColor: 'bg-yellow-500' },
      { icon: 'mdi:home-import-outline', label: 'Home Delivery', link: 'homedelivery', dotColor: 'bg-yellow-500' },
      { icon: 'mdi:cart-off', label: 'Abandoned Order', link: 'abandonedorder', dotColor: 'bg-yellow-500' },
      { icon: 'mdi:cancel', label: 'Cancel Order', link: 'order/cancel-order', dotColor: 'bg-[#d72828]' },
      { icon: 'mdi:truck-delivery-outline', label: 'Shipped Order', link: 'shippedorder', dotColor: 'bg-green-500' }
    ]
  },
  {
    icon: 'mdi:tune-variant',
    label: 'Main Settings',
    submenu: [
      { icon: 'mdi:image-outline', label: 'Banner', link: 'main-cat', dotColor: 'bg-yellow-500' },
      { icon: 'mdi:flash-outline', label: 'Category Flash', link: 'main-cat-flash', dotColor: 'bg-yellow-500' },
      { icon: 'mdi:image-area', label: 'Category banner', link: 'main_cat_prod', dotColor: 'bg-yellow-500' },
      { icon: 'mdi:image-multiple-outline', label: 'Category Image', link: 'category-image-section', dotColor: 'bg-yellow-500' },
      { icon: 'mdi:cube-outline', label: 'open box banner', link: 'openboxbanner', dotColor: 'bg-yellow-500' },
    ]
  },
  { icon: 'mdi:percent-outline', label: 'Offer', link: 'offer' },
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
  { icon: 'mdi:briefcase-outline', label: 'Job Positions', link: 'careers' },
  { icon: 'mdi:note-text-outline', label: 'Blog', link: 'blog' },
  { icon: 'mdi:phone-outline', label: 'Contact Us', link: 'contact' },
  { icon: 'mdi:message-text-outline', label: 'Feedback', link: 'feedback_page' },
  { icon: 'material-symbols:reviews-rounded', label: 'Reviews', link: 'reviews' },
  {
    icon: 'mdi:file-chart-outline',
    label: 'Reports',
    submenu: [
      { icon: 'mdi:chart-plus', label: 'New Product', link: 'newproduct', dotColor: 'bg-green-500' },
    ]
  },
  {
    icon: 'mdi:cog-outline',
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
    icon: 'mdi:account-cog-outline',
    label: 'Users Settings',
    submenu: [
      { icon: 'mdi:account-outline', label: 'Users', link: 'user', dotColor: 'bg-yellow-500' },
      { icon: 'mdi:account-tie-outline', label: 'System_Users', link: 'system_users', dotColor: 'bg-yellow-500' },
      { icon: 'mdi:shield-key-outline', label: 'Permissions', link: 'permissions', dotColor: 'bg-purple-500' },
      { icon: 'mdi:account-group-outline', label: 'Roles', link: 'roles', dotColor: 'bg-blue-500' }
    ]
  },
];

function setSidebarFlyoutTop(event) {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--sidebar-flyout-top', `${rect.top}px`);
}

function SidebarHoverBadge({ label }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none fixed z-[80] whitespace-nowrap rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-brandRed shadow-lg opacity-0 invisible transition-opacity duration-200 group-hover:visible group-hover:opacity-100"
      style={{
        left: '60px',
        top: 'var(--sidebar-flyout-top, 0px)',
      }}
    >
      {label}
    </span>
  );
}

const karnatakaUniletMenuItems = [
  { icon: 'material-symbols:dashboard', label: 'Dashboard', link: 'unilet-dashboard' },
  { icon: 'mdi:account-group-outline', label: 'Users', link: 'unilet-users' },
  { icon: 'mdi:storefront-outline', label: 'Unilet Products', link: 'unilet-products' },
  { icon: 'mdi:currency-inr', label: 'Pricing', link: 'unilet-products' },
  { icon: 'mdi:package-variant-closed', label: 'Stock / Inventory', link: 'unilet-products' },
  { icon: 'mdi:clipboard-list-outline', label: 'Orders', link: 'unilet-orders' },
];

export default function AdminSider({ collapsed }) {
  const pathname = usePathname();
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [openMenus, setOpenMenus] = useState([]);
  const [isKarnatakaAdmin, setIsKarnatakaAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user") || localStorage.getItem("adminUser");
      if (userStr) {
        const userObj = JSON.parse(userStr);
        const userRole = (userObj.role || userObj.user_type || "").toLowerCase();
        if (userRole === "karnataka_unilet_admin" || userRole === "karnataka_unilet") {
          setIsKarnatakaAdmin(true);
        }
      }
      const roleStr = (localStorage.getItem("user_role") || "").toLowerCase();
      if (roleStr === "karnataka_unilet_admin" || roleStr === "karnataka_unilet") {
        setIsKarnatakaAdmin(true);
      }
    } catch (e) {}
  }, []);

  const activeMenuItems = isKarnatakaAdmin ? karnatakaUniletMenuItems : menuItems;

  useEffect(() => {
    if (!pathname) return;
    if (pathname.includes('/admin/unilet-products')) {
      setActiveMenu('Unilet Products');
      return;
    }
    for (const item of activeMenuItems) {
      if (item.link && pathname.includes(`/admin/${item.link}`)) {
        setActiveMenu(item.label);
        return;
      }
      if (item.submenu) {
        const sub = item.submenu.find((s) => pathname.includes(`/admin/${s.link}`));
        if (sub) {
          setActiveMenu(sub.label);
          setOpenMenus((prev) => (prev.includes(item.label) ? prev : [...prev, item.label]));
          return;
        }
      }
    }
  }, [pathname, isKarnatakaAdmin]);

  useEffect(() => {
    const clickedMain = activeMenuItems.find(item => item.label === activeMenu);
    if (clickedMain && !clickedMain.submenu) {
      setOpenMenus([]);
    }
  }, [activeMenu, isKarnatakaAdmin]);

  return (
    <aside
      id="admin-sidebar"
      className="col-start-1 row-start-2 z-30 flex h-full min-h-0 w-full flex-col overflow-y-auto border-r border-gray-200 bg-white scrollbar-hide"
    >
      <nav className="py-3">
        <ul className="space-y-1 px-3">
          {activeMenuItems.map((item) =>
            item.submenu ? (
              <SidebarItemWithDropdown
                key={item.label}
                item={item}
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                collapsed={collapsed}
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
  );
}

function SidebarItem({ icon, label, link, activeMenu, setActiveMenu, collapsed, router }) {
  const active = activeMenu === label;

  return (
    <li className="group relative" onMouseEnter={setSidebarFlyoutTop}>
      <button
        onClick={() => {
          setActiveMenu(label);
          router.push(`/admin/${link}`);
        }}
        className={`w-full flex items-center px-1 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
          active ? 'bg-brandRed text-white' : 'text-gray-700 hover:text-brandRed'
        } ${collapsed ? 'justify-center' : 'space-x-3'}`}
        aria-label={label}
      >
        <Icon icon={icon} className="text-xl" />
        {!collapsed && <span>{label}</span>}
      </button>
      {collapsed && <SidebarHoverBadge label={label} />}
    </li>
  );
}

function SidebarItemWithDropdown({
  item,
  activeMenu,
  setActiveMenu,
  collapsed,
  openMenus,
  setOpenMenus,
  router
}) {
  const isOpen = openMenus.includes(item.label);
  const [openUp, setOpenUp] = useState(false);

  const setFlyoutTop = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const estimatedHeight = 44 + item.submenu.length * 42 + 8;
    const spaceBelow = window.innerHeight - rect.top;
    const shouldOpenUp = spaceBelow < estimatedHeight + 12;

    event.currentTarget.style.setProperty('--sidebar-flyout-top', `${rect.top}px`);
    event.currentTarget.style.setProperty(
      '--sidebar-flyout-bottom',
      `${Math.max(8, window.innerHeight - rect.bottom)}px`
    );
    setOpenUp(shouldOpenUp);
  };

  const toggleMenu = () => {
    if (isOpen) {
      setOpenMenus((prev) => prev.filter((menu) => menu !== item.label));
    } else {
      setOpenMenus((prev) => [...prev, item.label]);
    }
  };

  return (
    <li className="group relative" onMouseEnter={collapsed ? setFlyoutTop : undefined}>
      <button
        onClick={() => {
          if (collapsed) return;
          toggleMenu();
        }}
        className={`w-full flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
          item.submenu.some((sub) => sub.label === activeMenu)
            ? 'bg-red-100 text-brandRed'
            : 'text-gray-700 hover:text-brandRed'
        } ${collapsed ? 'justify-center' : 'space-x-3'}`}
        aria-label={item.label}
        aria-haspopup="true"
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

      {collapsed && (
        <div
          className="invisible pointer-events-none fixed z-[90] group-hover:visible group-hover:pointer-events-auto"
          style={
            openUp
              ? { left: '50px', bottom: 'var(--sidebar-flyout-bottom, 8px)', top: 'auto' }
              : { left: '50px', top: 'var(--sidebar-flyout-top, 0px)', bottom: 'auto' }
          }
        >
          <div className="pl-2">
            <div className="min-w-[200px] max-h-[min(24rem,calc(100vh-16px))] overflow-hidden overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              <div className="bg-red-50 px-4 pb-2 pt-3 text-xs font-semibold uppercase tracking-wide text-brandRed">
                {item.label}
              </div>
              <ul>
                {item.submenu.map((sub) => (
                  <li key={sub.label}>
                    <button
                      onClick={() => {
                        setActiveMenu(sub.label);
                        router.push(`/admin/${sub.link}`);
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                        activeMenu === sub.label
                          ? 'bg-brandRed text-white'
                          : 'text-gray-700 hover:bg-red-50 hover:text-brandRed'
                      }`}
                    >
                      <Icon icon={sub.icon} className="h-4 w-4 shrink-0 text-[16px]" />
                      <span>{sub.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

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
