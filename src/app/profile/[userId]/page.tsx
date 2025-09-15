import { Suspense } from "react";
import UserProfileClient from "./UserProfileClient";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  return (
    <Suspense fallback={<div>Loading profile...</div>}>
      <UserProfileClient userId={userId} />
    </Suspense>
  );
}