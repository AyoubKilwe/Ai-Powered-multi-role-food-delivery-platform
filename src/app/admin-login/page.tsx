export const dynamic = "force-dynamic";

import LoginClient from "../login/LoginClient";

export default function AdminLoginPage() {
  return (
    <LoginClient
      allowedRoles={["ADMIN"]}
      defaultRole="ADMIN"
      title="Admin sign in"
      subtitle="Only admin accounts can enter here. Use your secure platform credentials."
      adminLinkHref="/login"
      adminLinkLabel="Back to public sign in"
    />
  );
}
