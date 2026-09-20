import { ZodError } from "zod";
import {
  PUBLIC_DATABASE_UNAVAILABLE_MESSAGE,
  isDatabaseRestrictionError,
  noteDatabaseError,
} from "@/lib/ecommerce/databaseHealth";

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export function apiError(error: unknown, status = 400) {
  if (isDatabaseRestrictionError(error)) {
    noteDatabaseError(error);
    return Response.json(
      {
        error: "database_unavailable",
        message: PUBLIC_DATABASE_UNAVAILABLE_MESSAGE,
      },
      { status: 503 }
    );
  }

  if (error instanceof ZodError) {
    return Response.json(
      {
        error: "validation_error",
        message: "Confirma os campos que enviaste.",
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
