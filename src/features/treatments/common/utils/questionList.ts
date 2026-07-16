import type { ProgramQuestion } from "@/features/treatments/types";

export function filterQuestions(questions: ProgramQuestion[], searchQuery: string, typeFilter: string) {
  let result = [...questions].sort((a, b) => a.order - b.order);
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    result = result.filter((question) =>
      question.text.toLowerCase().includes(query) || question.kind.toLowerCase().includes(query)
    );
  }
  if (typeFilter !== "all") {
    result = result.filter((question) => typeFilter === "single"
      ? question.kind === "single_choice" || question.kind === "yes_no"
      : question.kind === typeFilter);
  }
  return result;
}

export function countQuestionTypes(questions: ProgramQuestion[]) {
  const counts = { all: questions.length, single: 0, checkout: 0, multiple: 0, consent: 0, number: 0, date: 0 };
  for (const question of questions) {
    if (question.kind === "single_choice" || question.kind === "yes_no") counts.single++;
    else if (question.kind === "multiple_choice") counts.multiple++;
    else if (question.kind === "checkout") counts.checkout++;
    else if (question.kind === "consent") counts.consent++;
    else if (question.kind === "number") counts.number++;
    else if (question.kind === "date") counts.date++;
  }
  return counts;
}
