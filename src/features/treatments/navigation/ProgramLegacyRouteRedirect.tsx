import { Navigate, useParams } from "react-router-dom";

import { CLIENT_TREATMENT_ROUTES } from "@/features/treatments/navigation/routes";

export function ProgramLegacyRouteRedirect() {
  const { programId } = useParams();
  return (
    <Navigate
      replace
      to={
        programId
          ? CLIENT_TREATMENT_ROUTES.programQuestions(programId)
          : CLIENT_TREATMENT_ROUTES.programs
      }
    />
  );
}
