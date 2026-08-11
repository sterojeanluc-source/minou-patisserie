import React from "react";
import { redirect } from "next/navigation";
import { getDashboardData } from "../../lib/dashboard/get-dashboard-data";

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data) {
    redirect("/login");
  }

  return (
    <main className="p-6 lg:p-8 text-slate-800">

      {/* HEADER */}

      <div className="mb-8">

        <p className="text-sm text-slate-500 font-semibold">
          Bonjour,
        </p>

        <h1 className="text-3xl font-bold text-slate-900">
          {data.user.firstName} 👋
        </h1>

        <p className="mt-1 text-slate-500">
          Voici la situation de votre établissement. (LP-CODE-007)
        </p>

      </div>

      {/* SCHOOL CARD */}

      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm border border-slate-100">

        <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">
          Établissement Actif
        </p>

        <div className="mt-1 flex items-center justify-between flex-wrap gap-4">

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {data.school?.name}
            </h2>

            <p className="text-sm text-slate-500 font-medium">
              Code : {data.school?.code} {data.activeYearName ? `| Année : ${data.activeYearName}` : ""}
            </p>
          </div>

          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 uppercase">
            École active
          </span>

        </div>

      </div>

      {/* STATS TILES */}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Élèves actifs"
          value={data.stats.students}
          href="/students"
        />

        <StatCard
          title="Classes"
          value={data.stats.classes}
          href="/classes"
        />

        <StatCard
          title="Enseignants"
          value={data.stats.teachers}
          href="/teachers"
        />

        <StatCard
          title="Paiements du mois"
          value={`${data.stats.payments.toLocaleString()} HTG`}
          href="/payments"
        />

      </div>

      {/* LOWER SECTION */}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">

        <QuickActions />

        <Alerts />

      </div>

    </main>
  );
}

function StatCard({
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

      <p className="mt-3 text-3xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700">
        Ouvrir →
      </p>
    </a>
  );
}

function QuickActions() {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">

      <h2 className="text-lg font-bold text-slate-900">
        Actions rapides
      </h2>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">

        <QuickAction
          title="Ajouter un élève"
          href="/students/new"
        />

        <QuickAction
          title="Enregistrer un paiement"
          href="/payments/new"
        />

        <QuickAction
          title="Créer une classe"
          href="/classes/new"
        />

        <QuickAction
          title="Gérer les paramètres"
          href="/settings"
        />

      </div>

    </section>
  );
}

function QuickAction({
  title,
  href,
}: {
  title: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="rounded-xl border border-slate-200 p-4 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 block hover:text-blue-700"
    >
      + {title}
    </a>
  );
}

function Alerts() {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">

      <h2 className="text-lg font-bold text-slate-900">
        À surveiller
      </h2>

      <div className="mt-5 space-y-3">

        <Alert
          title="Paiements"
          message="Les alertes financières seront affichées ici."
        />

        <Alert
          title="Présence"
          message="Les absences importantes apparaîtront ici."
        />

        <Alert
          title="Notes"
          message="Les périodes non finalisées apparaîtront ici."
        />

      </div>

    </section>
  );
}

function Alert({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">

      <p className="font-semibold text-slate-800 text-sm">
        {title}
      </p>

      <p className="mt-1 text-xs text-slate-500 font-medium">
        {message}
      </p>

    </div>
  );
}
