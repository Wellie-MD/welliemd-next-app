import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Question } from "@/api/questionnaires";
import { useFlowStore } from "@/store/useFlowStore";
import { normalizeChoiceDisplay } from "@/utils/choiceValue";

export const QuestionNode = memo(
  ({
    data,
    id,
  }: NodeProps<{ question: Question; isLocked?: boolean }>) => {
    const { question, isLocked } = data;
    const isQuestionLocked = useFlowStore((state) =>
      state.isQuestionLocked(id)
    );
    const viewMode = useFlowStore((state) => state.viewMode);
    const isSelected = useFlowStore((state) => state.selectedNodeId === id);
    const locked = isLocked || isQuestionLocked;
    const isOverviewMode = viewMode === "overview";

    const isConsentQuestion = question.question_type === "consent";
    const hasChoices =
      question.answer_choices && question.answer_choices.length > 0;

    return (
      <div
        className={`
        rounded-xl border-2 bg-white shadow-md transition-all
        ${isOverviewMode ? "min-w-[320px] max-w-[420px]" : "min-w-[400px] max-w-[500px]"}
        ${isSelected ? "border-blue-400 shadow-lg" : "border-gray-200"}
        ${locked ? "opacity-60 cursor-not-allowed" : ""}
      `}
      >
        {/* Top Handle */}
        <Handle
          type="target"
          position={Position.Left}
          className="!w-4 !h-4 !bg-blue-400 !border-2 !border-white !-left-2"
          isConnectable={!locked}
        />

        {/* Question Header */}
        <div className={`${isOverviewMode ? "px-3 py-2" : "px-4 py-3"} border-b border-gray-100`}>
          <div
            className={`font-medium text-gray-900 ${
              isOverviewMode ? "text-sm line-clamp-2" : "text-base"
            }`}
          >
            {question.question_text || "Untitled Question"}
          </div>
          {isOverviewMode && (
            <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-500">
              <span className="rounded bg-gray-100 px-1.5 py-0.5">
                {question.question_type}
              </span>
              {hasChoices && (
                <span className="rounded bg-gray-100 px-1.5 py-0.5">
                  {question.answer_choices.length} choices
                </span>
              )}
            </div>
          )}
        </div>

        {/* Consent Text (for consent questions) */}
        {isConsentQuestion &&
          !isOverviewMode &&
          question.consent_form?.consent_text && (
          <div className="px-4 py-3 border-b border-gray-100 bg-blue-50">
            <div className="text-xs font-medium text-blue-900 mb-1">
              Consent Text:
            </div>
            <div className="text-sm text-gray-700 max-h-24 overflow-y-auto">
              {question.consent_form.consent_text}
            </div>
          </div>
        )}

        {/* Consent Choices - use actual answer_choices from API */}
        {isConsentQuestion && hasChoices && (
          <div className={`${isOverviewMode ? "p-1.5 space-y-1" : "p-2 space-y-2"}`}>
            {question.answer_choices.map((choice, idx) => (
              <div
                key={idx}
                className={`relative flex items-center bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors ${
                  isOverviewMode ? "px-2.5 py-1.5" : "px-4 py-3"
                }`}
              >
                <span
                  className={`text-gray-700 ${
                    isOverviewMode ? "text-xs truncate" : "text-sm"
                  }`}
                >
                  {normalizeChoiceDisplay(choice)}
                </span>

                {/* Handle for each consent choice */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`choice-${idx}`}
                  className="!w-4 !h-4 !bg-blue-400 !border-2 !border-white !-right-2"
                  isConnectable={!locked}
                  style={{ top: "50%" }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Answer Choices (for choice-based questions) */}
        {!isConsentQuestion && hasChoices && (
          <div className={`${isOverviewMode ? "p-1.5 space-y-1" : "p-2 space-y-2"}`}>
            {question.answer_choices.map((choice, idx) => {
              const displayText = normalizeChoiceDisplay(choice);

              return (
                <div
                  key={idx}
                  className={`relative flex items-center bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors ${
                    isOverviewMode ? "px-2.5 py-1.5" : "px-4 py-3"
                  }`}
                >
                  <span
                    className={`text-gray-700 ${
                      isOverviewMode ? "text-xs truncate" : "text-sm"
                    }`}
                  >
                    {displayText}
                  </span>

                  {/* Handle for each answer choice */}
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`choice-${idx}`}
                    className="!w-4 !h-4 !bg-blue-400 !border-2 !border-white !-right-2"
                    isConnectable={!locked}
                    style={{ top: "50%" }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Single Handle for non-choice questions */}
        {!isConsentQuestion && !hasChoices && (
          <Handle
            type="source"
            position={Position.Right}
            className="!w-4 !h-4 !bg-blue-400 !border-2 !border-white !-right-2"
            isConnectable={!locked}
          />
        )}
      </div>
    );
  }
);

QuestionNode.displayName = "QuestionNode";
