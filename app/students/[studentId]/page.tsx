import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

type Props = {
  params: Promise<{
    studentId: string;
  }>;
};

export default async function StudentPage({
  params,
}: Props) {
  const { studentId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // --------------------------------------------------
  // PROFIL UTILISATEUR
  // --------------------------------------------------

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/dashboard");
  }

  // --------------------------------------------------
  // ÉLÈVE
  // --------------------------------------------------

  const { data: student } = await supabase
    .from("students")
    .select(`
      id,
      student_number,
      first_name,
      last_name,
      date_of_birth,
      gender,
      status
    `)
    .eq("id", studentId)
    .eq("school_id", profile.school_id)
    .maybeSingle();

  if (!student) {
    notFound();
  }

  // --------------------------------------------------
  // INSCRIPTION ACTUELLE
  // --------------------------------------------------

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select(`
      id,
      status,
      academic_year:academic_years (
        id,
        name
      ),
      class:classes (
        id,
        name
      )
    `)
    .eq("student_id", student.id)
    .eq("status", "active")
    .maybeSingle();

  const enrollmentObj = enrollment as any;

  // --------------------------------------------------
  // RESPONSABLES
  // --------------------------------------------------

  const { data: guardians } = await supabase
    .from("student_guardians")
    .select(`
      id,
      relationship,
      is_primary,
      is_financial_responsible,
      is_emergency_contact,
      guardian:guardians (
        id,
        first_name,
        last_name,
        phone,
        email,
        address,
        occupation
      )
    `)
    .eq("student_id", student.id);

  const guardiansList = guardians as any[] | null;

  return (
    <main className="p-6 lg:p-8 text-slate-800">

      <div className="mx-auto max-w-6xl">

        {/* NAVIGATION */}

        <Link
          href="/students"
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          ← Retour aux élèves
        </Link>

        {/* HEADER */}

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm border border-slate-100">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>

              <div className="flex items-center gap-3">

                <h1 className="text-3xl font-bold text-slate-900">
                  {student.first_name} {student.last_name}
                </h1>

                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 uppercase tracking-wide">
                  {student.status}
                </span>

              </div>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                Matricule : {student.student_number}
              </p>

            </div>

            <Link
              href={`/students/${student.id}/edit`}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Modifier
            </Link>

          </div>

        </div>

        {/* INFORMATIONS */}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">

          <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 lg:col-span-2">

            <h2 className="text-lg font-bold text-slate-900">
              Informations personnelles
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">

              <Info
                label="Prénom"
                value={student.first_name}
              />

              <Info
                label="Nom"
                value={student.last_name}
              />

              <Info
                label="Date de naissance"
                value={
                  student.date_of_birth ?? "Non renseignée"
                }
              />

              <Info
                label="Sexe"
                value={
                  student.gender === "male"
                    ? "Garçon"
                    : student.gender === "female"
                    ? "Fille"
                    : "Non renseigné"
                }
              />

            </div>

          </section>

          {/* INSCRIPTION */}

          <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">

            <h2 className="text-lg font-bold text-slate-900">
              Scolarité actuelle
            </h2>

            <div className="mt-5 space-y-5">

              <Info
                label="Année scolaire"
                value={
                  enrollmentObj?.academic_year?.name ??
                  "Non inscrite"
                }
              />

              <Info
                label="Classe"
                value={
                  enrollmentObj?.class?.name ??
                  "Non affectée"
                }
              />

              <Info
                label="Statut"
                value={
                  enrollmentObj?.status ?? "—"
                }
              />

            </div>

          </section>

        </div>

        {/* RESPONSABLES */}

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm border border-slate-100">

          <div className="flex items-center justify-between flex-wrap gap-4">

            <div>

              <h2 className="text-lg font-bold text-slate-900">
                Parents / responsables
              </h2>

              <p className="mt-1 text-sm text-slate-500 font-medium">
                Personnes autorisées à être contactées concernant l'élève. (LP-CODE-009)
              </p>

            </div>

            <Link
              href={`/students/${student.id}/guardians/new`}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
            >
              + Ajouter
            </Link>

          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">

            {guardiansList?.length ? (

              guardiansList.map((item) => {

                const guardian = item.guardian;

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 p-5 bg-white shadow-sm"
                  >

                    <div className="flex items-start justify-between">

                      <div>

                        <h3 className="font-bold text-slate-900">
                          {guardian?.first_name}{" "}
                          {guardian?.last_name}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500 font-semibold">
                          {item.relationship}
                        </p>

                      </div>

                      {item.is_primary && (
                        <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                          Principal
                        </span>
                      )}

                    </div>

                    <div className="mt-4 space-y-2 text-sm text-slate-600 font-medium">

                      <p>
                        📞 {guardian?.phone ?? "—"}
                      </p>

                      <p>
                        ✉️ {guardian?.email ?? "—"}
                      </p>

                      {item.is_financial_responsible && (
                        <p className="text-green-600 font-semibold">
                          ✓ Responsable financier
                        </p>
                      )}

                      {item.is_emergency_contact && (
                        <p className="text-orange-600 font-semibold">
                          ✓ Contact d'urgence
                        </p>
                      )}

                    </div>

                  </div>
                );
              })

            ) : (

              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center md:col-span-2">

                <p className="text-sm text-slate-500 font-semibold">
                  Aucun responsable enregistré.
                </p>

                <Link
                  href={`/students/${student.id}/guardians/new`}
                  className="mt-3 inline-block text-sm font-bold text-blue-600 hover:text-blue-700"
                >
                  Ajouter le premier responsable →
                </Link>

              </div>

            )}

          </div>

        </section>

        {/* MODULES */}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <ModuleCard
            title="Notes"
            description="Consulter les évaluations"
            href={`/students/${student.id}/grades`}
          />

          <ModuleCard
            title="Présence"
            description="Historique des absences"
            href={`/students/${student.id}/attendance`}
          />

          <ModuleCard
            title="Paiements"
            description="Historique financier"
            href={`/students/${student.id}/payments`}
          />

          <ModuleCard
            title="Documents"
            description="Dossier administratif"
            href={`/students/${student.id}/documents`}
          />

        </section>

      </div>

    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function ModuleCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 transition hover:-translate-y-1 hover:shadow-md block"
    >

      <h3 className="font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-sm text-slate-500 font-medium">
        {description}
      </p>

      <p className="mt-4 text-sm font-bold text-blue-600 hover:text-blue-700">
        Ouvrir →
      </p>

    </Link>
  );
}
