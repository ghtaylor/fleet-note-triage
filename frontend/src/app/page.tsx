const HEALTH_CHECK_TIMEOUT_MS = 2_000;

async function isBackendHealthy(): Promise<boolean> {
  const backendUrl = process.env.BACKEND_URL;

  if (!backendUrl) {
    throw new Error("BACKEND_URL is required");
  }

  try {
    const response = await fetch(new URL("/health", backendUrl), {
      cache: "no-store",
      signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT_MS),
    });

    return response.ok;
  } catch {
    return false;
  }
}

export default async function Home() {
  const isHealthy = await isBackendHealthy();

  return (
    <span className="text-lg font-semibold">
      Backend is {isHealthy ? "healthy" : "not healthy"}
    </span>
  );
}
