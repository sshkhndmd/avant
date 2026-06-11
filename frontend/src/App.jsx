import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider, AdaptivityProvider, AppRoot } from "@vkontakte/vkui";
import vkBridge, {
  parseURLSearchParamsForGetLaunchParams,
} from "@vkontakte/vk-bridge";
import {
  useAppearance,
  useInsets,
} from "@vkontakte/vk-bridge-react";

import { isVkMiniApp } from "./utils/appMode";
import { api } from "./api";

// SITE
import Layout from "./layouts/Layout";
import Home from "./pages/Home";
import Product from "./pages/Product";
import Profile from "./pages/Profile";
import Favorites from "./pages/Favorites";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import Search from "./pages/Search";
import Catalog from "./pages/Catalog";
import About from "./pages/About";

import AdminUsers from "./pages/admin/AdminUsers";
import AdminProducts from "./pages/admin/AdminProducts";
import RequireRole from "./components/RequireRole";

// VK MINI APP
import VkLayout from "./layouts/VkLayout";
import VkHome from "./vk/VkHome";
import VkProduct from "./vk/VkProduct";
import VkFavorites from "./vk/VkFavorites";
import VkCart from "./vk/VkCart";
import VkProfile from "./vk/VkProfile";
import VkCatalog from "./vk/VkCatalog";
import VkOrders from "./vk/VkOrders";

function AppContent() {
  const vkMiniApp = isVkMiniApp();
  const [me, setMe] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMe(null);
      return;
    }

    api("/api/auth/me", { token })
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {vkMiniApp && (
          <Route element={<VkLayout />}>
            <Route path="/" element={<VkHome />} />
            <Route path="/product" element={<VkProduct />} />
            <Route path="/favorites" element={<VkFavorites />} />
            <Route path="/cart" element={<VkCart />} />
            <Route path="/profile" element={<VkProfile />} />
            <Route path="/catalog" element={<VkCatalog />} />
            <Route path="/orders" element={<VkOrders />} />
            <Route path="*" element={<Navigate to="/?vk=1" replace />} />
          </Route>
        )}
        {!vkMiniApp && (
          <Route element={<Layout />}>
            <Route
              path="/admin/users"
              element={
                <RequireRole user={me} roles={["ADMIN"]}>
                  <AdminUsers />
                </RequireRole>
              }
            />
            <Route
              path="/admin/products"
              element={
                <RequireRole
                  user={me}
                  roles={["ADMIN", "PRODUCT_MANAGER", "SALES_MANAGER"]}
                >
                  <AdminProducts />
                </RequireRole>
              }
            />
            <Route path="/" element={<Home />} />
            <Route path="/product" element={<Product />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/search" element={<Search />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  const vkMiniApp = isVkMiniApp();

  const vkBridgeColorScheme = useAppearance() || undefined;
  const vkBridgeInsets = useInsets() || undefined;

  const { vk_platform } = parseURLSearchParamsForGetLaunchParams(
    window.location.search
  );

  if (!vkMiniApp) {
    return <AppContent />;
  }

  return (
    <ConfigProvider
      colorScheme={vkBridgeColorScheme}
      platform={vk_platform === "desktop_web" ? "vkcom" : undefined}
      isWebView={vkBridge.isWebView()}
      hasCustomPanelHeaderAfter={true}
    >
      <AdaptivityProvider>
        <AppRoot mode="full" safeAreaInsets={vkBridgeInsets}>
          <AppContent />
        </AppRoot>
      </AdaptivityProvider>
    </ConfigProvider>
  );
}