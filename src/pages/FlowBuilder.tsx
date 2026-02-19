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
  Save,
  Plus,
  LayoutGrid,
  Maximize2,
  CircleHelp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { QuestionForm } from "@/components/questionnaires/QuestionForm";
import { EdgeConditionDialog } from "@/components/questionnaires/EdgeConditionDialog";
import { useToast } from "@/hooks/use-toast";
import { FlowViewMode, useFlowStore } from "@/store/useFlowStore";
import {
  getLayoutedElements,
  getQuickStructuredLayout,
  validateFlow,
} from "@/utils/flowLayout";
import { buildFlowMetrics } from "@/utils/flowMetrics";
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
  const [isViewportMoving, setIsViewportMoving] = useState(false);
  const zoomAnimationFrameRef = useRef<number | null>(null);
  const pendingZoomRef = useRef<number | null>(null);

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
        <FlowSidebar
          onEditQuestion={handleEditQuestion}
          onQuestionSelect={handleQuestionSelect}
          hubNodes={hubNodes}
          onHubFocus={handleHubFocus}
        />

        {/* Flow Canvas */}
        <div className="flex-1 relative">
          {/* Header Card - Floating on Canvas */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white border rounded-lg shadow-lg z-50 flex items-center justify-center gap-3 px-4 py-2 max-w-[calc(100%-2rem)] flex-wrap">
            <ControlTooltip content="Return to the template details page.">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/dashboard/questionnaires/${templateId}`)}
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

          {/* React Flow Canvas */}
          <div className="w-full h-full">
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
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white border rounded-lg shadow-lg px-3 py-2 z-40">
            <ControlTooltip content="Recompute graph arrangement. Uses visible graph in overview/focus for speed.">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => handleAutoLayout()}
                disabled={isAutoLayouting}
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
      <QuestionForm
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
