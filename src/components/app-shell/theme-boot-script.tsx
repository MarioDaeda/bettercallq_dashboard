import { THEME_STORAGE_KEY } from "@/lib/theme";

export function ThemeBootScript() {
  const script = `
    (() => {
      try {
        const stored = localStorage.getItem("${THEME_STORAGE_KEY}");
        const dark = stored === "dark" ||
          (stored === null && window.matchMedia("(prefers-color-scheme: dark)").matches);
        document.documentElement.classList.toggle("dark", dark);
        document.documentElement.style.colorScheme = dark ? "dark" : "light";
      } catch {}
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
