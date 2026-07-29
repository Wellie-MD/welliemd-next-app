import { AlertCircle, Loader2, Search } from "lucide-react";

export interface AssignmentListItem {
  id: string;
  name: string;
  subtitle?: string;
}

export function AssignmentSelection(props: {
  itemLabel: string;
  items: AssignmentListItem[];
  clients: Array<{ id: string; name: string; user?: { email?: string } }>;
  itemIds: Set<string>;
  clientIds: Set<string>;
  itemSearch: string;
  clientSearch: string;
  clientsLoading: boolean;
  clientsError: string | null;
  onItemSearch: (value: string) => void;
  onClientSearch: (value: string) => void;
  onItemToggle: (id: string) => void;
  onClientToggle: (id: string) => void;
}) {
  return (
    <div className="grid min-h-0 h-[min(460px,55dvh)] grid-cols-1 divide-y overflow-hidden sm:grid-cols-2 sm:divide-x sm:divide-y-0">
      <SelectionColumn
        title={`${props.itemLabel}s`}
        search={props.itemSearch}
        onSearch={props.onItemSearch}
      >
        {props.items.map((item) => (
          <CheckRow
            key={item.id}
            checked={props.itemIds.has(item.id)}
            title={item.name}
            subtitle={item.subtitle}
            onChange={() => props.onItemToggle(item.id)}
          />
        ))}
      </SelectionColumn>
      <SelectionColumn
        title="Clients"
        search={props.clientSearch}
        onSearch={props.onClientSearch}
      >
        {props.clientsLoading ? (
          <AssignmentEmptyState
            icon={<Loader2 className="h-5 w-5 animate-spin" />}
            text="Loading clients…"
          />
        ) : props.clientsError ? (
          <AssignmentEmptyState
            icon={<AlertCircle className="h-5 w-5" />}
            text={props.clientsError}
          />
        ) : (
          props.clients.map((client) => (
            <CheckRow
              key={client.id}
              checked={props.clientIds.has(client.id)}
              title={client.name}
              subtitle={client.user?.email}
              onChange={() => props.onClientToggle(client.id)}
            />
          ))
        )}
      </SelectionColumn>
    </div>
  );
}

function SelectionColumn(props: {
  title: string;
  search: string;
  onSearch: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-h-0 flex-col">
      <div className="space-y-2 border-b bg-slate-50/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {props.title}
        </p>
        <label className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={props.search}
            onChange={(event) => props.onSearch(event.target.value)}
            className="w-full border-0 bg-transparent text-sm outline-none"
            placeholder={`Search ${props.title.toLowerCase()}`}
          />
        </label>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {props.children}
      </div>
    </section>
  );
}

function CheckRow(props: {
  checked: boolean;
  title: string;
  subtitle?: string;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer gap-3 border-b px-2 py-3 hover:bg-slate-50">
      <input
        type="checkbox"
        checked={props.checked}
        onChange={props.onChange}
        className="mt-0.5 h-4 w-4"
      />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-slate-800">
          {props.title}
        </span>
        {props.subtitle && (
          <span className="block truncate text-xs text-slate-500">
            {props.subtitle}
          </span>
        )}
      </span>
    </label>
  );
}

export function AssignmentEmptyState(props: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-sm text-slate-500">
      {props.icon}
      <p>{props.text}</p>
    </div>
  );
}

export function AssignmentPrimaryButton(props: {
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={props.disabled}
      onClick={props.onClick}
      className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {props.children}
    </button>
  );
}
