import { useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactFlow, {
  Background,
  Node,
  Edge,
  Connection,
  addEdge as addReactFlowEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowRight,
  Ban,
  Save,
  Plus,
  LayoutGrid,
  Maximize2,
  CircleHelp,
  GitBranch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { templateApi, questionApi, Question } from "@/api/questionnaires";
import {
  FLOWBUILDER_AUTO_GROUPING_COMPLEXITY_THRESHOLD,
  FLOWBUILDER_BENCHMARK_QUERY_PARAM,
  FLOWBUILDER_DEFERRED_INITIAL_LAYOUT_QUESTION_THRESHOLD,
  FLOWBUILDER_INTERACTION_EDGE_CAP,
  FLOWBUILDER_INTERACTION_EDGE_COMPLEXITY_THRESHOLD,
  FLOWBUILDER_LAYOUT_CACHE_LIMIT,
  FLOWBUILDER_LAYOUT_EDGE_LIMIT,
  FLOWBUILDER_LOW_ZOOM_COMPLEXITY_THRESHOLD,
  FLOWBUILDER_LOW_ZOOM_EDGE_CAP,
  FLOWBUILDER_LOW_ZOOM_EDGE_SIMPLIFY_THRESHOLD,
  FLOWBUILDER_MODE_BY_COMPLEXITY,
  FLOWBUILDER_OVERVIEW_EDGE_CAP,
  FLOWBUILDER_ZOOM_ANIMATION_MS,
  FLOWBUILDER_ZOOM_STEP,
} from "@/constants/flowBuilder";
import { QuestionNode } from "@/components/questionnaires/nodes/QuestionNode";
import { DisqualifyNode } from "@/components/questionnaires/nodes/DisqualifyNode";
import { ConditionalEdge } from "@/components/questionnaires/nodes/ConditionalEdge";
import { FlowSidebar } from "@/components/questionnaires/FlowSidebar";
import { AddQuestionnairesForm } from "@/components/questionnaires/AddQuestionnairesForm";
import { EdgeConditionDialog } from "@/components/questionnaires/EdgeConditionDialog";
import { useToast } from "@/hooks/use-toast";
import { FlowViewMode, useFlowStore } from "@/store/useFlowStore";
import {
  getLayoutedElements,
  getQuickStructuredLayout,
  validateFlow,
} from "@/utils/flowLayout";
import { buildFlowMetrics } from "@/utils/flowMetrics";
import { normalizeChoiceDisplay } from "@/utils/choiceValue";
import {
  getDescendantDepthMap,
  getFocusVisibleNodeIds,
  getHubNodes,
} from "@/utils/flowVisibility";
import { generateFlowFromTemplate } from "@/services/flowGeneratorService";
import { AxiosError } from "axios";

const nodeTypes = {
  questionNode: QuestionNode,
  disqualifyNode: DisqualifyNode,
};

const edgeTypes = {
  conditional: ConditionalEdge,
};

interface FlowBenchmarkState {
  loadMs: number | null;
  score: number | null;
  baselineScore: number | null;
}

interface AutoLayoutOptions {
  scope?: "visible" | "full";
  focusPrimaryQuestion?: boolean;
}

interface CheckoutQuestionListItem {
  nodeId: string;
  question: Question | null;
}

interface CheckoutConditionRow {
  edgeId: string;
  direction: "incoming" | "outgoing";
  sourceNodeId: string;
  targetNodeId: string;
  sourceLabel: string;
  targetLabel: string;
  sourceOrderIndex: number | null;
  targetOrderIndex: number | null;
  edgeKind: "default" | "conditional" | "disqualify";
  operator: string | null;
  triggerValue: string | null;
  conditionLabel: string;
}

const CHECKOUT_CONDITION_VALUE_PREVIEW_MAX = 72;

function isBenchmarkEnabled(): boolean {
  if (import.meta.env.VITE_FLOWBUILDER_BENCHMARK === "true") return true;
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get(FLOWBUILDER_BENCHMARK_QUERY_PARAM) === "1";
}

function logFlowbuilderError(
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>
): void {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";
  console.error("[FlowBuilder][error]", {
    context,
    message,
    metadata: metadata || {},
  });
}

function getRecommendedViewMode(complexityScore: number): FlowViewMode {
  if (complexityScore >= FLOWBUILDER_MODE_BY_COMPLEXITY.overview) {
    return "overview";
  }
  return "edit";
}

function buildLayoutCacheKey(
  nodes: Node[],
  edges: Edge[],
  mode: FlowViewMode
): string {
  const nodePart = nodes.map((node) => node.id).sort().join("|");
  const edgePart = edges
    .map((edge) => `${edge.source}->${edge.target}:${edge.sourceHandle || "_"}`)
    .sort()
    .join("|");
  return `${mode}::${nodePart}::${edgePart}`;
}

function getLayoutComputationEdges(
  edges: Edge[],
  limit: number = FLOWBUILDER_LAYOUT_EDGE_LIMIT
): Edge[] {
  if (edges.length <= limit) return edges;

  const unique: Edge[] = [];
  const seen = new Set<string>();

  for (const edge of edges) {
    const key = `${edge.source}->${edge.target}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(edge);
    if (unique.length >= limit) break;
  }

  return unique.length > 0 ? unique : edges.slice(0, limit);
}

function buildGraphStructureSignature(nodes: Node[], edges: Edge[]): string {
  const nodeSignature = nodes
    .map((node) => node.id)
    .sort()
    .join("|");
  const edgeSignature = edges
    .map(
      (edge) =>
        `${edge.source}->${edge.target}:${edge.sourceHandle || "_"}:${edge.targetHandle || "_"}`
    )
    .sort()
    .join("|");
  return `${nodeSignature}::${edgeSignature}`;
}

function getPrimaryQuestionNodeId(nodes: Node[], edges: Edge[]): string | null {
  const questionNodes = nodes.filter((node) => node.type === "questionNode");
  if (questionNodes.length === 0) return null;

  const questionNodeIds = new Set(questionNodes.map((node) => node.id));
  const indegreeByNodeId = new Map<string, number>();
  questionNodes.forEach((node) => indegreeByNodeId.set(node.id, 0));

  edges.forEach((edge) => {
    if (!questionNodeIds.has(edge.target)) return;
    indegreeByNodeId.set(edge.target, (indegreeByNodeId.get(edge.target) || 0) + 1);
  });

  const compareByOrder = (a: Node, b: Node) => {
    const aOrder = a.data?.question?.order_index ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.data?.question?.order_index ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.id.localeCompare(b.id);
  };

  const roots = questionNodes
    .filter((node) => (indegreeByNodeId.get(node.id) || 0) === 0)
    .sort(compareByOrder);

  if (roots.length > 0) return roots[0].id;

  const sortedQuestions = [...questionNodes].sort(compareByOrder);
  return sortedQuestions[0]?.id ?? null;
}

function ControlTooltip({
  content,
  children,
  side = "bottom",
}: {
  content: string;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs text-xs">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

function truncateWithEllipsis(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1))}…`;
}

function isCheckoutQuestionNode(node: Node): boolean {
  return (
    node.type === "questionNode" &&
    String(node.data?.question?.question_type ?? "").toLowerCase() === "checkout"
  );
}

const FLOWBUILDER_GUIDE_SECTIONS: Array<{
  title: string;
  description: string;
  bullets: string[];
}> = [
  {
    title: "Canvas Navigation",
    description: "Move through large graphs smoothly without losing context.",
    bullets: [
      "Use mouse wheel or bottom +/- buttons to zoom.",
      "Drag empty canvas to pan quickly.",
      "Use `Fit` to re-center the currently visible graph.",
    ],
  },
  {
    title: "View Modes",
    description: "Each mode is optimized for a different job.",
    bullets: [
      "`Overview`: high-level map for complex templates.",
      "`Focus`: isolates one branch around the selected hub/question.",
      "`Full Edit`: full graph editing and connection workflow.",
    ],
  },
  {
    title: "Branch Hubs",
    description: "Hubs identify key branching questions with high fan-out.",
    bullets: [
      "Click a hub in the sidebar to jump into that branch.",
      "Fan-out count tells how many downstream branches it drives.",
      "Use hubs first when auditing large conditional templates.",
    ],
  },
  {
    title: "Clarity Controls",
    description: "Reduce visual noise while preserving logic.",
    bullets: [
      "`Group`: hides deeper descendants in Overview.",
      "`Labels`: toggle conditional labels on edges.",
      "`Auto Layout`: re-structures graph positions after major edits.",
    ],
  },
  {
    title: "Quality & Save",
    description: "Validate before saving and keep conditional logic safe.",
    bullets: [
      "`Validate`: checks graph issues like structure and connectivity.",
      "`Save`: persists flow + conditional logic to backend.",
      "`Focus First`: jumps to the root/first question fast.",
    ],
  },
];

function FlowBuilderContent() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fitView, zoomTo, getZoom, setCenter } = useReactFlow();

  const {
    template,
    setTemplate,
    setQuestions,
    selectedNodeId,
    setSelectedNodeId,
    updateNode,
    isQuestionLocked,
    viewMode,
    setViewMode,
    focusDepth,
    setFocusDepth,
    showEdgeLabels,
    setShowEdgeLabels,
    autoModeEnabled,
    setAutoModeEnabled,
    complexityScore,
    setComplexityScore,
    reset,
  } = useFlowStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [edgeDialogOpen, setEdgeDialogOpen] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<{
    source: string;
    target: string;
  } | null>(null);
  const [currentZoom, setCurrentZoom] = useState(1);
  const [initialAutoLayoutPending, setInitialAutoLayoutPending] = useState(false);
  const benchmarkEnabled = useMemo(() => isBenchmarkEnabled(), []);
  const [groupingEnabled, setGroupingEnabled] = useState(false);
  const [isAutoLayouting, setIsAutoLayouting] = useState(false);
  const layoutCacheRef = useRef<Map<string, { nodes: Node[]; edges: Edge[] }>>(
    new Map()
  );
  const structureSignatureRef = useRef<string>("");
  const [benchmark, setBenchmark] = useState<FlowBenchmarkState>({
    loadMs: null,
    score: null,
    baselineScore: null,
  });
  const [guideOpen, setGuideOpen] = useState(false);
  const [checkoutSearchQuery, setCheckoutSearchQuery] = useState("");
  const [checkoutOnlyConditional, setCheckoutOnlyConditional] = useState(false);
  const [isViewportMoving, setIsViewportMoving] = useState(false);
  const zoomAnimationFrameRef = useRef<number | null>(null);
  const pendingZoomRef = useRef<number | null>(null);
  const checkoutListItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const recordBenchmarkLoad = useCallback(
    (durationMs: number) => {
      if (!benchmarkEnabled) return;

      const safeDuration = Math.max(0, Math.round(durationMs));
      setBenchmark((previous) => {
        const next: FlowBenchmarkState = {
          ...previous,
          loadMs: safeDuration,
          score: safeDuration,
        };
        return next;
      });
    },
    [benchmarkEnabled]
  );

  // Fetch template data and initialize flow
  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const fetchTemplate = async () => {
      if (!templateId) return;
      const loadStart = performance.now();

      try {
        const data = await templateApi.getTemplate(templateId, {
          signal: controller.signal,
        });
        if (!isActive) return;
        setTemplate(data);

        if (benchmarkEnabled) {
          const baselineKey = `flowbuilder_benchmark_baseline_${data.id}`;
          let baselineScore: number | null = null;
          try {
            const rawBaseline = localStorage.getItem(baselineKey);
            if (rawBaseline !== null) {
              const parsed = Number(rawBaseline);
              if (Number.isFinite(parsed)) {
                baselineScore = parsed;
              }
            }
          } catch {
            // Ignore storage issues in benchmark mode.
          }

          setBenchmark((previous) => ({
            ...previous,
            loadMs: null,
            score: null,
            baselineScore,
          }));
        }
        
        // Ensure questions is an array
        const questionsList = Array.isArray(data.questions) ? data.questions : [];
        setQuestions(questionsList);

        // Generate flow using the service
        if (questionsList.length > 0) {
          const shouldDeferInitialLayout =
            questionsList.length >=
            FLOWBUILDER_DEFERRED_INITIAL_LAYOUT_QUESTION_THRESHOLD;
          const flowResult = generateFlowFromTemplate(
            data,
            !shouldDeferInitialLayout
          );
          const initialNodes = shouldDeferInitialLayout
            ? getQuickStructuredLayout(flowResult.nodes, flowResult.edges)
            : flowResult.nodes;

          setNodes(initialNodes);
          setEdges(flowResult.edges);

          const metrics = buildFlowMetrics(data, {
            nodeCount: initialNodes.length,
            edges: flowResult.edges,
            rootNodeIds: flowResult.rootNodes,
          });
          setComplexityScore(metrics.complexityScore);
          if (useFlowStore.getState().autoModeEnabled) {
            const recommendedMode = getRecommendedViewMode(
              metrics.complexityScore
            );
            setViewMode(recommendedMode);
            setShowEdgeLabels(recommendedMode === "edit");
            setGroupingEnabled(
              recommendedMode === "overview" &&
                metrics.complexityScore >=
                  FLOWBUILDER_AUTO_GROUPING_COMPLEXITY_THRESHOLD
            );
          }
          setInitialAutoLayoutPending(true);

          if (import.meta.env.DEV) {
            console.info(`[FlowBuilder][metrics] ${JSON.stringify(metrics)}`);
          }

          recordBenchmarkLoad(performance.now() - loadStart);

          requestAnimationFrame(() => {
            if (!isActive) return;
            fitView({
              padding: 0.2,
              duration: shouldDeferInitialLayout ? 120 : 260,
              maxZoom: 1.2,
            });
          });

        } else {
          setComplexityScore(0);
          setGroupingEnabled(false);
          setInitialAutoLayoutPending(false);
          if (useFlowStore.getState().autoModeEnabled) {
            setViewMode("edit");
            setShowEdgeLabels(true);
          }
          console.warn("No questions found in template");
        }
      } catch (error: unknown) {
        if (
          error instanceof AxiosError &&
          (error.code === "ERR_CANCELED" || error.name === "CanceledError")
        ) {
          return;
        }
        if (!isActive) return;
        logFlowbuilderError("fetch_template", error, { templateId });
        toast({
          title: "Error",
          description: "Failed to load template",
          variant: "destructive",
        });
      }
    };

    fetchTemplate();

    return () => {
      isActive = false;
      controller.abort();
      reset();
    };
  }, [
    fitView,
    reset,
    setEdges,
    setNodes,
    setQuestions,
    setTemplate,
    setComplexityScore,
    setShowEdgeLabels,
    setViewMode,
    benchmarkEnabled,
    recordBenchmarkLoad,
    templateId,
    toast,
  ]);

  useEffect(() => {
    if (!benchmarkEnabled) return;
    if (!template?.id) return;
    if (benchmark.score === null) return;

    try {
      localStorage.setItem(
        `flowbuilder_benchmark_latest_${template.id}`,
        String(benchmark.score)
      );
    } catch {
      // Ignore storage issues in benchmark mode.
    }
  }, [benchmark.score, benchmarkEnabled, template?.id]);

  useEffect(() => {
    setInitialAutoLayoutPending(false);
    layoutCacheRef.current.clear();
    structureSignatureRef.current = "";
  }, [templateId]);

  // Sync structural graph changes with store (skip position-only churn).
  useEffect(() => {
    const nextStructureSignature = buildGraphStructureSignature(nodes, edges);
    if (structureSignatureRef.current === nextStructureSignature) return;
    structureSignatureRef.current = nextStructureSignature;
    useFlowStore.setState({ nodes, edges });
  }, [nodes, edges]);

  // Initialize zoom level once
  useEffect(() => {
    setCurrentZoom(getZoom());
  }, [getZoom]);

  const commitPendingZoom = useCallback(() => {
    const pendingZoom = pendingZoomRef.current;
    zoomAnimationFrameRef.current = null;
    if (pendingZoom === null) return;
    setCurrentZoom((previousZoom) =>
      Math.abs(previousZoom - pendingZoom) < 0.005 ? previousZoom : pendingZoom
    );
  }, []);

  const onMoveStart = useCallback(() => {
    setIsViewportMoving(true);
  }, []);

  const onMove = useCallback(
    (_event: unknown, viewport: { zoom: number }) => {
      pendingZoomRef.current = viewport.zoom;
      if (zoomAnimationFrameRef.current !== null) return;
      zoomAnimationFrameRef.current = requestAnimationFrame(commitPendingZoom);
    },
    [commitPendingZoom]
  );

  const onMoveEnd = useCallback(
    (_event: unknown, viewport: { zoom: number }) => {
      pendingZoomRef.current = viewport.zoom;
      if (zoomAnimationFrameRef.current !== null) {
        cancelAnimationFrame(zoomAnimationFrameRef.current);
        zoomAnimationFrameRef.current = null;
      }
      setCurrentZoom((previousZoom) =>
        Math.abs(previousZoom - viewport.zoom) < 0.001
          ? previousZoom
          : viewport.zoom
      );
      setIsViewportMoving(false);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (zoomAnimationFrameRef.current !== null) {
        cancelAnimationFrame(zoomAnimationFrameRef.current);
      }
    };
  }, []);

  const reduceEdgeMotion = useMemo(() => {
    return viewMode !== "edit" && complexityScore >= 700;
  }, [complexityScore, viewMode]);

  const renderedEdges = useMemo(() => {
    const baseEdges = reduceEdgeMotion
      ? edges.map((edge) => ({
          ...edge,
          animated: false,
        }))
      : edges;

    if (viewMode !== "overview" || complexityScore < 700) {
      return baseEdges;
    }

    const prioritizedEdges = baseEdges.filter(
      (edge) =>
        edge.type === "default" ||
        edge.data?.condition?.operator === "disqualify"
    );
    const remainingEdges = baseEdges.filter(
      (edge) =>
        edge.type !== "default" &&
        edge.data?.condition?.operator !== "disqualify"
    );

    return [...prioritizedEdges, ...remainingEdges].slice(
      0,
      FLOWBUILDER_OVERVIEW_EDGE_CAP
    );
  }, [complexityScore, edges, reduceEdgeMotion, viewMode]);

  const applyViewMode = useCallback(
    (mode: FlowViewMode) => {
      if (viewMode === mode && autoModeEnabled === false) return;
      setAutoModeEnabled(false);
      if (viewMode !== mode) {
        setViewMode(mode);
      }
      const shouldShowLabels = mode === "edit";
      if (showEdgeLabels !== shouldShowLabels) {
        setShowEdgeLabels(shouldShowLabels);
      }
    },
    [
      autoModeEnabled,
      setAutoModeEnabled,
      setShowEdgeLabels,
      setViewMode,
      showEdgeLabels,
      viewMode,
    ]
  );

  const handleAutoModeToggle = useCallback(() => {
    const nextEnabled = !autoModeEnabled;
    setAutoModeEnabled(nextEnabled);
    if (nextEnabled) {
      const recommendedMode = getRecommendedViewMode(complexityScore);
      setViewMode(recommendedMode);
      setShowEdgeLabels(recommendedMode === "edit");
    }
  }, [
    autoModeEnabled,
    complexityScore,
    setAutoModeEnabled,
    setShowEdgeLabels,
    setViewMode,
  ]);

  const handleResetOverview = useCallback(() => {
    setAutoModeEnabled(false);
    setViewMode("overview");
    setShowEdgeLabels(false);
    setGroupingEnabled(false);
    setSelectedNodeId(null);
    fitView({ padding: 0.2, duration: 300 });
  }, [
    fitView,
    setAutoModeEnabled,
    setSelectedNodeId,
    setShowEdgeLabels,
    setViewMode,
  ]);

  const safeVisitType = useMemo(() => {
    if (template?.beluga_visit_type === "UC") {
      return "UC";
    }
    return "ED";
  }, [template?.beluga_visit_type]);

  const safeFocusDepth = useMemo(() => {
    if (focusDepth === 1 || focusDepth === 2 || focusDepth === 3) {
      return focusDepth;
    }
    return 2;
  }, [focusDepth]);

  const benchmarkDeltaPct = useMemo(() => {
    if (benchmark.score === null || benchmark.baselineScore === null) {
      return null;
    }
    if (benchmark.baselineScore === 0) {
      return null;
    }
    const delta =
      ((benchmark.baselineScore - benchmark.score) / benchmark.baselineScore) *
      100;
    return Math.round(delta);
  }, [benchmark.baselineScore, benchmark.score]);

  const handleSetBenchmarkBaseline = useCallback(() => {
    if (!benchmarkEnabled) return;
    if (!template?.id) return;
    if (benchmark.score === null) return;

    const baselineKey = `flowbuilder_benchmark_baseline_${template.id}`;
    try {
      localStorage.setItem(baselineKey, String(benchmark.score));
    } catch {
      // Ignore storage issues in benchmark mode.
    }

    setBenchmark((previous) => ({
      ...previous,
      baselineScore: benchmark.score,
    }));
  }, [benchmark.score, benchmarkEnabled, template?.id]);

  const hubNodes = useMemo(() => {
    try {
      return getHubNodes(nodes, edges);
    } catch (error) {
      logFlowbuilderError("build_hub_nodes", error, {
        nodeCount: nodes.length,
        edgeCount: edges.length,
      });
      return [];
    }
  }, [edges, nodes]);

  const focusCenterNodeId = useMemo(() => {
    if (viewMode !== "focus") return null;
    return selectedNodeId || hubNodes[0]?.questionId || null;
  }, [hubNodes, selectedNodeId, viewMode]);

  const focusVisibleNodeIds = useMemo(() => {
    if (viewMode !== "focus" || !focusCenterNodeId) return null;
    try {
      return getFocusVisibleNodeIds(
        nodes,
        edges,
        focusCenterNodeId,
        safeFocusDepth
      );
    } catch (error) {
      logFlowbuilderError("compute_focus_visibility", error, {
        centerNodeId: focusCenterNodeId,
        focusDepth: safeFocusDepth,
        nodeCount: nodes.length,
        edgeCount: edges.length,
      });
      return null;
    }
  }, [edges, focusCenterNodeId, nodes, safeFocusDepth, viewMode]);

  const checkoutQuestionList = useMemo<CheckoutQuestionListItem[]>(() => {
    return nodes
      .filter(isCheckoutQuestionNode)
      .sort((a, b) => {
        const aOrder = a.data?.question?.order_index ?? Number.MAX_SAFE_INTEGER;
        const bOrder = b.data?.question?.order_index ?? Number.MAX_SAFE_INTEGER;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.id.localeCompare(b.id);
      })
      .map((node) => ({
        nodeId: node.id,
        question: (node.data?.question as Question | undefined) ?? null,
      }));
  }, [nodes]);

  const filteredCheckoutQuestionList = useMemo(() => {
    const query = checkoutSearchQuery.trim().toLowerCase();
    if (!query) return checkoutQuestionList;

    return checkoutQuestionList.filter((item) => {
      const q = item.question;
      if (!q) return item.nodeId.toLowerCase().includes(query);
      return (
        q.question_text.toLowerCase().includes(query) ||
        q.question_type.toLowerCase().includes(query) ||
        String(q.order_index).includes(query) ||
        item.nodeId.toLowerCase().includes(query)
      );
    });
  }, [checkoutQuestionList, checkoutSearchQuery]);

  const checkoutConditionCountByNodeId = useMemo(() => {
    const counts = new Map<string, { incoming: number; outgoing: number; conditionalIn: number }>();
    checkoutQuestionList.forEach((item) => {
      counts.set(item.nodeId, { incoming: 0, outgoing: 0, conditionalIn: 0 });
    });
    edges.forEach((edge) => {
      const targetCounts = counts.get(edge.target);
      if (targetCounts) {
        targetCounts.incoming += 1;
        if (edge.type !== "default") targetCounts.conditionalIn += 1;
      }
      const sourceCounts = counts.get(edge.source);
      if (sourceCounts) {
        sourceCounts.outgoing += 1;
      }
    });
    return counts;
  }, [checkoutQuestionList, edges]);

  const groupedHiddenNodeIds = useMemo(() => {
    if (!groupingEnabled) return new Set<string>();
    if (viewMode !== "overview") return new Set<string>();
    if (hubNodes.length === 0) return new Set<string>();

    try {
      const hidden = new Set<string>();
      hubNodes.forEach((hub) => {
        const depthMap = getDescendantDepthMap(nodes, edges, hub.questionId, 5);
        depthMap.forEach((depth, nodeId) => {
          if (depth >= 2) {
            hidden.add(nodeId);
          }
        });
      });

      if (selectedNodeId) {
        hidden.delete(selectedNodeId);
      }
      hidden.delete("disqualify-node");
      return hidden;
    } catch (error) {
      logFlowbuilderError("compute_overview_grouping", error, {
        hubCount: hubNodes.length,
        nodeCount: nodes.length,
        edgeCount: edges.length,
      });
      return new Set<string>();
    }
  }, [
    edges,
    groupingEnabled,
    hubNodes,
    nodes,
    selectedNodeId,
    viewMode,
  ]);

  const renderedNodes = useMemo(() => {
    if (viewMode === "focus" && focusVisibleNodeIds) {
      return nodes.filter((node) => focusVisibleNodeIds.has(node.id));
    }
    if (viewMode === "overview" && groupedHiddenNodeIds.size > 0) {
      return nodes.filter((node) => !groupedHiddenNodeIds.has(node.id));
    }
    return nodes;
  }, [focusVisibleNodeIds, groupedHiddenNodeIds, nodes, viewMode]);

  const visibleEdges = useMemo(() => {
    if (viewMode === "focus" && focusVisibleNodeIds) {
      return renderedEdges.filter(
        (edge) =>
          focusVisibleNodeIds.has(edge.source) &&
          focusVisibleNodeIds.has(edge.target)
      );
    }
    if (viewMode === "overview" && groupedHiddenNodeIds.size > 0) {
      return renderedEdges.filter(
        (edge) =>
          !groupedHiddenNodeIds.has(edge.source) &&
          !groupedHiddenNodeIds.has(edge.target)
      );
    }
    return renderedEdges;
  }, [focusVisibleNodeIds, groupedHiddenNodeIds, renderedEdges, viewMode]);

  const selectedCheckoutQuestion = useMemo(() => {
    if (viewMode !== "checkout") return null;
    if (checkoutQuestionList.length === 0) return null;
    return (
      checkoutQuestionList.find((item) => item.nodeId === selectedNodeId) ??
      checkoutQuestionList[0]
    );
  }, [checkoutQuestionList, selectedNodeId, viewMode]);

  const checkoutConditionRows = useMemo<CheckoutConditionRow[]>(() => {
    if (!selectedCheckoutQuestion) return [];

    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const isDisqualifyEdge = (edge: Edge) =>
      edge.target === "disqualify-node" || edge.data?.condition?.operator === "disqualify";

    const toRow = (edge: Edge, direction: "incoming" | "outgoing"): CheckoutConditionRow => {
      const sourceNode = nodeById.get(edge.source);
      const targetNode = nodeById.get(edge.target);
      const sourceQuestion = sourceNode?.data?.question as Question | undefined;
      const targetQuestion = targetNode?.data?.question as Question | undefined;
      const operator =
        typeof edge.data?.condition?.operator === "string" ? edge.data.condition.operator : null;
      const triggerValue =
        typeof edge.data?.condition?.value === "string"
          ? edge.data.condition.value
          : edge.data?.condition?.value != null
            ? String(edge.data.condition.value)
            : null;
      const edgeKind: CheckoutConditionRow["edgeKind"] = isDisqualifyEdge(edge)
        ? "disqualify"
        : edge.type === "default"
          ? "default"
          : "conditional";

      const conditionLabel =
        typeof edge.label === "string"
          ? edge.label
          : typeof edge.data?.label === "string"
            ? edge.data.label
            : edgeKind === "default"
              ? "Sequential flow"
              : edgeKind === "disqualify"
                ? "Disqualifies"
                : "Conditional";

      return {
        edgeId: edge.id,
        direction,
        sourceNodeId: edge.source,
        targetNodeId: edge.target,
        sourceLabel:
          edge.source === "disqualify-node"
            ? "Disqualify"
            : sourceQuestion?.question_text || "Unknown source",
        targetLabel:
          edge.target === "disqualify-node"
            ? "Disqualify"
            : targetQuestion?.question_text || "Unknown target",
        sourceOrderIndex:
          edge.source === "disqualify-node" ? null : sourceQuestion?.order_index ?? null,
        targetOrderIndex:
          edge.target === "disqualify-node" ? null : targetQuestion?.order_index ?? null,
        edgeKind,
        operator,
        triggerValue,
        conditionLabel,
      };
    };

    const incomingRows = edges
      .filter((edge) => edge.target === selectedCheckoutQuestion.nodeId)
      .map((edge) => toRow(edge, "incoming"));
    const outgoingRows = edges
      .filter((edge) => edge.source === selectedCheckoutQuestion.nodeId)
      .map((edge) => toRow(edge, "outgoing"));

    return [...incomingRows, ...outgoingRows];
  }, [edges, nodes, selectedCheckoutQuestion]);

  const filteredCheckoutConditionRows = useMemo(() => {
    if (!checkoutOnlyConditional) return checkoutConditionRows;
    return checkoutConditionRows.filter(
      (row) => row.edgeKind === "conditional" || row.edgeKind === "disqualify"
    );
  }, [checkoutConditionRows, checkoutOnlyConditional]);

  const selectedCheckoutIncomingCount = useMemo(
    () => checkoutConditionRows.filter((row) => row.direction === "incoming").length,
    [checkoutConditionRows]
  );

  const selectedCheckoutOutgoingCount = useMemo(
    () => checkoutConditionRows.filter((row) => row.direction === "outgoing").length,
    [checkoutConditionRows]
  );

  const isLowZoomEdgeSimplificationEnabled = useMemo(() => {
    return (
      currentZoom <= FLOWBUILDER_LOW_ZOOM_EDGE_SIMPLIFY_THRESHOLD &&
      complexityScore >= FLOWBUILDER_LOW_ZOOM_COMPLEXITY_THRESHOLD &&
      visibleEdges.length > FLOWBUILDER_LOW_ZOOM_EDGE_CAP
    );
  }, [complexityScore, currentZoom, visibleEdges.length]);

  const isInteractionEdgeSimplificationEnabled = useMemo(() => {
    return (
      isViewportMoving &&
      complexityScore >= FLOWBUILDER_INTERACTION_EDGE_COMPLEXITY_THRESHOLD &&
      visibleEdges.length > FLOWBUILDER_INTERACTION_EDGE_CAP
    );
  }, [complexityScore, isViewportMoving, visibleEdges.length]);

  const isEdgeSimplificationEnabled =
    isLowZoomEdgeSimplificationEnabled || isInteractionEdgeSimplificationEnabled;

  const canvasEdges = useMemo(() => {
    if (!isEdgeSimplificationEnabled) {
      return visibleEdges;
    }

    const edgeCap = isInteractionEdgeSimplificationEnabled
      ? FLOWBUILDER_INTERACTION_EDGE_CAP
      : FLOWBUILDER_LOW_ZOOM_EDGE_CAP;

    const prioritizedEdges: Edge[] = [];
    const remainingEdges: Edge[] = [];
    for (const edge of visibleEdges) {
      const isPriority =
        edge.type === "default" || edge.data?.condition?.operator === "disqualify";
      if (isPriority) {
        prioritizedEdges.push(edge);
      } else {
        remainingEdges.push(edge);
      }
    }

    const merged = prioritizedEdges.concat(remainingEdges).slice(0, edgeCap);

    return merged.map((edge) => {
        const isDisqualify = edge.data?.condition?.operator === "disqualify";
        return {
          ...edge,
          type: "default",
          animated: false,
          label: undefined,
          style: {
            ...edge.style,
            stroke: isDisqualify ? "#ef4444" : "#94a3b8",
            strokeWidth: isDisqualify ? 1.8 : 1.1,
            opacity: isDisqualify ? 0.92 : 0.68,
          },
        };
      });
  }, [isEdgeSimplificationEnabled, isInteractionEdgeSimplificationEnabled, visibleEdges]);

  useEffect(() => {
    if (viewMode !== "focus") return;
    if (selectedNodeId) return;
    if (hubNodes.length === 0) return;
    setSelectedNodeId(hubNodes[0].questionId);
  }, [hubNodes, selectedNodeId, setSelectedNodeId, viewMode]);

  useEffect(() => {
    if (viewMode !== "checkout") return;
    if (checkoutQuestionList.length === 0) return;
    const firstCheckoutNodeId = checkoutQuestionList[0].nodeId;
    const hasSelectedCheckout = checkoutQuestionList.some(
      (item) => item.nodeId === selectedNodeId
    );
    if (!hasSelectedCheckout) {
      setSelectedNodeId(firstCheckoutNodeId);
      return;
    }
  }, [checkoutQuestionList, selectedNodeId, setSelectedNodeId, viewMode]);

  useEffect(() => {
    if (viewMode !== "checkout") return;
    const selectedId =
      checkoutQuestionList.find((item) => item.nodeId === selectedNodeId)?.nodeId ??
      checkoutQuestionList[0]?.nodeId;
    if (!selectedId) return;
    const itemEl = checkoutListItemRefs.current[selectedId];
    if (!itemEl) return;
    requestAnimationFrame(() => {
      itemEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }, [checkoutQuestionList, selectedNodeId, viewMode]);

  // Handle node selection from canvas
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (selectedNodeId !== node.id) {
        setSelectedNodeId(node.id);
      }
    },
    [selectedNodeId, setSelectedNodeId]
  );

  // Handle question selection from sidebar with focus and zoom
  const handleQuestionSelect = useCallback(
    (questionId: string | null) => {
      if (!questionId) {
        if (selectedNodeId !== null) {
          setSelectedNodeId(null);
        }
        return;
      }

      // Set the selected node
      if (selectedNodeId !== questionId) {
        setSelectedNodeId(questionId);
      }

      // Find the node and focus on it
      const selectedNode = nodes.find((n) => n.id === questionId);
      if (selectedNode) {
        requestAnimationFrame(() => {
          setCenter(
            selectedNode.position.x + 200, // Center on node (accounting for node width)
            selectedNode.position.y + 90, // Center on node (accounting for node height)
            { zoom: 0.85, duration: 220 }
          );
        });
      }
    },
    [nodes, selectedNodeId, setSelectedNodeId, setCenter]
  );

  const handleHubFocus = useCallback(
    (questionId: string) => {
      setAutoModeEnabled(false);
      if (viewMode !== "focus") {
        setViewMode("focus");
      }
      requestAnimationFrame(() => {
        handleQuestionSelect(questionId);
      });
    },
    [
      handleQuestionSelect,
      setAutoModeEnabled,
      setViewMode,
      viewMode,
    ]
  );

  const handleCheckoutQuestionSelect = useCallback(
    (questionId: string) => {
      setAutoModeEnabled(false);
      if (viewMode !== "checkout") {
        setViewMode("checkout");
      }
      if (selectedNodeId !== questionId) setSelectedNodeId(questionId);
    },
    [selectedNodeId, setAutoModeEnabled, setSelectedNodeId, setViewMode, viewMode]
  );

  const handleOpenFullEditFromCheckout = useCallback(
    (questionId: string | null | undefined) => {
      setAutoModeEnabled(false);
      if (viewMode !== "edit") {
        setViewMode("edit");
      }
      if (!questionId) return;
      requestAnimationFrame(() => {
        handleQuestionSelect(questionId);
      });
    },
    [handleQuestionSelect, setAutoModeEnabled, setViewMode, viewMode]
  );

  const handleCopyCheckoutReference = useCallback(
    async (kind: "id" | "q", item: CheckoutQuestionListItem | null | undefined) => {
      if (!item) return;
      const text =
        kind === "id"
          ? item.nodeId
          : item.question?.order_index != null
            ? `Q${item.question.order_index}`
            : item.nodeId;

      try {
        await navigator.clipboard.writeText(text);
        toast({
          title: "Copied",
          description: kind === "id" ? "Question ID copied." : "Question reference copied.",
        });
      } catch {
        toast({
          title: "Copy failed",
          description: "Clipboard access is unavailable in this browser context.",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const focusPrimaryQuestion = useCallback(
    (zoom: number = 0.85, duration: number = 220) => {
      const primaryQuestionNodeId = getPrimaryQuestionNodeId(nodes, edges);
      if (!primaryQuestionNodeId) return;

      const primaryNode = nodes.find((node) => node.id === primaryQuestionNodeId);
      if (!primaryNode) return;

      if (selectedNodeId !== primaryQuestionNodeId) {
        setSelectedNodeId(primaryQuestionNodeId);
      }

      requestAnimationFrame(() => {
        setCenter(
          primaryNode.position.x + 200,
          primaryNode.position.y + 90,
          { zoom, duration }
        );
      });
    },
    [edges, nodes, selectedNodeId, setCenter, setSelectedNodeId]
  );

  // Handle connections between nodes
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;

      // Check if source is locked
      if (isQuestionLocked(params.source)) {
        toast({
          title: "Cannot connect",
          description: "The source question is locked",
          variant: "destructive",
        });
        return;
      }

      // Check if target is locked
      if (isQuestionLocked(params.target)) {
        toast({
          title: "Cannot connect",
          description: "The target question is locked",
          variant: "destructive",
        });
        return;
      }

      // Open dialog to set condition
      setPendingConnection({ source: params.source, target: params.target });
      setEdgeDialogOpen(true);
    },
    [isQuestionLocked, toast]
  );

  // Confirm edge with condition
  const handleEdgeConditionConfirm = useCallback(
    (condition: { value: string; operator: string }) => {
      if (!pendingConnection) return;

      const newEdge: Edge = {
        id: `e-${pendingConnection.source}-${pendingConnection.target}`,
        source: pendingConnection.source,
        target: pendingConnection.target,
        type: "conditional",
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#ef4444",
        },
        data: {
          label: condition.value,
          condition,
        },
      };

      setEdges((eds) => addReactFlowEdge(newEdge, eds));

      // Update target question's conditional_logic
      const targetNode = nodes.find((n) => n.id === pendingConnection.target);
      if (targetNode) {
        updateNode(pendingConnection.target, {
          question: {
            ...targetNode.data.question,
            conditional_logic: {
              show_if: {
                question_id: pendingConnection.source,
                value: condition.value,
                operator: condition.operator,
              },
            },
          },
        });
      }

      setPendingConnection(null);
    },
    [pendingConnection, nodes, setEdges, updateNode]
  );

  // Handle add question
  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setModalOpen(true);
  };

  // Handle edit question
  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setModalOpen(true);
  };

  // Handle question save success
  const handleQuestionSaveSuccess = async () => {
    setModalOpen(false);

    // Refetch template to get updated questions
    if (templateId) {
      try {
        const data = await templateApi.getTemplate(templateId);
        setQuestions(data.questions || []);

        // Regenerate flow while preserving manual position adjustments
        const flowResult = generateFlowFromTemplate(data, false);

        // Merge with existing positions where possible
        const updatedNodes = flowResult.nodes.map((newNode) => {
          const existingNode = nodes.find((n) => n.id === newNode.id);
          return existingNode
            ? { ...newNode, position: existingNode.position }
            : newNode;
        });

        setNodes(updatedNodes);
        setEdges(flowResult.edges);

        const metrics = buildFlowMetrics(data, {
          nodeCount: updatedNodes.length,
          edges: flowResult.edges,
          rootNodeIds: flowResult.rootNodes,
        });
        setComplexityScore(metrics.complexityScore);
        if (useFlowStore.getState().autoModeEnabled) {
          const recommendedMode = getRecommendedViewMode(metrics.complexityScore);
          setViewMode(recommendedMode);
          setShowEdgeLabels(recommendedMode === "edit");
          setGroupingEnabled(
            recommendedMode === "overview" &&
              metrics.complexityScore >=
                FLOWBUILDER_AUTO_GROUPING_COMPLEXITY_THRESHOLD
          );
        }
      } catch (error) {
        logFlowbuilderError("refresh_questions", error, { templateId });
      }
    }
  };

  // Auto layout with horizontal arrangement and focus on first node
  const handleAutoLayout = useCallback((options: AutoLayoutOptions = {}) => {
    if (isAutoLayouting) return;
    setIsAutoLayouting(true);
    try {
      const layoutScope =
        options.scope || (viewMode !== "edit" ? "visible" : "full");
      const layoutInputNodes = layoutScope === "full" ? nodes : renderedNodes;
      const layoutInputEdges = layoutScope === "full" ? edges : visibleEdges;
      const layoutComputationEdges = getLayoutComputationEdges(layoutInputEdges);
      const shouldFocusPrimaryQuestion = options.focusPrimaryQuestion === true;
      const primaryQuestionNodeId = shouldFocusPrimaryQuestion
        ? getPrimaryQuestionNodeId(nodes, edges)
        : null;

      const cacheKey = buildLayoutCacheKey(
        layoutInputNodes,
        layoutComputationEdges,
        viewMode
      );
      const cached = layoutCacheRef.current.get(cacheKey);

      const layoutedResult =
        cached ||
        getLayoutedElements(
          layoutInputNodes,
          layoutComputationEdges,
          "LR" // Horizontal layout
        );

      if (!cached) {
        layoutCacheRef.current.set(cacheKey, layoutedResult);
        if (layoutCacheRef.current.size > FLOWBUILDER_LAYOUT_CACHE_LIMIT) {
          const firstKey = layoutCacheRef.current.keys().next().value;
          if (firstKey) {
            layoutCacheRef.current.delete(firstKey);
          }
        }
      }

      if (layoutInputNodes === nodes) {
        setNodes(layoutedResult.nodes);
      } else {
        const positionByNodeId = new Map(
          layoutedResult.nodes.map((node) => [node.id, node])
        );
        setNodes((previousNodes) =>
          previousNodes.map((node) => {
            const positioned = positionByNodeId.get(node.id);
            if (!positioned) return node;
            return {
              ...node,
              position: positioned.position,
              sourcePosition: positioned.sourcePosition,
              targetPosition: positioned.targetPosition,
            };
          })
        );
      }

      requestAnimationFrame(() => {
        fitView({ padding: 0.2, duration: 260, maxZoom: 1.2 });

        if (shouldFocusPrimaryQuestion && primaryQuestionNodeId) {
          const positionedPrimaryNode = layoutedResult.nodes.find(
            (node) => node.id === primaryQuestionNodeId
          );
          if (positionedPrimaryNode) {
            setSelectedNodeId(primaryQuestionNodeId);
            setTimeout(() => {
              setCenter(
                positionedPrimaryNode.position.x + 200,
                positionedPrimaryNode.position.y + 90,
                { zoom: 0.88, duration: 240 }
              );
            }, 280);
          }
        }
      });
    } catch (error) {
      logFlowbuilderError("auto_layout", error, {
        nodeCount: nodes.length,
        edgeCount: edges.length,
      });
      toast({
        title: "Layout failed",
        description: "Auto layout could not be completed for this graph.",
        variant: "destructive",
      });
    } finally {
      setIsAutoLayouting(false);
    }
  }, [
    edges,
    fitView,
    isAutoLayouting,
    nodes,
    renderedNodes,
    setCenter,
    setNodes,
    setSelectedNodeId,
    toast,
    viewMode,
    visibleEdges,
  ]);

  useEffect(() => {
    if (!initialAutoLayoutPending) return;
    if (isAutoLayouting) return;
    if (nodes.length === 0) return;

    setInitialAutoLayoutPending(false);
    requestAnimationFrame(() => {
      handleAutoLayout({
        scope: "full",
        focusPrimaryQuestion: true,
      });
    });
  }, [
    handleAutoLayout,
    initialAutoLayoutPending,
    isAutoLayouting,
    nodes.length,
  ]);

  // Validate flow
  const handleValidate = useCallback(() => {
    const { errors, warnings, isValid } = validateFlow(nodes, edges);

    if (isValid && warnings.length === 0) {
      toast({
        title: "Validation Passed",
        description: "Flow is valid with no issues",
      });
    } else {
      const message = [
        ...errors.map((e) => `❌ ${e}`),
        ...warnings.map((w) => `⚠️ ${w}`),
      ].join("\n");

      toast({
        title: isValid ? "Validation Warnings" : "Validation Failed",
        description: message,
        variant: isValid ? "default" : "destructive",
      });
    }
  }, [nodes, edges, toast]);

  // Save flow
  const handleSaveFlow = async () => {
    if (!templateId) return;

    setSaving(true);
    try {
      // Update each question's conditional_logic based on edges
      const updates = nodes
        .filter((n) => n.type === "questionNode")
        .map(async (node) => {
          const question = node.data.question;
          const incomingEdge = edges.find((e) => e.target === node.id);

          const conditionalLogic = incomingEdge?.data?.condition
            ? {
                show_if: {
                  question_id: incomingEdge.source,
                  value: incomingEdge.data.condition.value,
                  operator: incomingEdge.data.condition.operator,
                },
              }
            : {};

          // Only update if question exists in backend (not temp)
          if (!question.id.startsWith("temp-")) {
            await questionApi.updateQuestion(question.id, {
              template_id: templateId,
              question_text: question.question_text,
              question_type: question.question_type,
              is_required: question.is_required,
              answer_choices: question.answer_choices,
              conditional_logic: conditionalLogic,
              validation_rules: question.validation_rules,
              beluga_field_mapping: question.beluga_field_mapping,
              include_in_qa_section: question.include_in_qa_section,
            });
          }
        });

      await Promise.all(updates);

      toast({
        title: "Success",
        description: "Flow saved successfully",
      });
    } catch (error: unknown) {
      logFlowbuilderError("save_flow", error, {
        templateId,
        nodeCount: nodes.length,
        edgeCount: edges.length,
      });
      const backendMessage =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (
          error as { response?: { data?: { message?: unknown } } }
        ).response?.data?.message === "string"
          ? (error as { response?: { data?: { message?: string } } }).response!
              .data!.message
          : null;
      toast({
        title: "Error",
        description: backendMessage || "Failed to save flow",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-gray-50">
      {/* Main Content - Full Height */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Sidebar - Floating */}
        {viewMode !== "checkout" && (
          <FlowSidebar
            onEditQuestion={handleEditQuestion}
            onQuestionSelect={handleQuestionSelect}
            hubNodes={hubNodes}
            onHubFocus={handleHubFocus}
          />
        )}

        {/* Flow Canvas */}
        <div className="flex-1 relative">
          {/* Header Card - Floating on Canvas */}
          {viewMode === "checkout" ? (
            <div className="absolute top-4 inset-x-4 bg-white/95 backdrop-blur border rounded-xl shadow-lg z-50 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/dashboard/templates/${templateId}`)}
                    className="h-8"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <div className="h-6 w-px bg-gray-300" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Checkout Review</div>
                    <div className="text-xs text-gray-500">
                      Vertical checkout list with condition inspection and quick navigation
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => applyViewMode("overview")}>
                    Overview
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => applyViewMode("focus")}>
                    Focus
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => applyViewMode("edit")}>
                    Full Edit
                  </Button>
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {checkoutQuestionList.length} checkout
                  </Badge>
                  <Button
                    variant="default"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => selectedCheckoutQuestion?.question && handleEditQuestion(selectedCheckoutQuestion.question)}
                    disabled={!selectedCheckoutQuestion?.question}
                  >
                    Edit Selected
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => handleOpenFullEditFromCheckout(selectedCheckoutQuestion?.nodeId)}
                    disabled={!selectedCheckoutQuestion}
                  >
                    Open In Full Edit
                  </Button>
                </div>
              </div>
            </div>
          ) : (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white border rounded-lg shadow-lg z-50 flex items-center justify-center gap-3 px-4 py-2 max-w-[calc(100%-2rem)] flex-wrap">
            <ControlTooltip content="Return to the template details page.">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/dashboard/templates/${templateId}`)}
                className="h-8"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </ControlTooltip>

            <div className="h-6 w-px bg-gray-300" />

            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold">Flow builder</h1>
              <ControlTooltip content="Open the detailed FlowBuilder guide.">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-500 hover:text-gray-700"
                  onClick={() => setGuideOpen(true)}
                  aria-label="Open FlowBuilder guide"
                >
                  <CircleHelp className="h-4 w-4" />
                </Button>
              </ControlTooltip>
              {template && (
                <ControlTooltip content="Template visit type (read-only).">
                  <div>
                    <Select value={safeVisitType} disabled>
                      <SelectTrigger className="h-7 w-20 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ED">ED</SelectItem>
                        <SelectItem value="UC">UC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </ControlTooltip>
              )}
            </div>

            <div className="h-6 w-px bg-gray-300" />

            <div className="flex items-center gap-1">
              <ControlTooltip content="High-level structure view for large templates.">
                <Button
                  variant={viewMode === "overview" ? "default" : "ghost"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => applyViewMode("overview")}
                >
                  Overview
                </Button>
              </ControlTooltip>
              <ControlTooltip content="Isolate one branch with ancestors and limited descendants.">
                <Button
                  variant={viewMode === "focus" ? "default" : "ghost"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => applyViewMode("focus")}
                >
                  Focus
                </Button>
              </ControlTooltip>
              <ControlTooltip content="Show full graph for detailed edge editing.">
                <Button
                  variant={viewMode === "edit" ? "default" : "ghost"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => applyViewMode("edit")}
                >
                  Full Edit
                </Button>
              </ControlTooltip>
              <ControlTooltip content="Checkout-only inspection mode with direct navigation and condition review.">
                <Button
                  variant={viewMode === "checkout" ? "default" : "ghost"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => applyViewMode("checkout")}
                >
                  Checkout
                </Button>
              </ControlTooltip>
              <ControlTooltip content="In overview mode, hide deeper descendants to reduce clutter.">
                <Button
                  variant={groupingEnabled ? "default" : "ghost"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    setAutoModeEnabled(false);
                    setGroupingEnabled((previous) => !previous);
                  }}
                  disabled={viewMode !== "overview"}
                >
                  Group {groupingEnabled ? "On" : "Off"}
                </Button>
              </ControlTooltip>
              <ControlTooltip content="Reset selection and return to overview with best-fit canvas.">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleResetOverview}
                >
                  Reset
                </Button>
              </ControlTooltip>
              <ControlTooltip content="Jump to the first/root question and center it in view.">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => focusPrimaryQuestion(0.9, 260)}
                >
                  Focus First
                </Button>
              </ControlTooltip>
            </div>

            {viewMode === "focus" && (
              <ControlTooltip content="Choose how deep descendants remain visible around the focused branch.">
                <div>
                  <Select
                    value={String(safeFocusDepth)}
                    onValueChange={(value) => {
                      const parsed = Number(value);
                      if (parsed === 1 || parsed === 2 || parsed === 3) {
                        setFocusDepth(parsed);
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 w-24 text-xs">
                      <SelectValue placeholder="Depth" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Depth 1</SelectItem>
                      <SelectItem value="2">Depth 2</SelectItem>
                      <SelectItem value="3">Depth 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </ControlTooltip>
            )}

            <ControlTooltip content="Show or hide edge condition labels to reduce visual noise.">
              <Button
                variant={showEdgeLabels ? "default" : "ghost"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setAutoModeEnabled(false);
                  setShowEdgeLabels(!showEdgeLabels);
                }}
              >
                Labels {showEdgeLabels ? "On" : "Off"}
              </Button>
            </ControlTooltip>

            <ControlTooltip content="Auto-picks best default mode based on graph complexity.">
              <Button
                variant={autoModeEnabled ? "default" : "ghost"}
                size="sm"
                className="h-8 text-xs"
                onClick={handleAutoModeToggle}
              >
                Auto
              </Button>
            </ControlTooltip>

            <Badge
              variant="secondary"
              className="text-[10px] sm:text-xs h-6 px-1.5 sm:px-2 max-w-[7.5rem] sm:max-w-none truncate"
            >
              <span className="hidden sm:inline">Score </span>
              <span className="sm:hidden">S </span>
              <span className="font-semibold">{complexityScore}</span>
            </Badge>
            {isEdgeSimplificationEnabled && (
              <Badge variant="secondary" className="text-[10px] h-6 text-amber-700">
                {isViewportMoving ? "Perf motion" : "Perf edges"}
              </Badge>
            )}

            {benchmarkEnabled && (
              <Badge variant="secondary" className="text-[10px] h-6">
                Benchmark{" "}
                {benchmark.score !== null ? `${benchmark.score}ms` : "warming..."}
              </Badge>
            )}

            {benchmarkEnabled && benchmark.baselineScore !== null && (
              <Badge variant="secondary" className="text-[10px] h-6">
                Baseline {benchmark.baselineScore}ms
              </Badge>
            )}

            {benchmarkEnabled && benchmarkDeltaPct !== null && (
              <Badge
                variant="secondary"
                className={`text-[10px] h-6 ${
                  benchmarkDeltaPct >= 0 ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                vs baseline {benchmarkDeltaPct >= 0 ? "+" : ""}
                {benchmarkDeltaPct}%
              </Badge>
            )}

            {benchmarkEnabled && (
              <ControlTooltip content="Save current load time as local benchmark baseline for this template.">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleSetBenchmarkBaseline}
                  disabled={benchmark.score === null}
                >
                  Set Baseline
                </Button>
              </ControlTooltip>
            )}

            <div className="h-6 w-px bg-gray-300" />

            <div className="flex items-center gap-2">
              <ControlTooltip content="Create a new question in this template.">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddQuestion}
                  className="h-8"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add question
                </Button>
              </ControlTooltip>
              <ControlTooltip content="Persist all flow and conditional logic changes.">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveFlow}
                  disabled={saving}
                  className="h-8"
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              </ControlTooltip>
              <ControlTooltip content="Run structural checks for cycles, missing links, and question issues.">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleValidate}
                  className="h-8"
                >
                  Validate
                </Button>
              </ControlTooltip>
            </div>
          </div>
          )}

          {viewMode === "checkout" && (
            <div className="absolute inset-x-4 top-20 bottom-4 z-40">
              <div className="absolute inset-0 rounded-2xl border border-border bg-gradient-to-br from-background via-background to-primary/5 shadow-sm" />
              <div className="relative h-full grid grid-cols-1 xl:grid-cols-[32rem,1fr] gap-4 p-3">
                <Card className="shadow-lg border-border min-h-0 flex flex-col bg-background/95 backdrop-blur">
                  <CardHeader className="pb-2 space-y-1.5">
                    <CardTitle className="text-base font-semibold tracking-tight flex items-center justify-between gap-2">
                      <span>Checkout Questions</span>
                      <Badge variant="secondary" className="text-[10px] h-5">
                        {checkoutQuestionList.length}
                      </Badge>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground leading-5">
                      FlowBuilder-style question cards arranged vertically. Select one to inspect conditions and jump into full edit.
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0 flex-1 min-h-0 flex flex-col gap-2">
                    <Input
                      value={checkoutSearchQuery}
                      onChange={(e) => setCheckoutSearchQuery(e.target.value)}
                      placeholder="Search checkout questions"
                      className="h-9 text-sm bg-background"
                    />
                    <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                      {filteredCheckoutQuestionList.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 space-y-3">
                          <div>
                            <div className="text-sm font-medium text-foreground">No checkout-type questions found</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              This workspace only shows questions with `question_type = checkout`.
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => applyViewMode("edit")}>
                            Open Full Edit
                          </Button>
                        </div>
                      ) : (
                        <div className="relative pl-7">
                          <div className="absolute left-[14px] top-2 bottom-2 w-[2px] rounded-full bg-gradient-to-b from-primary/25 via-primary/15 to-border" />
                          <div className="space-y-4">
                            {filteredCheckoutQuestionList.map((item, idx) => {
                              const q = item.question;
                              const isSelected = selectedNodeId === item.nodeId;
                              const counts = checkoutConditionCountByNodeId.get(item.nodeId) ?? {
                                incoming: 0,
                                outgoing: 0,
                                conditionalIn: 0,
                              };
                              const previewChoices = Array.isArray(q?.answer_choices)
                                ? q.answer_choices.slice(0, 3).map((choice) => normalizeChoiceDisplay(choice))
                                : [];

                              return (
                                <div key={item.nodeId} className="relative">
                                  <div
                                    className={`absolute -left-7 top-6 h-5 w-5 rounded-full border-[3px] bg-white shadow-sm ${
                                      isSelected ? "border-blue-500" : "border-blue-200"
                                    }`}
                                  />
                                  <div className={`absolute -left-1 top-8 h-[2px] w-4 ${isSelected ? "bg-blue-400" : "bg-blue-200"}`} />
                                  <button
                                    type="button"
                                    ref={(el) => {
                                      checkoutListItemRefs.current[item.nodeId] = el;
                                    }}
                                    onClick={() => handleCheckoutQuestionSelect(item.nodeId)}
                                    className={`group w-full text-left rounded-xl border-2 bg-white transition-all duration-150 ${
                                      isSelected
                                        ? "border-blue-400 shadow-lg ring-2 ring-blue-100"
                                        : "border-gray-200 shadow-md hover:border-gray-300"
                                    }`}
                                  >
                                    <div className="px-4 py-3 border-b border-gray-100">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">#{idx + 1}</Badge>
                                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">Q{q?.order_index ?? "?"}</Badge>
                                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">checkout</Badge>
                                          <ControlTooltip content="Copy question reference (Q#)">
                                            <span
                                              role="button"
                                              tabIndex={0}
                                              className="inline-flex h-4 items-center rounded border border-border bg-background px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopyCheckoutReference("q", item);
                                              }}
                                              onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  handleCopyCheckoutReference("q", item);
                                                }
                                              }}
                                            >
                                              Copy Q
                                            </span>
                                          </ControlTooltip>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          {counts.conditionalIn > 0 && (
                                            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 border border-blue-200 bg-blue-50 text-blue-800">
                                              <ArrowDownLeft className="mr-1 h-2.5 w-2.5" />
                                              cond {counts.conditionalIn}
                                            </Badge>
                                          )}
                                          {counts.outgoing > 0 && (
                                            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 border border-emerald-200 bg-emerald-50 text-emerald-800">
                                              <ArrowRight className="mr-1 h-2.5 w-2.5" />
                                              out {counts.outgoing}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      <div className="mt-2 text-base font-medium text-gray-900 leading-6">
                                        {q?.question_text || item.nodeId}
                                      </div>
                                    </div>

                                    <div className="p-2 space-y-2">
                                      <div className="grid grid-cols-2 gap-2 px-1">
                                        <div className="rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-2">
                                          <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-blue-700">
                                            <ArrowDownLeft className="h-3 w-3" />
                                            Incoming
                                          </div>
                                          <div className="mt-0.5 text-xs font-medium text-blue-900">
                                            {counts.incoming} edge{counts.incoming === 1 ? "" : "s"}
                                          </div>
                                        </div>
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                          <div className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Type</div>
                                          <div className="mt-0.5 text-xs font-medium text-gray-800">
                                            {q?.question_type || "checkout"}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="space-y-2">
                                        <div className="px-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">
                                          Choices Preview
                                        </div>
                                        {previewChoices.length > 0 ? (
                                          <>
                                            {previewChoices.map((choice, choiceIdx) => (
                                              <div
                                                key={`${item.nodeId}-choice-${choiceIdx}`}
                                                className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 truncate"
                                              >
                                                {choice}
                                              </div>
                                            ))}
                                            {(q?.answer_choices?.length || 0) > 3 && (
                                              <div className="text-[11px] text-gray-500 px-1">
                                                +{(q?.answer_choices?.length || 0) - 3} more choice(s)
                                              </div>
                                            )}
                                          </>
                                        ) : (
                                          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                                            No answer choices preview
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="pt-2 border-t border-border flex flex-wrap items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => handleOpenFullEditFromCheckout(selectedCheckoutQuestion?.nodeId)}
                        disabled={!selectedCheckoutQuestion}
                      >
                        Open In Full Edit
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => selectedCheckoutQuestion?.question && handleEditQuestion(selectedCheckoutQuestion.question)}
                        disabled={!selectedCheckoutQuestion?.question}
                      >
                        Edit Checkout Question
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-border min-h-0 flex flex-col bg-background/95 backdrop-blur">
                  <CardHeader className="pb-2 space-y-1.5">
                    <CardTitle className="text-base font-semibold tracking-tight">Conditions & Navigation</CardTitle>
                    <p className="text-xs text-muted-foreground leading-5">
                      Inspect what leads into this checkout question and where it goes next.
                    </p>
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2">
                      <div className="text-xs text-muted-foreground">Show only conditional/disqualify paths</div>
                      <Switch
                        checked={checkoutOnlyConditional}
                        onCheckedChange={setCheckoutOnlyConditional}
                        aria-label="Show only conditional and disqualify paths"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 flex-1 min-h-0 flex flex-col">
                    {!selectedCheckoutQuestion?.question ? (
                      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 space-y-3">
                        <div className="text-sm font-medium text-foreground">
                          {checkoutQuestionList.length === 0 ? "No checkout question selected" : "Select a checkout question"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {checkoutQuestionList.length === 0
                            ? "There are no checkout-type questions in this template."
                            : "Pick a checkout question from the left to review its incoming conditions and outgoing paths."}
                        </div>
                        {checkoutQuestionList.length === 0 && (
                          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => applyViewMode("edit")}>
                            Open Full Edit
                          </Button>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="mb-3 rounded-2xl border border-border bg-gradient-to-br from-muted/25 to-background p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">Q{selectedCheckoutQuestion.question.order_index}</Badge>
                              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">checkout</Badge>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-blue-800">
                                <ArrowDownLeft className="mr-1 h-3 w-3" />
                                {selectedCheckoutIncomingCount} incoming
                              </span>
                              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-800">
                                <ArrowRight className="mr-1 h-3 w-3" />
                                {selectedCheckoutOutgoingCount} outgoing
                              </span>
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-foreground leading-5">
                            {selectedCheckoutQuestion.question.question_text}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <ControlTooltip content="Copy question reference (Q#)">
                              <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => handleCopyCheckoutReference("q", selectedCheckoutQuestion)}>
                                Copy Q
                              </Button>
                            </ControlTooltip>
                            <ControlTooltip content="Copy internal question node ID">
                              <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => handleCopyCheckoutReference("id", selectedCheckoutQuestion)}>
                                Copy ID
                              </Button>
                            </ControlTooltip>
                          </div>
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-3">
                          {filteredCheckoutConditionRows.length === 0 ? (
                            <div className="text-sm text-muted-foreground rounded-lg border border-dashed border-border bg-muted/20 p-4">
                              {checkoutOnlyConditional
                                ? "No conditional/disqualify paths found for this checkout question."
                                : "No direct incoming or outgoing edges found for this checkout question."}
                            </div>
                          ) : (
                            <>
                              {(["incoming", "outgoing"] as const).map((sectionDirection) => {
                                const rows = filteredCheckoutConditionRows.filter((row) => row.direction === sectionDirection);
                                if (rows.length === 0) return null;
                                return (
                                  <div key={sectionDirection} className="space-y-2">
                                    <div className="sticky top-0 z-10 -mx-1 px-1 py-1 bg-background/90 backdrop-blur">
                                      <div className="flex items-center justify-between">
                                        <div className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${sectionDirection === "incoming" ? "text-blue-800" : "text-emerald-800"}`}>
                                          {sectionDirection === "incoming" ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
                                          {sectionDirection === "incoming" ? "Incoming Conditions" : "Outgoing Paths"}
                                        </div>
                                        <Badge variant="secondary" className={`text-[10px] h-4 px-1.5 border ${sectionDirection === "incoming" ? "border-blue-200 bg-blue-50 text-blue-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                                          {rows.length}
                                        </Badge>
                                      </div>
                                    </div>
                                    {rows.map((row) => (
                                      <div
                                        key={row.edgeId}
                                        className={`rounded-xl border p-3 shadow-sm ${
                                          row.edgeKind === "disqualify"
                                            ? "border-rose-200 bg-background"
                                            : row.direction === "incoming"
                                              ? "border-blue-200 bg-background"
                                              : row.edgeKind === "conditional"
                                                ? "border-emerald-200 bg-background"
                                                : "border-border bg-background"
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5 flex-wrap mb-2">
                                          <Badge variant="secondary" className={`text-[10px] h-4 px-1.5 border ${row.direction === "incoming" ? "border-blue-200 bg-blue-50 text-blue-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
                                            {row.direction === "incoming" ? <ArrowDownLeft className="mr-1 h-2.5 w-2.5" /> : <ArrowRight className="mr-1 h-2.5 w-2.5" />}
                                            {row.direction === "incoming" ? "Incoming Condition" : "Outgoing Path"}
                                          </Badge>
                                          <Badge variant="secondary" className={`text-[10px] h-4 px-1.5 border ${row.edgeKind === "disqualify" ? "border-rose-200 bg-rose-50 text-rose-800" : row.edgeKind === "conditional" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-border bg-muted/40 text-foreground/80"}`}>
                                            {row.edgeKind === "disqualify" ? <Ban className="mr-1 h-2.5 w-2.5" /> : row.edgeKind === "conditional" ? <GitBranch className="mr-1 h-2.5 w-2.5" /> : null}
                                            {row.edgeKind}
                                          </Badge>
                                        </div>
                                        <div className={`text-xs ${row.direction === "incoming" ? "text-blue-900" : "text-emerald-900"}`}>
                                          {row.direction === "incoming" ? "Source" : "Target"}:{" "}
                                          {row.direction === "incoming"
                                            ? row.sourceOrderIndex ? `Q${row.sourceOrderIndex} · ` : ""
                                            : row.targetOrderIndex ? `Q${row.targetOrderIndex} · ` : ""}
                                          {row.direction === "incoming" ? row.sourceLabel : row.targetLabel}
                                        </div>
                                        <div className={`mt-1 text-sm font-medium ${row.edgeKind === "disqualify" ? "text-rose-900" : row.direction === "incoming" ? "text-blue-900" : "text-emerald-900"}`}>
                                          {row.conditionLabel}
                                        </div>
                                        {(row.operator || row.triggerValue) && (
                                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                                            {row.operator && (
                                              <span className={`rounded border px-1.5 py-0.5 ${row.edgeKind === "disqualify" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-border bg-muted/30 text-muted-foreground"}`}>
                                                Operator: {row.operator}
                                              </span>
                                            )}
                                            {row.triggerValue && (
                                              <ControlTooltip content={row.triggerValue}>
                                                <span className={`max-w-full cursor-help rounded border px-1.5 py-0.5 ${row.edgeKind === "disqualify" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-border bg-muted/30 text-muted-foreground"}`}>
                                                  Value: {truncateWithEllipsis(row.triggerValue, CHECKOUT_CONDITION_VALUE_PREVIEW_MAX)}
                                                </span>
                                              </ControlTooltip>
                                            )}
                                          </div>
                                        )}
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          {row.direction === "incoming" && row.sourceNodeId !== "disqualify-node" && (
                                            <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => handleOpenFullEditFromCheckout(row.sourceNodeId)}>
                                              Open Source In Full Edit
                                            </Button>
                                          )}
                                          {row.direction === "outgoing" && row.targetNodeId !== "disqualify-node" && (
                                            <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => handleOpenFullEditFromCheckout(row.targetNodeId)}>
                                              Open Target In Full Edit
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })}
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* React Flow Canvas */}
          <div className={viewMode === "checkout" ? "hidden" : "w-full h-full"}>
            <ReactFlow
              nodes={renderedNodes}
              edges={canvasEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onMoveStart={onMoveStart}
              onMove={onMove}
              onMoveEnd={onMoveEnd}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              onlyRenderVisibleElements
              selectionOnDrag={false}
              nodesDraggable={viewMode === "edit"}
              nodesConnectable={viewMode === "edit"}
              selectNodesOnDrag={viewMode === "edit"}
              nodesFocusable={false}
              edgesFocusable={false}
              zoomOnDoubleClick={false}
              deleteKeyCode="Delete"
              minZoom={0.1}
              maxZoom={2}
              defaultEdgeOptions={{
                type: "conditional",
                animated: !reduceEdgeMotion,
              }}
              proOptions={{ hideAttribution: true }}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={16}
                size={1}
              />
            </ReactFlow>
          </div>

          {/* Bottom Controls - Outside ReactFlow */}
          <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white border rounded-lg shadow-lg px-3 py-2 z-40 ${viewMode === "checkout" ? "hidden" : ""}`}>
            <ControlTooltip content="Recompute graph arrangement. Uses visible graph in overview/focus for speed.">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => handleAutoLayout()}
                disabled={isAutoLayouting || viewMode === "checkout"}
              >
                <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
                {isAutoLayouting ? "Layout..." : "Auto Layout"}
              </Button>
            </ControlTooltip>

            <div className="h-4 w-px bg-gray-300" />

            <div className="flex items-center gap-1 px-2">
              <ControlTooltip content="Zoom out">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    const currentZoom = getZoom();
                    const newZoom = Math.max(0.1, currentZoom - FLOWBUILDER_ZOOM_STEP);
                    zoomTo(newZoom, { duration: FLOWBUILDER_ZOOM_ANIMATION_MS });
                    setCurrentZoom(newZoom);
                  }}
                >
                  <span className="text-xs">−</span>
                </Button>
              </ControlTooltip>
              <span className="text-xs text-gray-600 min-w-[3rem] text-center">
                {Math.round(currentZoom * 100)}%
              </span>
              <ControlTooltip content="Zoom in">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    const currentZoom = getZoom();
                    const newZoom = Math.min(2, currentZoom + FLOWBUILDER_ZOOM_STEP);
                    zoomTo(newZoom, { duration: FLOWBUILDER_ZOOM_ANIMATION_MS });
                    setCurrentZoom(newZoom);
                  }}
                >
                  <span className="text-xs">+</span>
                </Button>
              </ControlTooltip>
            </div>

            <div className="h-4 w-px bg-gray-300" />

            <ControlTooltip content="Fit graph to viewport">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => fitView({ padding: 0.2, duration: 300 })}
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            </ControlTooltip>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddQuestionnairesForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        templateId={templateId!}
        question={editingQuestion}
        onSuccess={handleQuestionSaveSuccess}
      />

      <EdgeConditionDialog
        open={edgeDialogOpen}
        onOpenChange={setEdgeDialogOpen}
        sourceNodeId={pendingConnection?.source || ""}
        targetNodeId={pendingConnection?.target || ""}
        onConfirm={handleEdgeConditionConfirm}
      />

      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>FlowBuilder Guide</DialogTitle>
            <DialogDescription>
              Quick reference for every core control so large templates stay easy
              to navigate, validate, and maintain.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {FLOWBUILDER_GUIDE_SECTIONS.map((section) => (
              <Card key={section.title} className="border-gray-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{section.title}</CardTitle>
                  <p className="text-xs text-gray-600">{section.description}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-1.5 text-xs text-gray-700">
                    {section.bullets.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function FlowBuilder() {
  return (
    <ReactFlowProvider>
      <FlowBuilderContent />
    </ReactFlowProvider>
  );
}
