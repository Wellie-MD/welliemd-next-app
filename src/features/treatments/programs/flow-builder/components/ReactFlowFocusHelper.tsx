import { useEffect } from "react";
import { useReactFlow } from "reactflow";

export default function ReactFlowFocusHelper({ focusedNodeId }: { focusedNodeId?: string | null }) {
  const reactFlow = useReactFlow();

  useEffect(() => {
    if (!focusedNodeId) return;

    const timeout = setTimeout(() => {
      const node = reactFlow.getNode(focusedNodeId);
      if (node) {
        const width =
          node.type === "product"
            ? 200
            : node.type === "question" || node.type === "consent"
              ? 300
              : 140;

        const height = node.data?.nodeHeight || 120;

        const centerX = node.position.x + width / 2;
        const centerY = node.position.y + height / 2;

        reactFlow.setCenter(centerX, centerY, {
          zoom: 0.78,
          duration: 600,
        });
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [focusedNodeId, reactFlow]);

  return null;
}
