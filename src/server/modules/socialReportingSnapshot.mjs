import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { join } from "node:path";
import { socialReportingProjectDir } from "../config/paths.mjs";

const supportedSources = new Set(["file", "meta", "swatio", "combined"]);

const snapshotScript = `
import json
import logging
import sys
from pathlib import Path

import pandas as pd

from src.config import load_app_config
from src.main import _build_connectors, _fetch_source_data, _reporting_scope
from src.transform_data import apply_filters, coerce_types, derive_engagement_if_missing, enrich_source_metadata
from src.validate_data import (
    build_api_quality_report,
    build_data_quality_report,
    build_source_coverage_report,
    build_source_overlap_report,
    summarize_quality,
    validate_schema,
)
from src.calculate_kpis import build_summary, calculate_kpis

SUPPORTED_REPORT_PLATFORMS = {"Facebook", "Instagram", "LinkedIn", "TikTok"}


def _native(value):
    if value is None:
        return None
    if isinstance(value, pd.Timestamp):
        return value.isoformat()
    try:
        if pd.isna(value):
            return None
    except TypeError:
        pass
    if hasattr(value, "item"):
        try:
            return value.item()
        except Exception:
            return value
    return value


def _number(value):
    native = _native(value)
    if native is None:
        return 0
    try:
        return float(native)
    except (TypeError, ValueError):
        return 0


def _platform_summary(df):
    rows = []
    if df.empty or "platform" not in df.columns:
        return rows
    for platform, group in df.groupby("platform", dropna=False):
        rows.append({
            "platform": str(platform),
            "rows": int(len(group)),
            "reach": round(_number(group["reach"].sum()) if "reach" in group.columns else 0, 2),
            "impressions": round(_number(group["impressions"].sum()) if "impressions" in group.columns else 0, 2),
            "engagement": round(_number(group["engagement"].sum()) if "engagement" in group.columns else 0, 2),
            "clicks": round(_number(group["clicks"].sum()) if "clicks" in group.columns else 0, 2),
            "follower_growth": round(_number(group["follower_growth"].sum()) if "follower_growth" in group.columns else 0, 2),
            "engagement_rate": round(_number(group["engagement_rate"].mean()) if "engagement_rate" in group.columns else 0, 6),
            "click_rate": round(_number(group["click_rate"].mean()) if "click_rate" in group.columns else 0, 6),
        })
    return sorted(rows, key=lambda item: item["reach"], reverse=True)


def _source_summary(df):
    rows = []
    if df.empty or "source" not in df.columns:
        return rows
    group_columns = ["source"]
    if "platform" in df.columns:
        group_columns.append("platform")
    for keys, group in df.groupby(group_columns, dropna=False):
        if not isinstance(keys, tuple):
            keys = (keys,)
        source = str(keys[0])
        platform = str(keys[1]) if len(keys) > 1 else ""
        rows.append({
            "source": source,
            "platform": platform,
            "rows": int(len(group)),
            "reach": round(_number(group["reach"].sum()) if "reach" in group.columns else 0, 2),
            "impressions": round(_number(group["impressions"].sum()) if "impressions" in group.columns else 0, 2),
            "engagement": round(_number(group["engagement"].sum()) if "engagement" in group.columns else 0, 2),
            "clicks": round(_number(group["clicks"].sum()) if "clicks" in group.columns else 0, 2),
        })
    return sorted(rows, key=lambda item: (item["source"], -item["reach"], item["platform"]))


def _excluded_platforms(full_df, scoped_df):
    if full_df.empty or "platform" not in full_df.columns:
        return {}
    if scoped_df.empty:
        value_counts = full_df["platform"].astype("string").value_counts(dropna=True)
        return {str(key): int(value) for key, value in value_counts.items() if str(key) not in SUPPORTED_REPORT_PLATFORMS}
    excluded = full_df[~full_df.index.isin(scoped_df.index)]
    if excluded.empty:
        return {}
    value_counts = excluded["platform"].astype("string").value_counts(dropna=True)
    return {str(key): int(value) for key, value in value_counts.items()}


payload = json.loads(sys.argv[1])
source = payload.get("source") or "combined"
start_date = payload.get("startDate")
end_date = payload.get("endDate")
platform = payload.get("platform")

config = load_app_config("config.yaml")
logger = logging.getLogger("jarvis_live_snapshot")
logger.handlers.clear()
logger.addHandler(logging.NullHandler())
logger.setLevel(logging.CRITICAL)

connectors = _build_connectors(
    source=source,
    input_path=Path("data_input"),
    app_config=config,
    logger=logger,
)

standardized, _, connector_quality = _fetch_source_data(
    connectors=connectors,
    start_date=start_date,
    end_date=end_date,
    logger=logger,
)
standardized = derive_engagement_if_missing(standardized)
validate_schema(standardized)

transformed = coerce_types(standardized)
transformed = derive_engagement_if_missing(transformed)
transformed = enrich_source_metadata(transformed)
filtered = apply_filters(
    transformed,
    start_date=start_date,
    end_date=end_date,
    platform=platform,
)

if filtered.empty:
    raise ValueError("Keine Social-Reporting-Daten fuer den angefragten Zeitraum gefunden.")

quality_reports = [
    report
    for report in [
        connector_quality,
        build_api_quality_report(filtered, source=source, start_date=start_date, end_date=end_date),
        build_source_coverage_report(filtered, source=source, platform_filter=platform),
        build_source_overlap_report(filtered, source=source),
        build_data_quality_report(filtered),
    ]
    if not report.empty
]
quality_report = pd.concat(quality_reports, ignore_index=True) if quality_reports else pd.DataFrame()
quality_summary = summarize_quality(quality_report)

report_data = calculate_kpis(filtered)
reporting_data = _reporting_scope(report_data)
summary = build_summary(
    reporting_data,
    period="weekly",
    quality_summary=quality_summary,
    period_start=start_date,
    period_end=end_date,
)

response = {
    "status": "ready",
    "generatedAt": pd.Timestamp.utcnow().isoformat(),
    "period": {
        "startDate": start_date,
        "endDate": end_date,
    },
    "filter": {
        "source": source,
        "platform": platform or None,
    },
    "summary": {
        "content_count": int(summary.get("content_count", 0)),
        "total_reach": round(_number(summary.get("total_reach")), 2),
        "total_impressions": round(_number(summary.get("total_impressions")), 2),
        "total_engagement": round(_number(summary.get("total_engagement")), 2),
        "total_clicks": round(_number(summary.get("total_clicks")), 2),
        "average_engagement_rate": round(_number(summary.get("average_engagement_rate")), 6),
        "follower_growth": round(_number(summary.get("follower_growth")), 2),
    },
    "qualitySummary": quality_summary,
    "platforms": _platform_summary(reporting_data),
    "sources": _source_summary(filtered),
    "excludedPlatforms": _excluded_platforms(report_data, reporting_data),
    "issuesPreview": quality_report.head(8).fillna("").to_dict(orient="records"),
}

print(json.dumps(response, ensure_ascii=False))
`;

export async function getSocialReportingLiveSnapshot(options = {}) {
  const projectPath = socialReportingProjectDir;

  if (!await pathExists(projectPath)) {
    return {
      status: "pending_connection",
      generatedAt: new Date().toISOString(),
      projectPath,
      errorMessage: "Das Social Reporting Projekt wurde nicht gefunden.",
      summary: null,
      platforms: [],
      sources: [],
      qualitySummary: { errors: 1, warnings: 0, info: 0, total: 1 },
      issuesPreview: [],
    };
  }

  const pythonPath = await resolvePythonExecutable(projectPath);
  if (!pythonPath) {
    return {
      status: "pending_connection",
      generatedAt: new Date().toISOString(),
      projectPath,
      errorMessage: "Keine Python-Runtime fuer das Social Reporting Tool gefunden.",
      summary: null,
      platforms: [],
      sources: [],
      qualitySummary: { errors: 1, warnings: 0, info: 0, total: 1 },
      issuesPreview: [],
    };
  }

  const payload = {
    source: normalizeSource(options.source),
    startDate: normalizeDate(options.startDate) || isoDate(daysAgo(7)),
    endDate: normalizeDate(options.endDate) || isoDate(new Date()),
    platform: normalizePlatform(options.platform),
  };

  const commandResult = await runProcess(
    pythonPath,
    ["-c", snapshotScript, JSON.stringify(payload)],
    projectPath,
  );

  if (commandResult.code !== 0) {
    return {
      status: "error",
      generatedAt: new Date().toISOString(),
      projectPath,
      pythonPath,
      filter: payload,
      errorMessage: summarizeFailure(commandResult),
      stdoutPreview: shrinkText(commandResult.stdout),
      stderrPreview: shrinkText(commandResult.stderr),
      summary: null,
      platforms: [],
      sources: [],
      qualitySummary: { errors: 1, warnings: 0, info: 0, total: 1 },
      issuesPreview: [],
    };
  }

  try {
    const snapshot = JSON.parse(String(commandResult.stdout || "{}"));
    return {
      ...snapshot,
      status: snapshot.status || "ready",
      projectPath,
      pythonPath,
      commandPreview: `${pythonPath} -c <live-social-snapshot>`,
      stdoutPreview: shrinkText(commandResult.stdout),
      stderrPreview: shrinkText(commandResult.stderr),
    };
  } catch {
    return {
      status: "error",
      generatedAt: new Date().toISOString(),
      projectPath,
      pythonPath,
      filter: payload,
      errorMessage: "Die Live-Snapshot-Antwort aus dem Social Reporting Tool war kein valides JSON.",
      stdoutPreview: shrinkText(commandResult.stdout),
      stderrPreview: shrinkText(commandResult.stderr),
      summary: null,
      platforms: [],
      sources: [],
      qualitySummary: { errors: 1, warnings: 0, info: 0, total: 1 },
      issuesPreview: [],
    };
  }
}

async function resolvePythonExecutable(projectPath) {
  const configuredPythonPath = String(process.env.SOCIAL_REPORTING_PYTHON_PATH || "").trim();
  const candidates = [
    configuredPythonPath,
    join(projectPath, ".venv", "bin", "python"),
    join(projectPath, ".venv", "Scripts", "python.exe"),
    "python3",
    "python",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate === "python3" || candidate === "python") return candidate;
    if (await pathExists(candidate)) return candidate;
  }

  return null;
}

function normalizeSource(source) {
  const normalized = String(source || "combined").trim().toLowerCase();
  return supportedSources.has(normalized) ? normalized : "combined";
}

function normalizePlatform(platform) {
  const value = String(platform || "").trim();
  if (!value || value === "Alle Kanaele" || value === "Social") return "";
  return value;
}

function normalizeDate(value) {
  const text = String(value || "").trim();
  return /^\\d{4}-\\d{2}-\\d{2}$/.test(text) ? text : "";
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function isoDate(value) {
  return value.toISOString().slice(0, 10);
}

function runProcess(command, args, cwd) {
  return new Promise((resolvePromise) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("error", (error) => {
      resolvePromise({
        code: 1,
        stdout,
        stderr: `${stderr}\n${error.message}`.trim(),
      });
    });

    child.on("close", (code) => {
      resolvePromise({
        code: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function summarizeFailure(commandResult) {
  return shrinkText(commandResult.stderr || commandResult.stdout || "Der Live-Snapshot aus dem Social Reporting Tool ist fehlgeschlagen.");
}

function shrinkText(value, maxLength = 800) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}
