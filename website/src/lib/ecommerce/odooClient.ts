import "server-only";

import { XMLParser } from "fast-xml-parser";

type XmlRpcValue =
  | string
  | number
  | boolean
  | null
  | XmlRpcValue[]
  | { [key: string]: XmlRpcValue };

type OdooConfig = {
  url: string;
  db: string;
  username: string;
  apiKey: string;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false,
  trimValues: false,
});

export function hasOdooConfig() {
  return Boolean(
    process.env.ODOO_URL &&
      process.env.ODOO_DB &&
      process.env.ODOO_USERNAME &&
      process.env.ODOO_API_KEY
  );
}

export function odooConfig(): OdooConfig {
  const missing = ["ODOO_URL", "ODOO_DB", "ODOO_USERNAME", "ODOO_API_KEY"].filter(
    (name) => !process.env[name]
  );
  if (missing.length) {
    throw new Error(`Missing Odoo environment variables: ${missing.join(", ")}`);
  }

  return {
    url: process.env.ODOO_URL!.replace(/\/$/, ""),
    db: process.env.ODOO_DB!,
    username: process.env.ODOO_USERNAME!,
    apiKey: process.env.ODOO_API_KEY!,
  };
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function xmlValue(value: XmlRpcValue): string {
  if (value === null || value === undefined) return "<nil/>";
  if (Array.isArray(value)) {
    return `<array><data>${value.map((item) => `<value>${xmlValue(item)}</value>`).join("")}</data></array>`;
  }
  if (typeof value === "object") {
    return `<struct>${Object.entries(value)
      .map(
        ([key, item]) =>
          `<member><name>${escapeXml(key)}</name><value>${xmlValue(item)}</value></member>`
      )
      .join("")}</struct>`;
  }
  if (typeof value === "number") {
    return Number.isInteger(value) ? `<int>${value}</int>` : `<double>${value}</double>`;
  }
  if (typeof value === "boolean") return `<boolean>${value ? 1 : 0}</boolean>`;
  return `<string>${escapeXml(value)}</string>`;
}

function methodCall(methodName: string, params: XmlRpcValue[]) {
  return `<?xml version="1.0"?><methodCall><methodName>${methodName}</methodName><params>${params
    .map((param) => `<param><value>${xmlValue(param)}</value></param>`)
    .join("")}</params></methodCall>`;
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function parseValue(node: unknown): unknown {
  if (node === undefined || node === null) return null;
  if (typeof node !== "object") return node;
  if (!isRecord(node)) return node;
  if ("value" in node && Object.keys(node).length === 1) return parseValue(node.value);
  if ("string" in node) return node.string ?? "";
  if ("int" in node) return Number(node.int || 0);
  if ("i4" in node) return Number(node.i4 || 0);
  if ("double" in node) return Number(node.double || 0);
  if ("boolean" in node) return node.boolean === "1" || node.boolean === 1 || node.boolean === true;
  if ("nil" in node) return null;
  if ("base64" in node) return node.base64 || "";
  if ("array" in node && isRecord(node.array) && isRecord(node.array.data)) {
    return asArray(node.array.data.value).map(parseValue);
  }
  if ("struct" in node && isRecord(node.struct)) {
    const result: Record<string, unknown> = {};
    for (const member of asArray(node.struct.member)) {
      if (!isRecord(member)) continue;
      const name = String(member.name || "");
      if (name) result[name] = parseValue(member.value);
    }
    return result;
  }
  return node;
}

async function xmlRpcRequest(endpoint: string, methodName: string, params: XmlRpcValue[]) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "text/xml" },
    body: methodCall(methodName, params),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Odoo XML-RPC request failed with HTTP ${response.status}`);
  }

  const parsed = parser.parse(text) as Record<string, unknown>;
  const methodResponse = isRecord(parsed.methodResponse) ? parsed.methodResponse : {};
  const fault = methodResponse.fault;
  if (fault) {
    const faultValue = isRecord(fault) ? fault.value : fault;
    const parsedFault = parseValue(faultValue);
    const faultMessage = isRecord(parsedFault) ? parsedFault.faultString : JSON.stringify(parsedFault);
    throw new Error(`Odoo fault: ${faultMessage || "Unknown XML-RPC fault"}`);
  }

  const responseParams = isRecord(methodResponse.params) ? methodResponse.params : {};
  const param = isRecord(responseParams.param) ? responseParams.param : {};
  const value = param.value;
  return parseValue(value);
}

export class OdooClient {
  private uid: number | null = null;

  constructor(private readonly config: OdooConfig = odooConfig()) {}

  async authenticate() {
    const uid = await xmlRpcRequest(`${this.config.url}/xmlrpc/2/common`, "authenticate", [
      this.config.db,
      this.config.username,
      this.config.apiKey,
      {},
    ]);
    if (!uid) {
      throw new Error("Odoo authentication failed. Check DB, username, API key, and permissions.");
    }
    this.uid = Number(uid);
    return this.uid;
  }

  async executeKw(model: string, method: string, args: XmlRpcValue[] = [], kwargs: Record<string, XmlRpcValue> = {}) {
    if (!this.uid) await this.authenticate();
    let lastError: unknown;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await xmlRpcRequest(`${this.config.url}/xmlrpc/2/object`, "execute_kw", [
          this.config.db,
          this.uid!,
          this.config.apiKey,
          model,
          method,
          args,
          kwargs,
        ]);
      } catch (error) {
        lastError = error;
        if (attempt === 2) break;
        await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
      }
    }

    throw lastError;
  }

  async searchRead(
    model: string,
    domain: XmlRpcValue[] = [],
    fields: string[] = [],
    options: { limit?: number; offset?: number; order?: string } = {}
  ) {
    const kwargs: Record<string, XmlRpcValue> = {
      fields,
      limit: options.limit ?? 100,
      offset: options.offset ?? 0,
    };
    if (options.order) kwargs.order = options.order;
    const rows = await this.executeKw(model, "search_read", [domain], kwargs);
    if (Array.isArray(rows)) return rows as Record<string, unknown>[];
    // Single-row XML-RPC responses can arrive as one struct (must include id).
    if (rows && typeof rows === "object" && "id" in (rows as Record<string, unknown>)) {
      return [rows as Record<string, unknown>];
    }
    return [];
  }
}
