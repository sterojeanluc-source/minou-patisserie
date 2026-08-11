"use client";

import React, { FormEvent, useState } from "react";
import { createClient } from "../../../../lib/supabase/client";
import { useRouter } from "next/navigation";

export default function NewGuardianPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("Mère");

  const [primary, setPrimary] = useState(false);
  const [financial, setFinancial] = useState(false);
  const [emergency, setEmergency] = useState(false);

  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);

    const { studentId } = await params;

    // --------------------------------------------------
    // UTILISATEUR
    // --------------------------------------------------

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // --------------------------------------------------
    // ÉCOLE
    // --------------------------------------------------

    const { data: profile } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      setLoading(false);
      return;
    }

    // --------------------------------------------------
    // CRÉER RESPONSABLE
    // --------------------------------------------------

    const { data: guardian, error } =
      await supabase
        .from("guardians")
        .insert({
          school_id: profile.school_id,
          first_name: firstName,
          last_name: lastName,
          phone,
          email: email || null,
        })
        .select()
        .maybeSingle();

    if (error || !guardian) {
      console.error(error);
      setLoading(false);
      return;
    }

    // --------------------------------------------------
    // RELIER À L'ÉLÈVE
    // --------------------------------------------------

    const { error: relationError } =
      await supabase
        .from("student_guardians")
        .insert({
          student_id: studentId,
          guardian_id: guardian.id,
          relationship,
          is_primary: primary,
          is_financial_responsible: financial,
          is_emergency_contact: emergency,
        });

    if (relationError) {
      console.error(relationError);
      setLoading(false);
      return;
    }

    router.push(`/students/${studentId}`);
    router.refresh();
  }

  return (
    <main className="p-6 lg:p-8 text-slate-800">

      <div className="mx-auto max-w-2xl">

        <a
          href="/students"
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          ← Élèves
        </a>

        <h1 className="mt-5 text-3xl font-bold text-slate-900">
          Ajouter un responsable
        </h1>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6"
        >

          <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">

            <h2 className="text-lg font-bold text-slate-900">
              Informations du responsable
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">

              <Input
                label="Prénom"
                value={firstName}
                onChange={setFirstName}
              />

              <Input
                label="Nom"
                value={lastName}
                onChange={setLastName}
              />

              <Input
                label="Téléphone"
                value={phone}
                onChange={setPhone}
              />

              <Input
                label="Email"
                value={email}
                onChange={setEmail}
              />

            </div>

          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">

            <h2 className="text-lg font-bold text-slate-900">
              Relation avec l'élève
            </h2>

            <select
              value={relationship}
              onChange={(e) =>
                setRelationship(e.target.value)
              }
              className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-3 bg-white outline-none focus:border-blue-500"
            >
              <option>Mère</option>
              <option>Père</option>
              <option>Tuteur</option>
              <option>Tutrice</option>
              <option>Grand-parent</option>
              <option>Frère / sœur</option>
              <option>Autre</option>
            </select>

            <div className="mt-6 space-y-4">

              <Check
                label="Responsable principal"
                checked={primary}
                onChange={setPrimary}
              />

              <Check
                label="Responsable financier"
                checked={financial}
                onChange={setFinancial}
              />

              <Check
                label="Contact d'urgence"
                checked={emergency}
                onChange={setEmergency}
              />

            </div>

          </section>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading
              ? "Enregistrement..."
              : "Ajouter le responsable"}
          </button>

        </form>

      </div>

    </main>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full rounded-xl border border-slate-200 px-4 py-3 bg-white outline-none focus:border-blue-500 text-slate-900"
      />

    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">

      <input
        type="checkbox"
        checked={checked}
        onChange={(e) =>
          onChange(e.target.checked)
        }
        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      />

      <span className="text-sm text-slate-700 font-medium">
        {label}
      </span>

    </label>
  );
}
