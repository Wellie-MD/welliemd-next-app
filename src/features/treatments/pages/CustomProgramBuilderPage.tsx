import { useParams } from "react-router-dom";
import { AddToFlowDrawerStub } from "../components/builder/AddToFlowDrawerStub";
import { CustomProgramFlowBuilder } from "../components/builder/CustomProgramFlowBuilder";
import { PrototypeNotice } from "../components/common";
import {
  useConsents,
  useCustomProgram,
  usePrograms,
  useSections,
} from "../hooks/useTreatmentLibraries";

export default function CustomProgramBuilderPage() {
  const { customProgramId = "custom-universal" } = useParams();
  const { data: customProgram } = useCustomProgram(customProgramId);
  const { data: programs = [] } = usePrograms();
  const { data: sections = [] } = useSections();
  const { data: consents = [] } = useConsents();

  if (!customProgram) {
    return <div className="p-6">Custom program not found.</div>;
  }

  return (
    <div className="space-y-4 p-6">
      <PrototypeNotice>
        Builder must match the prototype list view, flow view, add-to-flow drawer, slug editing, preview, and save controls.
      </PrototypeNotice>
      <CustomProgramFlowBuilder customProgram={customProgram} />
      <AddToFlowDrawerStub programs={programs} sections={sections} consents={consents} />
    </div>
  );
}
