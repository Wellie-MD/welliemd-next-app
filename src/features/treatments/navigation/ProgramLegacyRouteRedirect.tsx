import { Navigate, useParams } from "react-router-dom";

import { ADMIN_TREATMENT_ROUTES } from "@/features/treatments/navigation/routes";

export function ProgramLegacyRouteRedirect() {
  const { programId } = useParams();
  return (
    <Navigate
      replace
      to={
        programId
          ? ADMIN_TREATMENT_ROUTES.programQuestions(programId)
          : ADMIN_TREATMENT_ROUTES.programs
      }
    />
  );
}
