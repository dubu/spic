const feedEl = document.querySelector("#feed");
const emptyEl = document.querySelector("#empty");
const template = document.querySelector('script[type="text/template"]');

// Parse script template to create element
function createNodeFromTemplate() {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = template.innerHTML.trim();
  return tempDiv.firstElementChild.cloneNode(true);
}

async function loadFeed() {
  try {
    const res = await fetch("https://dubu.github.io/spic/xxx.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = await res.json();
    render(items);
  } catch (err) {
    console.error("failed to load feed", err);
    feedEl.classList.add("hidden");
    emptyEl.classList.remove("hidden");
  }
}

function render(items) {
  if (!Array.isArray(items) || items.length === 0) {
    feedEl.classList.add("hidden");
    emptyEl.classList.remove("hidden");
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const item of items) {
    const node = createNodeFromTemplate();
    const link = node.querySelector(".card-link");
    const img = node.querySelector("img");
    const title = node.querySelector(".title");
    const desc = node.querySelector(".desc");
    const pill = node.querySelector(".pill");
    const meta = node.querySelector(".meta");

    link.href = item.url;
    
    const thumb = node.querySelector(".thumb");
    let hasImage = false;
    
    // Set image with error handling
    if (item.image && item.image.trim()) {
    img.alt = item.title || "썸네일";
      
      // For clien.net images, try different referrer policies
      if (item.image.includes("clien.net") || item.image.includes("edgio.clien.net")) {
        // Try with origin referrer first (some sites need this)
        img.referrerPolicy = "origin";
      } else {
        img.referrerPolicy = "no-referrer";
      }
      
      // Try loading image without crossorigin first
      img.src = item.image;
      hasImage = true;
      
      // Add loading state
      img.style.opacity = "0";
      img.style.transition = "opacity 0.3s";
      
      // Handle image load errors (CORS, 404, etc.)
      img.onerror = function() {
        console.warn("Image load failed:", item.image);
        
        // Try with different referrer policies for clien
        if ((item.image.includes("clien.net") || item.image.includes("edgio.clien.net")) && 
            this.referrerPolicy !== "no-referrer") {
          this.referrerPolicy = "no-referrer";
          this.src = item.image;
          return;
        }
        
        // Try with crossorigin as fallback
        if (!this.crossOrigin) {
          this.crossOrigin = "anonymous";
          this.src = item.image;
          return;
        }
        
        // If still fails, hide the image but keep pill visible
        hasImage = false;
        if (thumb) {
          thumb.style.display = "none";
        }
        // Move pill to content area if it's in thumb
        if (pill && pill.parentElement === thumb) {
          const content = node.querySelector(".content");
          if (content) {
            content.insertBefore(pill, content.firstChild);
          }
        }
        this.onerror = null; // Prevent infinite loop
        this.crossOrigin = null;
      };
      
      // On successful image load, show it and move pill to thumb
      img.onload = function() {
        this.style.opacity = "1";
        if (pill && pill.parentElement !== thumb) {
          thumb.appendChild(pill);
        }
      };
    } else {
      // No image URL - hide the image container, pill stays in content
      hasImage = false;
      if (thumb) {
        thumb.style.display = "none";
      }
    }
    
    title.textContent = item.title || "제목 없음";
    desc.textContent = item.description || "";

    const brand = item.brand || new URL(item.url).host;
    const clicks = item.click_cnt ? `${item.click_cnt.toLocaleString()} 조회` : "";

    pill.textContent = brand;
    if (clicks) {
      const span = document.createElement("span");
      span.className = "count";
      span.textContent = clicks;
      pill.append(" · ", span);
    }
    
    // If no image, ensure pill is in content area
    if (!hasImage && pill && pill.parentElement === thumb) {
      const content = node.querySelector(".content");
      if (content) {
        content.insertBefore(pill, content.firstChild);
      }
    }

    meta.textContent = brand;
    if (item.fetched_at) {
      const dt = new Date(item.fetched_at);
      if (!isNaN(dt)) {
        const formatted = dt.toLocaleString("ko-KR", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        meta.textContent += ` · ${formatted}`;
      }
    }

    fragment.appendChild(node);
  }

  feedEl.innerHTML = "";
  feedEl.appendChild(fragment);
}

loadFeed();

