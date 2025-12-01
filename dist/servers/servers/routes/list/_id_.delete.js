import { defineEventHandler } from "../../../node_modules/.pnpm/h3@2.0.0-beta.4/node_modules/h3/dist/h3.js";

//#region servers/routes/list/[id].delete.ts
var __id__delete_default = defineEventHandler((event) => {
	if (typeof event.context.params?.id !== "number") {
		event.res.status = 403;
		return {
			code: 403,
			msg: "删除失败"
		};
	}
	return {
		code: 200,
		msg: "删除成功"
	};
});

//#endregion
export { __id__delete_default as default };