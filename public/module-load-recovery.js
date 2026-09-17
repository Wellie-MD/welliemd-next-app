(() => {
  const retryKey = "welliemd_module_load_retry";
  const retryableMessage = /Failed to fetch dynamically imported module|Importing a module script failed|ERR_NETWORK_CHANGED|Load failed/i;
  let recoveryScheduled = false;

  const recover = (reason) => {
    const message = reason instanceof Error ? reason.message : String(reason ?? "");
    if (recoveryScheduled || !retryableMessage.test(message)) return;
    if (sessionStorage.getItem(retryKey) === "1") return;

    recoveryScheduled = true;
    sessionStorage.setItem(retryKey, "1");
    window.setTimeout(() => window.location.reload(), 350);
  };

  window.addEventListener("error", (event) => {
    recover(event.error ?? event.message);
  }, true);

  window.addEventListener("unhandledrejection", (event) => {
    recover(event.reason);
  });

  window.addEventListener("load", () => {
    window.setTimeout(() => sessionStorage.removeItem(retryKey), 5_000);
  });
})();
