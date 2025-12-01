import { __toESM } from "../../../_virtual/rolldown_runtime.js";
import { defineEventHandler, readBody } from "../../../node_modules/.pnpm/h3@2.0.0-beta.4/node_modules/h3/dist/h3.js";
import { require_dayjs_min } from "../../../node_modules/.pnpm/dayjs@1.11.18/node_modules/dayjs/dayjs.min.js";

//#region servers/routes/list/consult-list.post.ts
var import_dayjs_min = /* @__PURE__ */ __toESM(require_dayjs_min(), 1);
var STATUS = /* @__PURE__ */ function(STATUS$1) {
	STATUS$1["OFF"] = "0";
	STATUS$1["RUNNING"] = "1";
	STATUS$1["ONLINE"] = "2";
	STATUS$1["ERROR"] = "3";
	return STATUS$1;
}(STATUS || {});
var consult_list_post_default = defineEventHandler(async (_event) => {
	const body = await readBody(_event);
	return {
		code: 200,
		msg: "获取成功",
		data: [
			{
				id: 1,
				name: "第一个任务",
				callNo: 2e3,
				desc: "一生那么短，遗忘又那么漫长",
				status: STATUS.ONLINE,
				updatedAt: (0, import_dayjs_min.default)().format("YYYY-MM-DD HH:mm")
			},
			{
				id: 2,
				name: "Ant Design Vue",
				callNo: 200,
				desc: "有时，你必须进入别人的世界去发现自己的世界缺少什么",
				status: STATUS.OFF,
				updatedAt: (0, import_dayjs_min.default)().format("YYYY-MM-DD HH:mm")
			},
			{
				id: 3,
				name: "Vue",
				callNo: 2010,
				desc: "一生那么短，遗忘又那么漫长",
				status: STATUS.ERROR,
				updatedAt: (0, import_dayjs_min.default)().format("YYYY-MM-DD HH:mm")
			},
			{
				id: 4,
				name: "Vite",
				callNo: 20300,
				desc: "希望是件美丽的东西，也许是最好的东西",
				status: STATUS.ERROR,
				updatedAt: (0, import_dayjs_min.default)().format("YYYY-MM-DD HH:mm")
			},
			{
				id: 5,
				name: "React",
				callNo: 2e3,
				desc: "人并非生来就伟大，而是越活越伟大",
				status: STATUS.ONLINE,
				updatedAt: (0, import_dayjs_min.default)().format("YYYY-MM-DD HH:mm")
			},
			{
				id: 6,
				name: "Antdv Pro",
				callNo: 2e3,
				desc: "不管何时何地，做你想做的事永远都不嫌晚",
				status: STATUS.OFF,
				updatedAt: (0, import_dayjs_min.default)().format("YYYY-MM-DD HH:mm")
			},
			{
				id: 7,
				name: "Webpack",
				callNo: 2e3,
				desc: "你要一直不停地往前走，不然你不会知道生活还会给你什么",
				status: STATUS.ONLINE,
				updatedAt: (0, import_dayjs_min.default)().format("YYYY-MM-DD HH:mm")
			}
		].filter((i) => {
			if (body.name) return body.name === i.name;
			else return true;
		})
	};
});

//#endregion
export { consult_list_post_default as default };