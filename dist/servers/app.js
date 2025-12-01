import { H3, serveStatic } from "./node_modules/.pnpm/h3@2.0.0-beta.4/node_modules/h3/dist/h3.js";
import { serve } from "./node_modules/.pnpm/h3@2.0.0-beta.4/node_modules/h3/dist/_entries/node.js";
import { vendorMap } from "./vendor.js";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

//#region servers/.runtime/app.ts
function resolvePath(path$1, options = {}) {
	if (!path$1 || !path$1.trim()) return "";
	let normalizedPath = path$1.replace(/\\+/g, "/").trim();
	if (normalizedPath.endsWith("/") && normalizedPath !== "/") normalizedPath = normalizedPath.slice(0, -1);
	if (!normalizedPath) return "";
	const paths = normalizedPath.split("/");
	const newPaths = [];
	for (const _path of paths) if (_path.startsWith("[") && _path.endsWith("]")) {
		const _name = _path.slice(1, -1);
		if (_name.startsWith("[") && _name.endsWith("]")) {
			const optionalParam = _name.slice(1, -1);
			if (optionalParam.startsWith("...")) {
				const catchAllParam = optionalParam.slice(3);
				if (catchAllParam.includes(":")) {
					const [param, type] = catchAllParam.split(":");
					newPaths.push("**:" + param + "(" + getTypeRegex(type) + ")?");
				} else newPaths.push("**:" + catchAllParam + "?");
				continue;
			}
			if (optionalParam.includes(":")) {
				const [param, type] = optionalParam.split(":");
				newPaths.push(":" + param + "(" + getTypeRegex(type) + ")?");
			} else newPaths.push(":" + optionalParam + "?");
			continue;
		}
		if (_name.includes(":")) {
			const colonIndex = _name.indexOf(":");
			const param = _name.substring(0, colonIndex);
			const type = _name.substring(colonIndex + 1);
			if (param.startsWith("...")) {
				const catchAllParam = param.slice(3);
				newPaths.push("**:" + catchAllParam + "(" + getTypeRegex(type) + ")");
			} else newPaths.push(":" + param + "(" + getTypeRegex(type) + ")");
			continue;
		}
		if (_name === "all" || _name === "...") newPaths.push("*");
		else if (_name === "...all") newPaths.push("**");
		else if (_name.startsWith("...")) newPaths.push("**:" + _name.slice(3));
		else newPaths.push(":" + _name);
	} else {
		if (options.strict && _path.includes("*")) throw new Error("Invalid path segment: " + _path + ". Wildcard characters not allowed in static segments when strict mode is enabled.");
		newPaths.push(_path);
	}
	const result = newPaths.join("/");
	if (options.strict) validateResolvedPath(result);
	return result;
}
function getTypeRegex(type) {
	return {
		"number": "\\\\d+",
		"int": "\\\\d+",
		"float": "\\\\d+\\\\.\\\\d+",
		"uuid": "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
		"slug": "[a-z0-9-]+",
		"alpha": "[a-zA-Z]+",
		"alphanumeric": "[a-zA-Z0-9]+",
		"email": "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}",
		"date": "\\\\d{4}-\\\\d{2}-\\\\d{2}",
		"year": "\\\\d{4}",
		"month": "\\\\d{1,2}",
		"day": "\\\\d{1,2}"
	}[type] || type;
}
function validateResolvedPath(path$1) {
	if (path$1.includes("**:") && path$1.includes("*")) {
		const segments = path$1.split("/");
		const wildcardIndex = segments.findIndex(function(seg) {
			return seg === "*";
		});
		const catchAllIndex = segments.findIndex(function(seg) {
			return seg.startsWith("**:");
		});
		if (wildcardIndex >= 0 && catchAllIndex >= 0 && wildcardIndex > catchAllIndex) throw new Error("Invalid path: wildcard (*) cannot appear after catch-all (**:param)");
	}
	const catchAllCount = (path$1.match(/\\\\*\\\\*:/g) || []).length;
	if (catchAllCount > 1) throw new Error("Invalid path: multiple catch-all parameters are not allowed");
	if (catchAllCount === 1) {
		const lastSegment = path$1.split("/").pop();
		if (lastSegment && !lastSegment.startsWith("**:")) throw new Error("Invalid path: catch-all parameter must be the last segment");
	}
}
function generateRoutePath(basePath, mockPath, baseUrl) {
	if (mockPath === ".") mockPath = "";
	if (basePath === "index") basePath = "";
	let p = path.posix.join(baseUrl, mockPath, basePath);
	if (p.endsWith("/")) p = p.slice(0, -1);
	return resolvePath(p);
}
const validMethods = [
	"get",
	"post",
	"put",
	"delete",
	"patch",
	"head",
	"options"
];
function getMethod(filePath) {
	const method = path.basename(filePath).split(".")[1];
	if (validMethods.includes(method)) return method;
	return "get";
}
async function createSever() {
	const app = new H3({});
	const baseDir = path.dirname(fileURLToPath(import.meta.url));
	const prefix = "/api";
	app.use("/**", (event) => {
		if (event.url.pathname.startsWith(prefix)) return;
		const getFilePath = (id) => {
			if (id.startsWith("/")) id = id.slice(1);
			if (!/\.[a-z0-9]+$/i.test(id)) return path.join(baseDir, "../", "index.html");
			return path.join(baseDir, "../", id);
		};
		return serveStatic(event, {
			indexNames: ["index.html"],
			getContents: (id) => {
				const filePath = getFilePath(id);
				const ext = path.extname(filePath).toLowerCase();
				if ([
					".html",
					".htm",
					".js",
					".mjs",
					".ts",
					".css",
					".json",
					".map",
					".txt",
					".md",
					".vue",
					".xml",
					".svg"
				].includes(ext)) return fs.readFile(filePath, "utf-8");
				return fs.readFile(getFilePath(id));
			},
			getMeta: async (id) => {
				const stats = await fs.stat(getFilePath(id)).catch(() => {});
				if (stats?.isFile()) return {
					size: stats.size,
					mtime: stats.mtimeMs
				};
			}
		});
	});
	const collectByPrefix = (pfx) => Object.keys(vendorMap).filter((k) => k.startsWith(pfx));
	const plugins = collectByPrefix("plugins/");
	const middlewares = collectByPrefix("middleware/");
	const routes = collectByPrefix("routes/");
	const resolvePlugins = async () => {
		for (const key of plugins) {
			const mod = vendorMap[key];
			const plugin = mod && mod.default ? mod.default : mod;
			if (!plugin) continue;
			if (typeof plugin === "function") app.register(plugin());
			else app.register(plugin);
		}
	};
	await resolvePlugins();
	const resolverMiddlewares = async () => {
		for (const key of middlewares) {
			const mod = vendorMap[key];
			const mw = mod && mod.default ? mod.default : mod;
			if (!mw) continue;
			app.use(mw);
		}
	};
	await resolverMiddlewares();
	const resolverRoutes = async () => {
		for (const key of routes) {
			const rel = key.slice(7);
			const dir = path.posix.dirname(rel);
			const baseName = path.posix.basename(rel);
			const cleanPath = baseName.split(".")[0];
			const routePath = generateRoutePath(cleanPath, dir === "." ? "" : dir, prefix);
			const method = getMethod(baseName);
			const mod = vendorMap[key];
			const handler = mod && mod.default ? mod.default : mod;
			if (!handler) continue;
			app.on(method, routePath, handler);
		}
	};
	await resolverRoutes();
	serve(app, {
		port: 3e3,
		host: "localhost"
	});
}
createSever().then(() => {});

//#endregion
export {  };