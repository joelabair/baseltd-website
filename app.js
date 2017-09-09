"use strict";

var db = null,
	fs = require('fs'),
	util = require('util'),
	csrf = require('csurf'),
	path = require('path'),
	helmet = require('helmet'),
	express = require('express'),
	morgan  = require('morgan'),
	favicon = require('serve-favicon'),
	compress = require('compression'),
	bodyParser = require('body-parser'),
	session = require('express-session'),
	timeout = require('connect-timeout'),
	cookieParser = require('cookie-parser'),
	MongoClient = require('mongodb').MongoClient;

var MongoDBStore = require('connect-mongodb-session')(session);

global['__APP_ROOT_PATH'] = __dirname;
global['__APP_MODELS_PATH'] = path.join(__dirname, 'models');
global['__APP_VIEWS_PATH'] = path.join(__dirname,'views');
global['__APP_ROUTES_PATH'] = path.join(__dirname, 'routes');
global['__APP_PUBLIC_PATH'] = path.join(__dirname, 'public');

/**
 * Get config
 *
 */
var config = require(path.join(__APP_ROOT_PATH, 'config.js'));

/**
 * Init the app instance
 *
 */
var app = express();

// config settings
for(var name in config.server) {
    if(config.server.hasOwnProperty(name)) {
        app.set(name, config.server[name]);
    }
}

if ('messaging' in config) {
	app.set('messaging', config.messaging);
}

var url = util.format('mongodb://%s:%s@%s', config.mongodb.user, config.mongodb.password, config.mongodb.hostString);
MongoClient.connect(url, function(err, _db) {
    if(err) {
        console.error(util.format('MongoDB Connect Error: %s', err));
        return process.exit(1);
    }
	db = _db;
});

var expressSecret = '$#02022010BASE';

var store = new MongoDBStore({
  uri: url,
  collection: 'sessions'
});

app.enable('trust proxy');
app.disable('x-powered-by');

app.use(favicon(__APP_PUBLIC_PATH + '/assets/ico/favicon.ico'));

app.use(morgan(config.logFormat));
app.use(helmet());
app.use(timeout('15s'));
app.use(compress());

app.use(bodyParser.urlencoded({limit: 4096}));
app.use(cookieParser(expressSecret));

app.use(session({
	name: '_BSID',
	secret: expressSecret,
	store: store
}));

app.use(express.static(__APP_PUBLIC_PATH));

app.engine('hbs', require('exphbs'));
app.set('views', __APP_VIEWS_PATH);
app.set('view engine', 'hbs');

app.use(csrf({ ignoreMethods:  ['GET', 'HEAD', 'OPTIONS', 'PATCH', 'PUT', 'DELETE']}));

/**
 * load routes
 *
 */
var routes = [];

try {
    var dirList = fs.readdirSync(__APP_ROUTES_PATH);
    dirList.forEach(function(item){
        var index, comp = fs.statSync(path.join(__APP_ROUTES_PATH, item));
        if(comp.isDirectory()) {
            try {
                index = fs.statSync(path.join(__APP_ROUTES_PATH, item, '/index.js'));
            } catch (e) {
                // ok and index should be undefined or null
            }
            if(index && index.isFile()) {
                routes.push(require(path.join(__APP_ROUTES_PATH, item))(app, item));
            }
        }
    });
} catch (err) {
    if(err) {
        console.error('Read error: ' + err);
        process.exit();
    }
}

app.get('/', function(req, res){
	res.render('index', { csrfToken: req.csrfToken() });
});

app.get('/ping', function(req, res){
	res.send(true);
});

// error handler
app.use(function (err, req, res, next) {
	console.error(err);
	if (!process.env.NODE_ENV || process.env.NODE_ENV.indexOf('development') === -1) {
	  err.stack='Error!';
	}
	next(err);
});

module.exports = app;
