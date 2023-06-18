// Source: https://github.com/nodejs/node/issues/34493#issuecomment-666999818
const DURATION_MS = 10 * 1000; // 10 seconds
const WARMUP_DURATION_MS = 100; // 100 ms

let fn = async (path) => {
  const res = await fetch(`http://localhost:3000${path}`, {
    method: "GET",
  });
  if (res.status !== 200) {
    throw new Error("Failed request: " + res.url);
  }
};

let runWithExpiry = async (expiry, fn, ...args) => {
  let iterations = 0;
  while (Date.now() < expiry) {
    await fn(...args);
    iterations++;
  }
  return iterations;
};

(async () => {
  console.log(
    `Performed ${await runWithExpiry(
      Date.now() + WARMUP_DURATION_MS,
      fn,
      "/api/traced"
    )} iterations to warmup traced`
  );

  console.log(
    `Performed ${await runWithExpiry(
      Date.now() + WARMUP_DURATION_MS,
      fn,
      "/api/untraced"
    )} iterations to warmup untraced`
  );

  let withAls = await runWithExpiry(
    Date.now() + DURATION_MS,
    fn,
    "/api/traced"
  );

  console.log(`Performed ${withAls} iterations (with ALS enabled)`);

  let withoutAls = await runWithExpiry(
    Date.now() + DURATION_MS,
    fn,
    "/api/untraced"
  );

  console.log(`Performed ${withoutAls} iterations (with ALS disabled)`);

  console.log(
    "ALS penalty: " +
      Math.round((1 - withAls / withoutAls) * DURATION_MS) / 100 +
      "%"
  );
})();
