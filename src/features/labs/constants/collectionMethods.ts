export const LAB_COLLECTION_METHOD_LABELS: Record<string, string> = {
  at_home_phlebotomy: 'At-home phlebotomy',
  walk_in_test: 'Walk-in lab draw',
  testkit: 'At-home test kit',
  on_site_collection: 'On-site collection',
};

export function labCollectionMethodLabel(method?: string) {
  return method ? (LAB_COLLECTION_METHOD_LABELS[method] ?? method.replace(/_/g, ' ')) : '—';
}
