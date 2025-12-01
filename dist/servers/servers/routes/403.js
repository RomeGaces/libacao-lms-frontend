import { defineEventHandler } from "../../node_modules/.pnpm/h3@2.0.0-beta.4/node_modules/h3/dist/h3.js";

//#region servers/routes/403.ts
var _403_default = defineEventHandler((event) => {
	event.res.status = 403;
	return {
		code: 403,
		msg: "请先登录"
	};
});

//#endregion
export { _403_default as default };