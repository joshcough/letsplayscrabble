import * as $foreign from "./foreign.js";
import * as Affjax from "../Affjax/index.js";

// | Makes an HTTP request.
// |
// | The example below performs a `GET` request to the URL `/resource` and
// | interprets the response body as JSON.
// |
// | ```purescript
// | import Affjax.ResponseFormat (json)
// | ...
// | request (defaultRequest { url = "/resource", method = Left GET, responseFormat = json})
// | ```
// |
// | For common cases helper functions can often be used instead of `request` .
// | For instance, the above example is equivalent to the following.
// |
// | ```purescript
// | get json "/resource"
// | ```
var request = /* #__PURE__ */ Affjax.request($foreign.driver);

// | Makes a `PUT` request to the specified URL with the option to send data
// | and ignores the response body.
var put_ = /* #__PURE__ */ Affjax.put_($foreign.driver);

// | Makes a `PUT` request to the specified URL with the option to send data.
var put = /* #__PURE__ */ Affjax.put($foreign.driver);

// | Makes a `POST` request to the specified URL with the option to send data
// | and ignores the response body.
var post_ = /* #__PURE__ */ Affjax.post_($foreign.driver);

// | Makes a `POST` request to the specified URL with the option to send data.
var post = /* #__PURE__ */ Affjax.post($foreign.driver);

// | Makes a `PATCH` request to the specified URL with the option to send data
// | and ignores the response body.
var patch_ = /* #__PURE__ */ Affjax.patch_($foreign.driver);

// | Makes a `PATCH` request to the specified URL with the option to send data.
var patch = /* #__PURE__ */ Affjax.patch($foreign.driver);

// | Makes a `GET` request to the specified URL.
var get = /* #__PURE__ */ Affjax.get($foreign.driver);

// | Makes a `DELETE` request to the specified URL and ignores the response
// | body.
var delete_ = /* #__PURE__ */ Affjax.delete_($foreign.driver);

// | Makes a `DELETE` request to the specified URL.
var $$delete = /* #__PURE__ */ Affjax["delete"]($foreign.driver);
export {
    driver
} from "./foreign.js";
export {
    request,
    get,
    post,
    post_,
    put,
    put_,
    $$delete as delete,
    delete_,
    patch,
    patch_
};
export {
    RequestContentError,
    RequestFailedError,
    ResponseBodyError,
    TimeoutError,
    XHROtherError,
    defaultRequest,
    printError
} from "../Affjax/index.js";
