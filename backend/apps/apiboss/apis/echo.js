/* 
 * (C) 2020 TekMonks. All rights reserved.
 *
 * Simple echo API
 */

exports.doService = async jsonReq => {
	let resp = jsonReq.data;
	resp.headers = jsonReq.headers;

	return {data: resp, headers: {"Server": "APIBoss"}};
}