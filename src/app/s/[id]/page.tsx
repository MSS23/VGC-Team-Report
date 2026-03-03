import { redirect } from "next/navigation";

export default async function ShareRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/?s=${encodeURIComponent(id)}`);
}
