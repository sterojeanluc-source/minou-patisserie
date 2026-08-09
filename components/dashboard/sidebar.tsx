"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  {
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    label: "Élèves",
    href: "/students",
  },
  {
    label: "Classes",
    href: "/classes",
  },
  {
    label: "Notes",
    href: "/grades",
  },
  {
    label: "Présence",
    href: "/attendance",
  },
  {
    label: "Paiements",
    href: "/payments",
  },
  {
    label: "Bulletins",
    href: "/reports",
  },
  {
    label: "Communication",
    href: "/communication",
  },
  {
    label: "Paramètres",
    href: "/settings",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block shadow-sm">

      <div className="p-6">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Lekòl Pam
          </h1>

          <p className="text-xs text-slate-500">
            Gestion scolaire
          </p>
        </div>

        <nav className="space-y-1">

          {links.map((link) => {
            const active =
              pathname === link.href ||
              pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

        </nav>

      </div>

    </aside>
  );
}
