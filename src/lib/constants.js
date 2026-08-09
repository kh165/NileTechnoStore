export const MAIN_ADMIN_EMAIL = (typeof import.meta !== "undefined" && import.meta.env && (import.meta.env.VITE_MAIN_ADMIN_EMAIL || import.meta.env.MAIN_ADMIN_EMAIL)) ? (import.meta.env.VITE_MAIN_ADMIN_EMAIL || import.meta.env.MAIN_ADMIN_EMAIL) : "";

/**
 * Checks if a user object is an Admin or Main Admin (role is 'admin', 'main_admin', 'super_admin', or email matches MAIN_ADMIN_EMAIL).
 */
export function isUserAdmin(user) {
  if (!user) return false;
  const userRole = (user.role || "").toLowerCase().trim();
  const userEmail = (user.email || "").toLowerCase().trim();
  const mainEmail = MAIN_ADMIN_EMAIL.toLowerCase().trim();

  return (
    userRole === "admin" ||
    userRole === "main_admin" ||
    userRole === "super_admin" ||
    (userEmail !== "" && userEmail === mainEmail)
  );
}

/**
 * Checks if a user object is a Main Admin / Super Admin with full access & privileges.
 * Regular 'admin' is NOT a Main Admin.
 */
export function isUserMainAdmin(user) {
  if (!user) return false;
  const userRole = (user.role || "").toLowerCase().trim();
  const userEmail = (user.email || "").toLowerCase().trim();
  const mainEmail = MAIN_ADMIN_EMAIL.toLowerCase().trim();

  return (
    userRole === "main_admin" ||
    userRole === "super_admin" ||
    (userEmail !== "" && userEmail === mainEmail)
  );
}

/**
 * Returns role rank: 'main_admin' | 'admin' | 'user'
 */
export function getUserRoleRank(user) {
  if (!user) return "user";
  if (isUserMainAdmin(user)) return "main_admin";
  if (isUserAdmin(user)) return "admin";
  return "user";
}

/**
 * Returns localized role label
 */
export function getUserRoleLabel(user, lang = "ar") {
  const rank = getUserRoleRank(user);
  if (rank === "main_admin") {
    return lang === "en" ? "Super / Main Admin" : "أدمن رئيسي";
  }
  if (rank === "admin") {
    return lang === "en" ? "Admin / Manager" : "أدمن / مدير";
  }
  return lang === "en" ? "User / Customer" : "مستخدم / عميل";
}

