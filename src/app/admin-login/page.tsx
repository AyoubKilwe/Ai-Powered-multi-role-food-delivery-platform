export const dynamic = "force-dynamic";

import LoginClient from "../login/LoginClient";

export default function AdminLoginPage() {
  return (
    <LoginClient
      allowedRoles={["ADMIN"]}
      defaultRole="ADMIN"
      title="Admin sign in"
      subtitle="Use your admin username and password here."
      identifierLabel="Username"
      adminLinkHref="/login"
      adminLinkLabel="Back to public sign in"
    />
  );
}
