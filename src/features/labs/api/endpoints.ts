export const clientLabEndpoints = {
  tests: "client/labs/tests/",
  testDetail: (assignmentId: string) => `client/labs/tests/${assignmentId}/`,
  testImage: (assignmentId: string) => `client/labs/tests/${assignmentId}/image/`,
  orders: "client/labs/orders/",
  orderDetail: (orderId: string) => `client/labs/orders/${orderId}/`,
  orderResultAccess: (orderId: string) => `client/labs/orders/${orderId}/result-access/`,
  orderResultPdf: (orderId: string) => `client/labs/orders/${orderId}/result-pdf/`,
  orderRequisitionPdf: (orderId: string) => `client/labs/orders/${orderId}/requisition-pdf/`,
  orderCollectionInstructionsPdf: (orderId: string) => `client/labs/orders/${orderId}/collection-instructions-pdf/`,
  orderRecollectionRetry: (orderId: string) => `client/labs/orders/${orderId}/recollection/retry/`,
};
