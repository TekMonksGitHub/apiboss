/**
 * (C) 2020 TekMonks. All rights reserved.
 *
 * Edits existing API
 */

 exports.doService = async req => {
    const jsonReq = req.data;
	if (!validateRequest(jsonReq)) {LOG.error(`Bad API edit request ${jsonReq?JSON.stringify(jsonReq):"null"}.`); return {data:CONSTANTS.FALSE_RESULT};}
    else {
        await APIREGISTRY.editAPI(jsonReq.path, jsonReq.apiregentry, APPCONSTANTS.APP_NAME); 
        LOG.info(`API edited to ${jsonReq.path}:${jsonReq.apiregentry}`); return {data:CONSTANTS.TRUE_RESULT};
    }
}

const validateRequest = jsonReq => jsonReq && jsonReq.path && jsonReq.apiregentry;