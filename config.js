/*
 *  Application Configuration Settings
 *
 */

var appConfig = process.env.APP_CONFIG || {
	"mongo": {
		"hostString": 	"127.0.0.1:27017/baseltd",
		"user": 			"openShiftDev75",
		"db": 				"baseltd"
	}
};

appConfig.mongo.password = process.env.EN_MONGO_PASSWD;

var config = {
	development: {
		logFormat: ':date [:req[X-Original-Host]] - :method :url HTTP/:http-version :status (sent :res[content-length] bytes in :response-time ms)',
		server: {
			hostname:	'baseltd.biz',
			address:		'127.0.0.1',
			port:			3000,
		},
		mongodb: appConfig.mongo,
		messaging: {
			subject:		'www.baseltd.net - E-Mail',
			to_addr:		'all-company@baseltd.biz',
			to_name:		'BASE, Ltd.',
			from_addr:	'messaging@baseltd.biz',
			from_sfx:		' via baseltd.biz'
		}
	},
	production: {
		logFormat: ':date [:req[X-Original-Host]] - :method :url HTTP/:http-version :status (sent :res[content-length] bytes in :response-time ms)',
		server: {
			hostname:	'baseltd.biz',
			address:		'0.0.0.0',
			port:			process.env.PORT,
		},
		mongodb: appConfig.mongo,
		messaging: {
			subject:		'www.baseltd.net - E-Mail',
			to_addr:		'all-company@baseltd.biz',
			to_name:		'BASE, Ltd.',
			from_addr:	'messaging@baseltd.biz',
			from_sfx:		' via baseltd.biz'
		}
	}
};


module.exports = config[process.env['NODE_ENV']];

