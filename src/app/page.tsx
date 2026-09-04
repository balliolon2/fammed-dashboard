import { getPatientCases, getClinicFormulary } from "@/app/actions";
import { DashboardWorklist } from "@/components/DashboardWorklist";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [cases, formularyStock] = await Promise.all([
    getPatientCases(),
    getClinicFormulary(),
  ]);

  return <DashboardWorklist cases={cases as any} formularyStock={formularyStock} />;
}
