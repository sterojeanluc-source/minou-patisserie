"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type Student = {
  id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  status: string;
};

export default function StudentsPage() {
  const supabase = createClient();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStudents() {
      const { data, error } = await supabase
        .from("students")
        .select(`
          id,
          student_number,
          first_name,
          last_name,
          date_of_birth,
          status
        `)
        .order("last_name");

      if (!error) {
        setStudents(data ?? []);
      }

      setLoading(false);
    }

    loadStudents();
  }, [supabase]);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">

      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-5">

          <a
            href="/dashboard"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            ← Dashboard
          </a>

          <div className="mt-4">
            <h1 className="text-3xl font-bold text-slate-900">
              Élèves
            </h1>

            <p className="mt-1 text-slate-500">
              Gestion des élèves de votre établissement
            </p>
          </div>

        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">

        {loading ? (
          <p className="text-slate-500 font-medium">
            Chargement...
          </p>
        ) : students.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center border border-slate-100 shadow-sm">
            <p className="text-slate-500 font-medium">
              Aucun élève trouvé.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100">

            <table className="w-full border-collapse">

              <thead className="border-b bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Matricule
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Élève
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Date de naissance
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Statut
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-slate-800">

                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50 transition-colors"
                  >

                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                      {student.student_number}
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {student.first_name} {student.last_name}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-500">
                      {student.date_of_birth ?? "—"}
                    </td>

                    <td className="px-6 py-4">

                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 uppercase tracking-wider">
                        {student.status}
                      </span>

                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </section>
    </main>
  );
}
