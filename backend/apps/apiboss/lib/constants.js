/* 
 * (C) 2015 TekMonks. All rights reserved.
 * License: GPL2 - see enclosed LICENSE file.
 */

const path = require("path");

APP_ROOT = `${path.resolve(`${__dirname}/../`)}`;

exports.APP_ROOT = APP_ROOT;
exports.LIB_DIR = `${APP_ROOT}/lib`;
exports.DB_DIR = `${APP_ROOT}/db`;
exports.CONF_DIR = `${APP_ROOT}/conf`;
exports.APP_NAME = "apiboss";