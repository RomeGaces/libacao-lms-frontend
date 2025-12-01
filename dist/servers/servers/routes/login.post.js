import { defineEventHandler, readBody } from "../../node_modules/.pnpm/h3@2.0.0-beta.4/node_modules/h3/dist/h3.js";

//#region servers/routes/login.post.ts
var login_post_default = defineEventHandler(async (event) => {
	const body = await readBody(event);
	const { type } = body;
	const success = {
		code: 200,
		data: { token: "1234567890" },
		msg: "登录成功"
	};
	if (type !== "mobile") {
		success.data.token = Buffer.from(body.username).toString("base64");
		if (body.username === "admin" && body.password === "admin") return success;
		if (body.username === "user" && body.password === "user") return success;
	} else return success;
	event.res.status = 403;
	return {
		code: 401,
		msg: "用户名或密码错误"
	};
});

//#endregion
export { login_post_default as default };