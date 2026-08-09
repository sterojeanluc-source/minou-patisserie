export type Role =
  | "DIRECTOR"
  | "ADMIN"
  | "SECRETARY"
  | "TEACHER"
  | "ACCOUNTANT"
  | "PARENT"
  | "STUDENT";

export const permissions = {
  DIRECTOR: [
    "dashboard.view",
    "students.view",
    "students.create",
    "students.update",
    "classes.view",
    "classes.manage",
    "grades.view",
    "grades.manage",
    "attendance.view",
    "attendance.manage",
    "payments.view",
    "payments.manage",
    "settings.view",
    "settings.manage",
    "users.manage",
  ],

  ADMIN: [
    "dashboard.view",
    "students.view",
    "students.create",
    "students.update",
    "classes.view",
    "classes.manage",
    "grades.view",
    "attendance.view",
    "payments.view",
  ],

  SECRETARY: [
    "dashboard.view",
    "students.view",
    "students.create",
    "students.update",
    "classes.view",
    "attendance.view",
    "payments.view",
  ],

  TEACHER: [
    "dashboard.view",
    "students.view",
    "classes.view",
    "grades.view",
    "grades.manage",
    "attendance.view",
    "attendance.manage",
  ],

  ACCOUNTANT: [
    "dashboard.view",
    "students.view",
    "payments.view",
    "payments.manage",
  ],

  PARENT: [
    "dashboard.view",
    "students.view",
    "grades.view",
    "attendance.view",
    "payments.view",
  ],

  STUDENT: [
    "dashboard.view",
    "grades.view",
    "attendance.view",
  ],
} as const;
