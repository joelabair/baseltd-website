"use strict";

var SparkPost = require('sparkpost');
var validator = require('validator');

var client = new SparkPost();  /* key is stored in SPARKPOST_API_KEY environment variable - see private-config.js*/
var template;

client.templates.find({id: 'base-ltd-contact-form'}, function(err, res) {
	var json;
	if (err) {
		console.log(err);
	} else {
		json = JSON.parse(res.body);
		if ('results' in json) {
			template = json.results;
			console.log("Email Template Retrieved");
		}
		else {
			console.log("Email Template Response Parse Error!");
		}
	}
});

var sanitize = function(input) {
	input = validator.toString(input);
	input = validator.stripLow(input);
	input = validator.trim(input);
	return input;
};

module.exports = function(app, path) {
	
	var msgConfig = app.get('messaging');
	
	var processRequest = function(req, res) {
		var text = '';
		var error = null;
		var name = sanitize(req.param('name'));
		var phone = sanitize(req.param('phone'));
		var email = sanitize(req.param('email'));
		var org = sanitize(req.param('organization'));
		var message = sanitize( req.param('message'));
		
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
		
		var data = {
			"name": name,
			"email": email,
			"phone": phone,
			"company": org,
			"message": message,
			"timestamp": Date().toString()
		};

		var reqOpts = {
			transmissionBody: {
				options: template.options,
				recipients: [{
					address: {
						"email": msgConfig.to_addr,
						"name": msgConfig.to_name
					}
				}],
				content: template.content,
				substitution_data: data
			}
		};
		
		reqOpts.transmissionBody.content['reply_to'] = name + " <"+email+">";
		  
		client.transmissions.send(reqOpts, function(err, result) {
			if (err) {
				console.log('A message transmission error occurred: ' + err.name + ' - ' + err.message);
				res.status(500).send({success: false, error: err});
			} else {
				res.send({success: true, result: result});
			}
		});
	};


    // setup route handlers
    app.get('/'+path, processRequest);
	app.post('/'+path, processRequest);

    app.all('/'+path, function(req,res,next) {
        res.send(405,'Unsupported action!');
    });

};
