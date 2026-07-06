import { getAppEnvironment, getSupabaseConfig } from "../config/env.mjs";
import { SupabaseRestClient } from "../persistence/supabaseRestClient.mjs";

const TOOL_ID = "editorial-planner";
const STATE_KEY = "editorial_planner_state";

const STATUS_FLOW = [
  ["proposed", "Vorgeschlagen"],
  ["shortlisted", "Shortlist"],
  ["planned", "Geplant"],
  ["briefed", "Briefed"],
  ["in_creation", "In Creation"],
  ["in_review", "In Review"],
  ["approved", "Freigegeben"],
  ["scheduled", "Geplant im Tool"],
  ["published", "Veröffentlicht"],
];

const CHANNELS = [
  { code: "instagram", label: "Instagram", tone: "violet" },
  { code: "tiktok", label: "TikTok", tone: "orange" },
  { code: "linkedin", label: "LinkedIn", tone: "blue" },
  { code: "facebook", label: "Facebook", tone: "teal" },
  { code: "newsletter", label: "Newsletter", tone: "amber" },
  { code: "blog_magazin", label: "Blog/Magazin", tone: "blue" },
];

const FORMATS = [
  ["reel", "Reel"],
  ["tiktok_short", "TikTok Short"],
  ["carousel", "Carousel"],
  ["static_post", "Static Post"],
  ["story", "Story"],
  ["poll", "Poll"],
  ["meme", "Meme"],
  ["linkedin_thought_leadership_post", "LinkedIn Thought Leadership Post"],
  ["market_insight_post", "Market Insight Post"],
  ["tutorial", "Tutorial"],
  ["checklist", "Checklist"],
  ["explainer", "Explainer"],
];

const RESPONSIBLE_PEOPLE = [
  { email: "social-media@immoscout24.at", name: "Mira Keller" },
  { email: "content.lead@immoscout24.at", name: "Leonie Hartmann" },
  { email: "brand.review@immoscout24.at", name: "Anna Berger" },
  { email: "design.ops@immoscout24.at", name: "Daniel Hofer" },
  { email: "performance.team@immoscout24.at", name: "Julia Fink" },
];

const TREND_SOURCE_TEMPLATES = [
  { code: "mock_google_trends", name: "Google Trends", source_type: "search" },
  { code: "mock_instagram_insights", name: "Instagram Insights", source_type: "social" },
  { code: "mock_linkedin_trends", name: "LinkedIn Trends", source_type: "social" },
  { code: "mock_reddit_dach", name: "Reddit DACH", source_type: "community" },
  { code: "mock_news_at", name: "AT Medienmonitor", source_type: "news" },
  { code: "mock_reporting", name: "Jarvis Performance Learnings", source_type: "internal" },
];

const TREND_SIGNAL_TEMPLATES = [
  ["Nebenkosten transparent erklaeren", "Betriebskosten und Warmmiete werden wieder auffaellig oft recherchiert.", "Mieten", "Austria", "mock_google_trends", "So erklaert ImmoScout24 Betriebskosten ohne Juristensprache."],
  ["WG-Casting Red Flags", "WG-Suche plus Matching-Frust sorgt fuer viele Community-Fragen.", "WG & Studenten", "Austria", "mock_reddit_dach", "Humor plus konkrete WG-Tipps fuer Studierende und Berufseinsteiger."],
  ["Kleine Wohnungen clever nutzen", "Stauraum, Multifunktionsmoebel und kleine Grundrisse performen stark.", "Wohnen & Einrichtung", "DACH", "mock_instagram_insights", "Carousel oder Reel mit echten Wohn-Hacks fuer 35 bis 55 Quadratmeter."],
  ["Mieten oder kaufen 2026", "Vergleichsrechner und Budget-Entscheidungshilfen gewinnen an Aufmerksamkeit.", "Kaufen", "Austria", "mock_reporting", "Entscheidungshilfe mit Budget-Brille statt harter Verkaufsperspektive."],
  ["Wohnungssuche in Wien", "Lokale Stadtinhalte und Suchfehler in Wien performen konstant.", "Wohnung suchen", "Austria", "mock_google_trends", "Hilfreicher Such-Guide mit Wien-Fokus."],
  ["Maklerwissen einfach erklaert", "Einfaches Erklaeren von Provision, Besichtigung und Expose bleibt relevant.", "Maklerwissen", "Austria", "mock_news_at", "Explainer-Post mit Sicherheitsgefuehl fuer Erstsuchende."],
  ["Umzugscheckliste fuer die erste Wohnung", "Die erste eigene Wohnung bleibt ein starker Gen-Z Trigger.", "Umzug", "Austria", "mock_instagram_insights", "Checkliste mit klaren Schritten und Quick Wins."],
  ["Immobilienpreise in Graz", "Regionale Preisentwicklungen und Vergleiche werden aktiv gelesen.", "Immobilienmarkt", "Austria", "mock_linkedin_trends", "LinkedIn Insight oder Carousel fuer Suchende und Makler."],
  ["Energiesparen in Mietwohnungen", "Nachhaltigkeit plus Nebenkosten ist weiter hoch relevant.", "Energie & Nachhaltigkeit", "DACH", "mock_news_at", "Hilfreiche Tipps ohne moralischen Zeigefinger."],
  ["Gen-Z Wohnprobleme", "Zwischen Balkontraum und Budgetrealitaet funktionieren relatable Inhalte sehr gut.", "Humor rund ums Wohnen", "DACH", "mock_instagram_insights", "Trendbasiertes Short Video mit klarer Brand-Passung."],
  ["Fehler bei der Wohnungssuche", "Fehlervermeidung bleibt eines der dankbarsten Hilfsthemen.", "Wohnung suchen", "Austria", "mock_reporting", "Konkreter Mehrwert fuer Suchende vor dem ersten Besichtigungstermin."],
  ["Wohntrends fuer kleine Balkone", "Balkon, Outdoor-Ecke und Sommer-Upgrade treiben Saves und Shares.", "Wohnen & Einrichtung", "Austria", "mock_instagram_insights", "Sommerlicher Quick-Win-Post fuer hohe Speicherrate."],
];

export function createEditorialPlannerNativeService(repository) {
  const store = createStateStore(repository);

  return {
    async getOverview() {
      const state = await loadState(store);
      const plans = sortPlans(state.plans);
      const currentWeek = isoWeekParts(new Date());
      const currentWeekPlan = plans.find((plan) => plan.calendarYear === currentWeek.year && plan.calendarWeek === currentWeek.week) || null;

      return {
        health: { status: "ok", mode: "native", source: "jarvis_native" },
        plans,
        latestPlan: plans[0] || null,
        currentWeekPlan,
        trendSignals: sortTrendSignals(state.trendSignals),
        trendSources: state.trendSources,
        performanceInsights: buildPerformanceInsights(),
        integrationStatus: buildIntegrationStatus(),
        automation: {
          enabled: false,
          running: false,
          next_run_at: null,
          mode: "manual_native",
        },
      };
    },

    async listPlans(query = {}) {
      const state = await loadState(store);
      let plans = sortPlans(state.plans);
      if (query.market) plans = plans.filter((plan) => plan.market === String(query.market).toUpperCase());
      if (query.status) plans = plans.filter((plan) => plan.status === query.status);
      const limit = clampInt(query.limit, 100, 1, 200);
      const offset = clampInt(query.offset, 0, 0, 10000);
      return {
        editorial_plans: plans.slice(offset, offset + limit),
      };
    },

    async getPlan(planId) {
      const state = await loadState(store);
      const plan = state.plans.find((item) => Number(item.id) === Number(planId));
      if (!plan) throw new Error("Redaktionsplan wurde nicht gefunden.");
      return clone(plan);
    },

    async generatePlan(payload = {}) {
      const weekStartDate = normalizeWeekStart(payload.weekStartDate || new Date().toISOString().slice(0, 10));
      const market = String(payload.market || "AT").trim().toUpperCase();
      const state = await loadState(store);
      const week = isoWeekParts(new Date(`${weekStartDate}T12:00:00`));

      let existing = state.plans.find((plan) => plan.weekStartDate === weekStartDate && plan.market === market);
      if (existing) {
        existing.updatedAt = nowIso();
        await saveState(store, state);
        return {
          ...clone(existing),
          automation_report: {
            created: false,
            existing_plan_reused: true,
            trend_signal_count: state.trendSignals.length,
          },
        };
      }

      const planId = state.nextPlanId++;
      const generated = generateIdeasForWeek({
        planId,
        weekStartDate,
        market,
        trendSignals: sortTrendSignals(state.trendSignals),
        nextIdeaId: state.nextIdeaId,
      });
      state.nextIdeaId = generated.nextIdeaId;

      const plan = buildPlan({
        id: planId,
        title: `Weekly Editorial Plan KW ${week.week}/${week.year}`,
        calendarYear: week.year,
        calendarWeek: week.week,
        weekStartDate,
        weekEndDate: addDays(weekStartDate, 6),
        market,
        status: "draft",
        generatedFrom: "jarvis_native_generator",
        contentIdeas: generated.ideas,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });

      state.plans.push(plan);
      await saveState(store, state);
      return {
        ...clone(plan),
        automation_report: {
          created: true,
          existing_plan_reused: false,
          trend_signal_count: state.trendSignals.length,
        },
      };
    },

    async listTrendSignals(query = {}) {
      const state = await loadState(store);
      let signals = sortTrendSignals(state.trendSignals);
      if (query.category) signals = signals.filter((signal) => signal.category === query.category);
      if (query.region) signals = signals.filter((signal) => signal.region === query.region);
      if (query.source) signals = signals.filter((signal) => signal.sourceCode === query.source || signal.source === query.source);
      if (query.min_relevance) signals = signals.filter((signal) => Number(signal.relevance || 0) >= Number(query.min_relevance || 0));
      const limit = clampInt(query.limit, 50, 1, 200);
      return {
        trend_signals: signals.slice(0, limit),
      };
    },

    async refreshTrendSignals() {
      const state = await loadState(store);
      state.trendSignals = buildTrendSignals(state.trendSources, new Date());
      state.lastUpdatedAt = nowIso();
      await saveState(store, state);
      return {
        refreshed_count: state.trendSignals.length,
        trend_signals: sortTrendSignals(state.trendSignals),
      };
    },

    async listTrendSources() {
      const state = await loadState(store);
      return {
        trend_sources: state.trendSources,
      };
    },

    async createContentIdea(payload = {}) {
      const state = await loadState(store);
      const plan = requirePlan(state, payload.editorial_plan_id || payload.editorialPlanId);
      const idea = createIdeaFromPayload({
        payload,
        plan,
        ideaId: state.nextIdeaId++,
        existingIdea: null,
      });
      plan.contentIdeas.push(idea);
      touchPlan(plan);
      await saveState(store, state);
      return clone(idea);
    },

    async updateContentIdea(contentIdeaId, payload = {}) {
      const state = await loadState(store);
      const { plan, idea } = requireIdea(state, contentIdeaId);
      const updated = createIdeaFromPayload({
        payload,
        plan,
        ideaId: idea.id,
        existingIdea: idea,
      });
      const index = plan.contentIdeas.findIndex((item) => Number(item.id) === Number(contentIdeaId));
      plan.contentIdeas[index] = updated;
      touchPlan(plan);
      await saveState(store, state);
      return clone(updated);
    },

    async deleteContentIdea(contentIdeaId) {
      const state = await loadState(store);
      const { plan } = requireIdea(state, contentIdeaId);
      plan.contentIdeas = plan.contentIdeas.filter((item) => Number(item.id) !== Number(contentIdeaId));
      touchPlan(plan);
      await saveState(store, state);
      return { ok: true };
    },

    async changeContentIdeaStatus(contentIdeaId, payload = {}) {
      const state = await loadState(store);
      const { plan, idea } = requireIdea(state, contentIdeaId);
      const statusCode = String(payload.status_code || payload.statusCode || payload.status || "").trim();
      if (!statusCode) throw new Error("status_code fehlt.");
      idea.statusCode = statusCode;
      idea.status = statusLabel(statusCode);
      idea.updatedAt = nowIso();
      touchPlan(plan);
      await saveState(store, state);
      return clone(idea);
    },

    async exportPlan(planId, format = "csv") {
      const plan = await this.getPlan(planId);
      const normalized = String(format || "csv").toLowerCase();

      if (normalized === "json") {
        return {
          contentType: "application/json",
          filename: `editorial-plan-${plan.id}.json`,
          body: Buffer.from(`${JSON.stringify({ plan }, null, 2)}\n`, "utf8"),
        };
      }

      const csvBody = buildCsv(plan);
      return {
        contentType: "text/csv; charset=utf-8",
        filename: `editorial-plan-${plan.id}.csv`,
        body: Buffer.from(`\uFEFF${csvBody}`, "utf8"),
      };
    },
  };
}

function createStateStore(repository) {
  const supabaseConfig = getSupabaseConfig();
  const directClient = supabaseConfig.url && supabaseConfig.serviceRoleKey
    ? new SupabaseRestClient(supabaseConfig)
    : null;

  return {
    async read() {
      if (directClient) {
        const rows = await directClient.select("settings", {
          filters: [eq("setting_key", STATE_KEY), eq("tool_id", TOOL_ID)],
          limit: 1,
        });
        if (rows[0]?.value) return rows[0].value;
      }

      const fallback = await repository.getSetting?.(STATE_KEY, { toolId: TOOL_ID });
      return fallback?.value || null;
    },

    async write(value) {
      const timestamp = nowIso();

      if (directClient) {
        const rows = await directClient.select("settings", {
          filters: [eq("setting_key", STATE_KEY), eq("tool_id", TOOL_ID)],
          limit: 1,
        });

        const body = {
          setting_key: STATE_KEY,
          scope: "tool",
          tool_id: TOOL_ID,
          value,
          is_secret: false,
          updated_at: timestamp,
        };

        if (rows[0]) {
          await directClient.patch("settings", {
            filters: [eq("setting_key", STATE_KEY), eq("tool_id", TOOL_ID)],
            body,
          });
        } else {
          await directClient.insert("settings", body);
        }
        return;
      }

      await repository.upsertSetting?.({
        settingKey: STATE_KEY,
        scope: "tool",
        toolId: TOOL_ID,
        value,
        updatedAt: timestamp,
      });
    },
  };
}

async function loadState(store) {
  const existing = await store.read();
  if (existing?.plans?.length) return existing;
  const seeded = buildSeedState(new Date());
  await store.write(seeded);
  return seeded;
}

async function saveState(store, state) {
  state.lastUpdatedAt = nowIso();
  await store.write(state);
}

function buildSeedState(now) {
  const trendSources = TREND_SOURCE_TEMPLATES.map((item, index) => ({
    id: index + 1,
    ...item,
    url: null,
    is_active: true,
    refresh_frequency: "daily",
    notes: "Native Jarvis Mock Source",
    created_at: nowIso(),
  }));
  const trendSignals = buildTrendSignals(trendSources, now);
  const currentWeekStart = normalizeWeekStart(now.toISOString().slice(0, 10));
  const previousWeekStart = addDays(currentWeekStart, -7);
  const currentWeek = isoWeekParts(new Date(`${currentWeekStart}T12:00:00`));
  const previousWeek = isoWeekParts(new Date(`${previousWeekStart}T12:00:00`));

  let nextIdeaId = 5000;
  const previousPlanGenerated = generateIdeasForWeek({
    planId: 1000,
    weekStartDate: previousWeekStart,
    market: "AT",
    trendSignals,
    nextIdeaId,
  });
  nextIdeaId = previousPlanGenerated.nextIdeaId;
  const currentPlanGenerated = generateIdeasForWeek({
    planId: 1001,
    weekStartDate: currentWeekStart,
    market: "AT",
    trendSignals,
    nextIdeaId,
  });
  nextIdeaId = currentPlanGenerated.nextIdeaId;

  return {
    version: 1,
    nextPlanId: 1002,
    nextIdeaId,
    trendSources,
    trendSignals,
    plans: [
      buildPlan({
        id: 1000,
        title: `Weekly Editorial Plan KW ${previousWeek.week}/${previousWeek.year}`,
        calendarYear: previousWeek.year,
        calendarWeek: previousWeek.week,
        weekStartDate: previousWeekStart,
        weekEndDate: addDays(previousWeekStart, 6),
        market: "AT",
        status: "completed",
        generatedFrom: "jarvis_native_seed",
        contentIdeas: previousPlanGenerated.ideas.map((idea, index) => ({
          ...idea,
          statusCode: index > 4 ? "published" : index > 2 ? "scheduled" : idea.statusCode,
          status: index > 4 ? statusLabel("published") : index > 2 ? statusLabel("scheduled") : idea.status,
        })),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }),
      buildPlan({
        id: 1001,
        title: `Weekly Editorial Plan KW ${currentWeek.week}/${currentWeek.year}`,
        calendarYear: currentWeek.year,
        calendarWeek: currentWeek.week,
        weekStartDate: currentWeekStart,
        weekEndDate: addDays(currentWeekStart, 6),
        market: "AT",
        status: "draft",
        generatedFrom: "jarvis_native_seed",
        contentIdeas: currentPlanGenerated.ideas,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }),
    ],
    lastUpdatedAt: nowIso(),
  };
}

function buildTrendSignals(trendSources, now) {
  return TREND_SIGNAL_TEMPLATES.map((item, index) => {
    const source = trendSources.find((entry) => entry.code === item[4]) || trendSources[0];
    return {
      id: index + 1,
      title: item[0],
      description: item[1],
      category: item[2],
      region: item[3],
      source: source.name,
      sourceCode: source.code,
      relevance: 74 + (index % 5) * 4,
      confidence: 72 + (index % 4) * 5,
      suggestedAngle: item[5],
      contentOpportunity: item[5],
      detectedAt: new Date(now.getTime() - index * 3600_000).toISOString(),
      platformFit: {
        instagram: index % 2 === 0,
        linkedin: index % 3 === 0,
        tiktok: index % 4 !== 0,
      },
    };
  });
}

function generateIdeasForWeek({ planId, weekStartDate, market, trendSignals, nextIdeaId }) {
  const slots = [
    ["instagram", "reel", "awareness", "high", "medium", 0],
    ["linkedin", "market_insight_post", "traffic", "high", "low", 1],
    ["instagram", "carousel", "engagement", "medium", "medium", 2],
    ["facebook", "poll", "engagement", "medium", "low", 3],
    ["tiktok", "tiktok_short", "awareness", "high", "low", 4],
    ["newsletter", "checklist", "traffic", "medium", "medium", 5],
    ["instagram", "story", "retention", "low", "low", 6],
    ["linkedin", "explainer", "lead", "medium", "medium", 2],
  ];

  const ideas = slots.map((slot, index) => {
    const trend = trendSignals[index % trendSignals.length];
    const postingDate = addDays(weekStartDate, slot[5]);
    const postingTime = ["09:00", "11:30", "13:00", "15:30", "17:30", "08:30", "18:00", "10:15"][index];
    const title = buildTitle(trend, slot[0], index);
    const hook = buildHook(trend, slot[0], index);
    const description = buildDescription(trend, market);
    const caption = buildCaption(title, trend, slot[0]);
    const brandFitScore = 84 + (index % 4) * 3;
    const qualityScore = 82 + (index % 3) * 4;
    const effortScore = effortScoreFromLabel(slot[4]);
    const responsible = RESPONSIBLE_PEOPLE[index % RESPONSIBLE_PEOPLE.length];
    const idea = {
      id: nextIdeaId + index,
      backendId: nextIdeaId + index,
      editorialPlanId: planId,
      title,
      description,
      shortDescription: description,
      platform: channelLabel(slot[0]),
      platformCode: slot[0],
      tone: channelTone(slot[0]),
      postingDate,
      postingTime,
      status: statusLabel(index < 2 ? "briefed" : "planned"),
      statusCode: index < 2 ? "briefed" : "planned",
      format: formatLabel(slot[1]),
      formatCode: slot[1],
      funnelGoal: slot[2],
      targetAudience: buildTargetAudience(trend),
      hook,
      captionDraft: caption,
      cta: buildCta(slot[2]),
      creativeDirection: buildCreativeDirection(slot[1], trend),
      timingReason: buildTimingReason(slot[0], slot[2], trend),
      requiredAssets: buildAssets(slot[1], trend),
      trendBasis: {
        trend_title: trend.title,
        trend_description: trend.description,
        category: trend.category,
        region: trend.region,
        source: trend.sourceCode,
        sourceName: trend.source,
        content_opportunity: trend.contentOpportunity,
        relevance_for_immoscout: trend.relevance,
      },
      responsible: responsible.name,
      responsibleEmail: responsible.email,
      relevanceScore: trend.relevance,
      effort: slot[4],
      effortScore,
      priority: slot[3],
      notes: index === 3 ? "Community-Reaktion in den Kommentaren monitoren." : "",
      expectedImpactScore: 78 + (index % 5) * 4,
      confidenceScore: trend.confidence,
      performanceScore: 70 + (index % 4) * 5,
      qualityScore,
      qualityValidation: {
        isValid: true,
        qualityScore,
        warnings: slot[4] === "high" ? ["Produktion frueh briefen, da Videocut und Grafiken zusammenlaufen."] : [],
        improvementSuggestions: [trend.suggestedAngle],
        blockingIssues: [],
      },
      brandFitScore,
      trendTitle: trend.title,
      publishingSlot: {
        scheduledDate: postingDate,
        scheduledTime: postingTime,
        timezone: "Europe/Vienna",
        status: "draft",
      },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    return idea;
  });

  return {
    ideas,
    nextIdeaId: nextIdeaId + ideas.length,
  };
}

function buildPlan(plan) {
  const contentIdeas = [...(plan.contentIdeas || [])].sort((left, right) =>
    `${left.postingDate} ${left.postingTime}`.localeCompare(`${right.postingDate} ${right.postingTime}`));

  return {
    ...plan,
    contentIdeas,
    summary: {
      totalIdeas: contentIdeas.length,
      channelCount: new Set(contentIdeas.map((idea) => idea.platform)).size,
      formatCount: new Set(contentIdeas.map((idea) => idea.format)).size,
      statusCounts: contentIdeas.reduce((accumulator, idea) => {
        accumulator[idea.statusCode] = Number(accumulator[idea.statusCode] || 0) + 1;
        return accumulator;
      }, {}),
    },
  };
}

function createIdeaFromPayload({ payload, plan, ideaId, existingIdea }) {
  const channelCode = normalizeCode(payload.channel_code || payload.channelCode || existingIdea?.platformCode || "instagram");
  const formatCode = normalizeCode(payload.format_code || payload.formatCode || existingIdea?.formatCode || "reel");
  const statusCode = String(payload.status_code || payload.statusCode || existingIdea?.statusCode || "planned");
  const responsibleEmail = String(payload.responsible_person_email || payload.responsiblePersonEmail || existingIdea?.responsibleEmail || RESPONSIBLE_PEOPLE[0].email);
  const responsible = RESPONSIBLE_PEOPLE.find((item) => item.email === responsibleEmail) || RESPONSIBLE_PEOPLE[0];
  const effort = normalizeEffort(payload.effort || payload.effortLevel || existingIdea?.effort || "medium");
  const trendTitle = payload.trend_basis?.trend_title || payload.trend_basis?.title || payload.trend_title || existingIdea?.trendBasis?.trend_title || "Manuell hinzugefuegt";
  const trendBasis = {
    trend_title: trendTitle,
    trend_description: payload.trend_basis?.trend_description || payload.description || existingIdea?.trendBasis?.trend_description || "",
    category: payload.trend_basis?.category || existingIdea?.trendBasis?.category || "Redaktion",
    region: payload.trend_basis?.region || existingIdea?.trendBasis?.region || "Austria",
    source: payload.trend_basis?.source || existingIdea?.trendBasis?.source || "manual",
    sourceName: payload.trend_basis?.sourceName || existingIdea?.trendBasis?.sourceName || "Jarvis Native",
    content_opportunity: payload.trend_basis?.content_opportunity || existingIdea?.trendBasis?.content_opportunity || "",
    relevance_for_immoscout: Number(payload.relevance_score || existingIdea?.relevanceScore || 80),
  };

  const qualityScore = scoreQuality({
    title: payload.title || existingIdea?.title,
    hook: payload.hook || existingIdea?.hook,
    notes: payload.notes || existingIdea?.notes || "",
  });
  const brandFitScore = Math.max(72, qualityScore - 2);

  return {
    id: ideaId,
    backendId: ideaId,
    editorialPlanId: plan.id,
    title: String(payload.title || existingIdea?.title || "").trim(),
    description: String(payload.description || existingIdea?.description || "").trim(),
    shortDescription: String(payload.short_description || payload.shortDescription || existingIdea?.shortDescription || payload.description || "").trim(),
    platform: channelLabel(channelCode),
    platformCode: channelCode,
    tone: channelTone(channelCode),
    postingDate: normalizeDate(payload.posting_date || payload.postingDate || existingIdea?.postingDate || plan.weekStartDate),
    postingTime: normalizeTime(payload.posting_time || payload.postingTime || existingIdea?.postingTime || "10:00"),
    status: statusLabel(statusCode),
    statusCode,
    format: formatLabel(formatCode),
    formatCode,
    funnelGoal: String(payload.funnel_goal || payload.funnelGoal || existingIdea?.funnelGoal || "awareness"),
    targetAudience: String(payload.target_audience || payload.targetAudience || existingIdea?.targetAudience || "Suchende in Oesterreich"),
    hook: String(payload.hook || existingIdea?.hook || "").trim(),
    captionDraft: String(payload.caption_suggestion || payload.captionDraft || existingIdea?.captionDraft || "").trim(),
    cta: String(payload.cta || existingIdea?.cta || "").trim(),
    creativeDirection: String(payload.creative_direction || payload.creativeDirection || existingIdea?.creativeDirection || "").trim(),
    timingReason: String(payload.timing_reason || payload.reasonForTiming || existingIdea?.timingReason || "").trim(),
    requiredAssets: normalizeAssets(payload.asset_requirements || payload.requiredAssets || existingIdea?.requiredAssets || []),
    trendBasis,
    responsible: responsible.name,
    responsibleEmail: responsible.email,
    relevanceScore: trendBasis.relevance_for_immoscout,
    effort,
    effortScore: effortScoreFromLabel(effort),
    priority: normalizePriority(payload.priority || existingIdea?.priority || "medium"),
    notes: String(payload.notes || existingIdea?.notes || "").trim(),
    expectedImpactScore: Number(payload.expected_impact_score || payload.expectedImpactScore || existingIdea?.expectedImpactScore || 78),
    confidenceScore: Number(payload.content_confidence_score || payload.confidenceScore || existingIdea?.confidenceScore || 80),
    performanceScore: Number(payload.performance_score || payload.performanceScore || existingIdea?.performanceScore || 76),
    qualityScore,
    qualityValidation: {
      isValid: true,
      qualityScore,
      warnings: qualityScore < 78 ? ["Hook und Nutzermehrwert schaerfen, bevor der Post freigegeben wird."] : [],
      improvementSuggestions: qualityScore < 78 ? ["Den Nutzen im ersten Satz konkreter machen."] : ["Posting ist fuer das Team direkt weiterbearbeitbar."],
      blockingIssues: [],
    },
    brandFitScore,
    trendTitle: trendBasis.trend_title,
    publishingSlot: {
      scheduledDate: normalizeDate(payload.posting_date || payload.postingDate || existingIdea?.postingDate || plan.weekStartDate),
      scheduledTime: normalizeTime(payload.posting_time || payload.postingTime || existingIdea?.postingTime || "10:00"),
      timezone: "Europe/Vienna",
      status: statusCode === "published" ? "published" : statusCode === "scheduled" ? "scheduled" : "draft",
    },
    createdAt: existingIdea?.createdAt || nowIso(),
    updatedAt: nowIso(),
  };
}

function buildPerformanceInsights() {
  return {
    source: "Jarvis Native Mock Insights",
    sampleSize: 42,
    bestPostingDay: "Dienstag",
    bestPerformingFormats: ["Carousel", "Reel", "LinkedIn Thought Leadership Post"],
    bestPostingTimes: ["09:00", "11:30", "17:30"],
    highEngagementTopics: ["Wohnungssuche in Wien", "Nebenkosten einfach erklaert", "WG-Leben"],
    lowPerformingTopics: ["Zu generische Wohnzitate"],
    recommendedContentMix: {
      instagram: 3,
      linkedin: 2,
      facebook: 1,
      tiktok: 1,
      newsletter: 1,
    },
    channelSpecificRecommendations: {
      instagram: "Carousels mit konkreten Checklisten liefern stabile Saves.",
      linkedin: "Markt- und Experteneinordnung performt morgens besonders gut.",
      tiktok: "Humor + Wohnrealitaet funktioniert, wenn der Mehrwert sofort sichtbar ist.",
    },
    weeklyOptimizationTips: [
      "Mindestens einen LinkedIn Marktpost am Dienstag oder Mittwoch einplanen.",
      "Short Videos mit klarem Pain Point in den ersten zwei Sekunden starten.",
      "Quick-Win-Posts mit Checkliste oder Erklaerstueck fuer Freitag vorsehen.",
    ],
  };
}

function buildIntegrationStatus() {
  return {
    summary: {
      active_trend_provider: "jarvis_native_mock",
      active_performance_provider: "jarvis_native_mock",
      planner_runtime: "native",
    },
    integrations: [
      { id: "jarvis_native", label: "Jarvis Native Planner", status: "connected" },
      { id: "trend_research_mock", label: "Mock Trend Research", status: "connected" },
      { id: "performance_mock", label: "Mock Performance Insights", status: "connected" },
    ],
    trend_providers: [
      { code: "jarvis_native_mock", name: "Jarvis Native Mock", status: "connected" },
    ],
    performance_providers: [
      { code: "jarvis_native_mock", name: "Jarvis Native Mock", status: "connected" },
    ],
  };
}

function buildCsv(plan) {
  const headers = [
    "Kalenderwoche", "Datum", "Uhrzeit", "Kanal", "Format", "Titel", "Beschreibung", "Hook",
    "Caption", "CTA", "Zielgruppe", "Funnel-Ziel", "Trendgrundlage", "benoetigte Assets",
    "Prioritaet", "Aufwand", "Verantwortlich", "Status", "Notizen",
  ];

  const rows = plan.contentIdeas.map((idea) => [
    `KW ${plan.calendarWeek}/${plan.calendarYear}`,
    idea.postingDate,
    idea.postingTime,
    idea.platform,
    idea.format,
    idea.title,
    idea.description,
    idea.hook,
    idea.captionDraft,
    idea.cta,
    idea.targetAudience,
    idea.funnelGoal,
    idea.trendTitle,
    idea.requiredAssets.map((asset) => `${asset.type}: ${asset.description}`).join(" | "),
    idea.priority,
    idea.effort,
    idea.responsible,
    idea.status,
    idea.notes,
  ]);

  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

function requirePlan(state, planId) {
  const plan = state.plans.find((item) => Number(item.id) === Number(planId));
  if (!plan) throw new Error("Redaktionsplan wurde nicht gefunden.");
  return plan;
}

function requireIdea(state, ideaId) {
  for (const plan of state.plans) {
    const idea = plan.contentIdeas.find((item) => Number(item.id) === Number(ideaId));
    if (idea) return { plan, idea };
  }
  throw new Error("Content-Idee wurde nicht gefunden.");
}

function touchPlan(plan) {
  plan.updatedAt = nowIso();
  const normalized = buildPlan(plan);
  plan.contentIdeas = normalized.contentIdeas;
  plan.summary = normalized.summary;
}

function sortPlans(plans) {
  return [...plans].sort((left, right) => `${right.weekStartDate}`.localeCompare(`${left.weekStartDate}`));
}

function sortTrendSignals(signals) {
  return [...signals].sort((left, right) => Number(right.relevance || 0) - Number(left.relevance || 0));
}

function buildTitle(trend, channelCode, index) {
  const variants = [
    `5 Learnings zu ${trend.category}`,
    `${trend.title}: Was Suchende jetzt wissen muessen`,
    `POV: ${trend.title}`,
    `${trend.title} einfach erklaert`,
  ];
  return channelCode === "linkedin"
    ? `${trend.title}: Marktupdate fuer ImmoScout24`
    : variants[index % variants.length];
}

function buildHook(trend, channelCode, index) {
  const hooks = [
    `Warum ${trend.title.toLowerCase()} gerade so viele Suchende beschaeftigt.`,
    `Wenn du 2026 wohnst, kennst du dieses Problem wahrscheinlich schon.`,
    `Das ist einer der haeufigsten Denkfehler rund ums Wohnen gerade.`,
    `Kurz und konkret: Das hilft dir bei ${trend.category.toLowerCase()}.`,
  ];
  return channelCode === "tiktok"
    ? `POV: Du suchst eine Wohnung und stolperst sofort ueber ${trend.title.toLowerCase()}.`
    : hooks[index % hooks.length];
}

function buildDescription(trend, market) {
  return `Redaktionelle Content-Idee fuer ImmoScout24 ${market}: ${trend.description}`;
}

function buildCaption(title, trend, channelCode) {
  return `${title}\n\n${trend.suggestedAngle}\n\nMehr Orientierung fuer Wohnungssuche, Miete und Kaufen in Oesterreich.`;
}

function buildCta(goal) {
  if (goal === "traffic") return "Mehr dazu im Magazin lesen";
  if (goal === "lead") return "Passende Inserate auf ImmoScout24 entdecken";
  if (goal === "engagement") return "Deine Erfahrung in den Kommentaren teilen";
  return "Fuer spaeter speichern";
}

function buildCreativeDirection(formatCode, trend) {
  if (formatCode === "poll") return "Leichtes Community-Visual mit klarer Frage und 2-4 Antwortoptionen.";
  if (formatCode === "reel" || formatCode === "tiktok_short") return "Schneller Einstieg mit Problem, kurze Schnitte, grosse On-Screen-Texte.";
  if (formatCode === "market_insight_post") return "Klare Chart- oder Kartenlogik mit Scout24 Branding und sachlicher Einordnung.";
  return `Klare, hilfreiche Visualisierung zum Thema ${trend.category}.`;
}

function buildTimingReason(channelCode, goal, trend) {
  return `${channelLabel(channelCode)} Slot passend fuer ${goal} und das aktuelle Interesse an ${trend.title}.`;
}

function buildTargetAudience(trend) {
  if (trend.category.includes("WG")) return "Studierende und Berufseinsteiger";
  if (trend.category.includes("Kaufen")) return "Kaeufer und Eigentumsinteressierte";
  return "Wohnungssuchende in Oesterreich";
}

function buildAssets(formatCode, trend) {
  if (formatCode === "poll") {
    return [{ type: "copy", description: `Frage + Antwortoptionen zu ${trend.title}`, required: true, status: "open" }];
  }
  if (formatCode === "reel" || formatCode === "tiktok_short") {
    return [
      { type: "video", description: `Kurzer Vertical Cut zum Thema ${trend.title}`, required: true, status: "open" },
      { type: "copy", description: "Hook und On-Screen-Texte", required: true, status: "open" },
    ];
  }
  return [
    { type: "design", description: `Visual oder Grafik fuer ${trend.title}`, required: true, status: "open" },
    { type: "copy", description: "Caption und CTA finalisieren", required: true, status: "open" },
  ];
}

function normalizeAssets(assets) {
  return (Array.isArray(assets) ? assets : [])
    .map((asset) => ({
      id: Number(asset.id || 0) || null,
      type: asset.type || asset.asset_type || "asset",
      description: asset.description || "",
      required: asset.required !== false && asset.is_required !== false,
      status: asset.status || "open",
    }))
    .filter((asset) => asset.description);
}

function scoreQuality({ title, hook, notes }) {
  let score = 76;
  if (String(title || "").trim().length >= 12) score += 6;
  if (String(hook || "").trim().length >= 18) score += 8;
  if (!String(notes || "").toLowerCase().includes("todo")) score += 4;
  return Math.min(96, score);
}

function channelLabel(code) {
  return CHANNELS.find((item) => item.code === code)?.label || code;
}

function channelTone(code) {
  return CHANNELS.find((item) => item.code === code)?.tone || "blue";
}

function formatLabel(code) {
  return FORMATS.find((item) => item[0] === code)?.[1] || code;
}

function statusLabel(code) {
  return STATUS_FLOW.find((item) => item[0] === code)?.[1] || code;
}

function effortScoreFromLabel(value) {
  if (value === "low") return 2;
  if (value === "high") return 4;
  return 3;
}

function normalizeEffort(value) {
  const raw = String(value || "medium").toLowerCase();
  if (["1", "2", "low", "niedrig"].includes(raw)) return "low";
  if (["4", "5", "high", "hoch"].includes(raw)) return "high";
  return "medium";
}

function normalizePriority(value) {
  const raw = String(value || "medium").toLowerCase();
  if (["high", "hoch"].includes(raw)) return "high";
  if (["low", "niedrig"].includes(raw)) return "low";
  return "medium";
}

function normalizeCode(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeDate(value) {
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return nowIso().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function normalizeTime(value) {
  const raw = String(value || "10:00").trim();
  return /^\d{2}:\d{2}$/.test(raw) ? raw : "10:00";
}

function normalizeWeekStart(value) {
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  return date.toISOString().slice(0, 10);
}

function addDays(dateValue, days) {
  const date = new Date(`${dateValue}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function isoWeekParts(value) {
  const date = new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return {
    year: date.getUTCFullYear(),
    week,
  };
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll(`"`, `""`)}"` : text;
}

function clampInt(value, fallback, min, max) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function eq(column, value) {
  return { column, value, operator: "eq" };
}

function nowIso() {
  return new Date().toISOString();
}

function clone(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}
