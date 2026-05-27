export const dynamic = "force-dynamic";

import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <LoginClient
      allowedRoles={["CUSTOMER", "DRIVER", "RECEPTIONIST", "ADMIN"]}
    />
  );
}
