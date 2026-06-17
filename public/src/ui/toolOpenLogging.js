import { DASHBOARD_ACTOR } from "../domain/constants.js";

export function bindToolOpenLogging(api) {
  document.querySelectorAll("[data-log-tool-open]").forEach((link) => {
    link.addEventListener("click", () => {
      const toolId = link.getAttribute("data-tool-id");
      const toolName = link.getAttribute("data-tool-name") || toolId;
      if (!toolId) return;

      api.createActivityLog({
        tool_id: toolId,
        action: "tool.opened",
        status: "info",
        actor: DASHBOARD_ACTOR,
        message: `${toolName} wurde geoeffnet.`,
        metadata: {
          href: link.getAttribute("href"),
        },
      }).catch(() => {
        // Navigation should not be blocked by monitoring writes.
      });
    });
  });
}
