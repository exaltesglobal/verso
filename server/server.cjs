// Hostinger entry point.
//
// Hostinger's Node.js runner loads the app's entry file with require(). Our
// server is an ES module that uses top-level await, which require() can't load
// (ERR_REQUIRE_ASYNC_MODULE). This tiny CommonJS file loads it with a dynamic
// import instead. Set the Hostinger "entry file" to `server.cjs`.
//
// In production it first applies pending database migrations (idempotent and
// locked, so a restart is safe). Set SKIP_MIGRATE_ON_START=1 to opt out, e.g.
// when migrations are run from a shell instead.
(async () => {
  if (process.env.NODE_ENV === "production" && process.env.SKIP_MIGRATE_ON_START !== "1") {
    await import("./dist/migrate.js");
    if (process.exitCode) {
      console.error("Verso server not started: migrations failed.");
      process.exit(1);
    }
  }
  await import("./dist/index.js");
})().catch((err) => {
  console.error("Verso server failed to start:", err);
  process.exit(1);
});
