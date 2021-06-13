/**
 * (C) 2020 TekMonks. All rights reserved.
 *
 * Simple echo API for APIBoss
 */

exports.doService = async jsonReq => {
	let resp = jsonReq.data||{};
	resp.headers = jsonReq.servObject.req.headers;

	return {data: resp, headers: {"Server": "APIBoss"}};
}