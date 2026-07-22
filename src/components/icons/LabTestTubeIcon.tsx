import { createLucideIcon } from "lucide-react";

// Exact match for the Labs icon in the HTML prototype (Guides/Patient_Portal.html):
// <path d="M9 3v11.5a3.5 3.5 0 0 0 7 0V3"/><line x1="6" y1="3" x2="18" y2="3"/>
const LabTestTubeIcon = createLucideIcon("lab-test-tube", [
  ["path", { d: "M9 3v11.5a3.5 3.5 0 0 0 7 0V3", key: "tube-body" }],
  ["line", { x1: "6", y1: "3", x2: "18", y2: "3", key: "tube-rim" }],
]);

export default LabTestTubeIcon;
