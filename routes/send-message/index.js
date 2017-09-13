"use strict";

var SparkPost = require('sparkpost');
var validator = require('validator');
var formatJson = require('stringify-object');
var util = require('util');
var nl2br  = require('nl2br');
var template = null;
var client = new SparkPost();  /* key is stored in SPARKPOST_API_KEY environment variable */

var getTemplate = function(callback) {
	if (typeof callback !== 'function') {
		console.error("A callback i required!");
		return process.exit(1);
	}
	if (template) {
		return callback(null, template);
	}
	client.templates.get('base-ltd-contact-form', function(err, res) {
		if (err) {
			console.error(util.format('SparkPost template fetch error: %s', err));
			return callback(err);
		} else {
			if ('results' in res) {
				template = res.results;
				console.log('%s: Email Template Retrieved...  Ready.', Date(Date.now()));
				callback(null, template);
			}
			else {
				console.log("%s: Email Template Response Parse Error!", Date(Date.now()));
				callback(new Error('Email Template Response Parse Error'));
			}
		}
	});
};

var sanitize = function(input) {
	input = validator.toString(input);
	input = validator.stripLow(input);
	input = validator.trim(input);
	return input;
};

module.exports = function(app, path) {

	var msgConfig = app.get('messaging');

	var processRequest = function(req, res) {
		if (!req.xhr) {
			return res.redirect('/');
		}

		var error = null;
		var name = sanitize(req.body.name);
		var phone = sanitize(req.body.phone);
		var email = sanitize(req.body.email);
		var org = sanitize(req.body.organization);
		var message = sanitize( req.body.message);

		if (!name) {
			error = error || {};
			error.name = 'required';
		}

		if (!phone) {
			error = error || {};
			error.phone = 'required';
		}

		if (!email || !validator.isEmail(email)) {
			error = error || {};
			error.email = 'invalid';
		}

		if (!message) {
			error = error || {};
			error.message = 'required';
		}

		if (error) {
			return res.status(400).send(error);
		}

		getTemplate(function(err, template) {
			if (err) {
				return res.status(500).send({success: false, error: err});
			}

			var data = {
				"name": name,
				"email": email,
				"phone": phone,
				"company": org,
				"message": nl2br(message),
				"rawmessage": message,
				"timestamp": Date().toString()
			};

			var reqOpts = {
				options: template.options,
				recipients: [{
					address: {
						"email": msgConfig.to_addr,
						"name": msgConfig.to_name
					}
				}],
				content: template.content,
				substitution_data: data
			};

			reqOpts.content['reply_to'] = name + " <"+email+">";

			client.transmissions.send(reqOpts, function(err, response) {
				if (err) {
					console.log('A message transmission error occurred: ' + err.name + ' - ' + err.message);
					res.status(500).send({success: false, error: err});
				} else {
					console.log('Message:', data);
					console.log('Result:', response.results);
					if (req.xhr) {
						res.send({success: true});
					}
				}
			});
		});
	};


    // setup route handlers
	app.post('/'+path, processRequest);

    app.all('/'+path, function(req,res) {
        var code = 405;
		var data = {
			error: 'Unsupported action!'
		};

		res.format({
			'text/html': function() {
				if (typeof data === 'object') {
					res.status(code).send('<pre>'+formatJson(data, {indent: '    ', singleQuotes: false})+'</pre>');
				} else {
					res.status(code).send('<pre>'+data+'</pre>');
				}
			},
			'application/xhtml+xml': function() {
				if (typeof data === 'object') {
					res.status(code).send('<pre>'+formatJson(data, {indent: '    ', singleQuotes: false})+'</pre>');
				} else {
					res.status(code).send('<pre>'+data+'</pre>');
				}
			},
			'application/json': function(){
				res.status(code).send(data);
			},
			'text/json': function(){
				res.status(code).send(data);
			},
			'application/javascript': function(){
				res.status(code).send(data);
			},
			'text/javascript': function(){
				res.status(code).send(data);
			},
			'text/plain': function() {
				if (typeof data === 'object') {
					res.status(code).send(formatJson(data, {indent: '    ', singleQuotes: false}));
				} else {
					res.status(code).send(data);
				}
			},
			default: function() {
				if (typeof data === 'object') {
					res.status(code).send(formatJson(data, {indent: '    ', singleQuotes: false}));
				} else {
					res.status(code).send(data);
				}
			}
		});
    });

};
