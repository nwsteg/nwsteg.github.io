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
    let selected = 1;
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
    const choices = [...figure.querySelectorAll("[data-crop]")];
    const panel = figure.querySelector("#crop-detail");
    let selected = data.crops[0];

    function choosePart(index) {
      const part = selected.parts[index];
      panel.querySelectorAll("[data-crop-part]").forEach(button => button.setAttribute("aria-pressed", String(Number(button.dataset.cropPart) === index)));
      panel.querySelector(".crop-part-title").textContent = `${index + 1}. ${part.name}`;
      panel.querySelector(".crop-part-text").textContent = part.text;
    }

    function choose(id) {
      selected = data.crops.find(crop => crop.id === id);
      if (!selected) return;
      choices.forEach(choice => choice.setAttribute("aria-pressed", String(choice.dataset.crop === id)));
      panel.innerHTML = `<div class="explorer-heading"><p class="figure-kicker">A closer look · ${escape(selected.latin)}</p><div class="explorer-nav"><button type="button" data-crop-step="-1" aria-label="Previous crop">←</button><button type="button" data-crop-step="1" aria-label="Next crop">→</button></div></div><div class="crop-exploration"><div class="crop-anatomy"><img src="${base}${selected.id}.svg" alt="${escape(selected.name)} illustration with three numbered features to explore."><div class="crop-part-markers">${selected.parts.map((part, index) => `<button type="button" style="left:${part.x}%;top:${part.y}%" data-crop-part="${index}" aria-label="${index + 1}. ${escape(part.name)}" aria-controls="crop-part-copy" aria-pressed="false">${index + 1}</button>`).join("")}</div></div><div class="crop-exploration-copy"><h4 id="crop-detail-title">${escape(selected.name)}</h4><p class="part-instruction">Select a number on the drawing to explore the plant.</p><div id="crop-part-copy" class="crop-part-copy" aria-live="polite"><h5 class="crop-part-title"></h5><p class="crop-part-text"></p></div><h5 class="crop-work-title">In Bill’s research</h5><p>${escape(selected.work)}</p><div class="crop-reading"><a class="evidence-source" href="${escape(selected.source)}">${escape(selected.sourceLabel)} →</a><a class="evidence-source" href="${escape(selected.botany)}">Open the botanical reference →</a></div></div></div>`;
      panel.hidden = false;
      panel.querySelectorAll("[data-crop-part]").forEach(button => button.addEventListener("click", () => choosePart(Number(button.dataset.cropPart))));
      panel.querySelectorAll("[data-crop-step]").forEach(button => button.addEventListener("click", () => {
        const index = data.crops.indexOf(selected);
        const direction = button.dataset.cropStep;
        const next = (index + Number(direction) + data.crops.length) % data.crops.length;
        choose(data.crops[next].id);
        panel.querySelector(`[data-crop-step="${direction}"]`).focus({ preventScroll: true });
      }));
      choosePart(0);
    }

    choices.forEach((choice, index) => {
      choice.setAttribute("role", "button");
      choice.setAttribute("aria-label", `Explore ${data.crops[index].name}`);
      choice.setAttribute("aria-controls", "crop-detail");
      choice.addEventListener("click", event => {
        event.preventDefault();
        choose(choice.dataset.crop);
        if (window.matchMedia("(max-width: 800px)").matches) panel.scrollIntoView({ block: "start", behavior: reducedMotion() ? "auto" : "smooth" });
      });
      choice.addEventListener("keydown", event => {
        if (event.key === " ") { event.preventDefault(); choice.click(); }
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          const next = (index + (event.key === "ArrowRight" ? 1 : -1) + choices.length) % choices.length;
          choose(choices[next].dataset.crop);
          choices[next].focus({ preventScroll: true });
          choices[next].scrollIntoView({ block: "nearest", inline: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
        }
      });
    });
    figure.dataset.enhanced = "true";
    choose(selected.id);
  }

  enhanceViewer();
  fetch(`${base}figures-data.json?v=4`).then(response => {
    if (!response.ok) throw new Error("Figure data unavailable");
    return response.json();
  }).then(data => {
    enhanceMap(data);
    enhanceCrops(data);
  }).catch(error => console.warn("The static figures and source links remain available.", error));
})();
