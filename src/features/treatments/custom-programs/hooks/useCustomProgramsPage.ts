import { useMemo, useState } from "react";
import { useCustomPrograms } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import type { CustomProgram } from "@/features/treatments/types";

export type CustomProgramsViewMode = "card" | "list";
export type CustomProgramsFilter = "all" | "multi" | "single";

export function isCustomProgramMulti(program: CustomProgram) {
  return program.isMulti === true || program.includedProgramIds.length > 1 || Boolean(program.tags?.includes("Multi-treatment"));
}

export function useCustomProgramsPage() {
  const { data: customPrograms = [] } = useCustomPrograms();

  const [viewMode, setViewMode] = useState<CustomProgramsViewMode>("card");
  const [filter, setFilter] = useState<CustomProgramsFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const multiCount = useMemo(() => customPrograms.filter(isCustomProgramMulti).length, [customPrograms]);
  const singleCount = useMemo(() => customPrograms.filter((program) => !isCustomProgramMulti(program)).length, [customPrograms]);

  const filteredPrograms = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return customPrograms.filter((program) => {
      if (filter === "multi" && !isCustomProgramMulti(program)) return false;
      if (filter === "single" && isCustomProgramMulti(program)) return false;
      if (!query) return true;
      return (
        program.name.toLowerCase().includes(query) ||
        program.description.toLowerCase().includes(query) ||
        program.onboardingName?.toLowerCase().includes(query) ||
        program.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [customPrograms, filter, searchQuery]);

  const groupedPrograms = useMemo(() => {
    return filteredPrograms.reduce(
      (groups, program) => {
        if (isCustomProgramMulti(program)) groups.multi.push(program);
        else groups.single.push(program);
        return groups;
      },
      { multi: [] as CustomProgram[], single: [] as CustomProgram[] }
    );
  }, [filteredPrograms]);

  const handleClearFilters = () => {
    setFilter("all");
    setSearchQuery("");
  };

  return {
    customPrograms,
    filteredPrograms,
    groupedPrograms,
    multiCount,
    singleCount,
    viewMode,
    setViewMode,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    handleClearFilters,
  };
}
