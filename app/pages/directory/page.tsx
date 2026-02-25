import Link from "next/link";
import { Footer } from "../../components/Footer";
import { FadeInSection } from "../../components/FadeInSection";
import { getSupabaseServer } from "../../lib/supabase/server";
import { DirectoryExplorer } from "./components/DirectoryExplorer";

type DepartmentRow = {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

const LOCATION_BY_DEPARTMENT: Record<string, string> = {
  "General Medicine": "Main OPD - Ground Floor",
  Pediatrics: "Pediatric Wing - Ground Floor",
  "OB-GYN": "Women’s Health Wing - 2nd Floor",
  Cardiology: "Heart Center - 2nd Floor",
  Orthopedics: "Bone & Joint Clinic - 3rd Floor",
  Dermatology: "Skin Care Unit - 3rd Floor",
  Pulmonology: "Respiratory Unit - 2nd Floor",
  Gastroenterology: "Digestive Care Unit - 2nd Floor",
  Dental: "Dental Clinic - Ground Floor",
};

function getLocationLabel(departmentName: string): string {
  return LOCATION_BY_DEPARTMENT[departmentName] ?? "Main Outpatient Department";
}

export default async function DirectoryPage() {
  const supabase = getSupabaseServer();

  let departments: DepartmentRow[] = [];
  let loadError = "";

  if (!supabase) {
    loadError = "Database is not configured.";
  } else {
    const { data, error } = await supabase
      .from("departments")
      .select("id, name, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      loadError = "Failed to load departments.";
    } else {
      departments = (data ?? []) as DepartmentRow[];
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#212529] flex flex-col">
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <FadeInSection delay={40}>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#333333] hover:text-[#007bff] transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>

          <h1 className="mt-6 text-3xl font-bold text-[#333333]">Directory</h1>
          <p className="mt-2 text-sm text-[#6C757D]">
            Find departments, service locations, and floor-level guidance before check-in.
          </p>
        </FadeInSection>

        <FadeInSection delay={120} className="mt-6">
          <section className="rounded-xl border border-[#E9ECEF] bg-white p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-[#333333]">What this page does</h2>
            <p className="mt-2 text-sm text-[#6C757D]">
              This directory helps patients locate the right clinic area quickly by showing active departments, exact service locations, and map highlights.
            </p>
          </section>
        </FadeInSection>

        <FadeInSection delay={200} className="mt-6">
          <section>
          {loadError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{loadError}</div>
          ) : departments.length === 0 ? (
            <div className="rounded-xl border border-[#E9ECEF] bg-white p-6 text-sm text-[#6C757D]">
              No active departments found.
            </div>
          ) : (
            <DirectoryExplorer
              departments={departments.map((department) => ({
                id: department.id,
                name: department.name,
                location: getLocationLabel(department.name),
              }))}
            />
          )}
          </section>
        </FadeInSection>
      </main>
      <Footer />
    </div>
  );
}