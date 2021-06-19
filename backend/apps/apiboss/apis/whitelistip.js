/**
 * (C) 2020 TekMonks. All rights reserved.
 *
 * Blacklists or unblacklists the given IP
 */
const server = require(`${CONSTANTS.ROOTDIR}/server.js`);

exports.doService = async req => {
	const jsonReq = req.data;
	if (!validateRequest(jsonReq)) {LOG.error(`Bad IP whitelist request ${jsonReq?JSON.stringify(jsonReq):"null"}.`); return {data:CONSTANTS.FALSE_RESULT};}

	await server.whitelistIP(jsonReq.ip, jsonReq.op);

	return {data: CONSTANTS.TRUE_RESULT};
}

const validateRequest = jsonReq => jsonReq && jsonReq.ip && jsonReq.op && (jsonReq.op == "add"||jsonReq.op=="remove");