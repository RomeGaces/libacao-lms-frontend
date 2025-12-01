import { defineEventHandler } from "../../../node_modules/.pnpm/h3@2.0.0-beta.4/node_modules/h3/dist/h3.js";

//#region servers/routes/user/info.ts
var info_default = defineEventHandler((event) => {
	const token = event.req.headers.get("Authorization");
	const username = Buffer.from(token, "base64").toString("utf-8");
	if (!token) return {
		code: 401,
		msg: "Login invalid"
	};
	return {
		code: 200,
		msg: "get success",
		data: {
			id: 1,
			username,
			nickname: username === "admin" ? "Rome" : "Mark",
			avatar: "https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png",
			roles: username === "admin" ? ["ADMIN"] : ["USER"]
		}
	};
});

//#endregion
export { info_default as default };