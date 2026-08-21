export type OdooRpcClient = {
  executeKw: (
    model: string,
    method: string,
    args?: unknown[],
    kwargs?: Record<string, unknown>
  ) => Promise<unknown>;
  searchRead: (
    model: string,
    domain?: unknown[],
    fields?: string[],
    options?: { limit?: number }
  ) => Promise<Record<string, unknown>[]>;
};

const CLOSED_PICKING_STATES = new Set(["done", "cancel"]);

export function shouldValidateDelivery(value = process.env.ODOO_AUTO_VALIDATE_DELIVERY) {
  return String(value ?? "").trim().toLowerCase() !== "false";
}

export function stockFieldsFromQty(quantity: number, saleable = true) {
  const stockQuantity = Math.max(0, Math.floor(quantity));
  return {
    stockQuantity,
    forecastQuantity: stockQuantity,
    stockState: !saleable ? "not_saleable" : stockQuantity <= 0 ? "out_of_stock" : stockQuantity <= 2 ? "low_stock" : "in_stock",
    availableForSale: Boolean(saleable && stockQuantity > 0),
  };
}

export function localStockAfterSale(currentQty: number, soldQty: number, saleable = true) {
  return stockFieldsFromQty(currentQty - soldQty, saleable);
}

export function openPickingIds(pickings: Array<{ id?: unknown; state?: unknown }>) {
  return pickings
    .filter((picking) => !CLOSED_PICKING_STATES.has(String(picking.state || "")))
    .map((picking) => Number(picking.id))
    .filter((id) => Number.isFinite(id) && id > 0);
}

export function wizardModel(result: unknown) {
  if (!result || typeof result !== "object") return null;
  const model = (result as { res_model?: unknown }).res_model;
  if (typeof model !== "string" || !model) return null;
  const lower = model.toLowerCase();
  if (lower.includes("immediate.transfer") || lower.includes("backorder") || lower.includes("immediate_transfer")) {
    return model;
  }
  return null;
}

export function wizardProcessMethod(model: string) {
  return model.toLowerCase().includes("backorder") ? "process_cancel_backorder" : "process";
}

function asRecords(value: unknown) {
  if (Array.isArray(value)) return value as Record<string, unknown>[];
  if (value && typeof value === "object" && "id" in (value as Record<string, unknown>)) {
    return [value as Record<string, unknown>];
  }
  return [];
}

async function writeDoneQty(client: OdooRpcClient, model: string, id: number, qty: number) {
  try {
    await client.executeKw(model, "write", [[id], { quantity: qty, qty_done: qty }]);
  } catch {
    try {
      await client.executeKw(model, "write", [[id], { quantity: qty }]);
    } catch {
      await client.executeKw(model, "write", [[id], { qty_done: qty, quantity_done: qty }]);
    }
  }
}

export async function setMoveDoneQty(client: OdooRpcClient, pickingId: number) {
  const lines = asRecords(
    await client.searchRead(
      "stock.move.line",
      [["picking_id", "=", pickingId]],
      ["id", "quantity", "qty_done", "quantity_product_uom", "product_uom_qty"]
    )
  );
  if (lines.length) {
    for (const line of lines) {
      const qty = Number(line.quantity_product_uom || line.product_uom_qty || line.quantity || 0);
      await writeDoneQty(client, "stock.move.line", Number(line.id), qty);
    }
    return;
  }

  const moves = asRecords(
    await client.searchRead("stock.move", [["picking_id", "=", pickingId]], ["id", "product_uom_qty", "quantity", "quantity_done"])
  );
  for (const move of moves) {
    const qty = Number(move.product_uom_qty || move.quantity || 0);
    await writeDoneQty(client, "stock.move", Number(move.id), qty);
  }
}

async function processValidateWizard(client: OdooRpcClient, pickingId: number, result: unknown) {
  const model = wizardModel(result);
  if (!model) return;

  const existingId = Number((result as { res_id?: unknown }).res_id);
  let wizardId = Number.isFinite(existingId) && existingId > 0 ? existingId : 0;
  if (!wizardId) {
    try {
      wizardId = Number(await client.executeKw(model, "create", [{ pick_ids: [[4, pickingId]] }]));
    } catch {
      wizardId = Number(
        await client.executeKw(model, "create", [{ immediate_transfer_line_ids: [[0, 0, { picking_id: pickingId }]] }])
      );
    }
  }
  if (!Number.isFinite(wizardId) || wizardId <= 0) return;

  const method = wizardProcessMethod(model);
  try {
    await client.executeKw(model, method, [[wizardId]]);
  } catch {
    if (method !== "process") {
      await client.executeKw(model, "process", [[wizardId]]);
    } else {
      throw new Error(`Odoo picking wizard ${model} failed.`);
    }
  }
}

export async function validatePicking(client: OdooRpcClient, pickingId: number) {
  await setMoveDoneQty(client, pickingId);
  const result = await client.executeKw("stock.picking", "button_validate", [[pickingId]]);
  await processValidateWizard(client, pickingId, result);
}

export async function validateOpenPickings(client: OdooRpcClient, saleOrderId: number) {
  if (!shouldValidateDelivery()) return { validated: 0, skipped: true };

  const pickings = asRecords(
    await client.searchRead("stock.picking", [["sale_id", "=", saleOrderId]], ["id", "state"], { limit: 20 })
  );
  const ids = openPickingIds(pickings);
  for (const pickingId of ids) {
    await validatePicking(client, pickingId);
  }
  return { validated: ids.length, skipped: false };
}

export function odooQtyByProductId(rows: Array<{ id?: unknown; qty_available?: unknown }>) {
  const qtyById = new Map<number, number>();
  for (const row of rows) {
    const id = Number(row.id);
    if (!Number.isFinite(id) || id <= 0) continue;
    qtyById.set(id, Math.max(0, Math.floor(Number(row.qty_available || 0))));
  }
  return qtyById;
}
