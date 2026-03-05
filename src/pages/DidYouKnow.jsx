import { redirect } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function DidYouKnow() {
  // Redirect to Discover page's DYK tab
  window.location.href = createPageUrl("Discover");
  return null;
}