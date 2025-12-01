import _401_default from "./servers/routes/401.js";
import _403_default from "./servers/routes/403.js";
import _500_default from "./servers/routes/500.js";
import routes_default from "./servers/routes/index.js";
import login_post_default from "./servers/routes/login.post.js";
import logout_default from "./servers/routes/logout.js";
import test_delete_default from "./servers/routes/test.delete.js";
import test_post_default from "./servers/routes/test.post.js";
import test_put_default from "./servers/routes/test.put.js";
import basic_list_post_default from "./servers/routes/list/basic-list.post.js";
import consult_list_post_default from "./servers/routes/list/consult-list.post.js";
import create_post_default from "./servers/routes/list/create.post.js";
import crud_table_post_default from "./servers/routes/list/crud-table.post.js";
import index_post_default from "./servers/routes/list/index.post.js";
import index_put_default from "./servers/routes/list/index.put.js";
import __id__delete_default from "./servers/routes/list/_id_.delete.js";
import menu_default from "./servers/routes/menu/index.js";
import info_default from "./servers/routes/user/info.js";

//#region servers/.runtime/vendor.ts
const vendorMap = {
	"routes/401": _401_default,
	"routes/403": _403_default,
	"routes/500": _500_default,
	"routes/index": routes_default,
	"routes/login.post": login_post_default,
	"routes/logout": logout_default,
	"routes/test.delete": test_delete_default,
	"routes/test.post": test_post_default,
	"routes/test.put": test_put_default,
	"routes/list/basic-list.post": basic_list_post_default,
	"routes/list/consult-list.post": consult_list_post_default,
	"routes/list/create.post": create_post_default,
	"routes/list/crud-table.post": crud_table_post_default,
	"routes/list/index.post": index_post_default,
	"routes/list/index.put": index_put_default,
	"routes/list/[id].delete": __id__delete_default,
	"routes/menu/index": menu_default,
	"routes/user/info": info_default
};

//#endregion
export { vendorMap };