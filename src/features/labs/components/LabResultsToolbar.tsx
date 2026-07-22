export type ResultFilter = 'all' | 'normal' | 'flagged';
export type ResultSort = 'newest' | 'oldest';

interface Props {
  count: number;
  filter: ResultFilter;
  sort: ResultSort;
  onFilter: (filter: ResultFilter) => void;
  onSort: (sort: ResultSort) => void;
}

export default function LabResultsToolbar({ count, filter, sort, onFilter, onSort }: Props) {
  return <div className="km-lab-results-toolbar">
    <div className="km-lab-toolbar-left">
      <span className="km-lab-section-label">Recent results</span>
      <div className="km-lab-filter-pills">{(['all', 'normal', 'flagged'] as ResultFilter[]).map((value) => <button type="button" key={value} className={filter === value ? 'is-active' : ''} onClick={() => onFilter(value)}>{value}</button>)}</div>
    </div>
    <label><span>{count} {count === 1 ? 'result' : 'results'}</span><select value={sort} onChange={(event) => onSort(event.target.value as ResultSort)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
  </div>;
}
