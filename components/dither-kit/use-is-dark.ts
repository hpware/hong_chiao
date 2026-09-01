"use client"

import { useSyncExternalStore } from "react"

// The theme is the `.dark` class on <html> (set in app/layout.tsx), toggled at
// runtime rather than only on load, so watch the attribute instead of reading
// it once.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  })
  return () => observer.disconnect()
}

const getSnapshot = () => document.documentElement.classList.contains("dark")

// Server render assumes dark, matching the layout's default, so the canvas
// doesn't flash the wrong bloom before hydration.
const getServerSnapshot = () => true

/** Whether the app is currently in dark mode. */
export function useIsDark() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
