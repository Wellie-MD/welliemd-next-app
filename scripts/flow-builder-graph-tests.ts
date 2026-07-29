import assert from "node:assert/strict";
import type { Program } from "../src/features/treatments/types/programs";
import type { ProgramQuestion, VisibilityRuleGroup } from "../src/features/treatments/types/questions";
import type { ProgramCheckoutProduct } from "../src/features/treatments/types/checkout";
import {
  applyFocusToProgramFlowGraph,
  buildStaticProgramFlowGraph,
} from "../src/features/treatments/programs/flow-builder/utils/programFlowGraph";
import {
  MAX_VISIBLE_CHOICES,
  choiceHandleId,
  getProductSource,
  nodeHeight,
} from "../src/features/treatments/programs/flow-builder/utils/flowLayoutHelpers";
import { normalizeProgramFlowData } from "../src/features/treatments/programs/flow-builder/utils/flowNormalizer";

const group = (questionId: string, value: string): VisibilityRuleGroup => ({
  mode: "simple",
  rules: [{ questionId, operator: "equals", value }],
});

const question = (overrides: Partial<ProgramQuestion> & Pick<ProgramQuestion, "id" | "order">): ProgramQuestion => ({
  id: overrides.id,
  order: overrides.order,
  text: overrides.text || overrides.id,
  kind: overrides.kind || "single_choice",
  section: overrides.section || "Screening",
  required: overrides.required ?? true,
  choices: overrides.choices,
  dqChoices: overrides.dqChoices,
  visibilityRule: overrides.visibilityRule,
  visibilityRuleGroup: overrides.visibilityRuleGroup,
  flags: overrides.flags,
});

const product = (overrides: Partial<ProgramCheckoutProduct> & Pick<ProgramCheckoutProduct, "id">): ProgramCheckoutProduct => ({
  id: overrides.id,
  category: overrides.category || "GLP",
  regimen: overrides.regimen || "Standard",
  doseLabel: overrides.doseLabel || overrides.id,
  productRole: overrides.productRole || "primary_choice",
  visibilityRules: overrides.visibilityRules,
});

const program = (products: ProgramCheckoutProduct[] = []): Program => ({
  id: "program-1",
  name: "Program",
  stage: "intake",
  treatmentTypeKey: "glp",
  visitType: "weightloss",
  questionCount: 0,
  checkoutQuestionCount: products.length ? 1 : 0,
  status: "draft",
  updatedAt: "2026-07-10",
  slug: "program",
  consentIds: [],
  checkoutQuestions: products.length
    ? [{ id: "checkout-question", text: "Choose treatment", products, visibilityRules: { mode: "simple", rules: [] } }]
    : [],
});

const edge = (graph: ReturnType<typeof buildStaticProgramFlowGraph>, idPrefix: string) =>
  graph.edges.find((candidate) => candidate.id.startsWith(idPrefix));

const node = (graph: ReturnType<typeof buildStaticProgramFlowGraph>, id: string) => {
  const result = graph.nodes.find((candidate) => candidate.id === id);
  assert.ok(result, `Expected node ${id}`);
  return result;
};

const test = (name: string, run: () => void) => {
  run();
  console.log(`PASS ${name}`);
};

test("linear program keeps deterministic spine order", () => {
  const questions = [question({ id: "q1", order: 1 }), question({ id: "q2", order: 2 })];
  const graph = buildStaticProgramFlowGraph(program(), questions, []);
  const ids = graph.nodes.map((item) => item.id);
  assert.deepEqual(ids.slice(0, 4), ["start", "auth", "q1", "q2"]);
  assert.ok(node(graph, "q1").position.y < node(graph, "q2").position.y);
  assert.equal(edge(graph, "edge-seq-q1-q2")?.data?.kind, "sequential");
});

test("conditional child uses exact answer handle", () => {
  const questions = [
    question({ id: "parent", order: 1, choices: ["Yes", "No"] }),
    question({ id: "child", order: 2, visibilityRuleGroup: group("parent", "Yes") }),
  ];
  const conditional = edge(buildStaticProgramFlowGraph(program(), questions, []), "edge-cond-parent-child");
  assert.equal(conditional?.data?.kind, "conditional");
  assert.equal(conditional?.sourceHandle, choiceHandleId("Yes"));
});

test("nested child remains conditional", () => {
  const questions = [
    question({ id: "root", order: 1, choices: ["Yes"] }),
    question({ id: "child", order: 2, choices: ["Continue"], visibilityRuleGroup: group("root", "Yes") }),
    question({ id: "nested", order: 3, visibilityRuleGroup: group("child", "Continue") }),
  ];
  const nestedEdge = edge(buildStaticProgramFlowGraph(program(), questions, []), "edge-cond-child-nested");
  assert.equal(nestedEdge?.data?.kind, "conditional");
  assert.equal(nestedEdge?.sourceHandle, choiceHandleId("Continue"));
});

test("branch siblings reserve vertical space", () => {
  const questions = [
    question({ id: "root", order: 1, choices: ["A", "B"] }),
    question({ id: "a", order: 2, choices: ["1", "2", "3"], visibilityRuleGroup: group("root", "A") }),
    question({ id: "b", order: 3, visibilityRuleGroup: group("root", "B") }),
  ];
  const graph = buildStaticProgramFlowGraph(program(), questions, []);
  const a = node(graph, "a");
  const b = node(graph, "b");
  assert.ok(b.position.y >= a.position.y + nodeHeight(questions[1]), "Branch cards overlap vertically");
});

test("single passing branch answer creates exact return route", () => {
  const questions = [
    question({ id: "root", order: 1, choices: ["Open"] }),
    question({ id: "branch", order: 2, choices: ["Continue", "Stop"], dqChoices: ["Stop"], visibilityRuleGroup: group("root", "Open") }),
    question({ id: "after", order: 3 }),
  ];
  const returnEdge = edge(buildStaticProgramFlowGraph(program(), questions, []), "edge-return-branch-after");
  assert.equal(returnEdge?.data?.kind, "return");
  assert.equal(returnEdge?.sourceHandle, choiceHandleId("Continue"));
});

test("multiple passing answers return from node bottom", () => {
  const questions = [
    question({ id: "root", order: 1, choices: ["Open"] }),
    question({ id: "branch", order: 2, choices: ["A", "B"], visibilityRuleGroup: group("root", "Open") }),
    question({ id: "after", order: 3 }),
  ];
  assert.equal(edge(buildStaticProgramFlowGraph(program(), questions, []), "edge-return-branch-after")?.sourceHandle, "bottom");
});

test("product route resolves semantic question text and exact answer", () => {
  const questions = [
    question({ id: "uuid-upload", order: 1, text: "Upload a medication photo", kind: "file_upload" }),
    question({ id: "uuid-pref", order: 2, text: "Which medication do you prefer?", choices: ["Semaglutide"] }),
  ];
  const checkoutProduct = product({
    id: "p1",
    visibilityRules: {
      mode: "nested",
      rules: [],
      subgroups: [group("uuid-upload", "Uploaded"), group("uuid-pref", "Semaglutide")],
    },
  });
  const source = getProductSource(checkoutProduct, new Map(questions.map((item) => [item.id, item])));
  assert.equal(source?.questionId, "uuid-pref");
  assert.equal(source?.reason, "new_patient_preference");
  const productEdge = edge(buildStaticProgramFlowGraph(program([checkoutProduct]), questions, []), "edge-product-p1");
  assert.equal(productEdge?.sourceHandle, choiceHandleId("Semaglutide"));
  assert.equal(productEdge?.data?.kind, "product");
});

test("unconditional product falls back to checkout", () => {
  const graph = buildStaticProgramFlowGraph(program([product({ id: "p1" })]), [], []);
  const productEdge = edge(graph, "edge-product-p1");
  assert.equal(productEdge?.source, "checkout");
  assert.equal(productEdge?.data?.kind, "product");
});

test("long answer list has deterministic bounded height and handles", () => {
  const choices = Array.from({ length: 12 }, (_, index) => `Choice ${index + 1}`);
  const item = question({ id: "long", order: 1, choices });
  assert.ok(nodeHeight(item) > 116);
  assert.equal(MAX_VISIBLE_CHOICES, 5);
  assert.equal(choiceHandleId(choices[0]), "choice-Choice%201");
});

test("node focus does not select all answers", () => {
  const questions = [question({ id: "q1", order: 1, choices: ["Yes", "No"] })];
  const staticGraph = buildStaticProgramFlowGraph(program(), questions, []);
  const focused = applyFocusToProgramFlowGraph(staticGraph, program(), questions, "q1", null);
  assert.deepEqual(node(focused, "q1").data.focusedChoices, []);
});

test("choice focus selects only the exact answer and route", () => {
  const questions = [
    question({ id: "root", order: 1, choices: ["Yes", "No"] }),
    question({ id: "child", order: 2, visibilityRuleGroup: group("root", "Yes") }),
  ];
  const staticGraph = buildStaticProgramFlowGraph(program(), questions, []);
  const focused = applyFocusToProgramFlowGraph(staticGraph, program(), questions, "root", { nodeId: "root", value: "Yes" });
  assert.deepEqual(node(focused, "root").data.focusedChoices, ["Yes"]);
  assert.equal(edge(focused, "edge-cond-root-child")?.data?.active, true);
});

test("route focus dims non-matching connectors and keeps only the exact route above them", () => {
  const questions = [
    question({ id: "root", order: 1, choices: ["Yes", "No"] }),
    question({ id: "yes-child", order: 2, visibilityRuleGroup: group("root", "Yes") }),
    question({ id: "no-child", order: 3, visibilityRuleGroup: group("root", "No") }),
  ];
  const staticGraph = buildStaticProgramFlowGraph(program(), questions, []);
  const focused = applyFocusToProgramFlowGraph(staticGraph, program(), questions, "root", { nodeId: "root", value: "Yes" });
  assert.equal(edge(focused, "edge-cond-root-yes-child")?.data?.active, true);
  assert.equal(edge(focused, "edge-cond-root-yes-child")?.data?.dimmed, false);
  assert.equal(edge(focused, "edge-cond-root-no-child")?.data?.active, false);
  assert.equal(edge(focused, "edge-cond-root-no-child")?.data?.dimmed, true);
  assert.ok((edge(focused, "edge-cond-root-yes-child")?.zIndex || 0) > (edge(focused, "edge-cond-root-no-child")?.zIndex || 0));
});

test("node focus traces direct routes without falsely selecting answer rows", () => {
  const questions = [
    question({ id: "root", order: 1, choices: ["Yes", "No"] }),
    question({ id: "child", order: 2, visibilityRuleGroup: group("root", "Yes") }),
  ];
  const staticGraph = buildStaticProgramFlowGraph(program(), questions, []);
  const focused = applyFocusToProgramFlowGraph(staticGraph, program(), questions, "child", null);
  assert.equal(edge(focused, "edge-cond-root-child")?.data?.active, true);
  assert.deepEqual(node(focused, "root").data.focusedChoices, []);
  assert.equal(edge(focused, "edge-seq-start-auth")?.data?.dimmed, true);
});

test("product focus traces source answer as product", () => {
  const questions = [question({ id: "pref", order: 1, text: "Medication preference", choices: ["Sema"] })];
  const checkoutProduct = product({ id: "p1", visibilityRules: group("pref", "Sema") });
  const currentProgram = program([checkoutProduct]);
  const staticGraph = buildStaticProgramFlowGraph(currentProgram, questions, []);
  const focused = applyFocusToProgramFlowGraph(staticGraph, currentProgram, questions, "product-card-p1", null);
  assert.deepEqual(node(focused, "pref").data.focusedChoices, ["Sema"]);
  assert.equal(node(focused, "pref").data.focusedChoiceKinds.Sema, "product");
});

test("invalid parent remains visible and reports diagnostic", () => {
  const questions = [question({ id: "orphan", order: 1, visibilityRuleGroup: group("missing", "Yes") })];
  const normalized = normalizeProgramFlowData(questions);
  assert.deepEqual(normalized.spineQuestions.map((item) => item.id), ["orphan"]);
  assert.equal(normalized.issues[0]?.type, "invalid_parent");
  assert.ok(node(buildStaticProgramFlowGraph(program(), questions, []), "orphan"));
});

test("self reference remains visible and reports diagnostic", () => {
  const questions = [question({ id: "self", order: 1, visibilityRuleGroup: group("self", "Yes") })];
  const normalized = normalizeProgramFlowData(questions);
  assert.equal(normalized.spineQuestions[0]?.id, "self");
  assert.equal(normalized.issues[0]?.type, "self_reference");
});

test("missing trigger value remains on spine and reports diagnostic", () => {
  const questions = [
    question({ id: "parent", order: 1, choices: ["Yes"] }),
    question({ id: "missing-value", order: 2, visibilityRule: { questionId: "parent", value: "" } }),
  ];
  const normalized = normalizeProgramFlowData(questions);
  assert.ok(normalized.spineQuestions.some((item) => item.id === "missing-value"));
  assert.equal(normalized.issues.find((issue) => issue.questionId === "missing-value")?.type, "missing_value");
});

test("cyclic visibility is broken deterministically without losing nodes", () => {
  const questions = [
    question({ id: "a", order: 1, visibilityRuleGroup: group("b", "Yes") }),
    question({ id: "b", order: 2, visibilityRuleGroup: group("a", "Yes") }),
  ];
  const normalized = normalizeProgramFlowData(questions);
  assert.equal(normalized.spineQuestions[0]?.id, "a");
  assert.equal(normalized.parentOf.get("b"), "a");
  assert.equal(normalized.issues.find((issue) => issue.type === "cycle")?.questionId, "a");
  const graph = buildStaticProgramFlowGraph(program(), questions, []);
  assert.ok(node(graph, "a"));
  assert.ok(node(graph, "b"));
});

test("deep branch chains remain visible beyond layout lane limit", () => {
  const questions: ProgramQuestion[] = [question({ id: "root", order: 1, choices: ["Next"] })];
  for (let index = 1; index <= 8; index += 1) {
    questions.push(
      question({
        id: `depth-${index}`,
        order: index + 1,
        choices: ["Next"],
        visibilityRuleGroup: group(index === 1 ? "root" : `depth-${index - 1}`, "Next"),
      })
    );
  }
  const graph = buildStaticProgramFlowGraph(program(), questions, []);
  questions.forEach((item) => assert.ok(node(graph, item.id)));
  assert.equal(edge(graph, "edge-cond-depth-7-depth-8")?.data?.kind, "conditional");
});

test("large program produces stable unique graph without overlaps in each branch column", () => {
  const root = question({ id: "root", order: 1, choices: Array.from({ length: 25 }, (_, index) => `Route ${index}`) });
  const branches = Array.from({ length: 25 }, (_, index) =>
    question({ id: `branch-${index}`, order: index + 2, visibilityRuleGroup: group("root", `Route ${index}`) })
  );
  const products = Array.from({ length: 20 }, (_, index) => product({ id: `product-${index}` }));
  const graph = buildStaticProgramFlowGraph(program(products), [root, ...branches], []);
  assert.equal(new Set(graph.nodes.map((item) => item.id)).size, graph.nodes.length);
  assert.equal(new Set(graph.edges.map((item) => item.id)).size, graph.edges.length);

  const branchNodes = branches.map((item) => node(graph, item.id)).sort((a, b) => a.position.y - b.position.y);
  for (let index = 1; index < branchNodes.length; index += 1) {
    const previous = branchNodes[index - 1];
    const current = branchNodes[index];
    assert.ok(current.position.y >= previous.position.y + Number(previous.data.nodeHeight), "Large branch cards overlap");
  }
});

console.log("All Program Flow Builder graph tests passed.");
