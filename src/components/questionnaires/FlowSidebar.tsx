import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Search, MoreVertical, Copy, Edit, Lock, Archive, Unlock, ArchiveRestore, ChevronDown, ChevronUp, SlidersHorizontal, X, CircleHelp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFlowStore, FilterType } from '@/store/useFlowStore';
import { Question } from '@/api/questionnaires';
import { cn } from '@/lib/utils';
import { HubNode } from '@/utils/flowVisibility';
import { FLOWBUILDER_SIDEBAR_DEFERRED_MOUNT_MS } from '@/constants/flowBuilder';

interface FlowSidebarProps {
  onEditQuestion: (question: Question) => void;
  onQuestionSelect: (questionId: string | null) => void;
  hubNodes?: HubNode[];
  onHubFocus?: (questionId: string) => void;
}

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'archived', label: 'Archived' },
  { value: 'unused', label: 'Unused' },
  { value: 'locked', label: 'Locked' },
];

export function FlowSidebar({
  onEditQuestion,
  onQuestionSelect,
  hubNodes = [],
  onHubFocus,
}: FlowSidebarProps) {
  const {
    questions,
    nodes,
    lockedQuestions,
    archivedQuestions,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    selectedNodeId,
    setSelectedNodeId,
    toggleLockQuestion,
    toggleArchiveQuestion,
    duplicateQuestion,
    isQuestionLocked,
    isQuestionArchived,
    sidebarCollapsed,
    setSidebarCollapsed,
  } = useFlowStore();

  const [hoveredQuestionId, setHoveredQuestionId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [isHeavyContentReady, setIsHeavyContentReady] = useState(false);

  useEffect(() => {
    if (sidebarCollapsed) return;
    if (isHeavyContentReady) return;
    const timerId = window.setTimeout(() => {
      setIsHeavyContentReady(true);
    }, FLOWBUILDER_SIDEBAR_DEFERRED_MOUNT_MS);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [isHeavyContentReady, sidebarCollapsed]);

  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredQuestions = useMemo(() => {
    if (!isHeavyContentReady) return [];

    let filtered = questions;

    if (activeFilter === 'archived') {
      filtered = filtered.filter((q) => archivedQuestions.has(q.id));
    } else if (activeFilter === 'locked') {
      filtered = filtered.filter((q) => lockedQuestions.has(q.id));
    } else if (activeFilter === 'unused') {
      const usedIds = new Set(nodes.map((n) => n.id));
      filtered = filtered.filter(
        (q) => !usedIds.has(q.id) && !archivedQuestions.has(q.id)
      );
    } else {
      filtered = filtered.filter((q) => !archivedQuestions.has(q.id));
    }

    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
    if (!normalizedQuery) return filtered;

    return filtered.filter((q) => {
      const questionText = q.question_text?.toLowerCase() || '';
      const questionType = q.question_type?.toLowerCase() || '';
      const questionId = q.id?.toLowerCase() || '';
      return (
        questionText.includes(normalizedQuery) ||
        questionType.includes(normalizedQuery) ||
        questionId.includes(normalizedQuery)
      );
    });
  }, [
    activeFilter,
    archivedQuestions,
    deferredSearchQuery,
    isHeavyContentReady,
    lockedQuestions,
    nodes,
    questions,
  ]);

  const handleCheckboxChange = (questionId: string, checked: boolean) => {
    if (checked) {
      setSelectedNodeId(questionId);
      onQuestionSelect(questionId);
    } else {
      setSelectedNodeId(null);
      onQuestionSelect(null);
    }
  };



  return (
    <div
      className={cn(
        'absolute left-4 top-4 bg-white border rounded-lg shadow-lg transition-all duration-300 flex flex-col',
        sidebarCollapsed ? 'w-64 h-12' : 'w-64'
      )}
      style={!sidebarCollapsed ? { height: 'calc(100% - 32px)', zIndex: 50 } : { zIndex: 50 }}
    >
      {/* Collapsible Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b shrink-0">
        <h3 className="text-sm font-semibold text-gray-900">Questions</h3>
        <div className="flex items-center gap-1">
          <button className="text-gray-400 hover:text-gray-600">
            <MoreVertical className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-gray-400 hover:text-gray-600"
          >
            {sidebarCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {!sidebarCollapsed && (
        <>
          {/* Search */}
          <div className="p-3 border-b shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, type or id"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-8 h-9 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Toggle and Filters */}
          <div className="px-3 py-2 border-b shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">FILTERS</span>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title={showFilters ? 'Hide filters' : 'Show filters'}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>
            
            {showFilters && (
              <div className="flex gap-1">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setActiveFilter(filter.value)}
                    className={cn(
                      'px-2 py-1 text-xs rounded transition-colors',
                      activeFilter === filter.value
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!isHeavyContentReady ? (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-500">
              Loading question index...
            </div>
          ) : (
            <>
              {/* Hub Navigation */}
              {hubNodes.length > 0 && (
                <div className="px-3 py-2 border-b shrink-0">
                  <div className="flex items-center gap-1 mb-2">
                    <div className="text-xs font-medium text-gray-700">
                      BRANCH HUBS
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          aria-label="What are branch hubs?"
                        >
                          <CircleHelp className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs text-xs">
                        Branch Hubs are high-fanout questions. Click one to focus
                        and inspect the branch area around that question.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {hubNodes.map((hub) => (
                      <Tooltip key={hub.questionId}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => onHubFocus?.(hub.questionId)}
                            className="w-full text-left px-2 py-1.5 rounded bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="text-xs font-medium text-gray-900 truncate">
                              Q{hub.orderIndex} · {hub.fanOut} branches
                            </div>
                            <div className="text-[11px] text-gray-600 truncate">
                              {hub.questionText}
                            </div>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs text-xs leading-relaxed">
                          Hub question with {hub.fanOut} downstream branches.
                          Click to jump and focus this branch.
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              )}

              {/* Questions List */}
              <div className="flex-1 overflow-y-auto scrollbar-hide" style={{ minHeight: 0 }}>
                <div className="p-2 space-y-1">
                  {filteredQuestions.length === 0 ? (
                    <div className="text-center py-8 text-sm text-gray-400">
                      {searchQuery ? 'No questions found' : 'No questions yet'}
                    </div>
                  ) : (
                    filteredQuestions.map((question) => {
                      const isLocked = isQuestionLocked(question.id);
                      const isArchived = isQuestionArchived(question.id);
                      const isSelected = selectedNodeId === question.id;
                      const isHovered = hoveredQuestionId === question.id;

                      return (
                        <div
                          key={question.id}
                          className={cn(
                            'group relative flex items-center py-1.5 cursor-pointer transition-all duration-200 rounded overflow-hidden',
                            isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                          )}
                          onMouseEnter={() => setHoveredQuestionId(question.id)}
                          onMouseLeave={() => setHoveredQuestionId(null)}
                        >
                          {/* Checkbox - positioned absolutely, appears on hover */}
                          <div
                            className={cn(
                              'absolute left-2 shrink-0 transition-opacity duration-200',
                              isHovered || isSelected ? 'opacity-100' : 'opacity-0 pointer-events-none'
                            )}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleCheckboxChange(question.id, checked as boolean)}
                              className="h-4 w-4"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>

                          {/* Question Text - Slides left on hover to reveal checkbox */}
                          <div
                            className={cn(
                              'flex-1 min-w-0 px-2 transition-all duration-200',
                              isHovered || isSelected ? 'ml-6' : 'ml-0'
                            )}
                          >
                            <div className="text-sm text-gray-900 truncate">
                              {question.question_text || <span className="text-gray-400 italic">Untitled</span>}
                            </div>
                          </div>

                          {/* Status Icons */}
                          <div className="flex items-center gap-1 shrink-0">
                            {isLocked && (
                              <Lock className="h-3 w-3 text-gray-400" />
                            )}
                            {isArchived && (
                              <Archive className="h-3 w-3 text-gray-400" />
                            )}
                          </div>

                          {/* Actions Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateQuestion(question.id);
                                }}
                                disabled={question.is_read_only}
                              >
                                <Copy className="h-3.5 w-3.5 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditQuestion(question);
                                }}
                                disabled={question.is_read_only}
                              >
                                <Edit className="h-3.5 w-3.5 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLockQuestion(question.id);
                                }}
                                disabled={question.is_read_only}
                              >
                                {isLocked ? (
                                  <>
                                    <Unlock className="h-3.5 w-3.5 mr-2" />
                                    Unlock
                                  </>
                                ) : (
                                  <>
                                    <Lock className="h-3.5 w-3.5 mr-2" />
                                    Lock
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleArchiveQuestion(question.id);
                                }}
                                disabled={question.is_read_only}
                                className={isArchived ? 'text-green-600' : 'text-red-600'}
                              >
                                {isArchived ? (
                                  <>
                                    <ArchiveRestore className="h-3.5 w-3.5 mr-2" />
                                    Restore
                                  </>
                                ) : (
                                  <>
                                    <Archive className="h-3.5 w-3.5 mr-2" />
                                    Archive
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 border-t shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold">
                    {filteredQuestions.length}
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs">
                    <svg className="h-3.5 w-3.5 mr-1.5" viewBox="0 0 16 16" fill="none">
                      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Invite
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
