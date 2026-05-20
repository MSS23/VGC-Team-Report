import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NotificationsContent } from "./NotificationsContent";

export const metadata: Metadata = {
  title: "Notification Preferences",
  description: "Manage your email notification preferences for VGC Team Report.",
  robots: { index: false, follow: false },
};

export default async function NotificationsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  return <NotificationsContent />;
}
