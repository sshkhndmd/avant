export function isVkMiniApp() {
  const params = new URLSearchParams(window.location.search);

  if (params.get("vk") === "1") {
    localStorage.setItem("app_mode", "vk");
    return true;
  }
  if (params.has("vk_platform")) {
    localStorage.setItem("app_mode", "vk");
    return true;
  }
  if (localStorage.getItem("app_mode") === "vk") {
    return true;
  }
  return false;
}

export function isSiteMode() {
  return !isVkMiniApp();
}
export function getAppMode() {
  return isVkMiniApp() ? "vk" : "site";
}
export function setSiteMode() {
  localStorage.setItem("app_mode", "site");
}
export function setVkMiniAppMode() {
  localStorage.setItem("app_mode", "vk");
}
export function clearAppMode() {
  localStorage.removeItem("app_mode");
}