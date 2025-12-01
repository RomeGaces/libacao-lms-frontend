import { defineEventHandler } from "../../node_modules/.pnpm/h3@2.0.0-beta.4/node_modules/h3/dist/h3.js";

//#region servers/routes/logout.ts
var logout_default = defineEventHandler(() => {
	return {
		code: 200,
		msg: "success"
	};
});

//#endregion
export { logout_default as default };