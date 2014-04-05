
/**
 * Module dependencies.
 *
 */
var fs = require('fs'),
	path = require('path'),
	express = require('express'),
	Db = require('mongodb').Db,
	Server = require('mongodb').Server,
	handlebars = require('express3-handlebars');


/**
 * Get config
 *
 */
var cfgRoot = (process.env.OPENSHIFT_DATA_DIR) ? process.env.OPENSHIFT_DATA_DIR : '';
var config = require(cfgRoot+'./private-config.js');


global['__APP_ROOT_PATH'] = __dirname;
global['__APP_MODELS_PATH'] = path.join(__dirname, 'models');
global['__APP_VIEWS_PATH'] = path.join(__dirname,'views');
global['__APP_ROUTES_PATH'] = path.join(__dirname, 'routes');
global['__APP_PUBLIC_PATH'] = path.join(__dirname, 'public');


/**
 * Init the app instance
 *
 */
var app = express();
app.enable('trust proxy');
app.disable('x-powered-by');

for(var name in config.server) {
    if(config.server.hasOwnProperty(name)) {
        app.set(name, config.server[name]);
    }
}

if ('messaging' in config) {
	app.set('messaging', config.messaging);
}

var dbcfg = config.mongodb;
var db = new Db(dbcfg.dbname, new Server(dbcfg.host, dbcfg.port), {safe:false});
db.open(function(err, db) {
    if(err) {
        console.error('MongoDB Connect Error: ' + err);
        db.close();
        process.exit();
    }
    db.authenticate(dbcfg.username, dbcfg.password, function(err, result) {
        if (err) {
            console.error('MongoDB Authenticate Error: ' + err);
            db.close();
            process.exit();
        }
    });
});

var expressSecret = '02022010amb';

app.set('views', __APP_VIEWS_PATH);
app.engine('phtml', handlebars({defaultLayout: 'layout', extname: '.phtml'}));
app.set('view engine', 'phtml');

app.use(express.logger(config.logFormat));
app.use(express.favicon(__APP_PUBLIC_PATH + '/favicon.ico'));
app.use(express.compress());

app.use(express.bodyParser({limit: 4096}));
app.use(express.cookieParser(expressSecret));
app.use(express.cookieSession({
	key: '_BSID',
	secret: expressSecret,
	cookie: {
		httpOnly: true,
		maxAge: (((60 * 60) * 24) * 7) * 1000
		// maxAge 7 days
	}
}));

app.use(express.csrf());
app.use(function(req, res, next) {
	// NOTE: ensure the _csrf token is available in any forms, add the following to the form
	// <input type="hidden" name="_csrf" value="{{csrfToken}}" />
	res.locals.csrfToken = req.csrfToken();
	next();
});


app.use(express.static(__APP_PUBLIC_PATH));
app.use(app.router);

express.errorHandler.title = 'BASE Ltd';
app.use(express.errorHandler());

app.get('/ping', function(req, res){
	res.render('ping');
});

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

app.listen(app.get('port'), app.get('address'), function () {
	console.log('%s: Node server started on %s:%d ...', Date(Date.now()), app.get('address'), app.get('port'));
});

//The 404 Route (ALWAYS Keep this as the last route)
app.all('/*', function(req, res){
    throw new NotFound("Oh snap!", req.url);
});

function NotFound(msg, url){
    this.name = 'NotFound';
    this.status = 404;
	this.toString = function(){
		return msg;
	};
	this.stack = "\nI can't hang with " + url;
}
