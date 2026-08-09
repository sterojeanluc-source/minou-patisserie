import React from "react";
import { redirect } from "next/navigation";
import { hasPermission } from "../../lib/auth/authorization";

export default async function SettingsPage() {
  const allowed = await hasPermission("settings.view");

  if (!allowed) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8 text-slate-800">

      <div className="mx-auto max-w-5xl">

        <a
          href="/dashboard"
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          ← Dashboard
        </a>

        <h1 className="mt-6 text-3xl font-bold text-slate-900">
          Paramètres de l'école
        </h1>

        <p className="mt-2 text-slate-500">
          Configurez les règles de votre établissement. (LP-CODE-006)
        </p>

        <div className="mt-8 p-6 rounded-2xl bg-white shadow-sm border border-slate-100">
          <p className="font-semibold text-slate-700">Seul le personnel autorisé (DIRECTOR) a accès à cette page.</p>
        </div>

      </div>

    </main>
  );
}
