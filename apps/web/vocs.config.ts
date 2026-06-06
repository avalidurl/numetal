import { defineConfig } from "vocs";

export default defineConfig({
  title: "Numetal",
  description: "Verification for autonomous agent work.",
  theme: { accentColor: "#002FA7", colorScheme: "light" },
  topNav: [
    { text: "Docs", link: "/docs" },
    { text: "App", link: "https://numetal.xyz" },
  ],
  sidebar: [
    { text: "Overview", link: "/docs" },
    { text: "How it works", link: "/docs/how-it-works" },
  ],
});
