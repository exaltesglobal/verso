// Hostinger entry point.
//
// Hostinger's Node.js runner loads the app's entry file with require(). Our
// server is an ES module that uses top-level await, which require() can't load
// (ERR_REQUIRE_ASYNC_MODULE). This tiny CommonJS file loads it with a dynamic
// import instead. Set the Hostinger "entry file" to `server.cjs`.
//
// Hostinger requires listen() within 3 seconds, so the server listens first
// and applies pending database migrations right after (see src/index.ts).
import("./dist/index.js").catch((err) => {
  console.error("Verso server failed to start:", err);
  process.exit(1);
});
