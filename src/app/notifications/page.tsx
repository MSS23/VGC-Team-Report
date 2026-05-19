import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { NotificationsContent } from "./NotificationsContent";

export const metadata: Metadata = {
  title: "Notifications | VGC Team Report",
  description: "Your activity notifications.",
  robots: { index: false, follow: false },
};

export default async function NotificationsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/notifications");
  }

  return <NotificationsContent />;
}
