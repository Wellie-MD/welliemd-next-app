import { useState } from "react";
import { Panel, useOnViewportChange, useReactFlow } from "reactflow";

export default function FlowZoomControls() {
  const reactFlow = useReactFlow();
  const [zoom, setZoom] = useState(75);

  useOnViewportChange({
    onChange: ({ zoom: nextZoom }) => setZoom(Math.round(nextZoom * 100)),
  });

  return (
    <Panel position="bottom-right" className="!m-4">
      <div className="flex items-center gap-0 overflow-hidden rounded-[9px] border border-slate-200 bg-white p-[3px] shadow-[0_2px_10px_rgba(0,0,0,0.12)]">
        <button
          type="button"
          onClick={() => reactFlow.zoomOut({ duration: 200 })}
          className="flex h-7 min-w-[30px] items-center justify-center rounded-md text-base font-semibold text-slate-600 transition-colors hover:bg-[#f7f9fc] hover:text-slate-900"
          title="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => reactFlow.fitView({ padding: 0.15, duration: 350 })}
          className="flex h-7 min-w-[46px] items-center justify-center rounded-md px-1.5 text-[11.5px] font-semibold text-slate-600 transition-colors hover:bg-[#f7f9fc] hover:text-slate-900"
          title="Fit to screen"
        >
          {zoom}%
        </button>
        <button
          type="button"
          onClick={() => reactFlow.zoomIn({ duration: 200 })}
          className="flex h-7 min-w-[30px] items-center justify-center rounded-md text-base font-semibold text-slate-600 transition-colors hover:bg-[#f7f9fc] hover:text-slate-900"
          title="Zoom in"
        >
          +
        </button>
      </div>
    </Panel>
  );
}
