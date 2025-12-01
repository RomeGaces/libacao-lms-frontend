import { defineEventHandler } from "../../node_modules/.pnpm/h3@2.0.0-beta.4/node_modules/h3/dist/h3.js";

//#region servers/routes/401.ts
var _401_default = defineEventHandler((event) => {
	event.res.status = 401;
	return {
		code: 401,
		msg: "请先登录"
	};
});

//#endregion
export { _401_default as default };