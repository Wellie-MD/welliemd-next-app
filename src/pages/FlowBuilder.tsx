import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactFlow, {
  Background,
  Controls,
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
  CheckCircle2,
  LayoutGrid,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { templateApi, questionApi, Question } from "@/api/questionnaires";
import { QuestionNode } from "@/components/questionnaires/nodes/QuestionNode";
import { DisqualifyNode } from "@/components/questionnaires/nodes/DisqualifyNode";
import { ConditionalEdge } from "@/components/questionnaires/nodes/ConditionalEdge";
import { FlowSidebar } from "@/components/questionnaires/FlowSidebar";
import { AddQuestionnairesForm } from "@/components/questionnaires/AddQuestionnairesForm";
import { EdgeConditionDialog } from "@/components/questionnaires/EdgeConditionDialog";
import { useToast } from "@/hooks/use-toast";
import { useFlowStore } from "@/store/useFlowStore";
import { getLayoutedElements, validateFlow } from "@/utils/flowLayout";
import { generateFlowFromTemplate } from "@/services/flowGeneratorService";

const nodeTypes = {
  questionNode: QuestionNode,
  disqualifyNode: DisqualifyNode,
};

const edgeTypes = {
  conditional: ConditionalEdge,
};

function FlowBuilderContent() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fitView, zoomTo, getZoom, setCenter } = useReactFlow();

  const {
    template,
    setTemplate,
    questions,
    setQuestions,
    selectedNodeId,
    setSelectedNodeId,
    updateNode,
    isQuestionLocked,
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

  // Fetch template data and initialize flow
  useEffect(() => {
    const fetchTemplate = async () => {
      if (!templateId) return;

      try {
        const data = await templateApi.getTemplate(templateId);
        setTemplate(data);
        setQuestions(data.questions || []);

        // Generate flow using the service
        if (data.questions && data.questions.length > 0) {
          const flowResult = generateFlowFromTemplate(data, true);

          setNodes(flowResult.nodes);
          setEdges(flowResult.edges);

          // Log flow statistics for debugging
          console.log("Flow generated:", flowResult.stats);

          // Fit view after a short delay
          setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 100);
        }
      } catch (error: unknown) {
        toast({
          title: "Error",
          description: "Failed to load template",
          variant: "destructive",
        });
      }
    };

    fetchTemplate();

    return () => {
      reset();
    };
  }, [
    fitView,
    reset,
    setEdges,
    setNodes,
    setQuestions,
    setTemplate,
    templateId,
    toast,
  ]);

  // Sync nodes/edges with store
  useEffect(() => {
    useFlowStore.setState({ nodes, edges });
  }, [nodes, edges]);

  // Track zoom level changes
  useEffect(() => {
    const updateZoom = () => {
      const zoom = getZoom();
      setCurrentZoom(zoom);
    };

    // Update zoom on mount
    updateZoom();

    // Update zoom periodically (React Flow doesn't provide a zoom change event)
    const interval = setInterval(updateZoom, 100);

    return () => clearInterval(interval);
  }, [getZoom]);

  // Sync node selection with store
  useEffect(() => {
    if (selectedNodeId) {
      // Update nodes to mark the selected one
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          selected: node.id === selectedNodeId,
        }))
      );
    } else {
      // Deselect all nodes
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          selected: false,
        }))
      );
    }
  }, [selectedNodeId, setNodes]);

  // Handle node selection from canvas
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  // Handle selection change from React Flow
  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      if (selectedNodes.length > 0) {
        setSelectedNodeId(selectedNodes[0].id);
      } else {
        setSelectedNodeId(null);
      }
    },
    [setSelectedNodeId]
  );

  // Handle question selection from sidebar with focus and zoom
  const handleQuestionSelect = useCallback(
    (questionId: string | null) => {
      if (!questionId) {
        setSelectedNodeId(null);
        return;
      }

      // Set the selected node
      setSelectedNodeId(questionId);

      // Find the node and focus on it
      const selectedNode = nodes.find((n) => n.id === questionId);
      if (selectedNode) {
        // Focus on the selected node with 80% zoom
        setTimeout(() => {
          setCenter(
            selectedNode.position.x + 200, // Center on node (accounting for node width)
            selectedNode.position.y + 90, // Center on node (accounting for node height)
            { zoom: 0.8, duration: 500 }
          );
        }, 100);
      }
    },
    [nodes, setSelectedNodeId, setCenter]
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
      } catch (error) {
        console.error("Failed to refresh questions:", error);
      }
    }
  };

  // Auto layout with horizontal arrangement and focus on first node
  const handleAutoLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      "LR" // Horizontal layout
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);

    // After layout, fit view and focus on first node
    setTimeout(() => {
      // First fit the entire view
      fitView({ padding: 0.2, duration: 500, maxZoom: 1.2 });

      // Then focus on the first node if it exists
      if (layoutedNodes.length > 0) {
        const firstNode = layoutedNodes[0];
        setTimeout(() => {
          setCenter(
            firstNode.position.x + 200, // Center on node (accounting for node width)
            firstNode.position.y + 90, // Center on node (accounting for node height)
            { zoom: 0.8, duration: 500 }
          );
        }, 600);
      }
    }, 50);
  }, [nodes, edges, setNodes, setEdges, fitView, setCenter]);

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
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save flow",
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
        />

        {/* Flow Canvas */}
        <div className="flex-1 relative">
          {/* Header Card - Floating on Canvas */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white border rounded-lg shadow-lg z-50 flex items-center gap-3 px-4 py-2">
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

            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold">Flow builder</h1>
              {template && (
                <Select value={template.beluga_visit_type || "ED"} disabled>
                  <SelectTrigger className="h-7 w-20 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ED">ED</SelectItem>
                    <SelectItem value="UC">UC</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="h-6 w-px bg-gray-300" />

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddQuestion}
                className="h-8"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add question
              </Button>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={handleValidate}
                className="h-8"
              >
                Validate
              </Button>
            </div>
          </div>

          {/* React Flow Canvas */}
          <div className="w-full h-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onSelectionChange={onSelectionChange}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              deleteKeyCode="Delete"
              minZoom={0.1}
              maxZoom={2}
              defaultEdgeOptions={{
                type: "conditional",
                animated: true,
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
          <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-white border rounded-lg shadow-lg px-3 py-2 z-40">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={handleAutoLayout}
            >
              <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
              Auto Layout
            </Button>

            <div className="h-4 w-px bg-gray-300" />

            <div className="flex items-center gap-1 px-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => {
                  const currentZoom = getZoom();
                  const newZoom = Math.max(0.1, currentZoom - 0.1);
                  zoomTo(newZoom);
                  setCurrentZoom(newZoom);
                }}
              >
                <span className="text-xs">−</span>
              </Button>
              <span className="text-xs text-gray-600 min-w-[3rem] text-center">
                {Math.round(currentZoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => {
                  const currentZoom = getZoom();
                  const newZoom = Math.min(2, currentZoom + 0.1);
                  zoomTo(newZoom);
                  setCurrentZoom(newZoom);
                }}
              >
                <span className="text-xs">+</span>
              </Button>
            </div>

            <div className="h-4 w-px bg-gray-300" />

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => fitView({ padding: 0.2, duration: 300 })}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
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
