import { ZodError } from "zod";

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export function apiError(error: unknown, status = 400) {
  if (error instanceof ZodError) {
    return Response.json(
      {
        error: "validation_error",
        message: "Please check the submitted fields.",
        fields: error.flatten().fieldErrors,
      },
      { status }
    );
  }

  const message = error instanceof Error ? error.message : "Unexpected error.";
  return Response.json({ error: "request_failed", message }, { status });
}

export function unavailableError() {
  return Response.json(
    {
      error: "database_not_configured",
      message:
        "The ecommerce database is not configured yet. Add DATABASE_URL before using account, cart, and checkout APIs.",
    },
    { status: 503 }
  );
}
