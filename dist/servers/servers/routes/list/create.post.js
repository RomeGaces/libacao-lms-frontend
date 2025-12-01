import { defineEventHandler, readBody } from "../../../node_modules/.pnpm/h3@2.0.0-beta.4/node_modules/h3/dist/h3.js";

//#region servers/routes/list/create.post.ts
var create_post_default = defineEventHandler(async (event) => {
	const body = await readBody(event);
	console.log(body);
	return {
		code: 200,
		msg: "创建成功"
	};
});

//#endregion
export { create_post_default as default };