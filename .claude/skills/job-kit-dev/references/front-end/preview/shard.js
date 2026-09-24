// Runs inside each preview shard. Three jobs, all file://-safe (postMessage, no
// parent DOM reach-in — Chromium blocks cross-document access between file:// pages):
//   1. report document height to the catalog      { type: "jk-ds-height", height }
//   2. follow the catalog's theme                  { type: "jk-ds-theme", theme: "light" | "dark" }
//      (standalone: prefers-color-scheme)
//   3. fill every [data-token="--name"] with getComputedStyle(root).getPropertyValue(name),
//      re-run on theme change — labels show the live declaration, never a typed hex.
;(function () {
  var root = document.documentElement
  var embedded = window.parent !== window

  // ---- 1. height reporting -------------------------------------------------

  var scheduled = false
  function measureHeight() {
    return Math.ceil(root.getBoundingClientRect().height)
  }
  function postHeight() {
    if (!embedded) return
    window.parent.postMessage({ type: "jk-ds-height", height: measureHeight() }, "*")
  }
  function scheduleHeight() {
    if (!embedded || scheduled) return
    scheduled = true
    requestAnimationFrame(function () {
      scheduled = false
      postHeight()
    })
  }

  if (embedded) {
    root.style.overflow = "hidden"
  }

  if (document.readyState === "complete") {
    scheduleHeight()
  } else {
    window.addEventListener("load", scheduleHeight, { once: true })
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(scheduleHeight)
  }
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(scheduleHeight).observe(root)
  }

  // ---- 2. theme -------------------------------------------------------------

  function applyTheme(theme) {
    root.classList.toggle("dark", theme === "dark")
    fillTokens()
    scheduleHeight()
  }

  window.addEventListener("message", function (event) {
    var data = event.data
    if (!data || data.type !== "jk-ds-theme") return
    applyTheme(data.theme)
  })

  if (!embedded) {
    var media = window.matchMedia("(prefers-color-scheme: dark)")
    applyTheme(media.matches ? "dark" : "light")
    media.addEventListener("change", function (event) {
      applyTheme(event.matches ? "dark" : "light")
    })
  }

  // ---- 3. live token values --------------------------------------------------

  function fillTokens() {
    var nodes = document.querySelectorAll("[data-token]")
    var styles = getComputedStyle(root)
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i]
      var name = node.getAttribute("data-token")
      if (!name) continue
      node.textContent = styles.getPropertyValue(name).trim()
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fillTokens, { once: true })
  } else {
    fillTokens()
  }
})()
