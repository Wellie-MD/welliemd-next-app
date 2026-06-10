export const MAX_ASSIGNMENT_PAIRS_PER_BATCH = 60;

export interface AssignmentPair {
  product_id: number;
  product_name: string;
  client_id: string;
  client_name: string;
  status?: "failed" | "pending";
  error?: string;
}

export interface AssignmentBatch {
  product_ids: number[];
  client_ids: string[];
}

export function buildAssignmentBatches(
  productIds: number[],
  clientIds: string[]
): AssignmentBatch[] {
  const productsPerBatch = Math.max(
    1,
    Math.floor(MAX_ASSIGNMENT_PAIRS_PER_BATCH / Math.max(clientIds.length, 1))
  );
  const batches: AssignmentBatch[] = [];

  for (let index = 0; index < productIds.length; index += productsPerBatch) {
    batches.push({
      product_ids: productIds.slice(index, index + productsPerBatch),
      client_ids: clientIds,
    });
  }

  return batches;
}

export function buildAssignmentBatchesFromPairs(pairs: AssignmentPair[]): AssignmentBatch[] {
  const groupedByClient = new Map<string, Set<number>>();

  pairs.forEach((pair) => {
    if (!groupedByClient.has(pair.client_id)) {
      groupedByClient.set(pair.client_id, new Set());
    }
    groupedByClient.get(pair.client_id)?.add(pair.product_id);
  });

  const batches: AssignmentBatch[] = [];
  groupedByClient.forEach((productSet, clientId) => {
    const productIds = Array.from(productSet);
    const groupedBatches = buildAssignmentBatches(productIds, [clientId]);
    batches.push(...groupedBatches);
  });

  return batches;
}

export function csvEscape(value: string | number | undefined) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}
