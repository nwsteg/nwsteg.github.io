/* Interactive field notes. All documents, images and data stay on this site. */
(() => {
  "use strict";
  const base = "/assets/2026-10-15-william-stegmeier/";
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const compactMap = () => window.matchMedia("(max-width: 600px), (hover: none)").matches;
  const photoMarkup = photo => `<a class="record-image-link place-photo-link" href="${escape(photo.image)}" data-zoom data-credit="${escape(photo.caption + ' ' + photo.credit)}" data-source="${escape(photo.source)}" data-download="${escape(photo.original)}"><img src="${escape(photo.image)}" alt="${escape(photo.alt)}" width="${photo.width}" height="${photo.height}"><span>Enlarge photograph ↗</span></a><p class="place-photo-caption">${escape(photo.caption)}</p><p class="place-photo-credit">${escape(photo.credit)} <a href="${escape(photo.source)}">Photo details →</a>${photo.relatedUrl ? `<br><a href="${escape(photo.relatedUrl)}">${escape(photo.relatedTitle)} →</a>` : ""}</p>`;

  function enhanceViewer() {
    const viewer = document.querySelector("#record-viewer");
    if (!viewer || typeof viewer.showModal !== "function") return;
    let trigger;
    document.addEventListener("click", event => {
      const link = event.target.closest("a[data-zoom]");
      if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      trigger = link;
      const image = viewer.querySelector(".record-viewer-image");
      image.src = link.href;
      image.alt = link.querySelector("img")?.alt || "Enlarged source excerpt";
      viewer.querySelector(".record-viewer-credit").textContent = link.dataset.credit || "";
      const source = viewer.querySelector(".record-viewer-source");
      source.href = link.dataset.source || link.href;
      viewer.querySelector(".record-viewer-download").href = link.dataset.download || link.href;
      viewer.showModal();
      document.documentElement.classList.add("record-viewer-open");
    });
    viewer.querySelector(".viewer-close").addEventListener("click", () => viewer.close());
    viewer.addEventListener("click", event => {
      if (event.target !== viewer) return;
      const bounds = viewer.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) viewer.close();
    });
    viewer.addEventListener("close", () => {
      document.documentElement.classList.remove("record-viewer-open");
      trigger?.focus({ preventScroll: true });
    });
  }

  function enhanceMap(data) {
    const figure = document.querySelector("#life-map");
    if (!figure) return;
    const canvas = figure.querySelector("[data-map-canvas]");
    const panel = figure.querySelector("#map-detail");
    const preview = figure.querySelector("#map-preview");
    const layer = document.createElement("div");
    layer.className = "map-markers";
    layer.setAttribute("role", "group");
    layer.setAttribute("aria-label", "Places in Bill’s life");
    canvas.append(layer);
    const connectors = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    connectors.classList.add("map-connectors");
    connectors.setAttribute("aria-hidden", "true");
    layer.append(connectors);
    let selected = 9;
    let previewId = null;
    let closeTimer;
    let focusSuppressed = false;
    const recordFor = place => data.records[place.record];
    const placeFor = id => data.places.find(place => place.id === Number(id));
    const markers = [];

    function hidePreview() {
      clearTimeout(closeTimer);
      preview.hidden = true;
      previewId = null;
      markers.forEach(marker => marker.removeAttribute("aria-describedby"));
    }

    function positionPreview() {
      if (preview.hidden || previewId === null) return;
      const pin = markers.find(marker => Number(marker.dataset.place) === previewId);
      const bounds = canvas.getBoundingClientRect();
      const pinBounds = pin.getBoundingClientRect();
      const width = preview.offsetWidth;
      const height = preview.offsetHeight;
      const x = pinBounds.left - bounds.left + pinBounds.width / 2;
      const y = pinBounds.top - bounds.top + pinBounds.height / 2;
      let left = x + 20;
      if (left + width > bounds.width - 10) left = x - width - 20;
      left = Math.max(8, Math.min(left, bounds.width - width - 8));
      let top = y + 20;
      if (top + height > bounds.height - 8) top = y - height - 20;
      preview.style.left = `${left}px`;
      preview.style.top = `${Math.max(8, top)}px`;
    }

    function showPreview(place, marker) {
      clearTimeout(closeTimer);
      if (compactMap() || focusSuppressed) return;
      const photo = place.photo;
      previewId = place.id;
      preview.innerHTML = `<img src="${escape(photo.image)}" alt="${escape(photo.alt)}"><div><strong>${escape(place.title)}</strong><span>${escape(place.date)}</span><p class="map-photo-subject">${escape(photo.title)} · ${escape(photo.year)}</p><p>${escape(photo.credit)}</p><small>Select the number for the photograph and Bill’s story ↓</small></div>`;
      preview.hidden = false;
      marker.setAttribute("aria-describedby", "map-preview");
      positionPreview();
      preview.querySelector("img").addEventListener("load", positionPreview, { once: true });
    }

    function scheduleClose() {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        const focusedPreview = document.activeElement?.classList.contains("map-marker") && Number(document.activeElement.dataset.place) === previewId;
        if (!preview.matches(":hover") && !focusedPreview) hidePreview();
      }, 180);
    }

    function choose(id, options = {}) {
      const place = placeFor(id);
      if (!place) return;
      selected = place.id;
      hidePreview();
      const record = recordFor(place);
      markers.forEach(marker => {
        const active = Number(marker.dataset.place) === selected;
        marker.setAttribute("aria-pressed", String(active));
        marker.tabIndex = active ? 0 : -1;
      });
      figure.querySelectorAll(".place-choice").forEach(link => {
        const active = Number(link.dataset.place) === selected;
        link.setAttribute("aria-pressed", String(active));
      });
      panel.innerHTML = `<div class="explorer-heading"><p class="figure-kicker">${String(place.id).padStart(2, "0")} / 09 · ${escape(place.date)}</p><div class="explorer-nav"><button type="button" data-place-step="-1" aria-label="Previous place">←</button><button type="button" data-place-step="1" aria-label="Next place">→</button></div></div><div class="place-record"><div class="place-record-image">${photoMarkup(place.photo)}</div><div class="place-record-copy"><h4 id="map-detail-title">${escape(place.title)}</h4><p>${escape(place.summary)}</p><p class="map-evidence-label">The record behind this place</p><a class="evidence-source" href="${escape(record.source)}">${escape(record.sourceLabel)} →</a><p class="evidence-credit">${escape(record.credit)}</p></div></div><p class="explorer-status visually-hidden" role="status">Selected ${escape(place.title)}.</p>`;
      panel.hidden = false;
      panel.querySelectorAll("[data-place-step]").forEach(button => button.addEventListener("click", () => {
        const next = ((selected - 1 + Number(button.dataset.placeStep) + data.places.length) % data.places.length) + 1;
        const direction = button.dataset.placeStep;
        choose(next);
        panel.querySelector(`[data-place-step="${direction}"]`).focus({ preventScroll: true });
      }));
      if (options.scroll) panel.scrollIntoView({ block: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
    }

    data.places.forEach(place => {
      const marker = document.createElement("button");
      marker.type = "button";
      marker.className = `map-marker marker-${place.kind}`;
      marker.dataset.place = place.id;
      marker.style.left = `${place.x / 960 * 100}%`;
      marker.style.top = `${place.y / 600 * 100}%`;
      marker.textContent = place.id;
      marker.setAttribute("aria-label", `${place.id}. ${place.title}. ${place.date}`);
      marker.setAttribute("aria-controls", "map-detail");
      marker.setAttribute("aria-pressed", "false");
      marker.addEventListener("pointerenter", () => { focusSuppressed = false; showPreview(place, marker); });
      marker.addEventListener("pointerleave", scheduleClose);
      marker.addEventListener("focus", () => { focusSuppressed = false; showPreview(place, marker); });
      marker.addEventListener("blur", scheduleClose);
      marker.addEventListener("click", () => { focusSuppressed = true; choose(place.id, { scroll: compactMap() }); });
      marker.addEventListener("keydown", event => {
        const index = markers.indexOf(marker);
        let next;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % markers.length;
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + markers.length) % markers.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = markers.length - 1;
        if (next !== undefined) {
          event.preventDefault();
          markers.forEach((item, i) => { item.tabIndex = i === next ? 0 : -1; });
          markers[next].focus({ preventScroll: true });
        }
      });
      markers.push(marker);
      layer.append(marker);
    });

    figure.querySelectorAll(".place-choice").forEach(link => {
      link.setAttribute("role", "button");
      link.setAttribute("aria-controls", "map-detail");
      link.addEventListener("click", event => { event.preventDefault(); choose(link.dataset.place, { scroll: true }); });
      link.addEventListener("keydown", event => { if (event.key === " ") { event.preventDefault(); link.click(); } });
    });
    document.querySelectorAll("[data-show-place]").forEach(link => link.addEventListener("click", event => {
      event.preventDefault();
      choose(link.dataset.showPlace);
      figure.scrollIntoView({ block: "start", behavior: reducedMotion() ? "auto" : "smooth" });
      markers.find(marker => marker.dataset.place === link.dataset.showPlace).focus({ preventScroll: true });
    }));
    preview.addEventListener("pointerenter", () => clearTimeout(closeTimer));
    preview.addEventListener("pointerleave", scheduleClose);
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") { focusSuppressed = true; hidePreview(); }
    });
    function updateInstructions() {
      figure.querySelector("#map-instructions").textContent = compactMap()
        ? "Tap a number or choose a place below to see a photograph and Bill’s connection to the place."
        : "Hover over a number for a photograph. Select it to explore the place below. Use arrow keys between map markers.";
    }
    const image = canvas.querySelector("[data-map-background]");
    function layoutMarkers() {
      const small = canvas.clientWidth < 500;
      const offsets = { 1: [8, 4], 2: [-7, -4], 3: [0, -6], 4: [10, 9], 5: [-7, -4], 7: [-5, 8], 8: [-14, 10], 9: [14, 3] };
      const colors = { family: "#b18535", service: "#587783", school: "#80657d", work: "#4d6950" };
      const width = canvas.clientWidth;
      const height = width * 600 / 960;
      image.src = `${base}${small ? "life-map-compact.svg" : "life-map-base.svg"}`;
      connectors.setAttribute("viewBox", `0 0 ${width} ${height}`);
      connectors.innerHTML = "";
      data.places.forEach((place, index) => {
        const [dx, dy] = small ? (offsets[place.id] || [0, 0]) : [0, 0];
        markers[index].style.left = `calc(${place.x / 960 * 100}% + ${dx}px)`;
        markers[index].style.top = `calc(${place.y / 600 * 100}% + ${dy}px)`;
        if (dx || dy) {
          const x = place.x / 960 * width;
          const y = place.y / 600 * height;
          connectors.innerHTML += `<path d="M${x},${y}L${x + dx},${y + dy}" stroke="${colors[place.kind]}" stroke-width="1.2" opacity=".7"/><circle cx="${x}" cy="${y}" r="2.2" fill="${colors[place.kind]}"/>`;
        }
      });
    }
    window.addEventListener("resize", () => { updateInstructions(); layoutMarkers(); if (compactMap()) hidePreview(); else positionPreview(); });
    image.draggable = false;
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    figure.querySelector("#map-instructions").hidden = false;
    figure.dataset.enhanced = "true";
    updateInstructions();
    layoutMarkers();
    choose(selected);
  }

  function enhanceCrops(data) {
    const figure = document.querySelector("#crop-figure");
    if (!figure) return;
    const tabs = [...figure.querySelectorAll(".crop-tab")];
    const panels = [...figure.querySelectorAll("[data-crop-panel]")];
    const tablist = figure.querySelector(".crop-tabs");
    tablist.setAttribute("role", "tablist");

    function choose(id) {
      tabs.forEach(tab => {
        const active = tab.dataset.crop === id;
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
      });
      panels.forEach(panel => { panel.hidden = panel.dataset.cropPanel !== id; });
    }

    data.crops.forEach(crop => {
      const panel = panels.find(item => item.dataset.cropPanel === crop.id);
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", `crop-tab-${crop.id}`);
      panel.tabIndex = 0;
      panel.querySelectorAll("[data-enhanced-only]").forEach(item => { item.hidden = false; });
      function choosePart(index, reveal = true) {
        const part = crop.parts[index];
        if (reveal) panel.querySelector(".crop-plant-notes").open = true;
        panel.querySelectorAll("[data-crop-part]").forEach(button => button.setAttribute("aria-pressed", String(Number(button.dataset.cropPart) === index)));
        panel.querySelector(".crop-part-title").textContent = `${index + 1}. ${part.name}`;
        panel.querySelector(".crop-part-text").textContent = part.text;
      }
      panel.querySelectorAll("[data-crop-part]").forEach(button => button.addEventListener("click", () => choosePart(Number(button.dataset.cropPart))));
      choosePart(0, false);
    });

    tabs.forEach((tab, index) => {
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", `crop-panel-${tab.dataset.crop}`);
      tab.addEventListener("click", event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        choose(tab.dataset.crop);
      });
      tab.addEventListener("keydown", event => {
        let next;
        if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
        if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = tabs.length - 1;
        if (next !== undefined) {
          event.preventDefault();
          choose(tabs[next].dataset.crop);
          tabs[next].focus({ preventScroll: true });
        }
        if (event.key === " ") { event.preventDefault(); tab.click(); }
      });
    });
    figure.dataset.enhanced = "true";
    const initial = tabs.find(tab => tab.hash === window.location.hash) || tabs[0];
    choose(initial.dataset.crop);
    // Preserve direct links to a crop panel, including browser back/forward.
    window.addEventListener("hashchange", () => {
      const match = tabs.find(tab => tab.hash === window.location.hash);
      if (match) choose(match.dataset.crop);
    });
  }

  enhanceViewer();
  fetch(`${base}figures-data.json?v=5`).then(response => {
    if (!response.ok) throw new Error("Figure data unavailable");
    return response.json();
  }).then(data => {
    enhanceMap(data);
    enhanceCrops(data);
  }).catch(error => console.warn("The static figures and source links remain available.", error));
})();
