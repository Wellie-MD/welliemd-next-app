import {
  hasPreviewIdentitySwitchTimedOut,
  isMatchingPreviewIdentityAcknowledgement,
} from "../src/features/treatments/preview/identitySwitch";

const identities = ["new_patient", "existing_patient"] as const;
const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

assert(
  isMatchingPreviewIdentityAcknowledgement({
    activeRequestId: 4,
    requestId: 4,
    identity: "existing_patient",
    identities,
  }),
  "matching acknowledgement should be accepted",
);
assert(
  !isMatchingPreviewIdentityAcknowledgement({
    activeRequestId: 4,
    requestId: 3,
    identity: "existing_patient",
    identities,
  }),
  "stale acknowledgement should be ignored",
);
assert(
  !isMatchingPreviewIdentityAcknowledgement({
    activeRequestId: 4,
    requestId: 4,
    identity: "unknown",
    identities,
  }),
  "unknown identity acknowledgement should be ignored",
);
assert(
  hasPreviewIdentitySwitchTimedOut(100, 15100, 15000),
  "switch timeout should be detected",
);
assert(
  !hasPreviewIdentitySwitchTimedOut(100, 15099, 15000),
  "switch before deadline should remain pending",
);

console.log("preview identity switch tests passed");
