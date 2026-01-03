/* global L, fetch */
(async function () {
  if (typeof L === "undefined") return;
  const states = window.P2DC_STATES || [];

  const map = L.map("map", { zoomControl: true }).setView([39.5, -98.35], 4);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  const select = document.getElementById("stateSelect");
  const list = document.getElementById("officialsList");

  function renderOfficials(stateAbbr, officials) {
    if (!stateAbbr) {
      list.innerHTML = '<div class="text-muted small">Select a state to view entries.</div>';
      return;
    }

    if (!officials || officials.length === 0) {
      list.innerHTML = `
        <div class="alert alert-light border">
          No directory entries for <strong>${stateAbbr}</strong> yet.
          Run the import script to populate officials.json.
        </div>
      `;
      return;
    }

    const cards = officials
      .map((o) => {
        const links = [
          o.website ? `<a href="${o.website}" target="_blank" rel="noreferrer">website</a>` : "",
          o.contact ? `<a href="${o.contact}" target="_blank" rel="noreferrer">contact</a>` : "",
        ]
          .filter(Boolean)
          .join(" • ");

        return `
          <div class="border rounded-3 p-2 mb-2">
            <div class="fw-semibold">${o.name}</div>
            <div class="text-muted small">${o.chamber}${o.party ? " • " + o.party : ""}</div>
            <div class="small mt-1">${links || ""}</div>
            ${o.phone ? `<div class="small text-muted mt-1">Phone: ${o.phone}</div>` : ""}
            ${o.dc_office ? `<div class="small text-muted">DC: ${o.dc_office}</div>` : ""}
          </div>
        `;
      })
      .join("");

    list.innerHTML = cards;
  }

  async function loadForState(stateAbbr) {
    if (!stateAbbr) {
      renderOfficials("", []);
      return;
    }
    const res = await fetch(`/api/officials?state=${encodeURIComponent(stateAbbr)}`);
    const data = await res.json();
    renderOfficials(stateAbbr, data.officials || []);
  }

  // markers for state capitals
  states.forEach((s) => {
    const marker = L.circleMarker([s.lat, s.lon], { radius: 5 });
    marker.addTo(map);
    marker.on("click", () => {
      select.value = s.abbr;
      loadForState(s.abbr);
    });
  });

  select.addEventListener("change", () => loadForState(select.value));

  // load initial selection from query (?state=TN)
  const params = new URLSearchParams(window.location.search);
  const init = (params.get("state") || "").toUpperCase();
  if (init) {
    select.value = init;
    await loadForState(init);
  }
})();
