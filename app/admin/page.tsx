import type { Metadata } from "next";
import { isAdminAuthenticated } from "../lib/adminAuth";
import { AdminDashboard } from "./AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel da Lista | Nataniel & Yasmin",
  description: "Área administrativa da lista de presentes.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminPage() {
  return (
    <AdminDashboard
      initialAuthenticated={await isAdminAuthenticated()}
    />
  );
}
