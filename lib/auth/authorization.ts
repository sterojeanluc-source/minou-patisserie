import { createClient } from "../supabase/server";
import { permissions, type Role } from "../permissions";

export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getCurrentUserRole(): Promise<Role | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("user_roles")
    .select(`
      roles (
        name
      )
    `)
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  // Helper check for safe nested roles properties access
  const roleObj = data?.roles as any;
  if (!roleObj || !roleObj.name) {
    return null;
  }

  return roleObj.name as Role;
}

export async function hasPermission(
  permission: string
) {
  const role = await getCurrentUserRole();

  if (!role) {
    return false;
  }

  return (permissions[role] as readonly string[]).includes(
    permission
  );
}
