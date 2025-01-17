// @ts-check
import { defineConfig } from "astro/config";

import tailwind from "@astrojs/tailwind";
import preact from "@astrojs/preact";

import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
	output: "server",
	integrations: [tailwind(), preact({ compat: true })],
	adapter: vercel({
		isr: {
			expiration: 60 * 60 * 3, // 3 hours
		},
	}),
	vite: {
		resolve: {
			alias: {
				react: "preact/compat",
				"react-dom/test-utils": "preact/test-utils",
				"react-dom": "preact/compat",
				"react/jsx-runtime": "preact/jsx-runtime",
			},
		},
	},
});
