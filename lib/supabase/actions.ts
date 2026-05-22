"use server";

import { createSupabaseServerClient } from "./server";
import { TemplatePackage, PrintSession, RecommendedSetup, TemplateStatus } from "../mock-data";

// Helper to map DB template package row to UI model
function mapDbToTemplatePackage(row: any): TemplatePackage {
  return {
    id: row.id,
    customerName: row.customer_name,
    packageName: row.package_name,
    outputs: row.outputs || [],
    status: row.status as TemplateStatus,
    version: row.version,
    updatedAt: row.updated_at || row.created_at,
    recommendedSetup: row.recommended_setup as RecommendedSetup,
  };
}

// Helper to map DB print session row to UI model
function mapDbToPrintSession(row: any): PrintSession {
  return {
    id: row.id,
    templateId: row.template_package_id,
    packageName: row.template_packages?.package_name || "Unknown Package",
    customerName: row.template_packages?.customer_name || "Unknown Customer",
    fileName: row.file_name,
    printedAt: row.printed_at,
    rowCount: row.row_count,
    documentCount: row.document_count,
    labelCount: row.label_count,
  };
}

/**
 * Fetch all template packages, ordered by updated_at descending.
 */
export async function getTemplatePackages(): Promise<TemplatePackage[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("template_packages")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error in getTemplatePackages:", error);
    throw new Error(error.message);
  }

  return (data || []).map(mapDbToTemplatePackage);
}

/**
 * Fetch a single template package by ID.
 */
export async function getTemplatePackageById(id: string): Promise<TemplatePackage | null> {
  if (!id) return null;
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("template_packages")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error in getTemplatePackageById:", error);
    throw new Error(error.message);
  }

  return data ? mapDbToTemplatePackage(data) : null;
}

/**
 * Create a new template package draft.
 */
export async function createTemplatePackage(data: {
  customerName: string;
  packageName: string;
  outputs: string[];
  recommendedSetup: RecommendedSetup;
}): Promise<TemplatePackage> {
  const supabase = createSupabaseServerClient();
  const { data: inserted, error } = await supabase
    .from("template_packages")
    .insert({
      customer_name: data.customerName,
      package_name: data.packageName,
      outputs: data.outputs,
      status: "draft",
      version: "v1.0-draft",
      recommended_setup: data.recommendedSetup,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error in createTemplatePackage:", error);
    throw new Error(error.message);
  }

  return mapDbToTemplatePackage(inserted);
}

/**
 * Update an existing template package.
 */
export async function updateTemplatePackage(
  id: string,
  data: Partial<Omit<TemplatePackage, "id" | "updatedAt">>
): Promise<TemplatePackage> {
  const supabase = createSupabaseServerClient();
  
  const updatePayload: any = {};
  if (data.customerName !== undefined) updatePayload.customer_name = data.customerName;
  if (data.packageName !== undefined) updatePayload.package_name = data.packageName;
  if (data.outputs !== undefined) updatePayload.outputs = data.outputs;
  if (data.status !== undefined) updatePayload.status = data.status;
  if (data.version !== undefined) updatePayload.version = data.version;
  if (data.recommendedSetup !== undefined) updatePayload.recommended_setup = data.recommendedSetup;
  
  updatePayload.updated_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from("template_packages")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("Error in updateTemplatePackage:", error);
    throw new Error(error.message);
  }

  return mapDbToTemplatePackage(updated);
}

/**
 * Confirm and lock a template package (sets status to 'locked' and updates version if needed).
 */
export async function lockTemplatePackage(id: string): Promise<TemplatePackage> {
  const supabase = createSupabaseServerClient();
  
  // First get current package to determine version number bump if necessary
  const { data: current, error: fetchError } = await supabase
    .from("template_packages")
    .select("version, status")
    .eq("id", id)
    .single();

  if (fetchError) {
    console.error("Error fetching package for lock:", fetchError);
    throw new Error(fetchError.message);
  }

  let nextVersion = "v1.0";
  if (current.status === "locked") {
    // If it was already locked, keep version or bump minor (for simple mock version management)
    const currentVerNum = parseFloat(current.version.replace("v", ""));
    nextVersion = `v${(currentVerNum + 0.1).toFixed(1)}`;
  } else if (current.version && current.version.endsWith("-draft")) {
    // Transitioning from draft to locked, strip the "-draft" suffix
    nextVersion = current.version.replace("-draft", "");
  } else {
    // Transitioning from other to locked, default to v1.0
    nextVersion = "v1.0";
  }

  const { data: locked, error } = await supabase
    .from("template_packages")
    .update({
      status: "locked",
      version: nextVersion,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("Error in lockTemplatePackage:", error);
    throw new Error(error.message);
  }

  return mapDbToTemplatePackage(locked);
}

/**
 * Log a print session event.
 */
export async function logPrintSession(data: {
  templatePackageId: string;
  fileName: string;
  rowCount: number;
  documentCount: number;
  labelCount: number;
}): Promise<PrintSession> {
  const supabase = createSupabaseServerClient();
  const { data: inserted, error } = await supabase
    .from("print_sessions")
    .insert({
      template_package_id: data.templatePackageId,
      file_name: data.fileName,
      row_count: data.rowCount,
      document_count: data.documentCount,
      label_count: data.labelCount,
      printed_at: new Date().toISOString(),
    })
    .select(`
      *,
      template_packages (
        customer_name,
        package_name
      )
    `)
    .single();

  if (error) {
    console.error("Error in logPrintSession:", error);
    throw new Error(error.message);
  }

  return mapDbToPrintSession(inserted);
}

/**
 * Fetch print sessions joined with template package name and customer name.
 */
export async function getPrintSessions(): Promise<PrintSession[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("print_sessions")
    .select(`
      *,
      template_packages (
        customer_name,
        package_name
      )
    `)
    .order("printed_at", { ascending: false });

  if (error) {
    console.error("Error in getPrintSessions:", error);
    throw new Error(error.message);
  }

  return (data || []).map(mapDbToPrintSession);
}

/**
 * Fetch aggregated statistics directly from the database tables.
 */
export async function getStats() {
  const supabase = createSupabaseServerClient();
  
  // Fetch packages count by status
  const { data: packages, error: pkgsError } = await supabase
    .from("template_packages")
    .select("status");

  if (pkgsError) {
    console.error("Error fetching packages stats:", pkgsError);
    throw new Error(pkgsError.message);
  }

  // Fetch print sessions count
  const { count: sessionCount, error: countError } = await supabase
    .from("print_sessions")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("Error counting sessions:", countError);
    throw new Error(countError.message);
  }

  const lockedCount = packages?.filter(p => p.status === "locked").length || 0;
  const draftCount = packages?.filter(p => p.status === "draft").length || 0;

  return {
    lockedCount,
    draftCount,
    totalPrintSessions: sessionCount || 0,
  };
}

/**
 * Clone an existing template package into a new draft package.
 */
export async function cloneTemplatePackageAsDraft(id: string): Promise<TemplatePackage> {
  const existing = await getTemplatePackageById(id);
  if (!existing) throw new Error("Template package not found");
  
  const supabase = createSupabaseServerClient();
  const cleanVer = existing.version.replace("v", "").replace("-draft", "");
  const currentVerNum = parseFloat(cleanVer);
  const nextVerNum = isNaN(currentVerNum) ? 1.0 : currentVerNum + 0.1;
  const nextVer = `v${nextVerNum.toFixed(1)}-draft`;
  
  const { data: inserted, error } = await supabase
    .from("template_packages")
    .insert({
      customer_name: existing.customerName,
      package_name: existing.packageName,
      outputs: existing.outputs,
      status: "draft",
      version: nextVer,
      recommended_setup: existing.recommendedSetup,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error in cloneTemplatePackageAsDraft:", error);
    throw new Error(error.message);
  }

  return mapDbToTemplatePackage(inserted);
}

/**
 * Archive a template package by changing its status to 'archived'.
 */
export async function archiveTemplatePackage(id: string): Promise<TemplatePackage> {
  return updateTemplatePackage(id, { status: "archived" });
}
