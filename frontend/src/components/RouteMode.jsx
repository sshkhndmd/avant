import { isVkMiniApp } from "../utils/appMode";

export default function RouteMode({ vk, desktop }) {
  return isVkMiniApp() ? vk : desktop;
}