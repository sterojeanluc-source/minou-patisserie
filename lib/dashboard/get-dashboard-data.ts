import { createClient } from "../supabase/server";

export async function getDashboardData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // ----------------------------------------------------------
  // PROFIL + ÉCOLE ID
  // ----------------------------------------------------------

  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      id,
      first_name,
      last_name,
      school_id
    `)
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return null;
  }

  const schoolId = profile.school_id;

  // ----------------------------------------------------------
  // ÉCOLE NAME & CODE
  // ----------------------------------------------------------

  const { data: school } = await supabase
    .from("schools")
    .select("id, name, code")
    .eq("id", schoolId)
    .maybeSingle();

  // ----------------------------------------------------------
  // ACTIVE ACADEMIC YEAR (LP-CODE-007 Context)
  // ----------------------------------------------------------

  const { data: activeYear } = await supabase
    .from("academic_years")
    .select("id, name")
    .eq("school_id", schoolId)
    .eq("status", "active")
    .maybeSingle();

  // ----------------------------------------------------------
  // ÉLÈVES (Context-aware active student enrollments)
  // ----------------------------------------------------------

  let activeStudentsCount = 0;

  if (activeYear) {
    const { count } = await supabase
      .from("enrollments")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("academic_year_id", activeYear.id)
      .eq("status", "active");

    activeStudentsCount = count ?? 0;
  }

  // ----------------------------------------------------------
  // CLASSES (Academic classes in the active academic year)
  // ----------------------------------------------------------

  let activeClassesCount = 0;

  if (activeYear) {
    const { count } = await supabase
      .from("classes")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("academic_year_id", activeYear.id);

    activeClassesCount = count ?? 0;
  }

  // ----------------------------------------------------------
  // ENSEIGNANTS (Roles verified per school)
  // ----------------------------------------------------------

  const { data: teacherRole } = await supabase
    .from("roles")
    .select("id")
    .eq("school_id", schoolId)
    .eq("name", "TEACHER")
    .maybeSingle();

  let teachersCount = 0;

  if (teacherRole) {
    const { count } = await supabase
      .from("user_roles")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("role_id", teacherRole.id);

    teachersCount = count ?? 0;
  }

  // ----------------------------------------------------------
  // PAIEMENTS (Payments computed for the current school)
  // ----------------------------------------------------------

  const { data: payments } = await supabase
    .from("payments")
    .select("amount")
    .eq("school_id", schoolId);

  const totalPayments =
    payments?.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    ) ?? 0;

  // ----------------------------------------------------------
  // RÉSULTAT CONTEXTUEL
  // ----------------------------------------------------------

  return {
    user: {
      firstName: profile.first_name,
      lastName: profile.last_name,
    },

    school,
    activeYearName: activeYear?.name ?? null,

    stats: {
      students: activeStudentsCount,
      classes: activeClassesCount,
      teachers: teachersCount,
      payments: totalPayments,
    },
  };
}
