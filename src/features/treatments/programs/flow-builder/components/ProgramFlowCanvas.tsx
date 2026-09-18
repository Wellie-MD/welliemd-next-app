import { useEffect, useMemo, useState } from "react";
import ReactFlow, {
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  applyFocusToProgramFlowGraph,
  buildStaticProgramFlowGraph,
} from "../utils/programFlowGraph";
import type { ConsentForm, Program, ProgramQuestion } from "../../../types";
import { nodeTypes } from "./nodes/nodeTypes";
import { edgeTypes } from "./edges/edgeTypes";
import FlowZoomControls from "./FlowZoomControls";
import ReactFlowFocusHelper from "./ReactFlowFocusHelper";

interface ProgramFlowCanvasProps {
  program: Program;
  questions: ProgramQuestion[];
  allConsents: ConsentForm[];
  focusedNodeId?: string | null;
  onNodeDoubleClick: (nodeId: string, nodeType: string) => void;
}

export function ProgramFlowCanvas({
  program,
  questions,
  allConsents,
  focusedNodeId,
  onNodeDoubleClick,
}: ProgramFlowCanvasProps) {
  const [localFocusedNodeId, setLocalFocusedNodeId] = useState<string | null>(focusedNodeId || null);
  const [focusedChoice, setFocusedChoice] = useState<{ nodeId: string; value: string } | null>(null);

  useEffect(() => {
    setLocalFocusedNodeId(focusedNodeId || null);
  }, [focusedNodeId]);

  const staticGraph = useMemo(
    () => buildStaticProgramFlowGraph(program, questions, allConsents, "TB"),
    [program, questions, allConsents]
  );
  const focusedGraph = useMemo(
    () => applyFocusToProgramFlowGraph(staticGraph, program, questions, localFocusedNodeId, focusedChoice),
    [staticGraph, program, questions, localFocusedNodeId, focusedChoice]
  );

  useEffect(() => {
    const onChoiceFocus = (event: Event) => {
      const detail = (event as CustomEvent<{ nodeId: string; value: string } | null>).detail;
      setFocusedChoice(detail || null);
      if (detail?.nodeId) {
        setLocalFocusedNodeId(detail.nodeId);
        return;
      }

      // The prototype clears the whole connector focus when the pointer leaves
      // an answer row. Keep only an explicit sidebar selection, if there is one.
      setLocalFocusedNodeId(focusedNodeId || null);
    };

    window.addEventListener("program-flow-choice-focus", onChoiceFocus);
    return () => window.removeEventListener("program-flow-choice-focus", onChoiceFocus);
  }, [focusedNodeId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(focusedGraph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(focusedGraph.edges);

  useEffect(() => {
    setNodes(focusedGraph.nodes);
    setEdges(focusedGraph.edges);
  }, [focusedGraph, setNodes, setEdges]);

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-[#f7f9fc]">
      <div className="flex h-8 shrink-0 items-center gap-2.5 border-b border-slate-200 bg-white px-3">
        <div className="flex items-center gap-2 text-[12px] font-extrabold text-slate-950">
          <span>Patient Flow</span>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
            Stage View
          </span>
        </div>
      </div>

      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeMouseEnter={(_event, node) => {
            setFocusedChoice(null);
            setLocalFocusedNodeId(node.id);
          }}
          onNodeMouseLeave={() => {
            setFocusedChoice(null);
            setLocalFocusedNodeId(focusedNodeId || null);
          }}
          onNodeClick={(_event, node) => {
            _event.preventDefault();
            _event.stopPropagation();
            setFocusedChoice(null);
            setLocalFocusedNodeId(node.id);
          }}
          onPaneClick={() => {
            setFocusedChoice(null);
            setLocalFocusedNodeId(null);
          }}
          onNodeDoubleClick={(_event, node) => {
            _event.preventDefault();
            _event.stopPropagation();
            onNodeDoubleClick(node.id, node.type || "question");
          }}
          defaultViewport={{ x: 36, y: 34, zoom: 0.75 }}
          minZoom={0.25}
          maxZoom={2}
          panOnDrag
          zoomOnDoubleClick={false}
          selectionOnDrag={false}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: "semantic" }}
          className="flex-1"
          style={{
            backgroundColor: "#f7f9fc",
            backgroundImage: "radial-gradient(circle, #d7dde6 1.25px, transparent 1.25px)",
            backgroundSize: "20px 20px",
          }}
        >
          <Background variant={BackgroundVariant.Dots} color="#d7dde6" gap={20} size={1.25} />
          <FlowZoomControls />
          <ReactFlowFocusHelper focusedNodeId={focusedNodeId} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
