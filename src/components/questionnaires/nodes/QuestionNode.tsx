import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Question } from "@/api/questionnaires";
import { useFlowStore } from "@/store/useFlowStore";

export const QuestionNode = memo(
  ({
    data,
    selected,
    id,
  }: NodeProps<{ question: Question; isLocked?: boolean }>) => {
    const { question, isLocked } = data;
    const isQuestionLocked = useFlowStore((state) =>
      state.isQuestionLocked(id)
    );
    const locked = isLocked || isQuestionLocked;

    const isConsentQuestion = question.question_type === "consent";
    const hasChoices =
      question.answer_choices && question.answer_choices.length > 0;

    return (
      <div
        className={`
        min-w-[400px] max-w-[500px] rounded-xl border-2 bg-white shadow-md transition-all
        ${selected ? "border-blue-400 shadow-lg" : "border-gray-200"}
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
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="text-base font-medium text-gray-900">
            {question.question_text || "Untitled Question"}
          </div>
        </div>

        {/* Consent Text (for consent questions) */}
        {isConsentQuestion && question.consent_form?.consent_text && (
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
          <div className="p-2 space-y-2">
            {question.answer_choices.map((choice, idx) => (
              <div
                key={idx}
                className="relative flex items-center px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm text-gray-700">{choice}</span>

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
          <div className="p-2 space-y-2">
            {question.answer_choices.map((choice, idx) => {
              // Handle product_selection type where choices are objects
              const displayText =
                typeof choice === "string"
                  ? choice
                  : (choice as { product_name?: string; name?: string })
                      .product_name ||
                    (choice as { product_name?: string; name?: string }).name ||
                    JSON.stringify(choice);

              return (
                <div
                  key={idx}
                  className="relative flex items-center px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm text-gray-700">{displayText}</span>

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
