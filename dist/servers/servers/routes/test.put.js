import { defineEventHandler } from "../../node_modules/.pnpm/h3@2.0.0-beta.4/node_modules/h3/dist/h3.js";

//#region servers/routes/test.put.ts
var test_put_default = defineEventHandler(() => {
	return {
		code: 200,
		msg: "put"
	};
});

//#endregion
export { test_put_default as default };