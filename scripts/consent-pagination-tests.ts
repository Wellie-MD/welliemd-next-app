import assert from "node:assert/strict";
import axiosInstance from "../src/api/axiosInstance";
import { consentsApi } from "../src/features/treatments/api/libraryApi";

const responses = [
  {
    count: 32,
    next: "https://admin.example.test/api/v1/treatments/consents/?page=2&page_size=100",
    previous: null,
    results: [
      {
        id: "consent-1",
        name: "First consent",
        scope: "global",
        visit_type_keys: [],
        version: 1,
      },
    ],
  },
  {
    count: 32,
    next: null,
    previous: "https://admin.example.test/api/v1/treatments/consents/?page=1&page_size=100",
    results: [
      {
        id: "consent-32",
        name: "Thirty-second consent",
        scope: "visit_type",
        visit_type_keys: ["weight-loss"],
        version: 1,
      },
    ],
  },
];

const requested: Array<{ url: string; config?: unknown }> = [];
const originalGet = axiosInstance.get;

axiosInstance.get = async (url, config) => {
  requested.push({ url: String(url), config });
  const data = responses.shift();
  if (!data) throw new Error("Unexpected consent request");
  return { data } as never;
};

const run = async () => {
  try {
    const consents = await consentsApi.list();

    assert.deepEqual(consents.map((consent) => consent.id), ["consent-1", "consent-32"]);
    assert.equal(requested.length, 2);
    assert.equal(requested[0].url, "treatments/consents/");
    assert.deepEqual(requested[0].config, { params: { page_size: 100 } });
    assert.equal(requested[1].url, "https://admin.example.test/api/v1/treatments/consents/?page=2&page_size=100");
    console.log("PASS consent library follows every paginated API response");
  } finally {
    axiosInstance.get = originalGet;
  }

  axiosInstance.get = async () => ({
    data: [
      {
        id: "legacy-consent",
        name: "Legacy response consent",
        scope: "global",
        visit_type_keys: [],
        version: 1,
      },
    ],
  }) as never;
  try {
    const consents = await consentsApi.list();
    assert.deepEqual(consents.map((consent) => consent.id), ["legacy-consent"]);
    console.log("PASS consent library retains array-response compatibility");
  } finally {
    axiosInstance.get = originalGet;
  }

  let callCount = 0;
  axiosInstance.get = async () => {
    callCount += 1;
    if (callCount === 1) {
      return {
        data: {
          count: 101,
          next: "https://admin.example.test/api/v1/treatments/consents/?page=2",
          previous: null,
          results: [],
        },
      } as never;
    }
    throw new Error("Second consent page failed");
  };
  try {
    await assert.rejects(consentsApi.list(), /Second consent page failed/);
    console.log("PASS consent library does not return an incomplete later-page response");
  } finally {
    axiosInstance.get = originalGet;
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
