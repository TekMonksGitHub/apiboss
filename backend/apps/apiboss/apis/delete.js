/**
 * (C) 2020 TekMonks. All rights reserved.
 *
 * Delete existing API
 */

 exports.doService = async req => {
    const jsonReq = req.data;
	if (!validateRequest(jsonReq)) {LOG.error(`Bad API delete request ${jsonReq?JSON.stringify(jsonReq):"null"}.`); return {data:CONSTANTS.FALSE_RESULT};}
    else {
        await APIREGISTRY.deleteAPI(jsonReq.path, APPCONSTANTS.APP_NAME); 
        LOG.info(`API deleted ${jsonReq.path}`); return {data:CONSTANTS.TRUE_RESULT};
    }
}

const validateRequest = jsonReq => jsonReq && jsonReq.path;