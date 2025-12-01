import { defineEventHandler } from "../../node_modules/.pnpm/h3@2.0.0-beta.4/node_modules/h3/dist/h3.js";

//#region servers/routes/test.delete.ts
var test_delete_default = defineEventHandler(() => {
	return {
		code: 200,
		msg: "delete"
	};
});

//#endregion
export { test_delete_default as default };