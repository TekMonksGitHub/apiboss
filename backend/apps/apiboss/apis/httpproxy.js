/** 
 * (C) 2020 TekMonks. All rights reserved.
 * 
 * Proxy for JSON/REST APIs for APIBoss
 */
 const crypto = require("crypto");
 const httpClient = require(`${CONSTANTS.LIBDIR}/httpClient.js`);
 const apibosslog = require(`${APPCONSTANTS.LIB_DIR}/apibosslog.js`);
 
 exports.doService = doService;
 
 async function doService(req) {
     let method = req.method.toLowerCase(); const url = new URL(req.url); const host = url.hostname; 
     const port = url.port; const path = url.pathname+url.search; if (!path.startsWith("/")) path = `/${path}`;
     const headers = {...req.headers}; const reqData = req.data;
 
     if (url.protocol.toLowerCase() == "https:") method += "Https";           
     if (method == "delete") method = "deleteHttp";        // delete is a reserved word in JS
 
     const timestamp = Date.now(), id = `${timestamp}${parseInt(crypto.randomBytes(4).toString("hex"),16)}`;
     apibosslog.recordRequest(id, timestamp, method, host, port, path, headers, reqData, "http"); // log request, async, don't wait
     const {error,data,status,resHeaders} = await httpClient[method](host, port, path, headers, reqData);
     apibosslog.recordResponse(id, Date.now(), error, data, status, resHeaders, "http"); // log response, async, don't wait
 
     if (error) throw("APIBoss HTTP Proxy Error", {status, message:error}); 
     else return({data,headers: resHeaders});
 }
 
