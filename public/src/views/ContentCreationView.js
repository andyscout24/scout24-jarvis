import { PageHeader } from "../components/PageHeader.js";
import { icon } from "../icons.js";
import { escapeHtml } from "../utils.js";

const houses = [
  { name: "Haus am See", text: "Hero-Story fuer modernes Wohnen mit Fokus auf Licht, Lage und Grundriss." },
  { name: "Penthouse West", text: "High-end Objekt fuer visuelle Reels, Property Highlights und CTA Copy." },
  { name: "Townhouse Urban", text: "Kompakte Stadtimmobilie fuer Carousel, Listing Copy und Social Teaser." },
  { name: "Villa Panorama", text: "Premium-Expose mit Spotlight auf Aussicht, Architektur und Zielgruppe." },
  { name: "Loft Riverside", text: "Conversion-nahe Content-Serie fuer junge Zielgruppen und Maklerkontakte." },
  { name: "Familienhaus Grünblick", text: "Editorial Storyline mit Nachbarschaft, Alltag und emotionalem Nutzen." },
];

export function ContentCreationView() {
  return `
    ${PageHeader({
      eyebrow: "Social Media",
      title: "Content Creation / Haus der Woche",
      description: "Kuratiere Objekte fuer hochwertige Content-Produktionen und halte die kreative Pipeline sauber strukturiert.",
      actions: [{ label: "Neues Haus der Woche anlegen", href: "#/content-creation", icon: "sparkles", primary: true }],
    })}

    <section class="creation-grid">
      ${houses.map(houseCard).join("")}
    </section>
  `;
}

function houseCard(house) {
  return `
    <article class="creation-card">
      <div class="creation-media">
        <div class="creation-media-overlay">${icon("sparkles")}</div>
      </div>
      <div class="creation-copy">
        <strong>${escapeHtml(house.name)}</strong>
        <p>${escapeHtml(house.text)}</p>
      </div>
    </article>
  `;
}
