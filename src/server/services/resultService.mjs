import { badRequest, notFound } from "../errors/apiError.mjs";
import { Permissions, canAccessTool, canReadOffer, canReadReport, requirePermission } from "../auth/permissions.mjs";
import { buildOfferGenerationPayload } from "../modules/offerGeneratorAdapter.mjs";
import { buildReportGenerationPayload } from "../modules/reportingToolAdapter.mjs";

export function createResultService(repository) {
  return {
    async listOffers(currentUser) {
      const offers = await repository.getOffers();
      return offers.filter((offer) => canReadOffer(currentUser, offer));
    },

    async getOffer(offerId, currentUser) {
      const offer = await repository.getOfferById(offerId);
      if (!offer || !canReadOffer(currentUser, offer)) {
        throw notFound("offer_not_found", "Das angeforderte Angebot wurde nicht gefunden.");
      }
      return offer;
    },

    async listReports(currentUser) {
      const reports = await repository.getReports();
      return reports.filter((report) => canReadReport(currentUser, report));
    },

    async getReport(reportId, currentUser) {
      const report = await repository.getReportById(reportId);
      if (!report || !canReadReport(currentUser, report)) {
        throw notFound("report_not_found", "Der angeforderte Report wurde nicht gefunden.");
      }
      return report;
    },

    async generateReport(body, currentUser) {
      requirePermission(currentUser, Permissions.CREATE_REPORTS, "Nur Admins und Marketing User koennen Reports erstellen.");
      const tool = await repository.getToolById("reporting-tool");
      if (!tool) {
        throw notFound("tool_not_found", "Das Reporting Tool wurde nicht gefunden.");
      }
      if (!canAccessTool(currentUser, tool)) {
        throw notFound("tool_not_found", "Das Reporting Tool wurde nicht gefunden.");
      }
      if (tool.status === "disabled") {
        throw badRequest("tool_disabled", "Das Reporting Tool ist deaktiviert.");
      }

      const { report, automationRun, log } = buildReportGenerationPayload({
        ...body,
        actor: currentUser.name,
        actorUserId: currentUser.id,
      }, tool);
      return repository.createReport({ report, automationRun, log });
    },

    async generateOffer(body, currentUser) {
      requirePermission(currentUser, Permissions.CREATE_OFFERS, "Nur Admins und Sales User koennen Angebote erstellen.");
      const tool = await repository.getToolById("offer-generator");
      if (!tool) {
        throw notFound("tool_not_found", "Der Angebotsgenerator wurde nicht gefunden.");
      }
      if (!canAccessTool(currentUser, tool)) {
        throw notFound("tool_not_found", "Der Angebotsgenerator wurde nicht gefunden.");
      }
      if (tool.status === "disabled") {
        throw badRequest("tool_disabled", "Der Angebotsgenerator ist deaktiviert.");
      }

      const { offer, automationRun, log } = buildOfferGenerationPayload({
        ...body,
        actor: currentUser.name,
        actorUserId: currentUser.id,
      }, tool);
      return repository.createOffer({ offer, automationRun, log });
    },
  };
}
