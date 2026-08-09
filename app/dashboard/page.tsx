"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type School = {
  id: string;
  name: string;
  code: string;
};

export default function DashboardPage() {
  const supabase = createClient();

  const [school, setSchool] = useState<School | null>(null);
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        setLoading(false);
        return;
      }

      const { data: schoolData } = await supabase
        .from("schools")
        .select("id, name, code")
        .eq("id", profile.school_id)
        .maybeSingle();

      const { count } = await supabase
        .from("students")
        .select("*", {
          count: "exact",
          head: true,
        });

      setSchool(schoolData);
      setStudentCount(count ?? 0);
      setLoading(false);
    }

    loadDashboard();
  }, [supabase]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-500">
          Chargement de Lekòl Pam...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">

      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Lekòl Pam
            </h1>

            <p className="text-sm text-slate-500">
              Tableau de bord (MVP v0.1)
            </p>
          </div>

          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/login";
            }}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Déconnexion
          </button>

        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">

        <div className="mb-8">
          <p className="text-sm text-slate-500">
            Bienvenue
          </p>

          <h2 className="text-3xl font-bold text-slate-900">
            {school?.name ?? "Votre école"}
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <DashboardCard
            title="Élèves"
            value={studentCount}
            href="/students"
          />

          <DashboardCard
            title="Classes"
            value="—"
            href="/classes"
          />

          <DashboardCard
            title="Présence"
            value="—"
            href="/attendance"
          />

          <DashboardCard
            title="Paiements"
            value="—"
            href="/payments"
          />

        </div>

      </section>
    </main>
  );
}

function DashboardCard({
  title,
  value,
  href,
}: {
  title: string;
  value: string | number;
  href: string;
}) {
  return (
    <a
      href={href}
      className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition hover:-translate-y-1 hover:shadow-md block"
    >
      <p className="text-sm text-slate-500 font-medium">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700">
        Ouvrir →
      </p>
    </a>
  );
}
