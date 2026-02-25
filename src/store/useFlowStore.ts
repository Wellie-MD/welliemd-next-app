import { create } from "zustand";
import { Node, Edge } from "reactflow";
import { Question, QuestionnaireTemplate } from "@/api/questionnaires";

export type FilterType = "all" | "archived" | "unused" | "locked";
export type FlowViewMode = "overview" | "focus" | "edit" | "checkout";

interface FlowState {
  // Template data
  template: QuestionnaireTemplate | null;
  questions: Question[];

  // Flow state
  nodes: Node[];
  edges: Edge[];

  // UI state
  selectedNodeId: string | null;
  searchQuery: string;
  activeFilter: FilterType;
  sidebarCollapsed: boolean;
  viewMode: FlowViewMode;
  focusDepth: number;
  showEdgeLabels: boolean;
  autoModeEnabled: boolean;
  complexityScore: number;

  // Question metadata
  lockedQuestions: Set<string>;
  archivedQuestions: Set<string>;

  // Actions
  setTemplate: (template: QuestionnaireTemplate) => void;
  setQuestions: (questions: Question[]) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setSelectedNodeId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setActiveFilter: (filter: FilterType) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setViewMode: (mode: FlowViewMode) => void;
  setFocusDepth: (depth: number) => void;
  setShowEdgeLabels: (show: boolean) => void;
  setAutoModeEnabled: (enabled: boolean) => void;
  setComplexityScore: (score: number) => void;

  // Question actions
  toggleLockQuestion: (questionId: string) => void;
  toggleArchiveQuestion: (questionId: string) => void;
  duplicateQuestion: (questionId: string) => void;
  deleteQuestion: (questionId: string) => void;

  // Flow actions
  addNode: (node: Node) => void;
  updateNode: (nodeId: string, data: Partial<Node["data"]>) => void;
  removeNode: (nodeId: string) => void;
  addEdge: (edge: Edge) => void;
  removeEdge: (edgeId: string) => void;

  // Computed
  getFilteredQuestions: () => Question[];
  getUnusedQuestions: () => Question[];
  isQuestionLocked: (questionId: string) => boolean;
  isQuestionArchived: (questionId: string) => boolean;

  // Reset
  reset: () => void;
}

export const useFlowStore = create<FlowState>((set, get) => ({
  // Initial state
  template: null,
  questions: [],
  nodes: [],
  edges: [],
  selectedNodeId: null,
  searchQuery: "",
  activeFilter: "all",
  sidebarCollapsed: false,
  viewMode: "edit",
  focusDepth: 2,
  showEdgeLabels: true,
  autoModeEnabled: true,
  complexityScore: 0,
  lockedQuestions: new Set(),
  archivedQuestions: new Set(),

  // Setters
  setTemplate: (template) => set({ template }),
  setQuestions: (questions) => set({ questions }),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setFocusDepth: (depth) => set({ focusDepth: depth }),
  setShowEdgeLabels: (show) => set({ showEdgeLabels: show }),
  setAutoModeEnabled: (enabled) => set({ autoModeEnabled: enabled }),
  setComplexityScore: (score) => set({ complexityScore: score }),

  // Question actions
  toggleLockQuestion: (questionId) => {
    const { lockedQuestions } = get();
    const newLocked = new Set(lockedQuestions);
    if (newLocked.has(questionId)) {
      newLocked.delete(questionId);
    } else {
      newLocked.add(questionId);
    }
    set({ lockedQuestions: newLocked });
  },

  toggleArchiveQuestion: (questionId) => {
    const { archivedQuestions, nodes, edges } = get();
    const newArchived = new Set(archivedQuestions);

    if (newArchived.has(questionId)) {
      newArchived.delete(questionId);
    } else {
      newArchived.add(questionId);
      // Remove from canvas when archived
      const newNodes = nodes.filter((n) => n.id !== questionId);
      const newEdges = edges.filter(
        (e) => e.source !== questionId && e.target !== questionId
      );
      set({ nodes: newNodes, edges: newEdges });
    }

    set({ archivedQuestions: newArchived });
  },

  duplicateQuestion: (questionId) => {
    const { questions, nodes } = get();
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    const newQuestion: Question = {
      ...question,
      id: `temp-${Date.now()}`,
      question_text: `${question.question_text} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const existingNode = nodes.find((n) => n.id === questionId);
    const newNode: Node = {
      id: newQuestion.id,
      type: "questionNode",
      position: existingNode
        ? { x: existingNode.position.x + 50, y: existingNode.position.y + 50 }
        : { x: Math.random() * 300 + 100, y: Math.random() * 300 + 200 },
      data: { question: newQuestion },
    };

    set({
      questions: [...questions, newQuestion],
      nodes: [...nodes, newNode],
    });
  },

  deleteQuestion: (questionId) => {
    const { questions, nodes, edges, lockedQuestions, archivedQuestions } =
      get();

    const newQuestions = questions.filter((q) => q.id !== questionId);
    const newNodes = nodes.filter((n) => n.id !== questionId);
    const newEdges = edges.filter(
      (e) => e.source !== questionId && e.target !== questionId
    );

    const newLocked = new Set(lockedQuestions);
    newLocked.delete(questionId);

    const newArchived = new Set(archivedQuestions);
    newArchived.delete(questionId);

    set({
      questions: newQuestions,
      nodes: newNodes,
      edges: newEdges,
      lockedQuestions: newLocked,
      archivedQuestions: newArchived,
    });
  },

  // Flow actions
  addNode: (node) => {
    const { nodes } = get();
    set({ nodes: [...nodes, node] });
  },

  updateNode: (nodeId, data) => {
    const { nodes, questions } = get();
    const newNodes = nodes.map((node) =>
      node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
    );

    // Also update in questions array
    const newQuestions = questions.map((q) =>
      q.id === nodeId && data.question ? { ...q, ...data.question } : q
    );

    set({ nodes: newNodes, questions: newQuestions });
  },

  removeNode: (nodeId) => {
    const { nodes, edges } = get();
    const newNodes = nodes.filter((n) => n.id !== nodeId);
    const newEdges = edges.filter(
      (e) => e.source !== nodeId && e.target !== nodeId
    );
    set({ nodes: newNodes, edges: newEdges });
  },

  addEdge: (edge) => {
    const { edges } = get();
    set({ edges: [...edges, edge] });
  },

  removeEdge: (edgeId) => {
    const { edges } = get();
    set({ edges: edges.filter((e) => e.id !== edgeId) });
  },

  // Computed
  getFilteredQuestions: () => {
    const {
      questions,
      searchQuery,
      activeFilter,
      lockedQuestions,
      archivedQuestions,
      nodes,
    } = get();

    let filtered = questions;

    // Apply filter
    if (activeFilter === "archived") {
      filtered = filtered.filter((q) => archivedQuestions.has(q.id));
    } else if (activeFilter === "locked") {
      filtered = filtered.filter((q) => lockedQuestions.has(q.id));
    } else if (activeFilter === "unused") {
      const usedIds = new Set(nodes.map((n) => n.id));
      filtered = filtered.filter(
        (q) => !usedIds.has(q.id) && !archivedQuestions.has(q.id)
      );
    } else {
      // 'all' - exclude archived
      filtered = filtered.filter((q) => !archivedQuestions.has(q.id));
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (q) =>
          q.question_text.toLowerCase().includes(query) ||
          q.question_type.toLowerCase().includes(query) ||
          q.id.toLowerCase().includes(query)
      );
    }

    return filtered;
  },

  getUnusedQuestions: () => {
    const { questions, nodes, archivedQuestions } = get();
    const usedIds = new Set(nodes.map((n) => n.id));
    return questions.filter(
      (q) => !usedIds.has(q.id) && !archivedQuestions.has(q.id)
    );
  },

  isQuestionLocked: (questionId) => {
    return get().lockedQuestions.has(questionId);
  },

  isQuestionArchived: (questionId) => {
    return get().archivedQuestions.has(questionId);
  },

  reset: () =>
    set({
      template: null,
      questions: [],
      nodes: [],
      edges: [],
      selectedNodeId: null,
      searchQuery: "",
      activeFilter: "all",
      sidebarCollapsed: false,
      viewMode: "edit",
      focusDepth: 2,
      showEdgeLabels: true,
      autoModeEnabled: true,
      complexityScore: 0,
      lockedQuestions: new Set(),
      archivedQuestions: new Set(),
    }),
}));
