export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // Scheduled jobs only on the live server (next start), never in local next dev.
  if (process.env.NODE_ENV !== "production") return;

  const { startLspPriceCron } = await import("./lib/lspPriceCron");
  startLspPriceCron();
}
