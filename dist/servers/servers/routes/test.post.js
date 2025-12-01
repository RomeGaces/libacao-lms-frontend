import { defineEventHandler } from "../../node_modules/.pnpm/h3@2.0.0-beta.4/node_modules/h3/dist/h3.js";

//#region servers/routes/test.post.ts
var test_post_default = defineEventHandler(() => {
	return {
		code: 200,
		msg: "post"
	};
});

//#endregion
export { test_post_default as default };