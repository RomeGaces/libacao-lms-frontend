import { defineEventHandler } from "../../../node_modules/.pnpm/h3@2.0.0-beta.4/node_modules/h3/dist/h3.js";

//#region servers/routes/list/index.put.ts
var index_put_default = defineEventHandler(async (_event) => {
	return {
		code: 200,
		msg: "编辑成功"
	};
});

//#endregion
export { index_put_default as default };