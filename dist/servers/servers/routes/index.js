import { defineEventHandler } from "../../node_modules/.pnpm/h3@2.0.0-beta.4/node_modules/h3/dist/h3.js";

//#region servers/routes/index.ts
var routes_default = defineEventHandler(() => {
	return { nitro: "Hello Antdv Pro" };
});

//#endregion
export { routes_default as default };