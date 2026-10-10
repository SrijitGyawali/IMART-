import { EscapeLines } from "./escape-lines";
import { FilmLabels } from "./film-labels";

const ACTS = [
  {
    id: "genuine",
    title: ["Genuine.", "Sealed.", "Yours."],
    body: "Every phone is genuine, sealed and new in the box, with warranty included.",
    meta: ["Genuine Apple product", "Sealed · new in box", "Warranty included"],
  },
  {
    id: "inside",
    title: ["We know it", "inside out."],
    body: "Repairs and after-sales care, right here at our Amarpath store.",
    meta: ["Back glass", "Battery", "Logic board", "Frame", "Display"],
  },
  {
    id: "pay",
    title: ["Pay", "your way."],
    body: "Pay cash on delivery or at pickup, or by QR after you order.",
    meta: ["Cash", "QR"],
  },
  {
    id: "delivery",
    title: ["Delivered", "in Butwal."],
    body: "Home delivery within Butwal, or pick up from our store in Amarpath.",
    meta: ["Home delivery in Butwal", "Pickup at Amarpath"],
  },
];

/** Server-rendered acts; when motion is allowed the film pins and one scroll-scrubbed timeline plays them. */
export function ProductFilm() {
  return (
    <section className="landing-film" data-stage-section="film" aria-label="Inside iMart">
      <div className="film-stage">
        <ol className="film-rail" aria-hidden="true">
          {[1, 2, 3, 4].map((n) => (
            <li key={n} data-n={n}>0{n}</li>
          ))}
        </ol>
        <div className="landing-container film-acts">
          {ACTS.map((act, i) => (
            <article key={act.id} className="film-act" data-act={i + 1} aria-labelledby={`act-${act.id}`}>
              <p className="landing-label landing-label-signal">0{i + 1}</p>
              <h2 id={`act-${act.id}`}>
                {act.title.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </h2>
              <p className="film-act-body">{act.body}</p>
              <ul className="film-act-meta">
                {act.meta.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <FilmLabels />
        <EscapeLines />
      </div>
    </section>
  );
}
