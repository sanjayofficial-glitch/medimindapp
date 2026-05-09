import { useLocation } from "react-router-dom";
import AIButton from "../AIButton";

const HIDE_AI_ROUTES = ["/", "/login", "/signup"];

export const AIButtonController = () => {
  const location = useLocation();
  if (HIDE_AI_ROUTES.includes(location.pathname)) return null;
  return <AIButton />;
};