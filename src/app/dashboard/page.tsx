import type { Metadata } from "next";
import { DashboardContent } from "./DashboardContent";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your VGC team reports, saved teams, and account.",
};

export default function DashboardPage() {
  return <DashboardContent />;
}
