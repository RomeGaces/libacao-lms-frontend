import { defineEventHandler } from "../../node_modules/.pnpm/h3@2.0.0-beta.4/node_modules/h3/dist/h3.js";

//#region servers/routes/500.ts
var _500_default = defineEventHandler((event) => {
	event.res.status = 500;
	return {
		code: 500,
		msg: "服务器错误"
	};
});

//#endregion
export { _500_default as default };