"use strict";

var mandrill = require('mandrill-api/mandrill');
var validator = require('validator');

var sanitize = function(input) {
	input = validator.toString(input);
	input = validator.stripLow(input);
	input = validator.trim(input);
	return input;
};


module.exports = function(app, path) {

	var msgConfig = app.get('messaging');
	var mandrill_client = new mandrill.Mandrill(msgConfig.api_key);

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
		
		text = "<html><body><p>";
		text += "Name: " + name + "<br>";
		text += "Phone: "+ phone + "<br>";
		if (org) text += "Company: "+ org + "<br>";
		text += "<br>" + Array(30).join('-') + 'MESSAGE TEXT'+Array(30).join('-') + "<br><br>";
		text += message;
		text += "<\p></body></html>";

		var message = {
			"html": text,
			"subject": msgConfig.subject,
			"from_email": msgConfig.from_addr,
			"from_name": name + msgConfig.from_sfx,
			"to": [{
				"email": msgConfig.to_addr,
				"name": msgConfig.to_name,
				"type": "to"
			}],
			"headers": {
				"Reply-To": email
			},
			"important": false,
			"track_opens": true,
			"track_clicks": false,
			"auto_text": true,
			"auto_html": true,
			"inline_css": true,
			"metadata": {
				"website": req.host
			},
			"subaccount": msgConfig.acnt_id
		};

		var success = function(result) {
			res.send({success: true, result: result});
		};

		var error = function(e) {
			console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
			res.send({success: false, error: e});
		};

		mandrill_client.messages.send({"message": message, "async": true}, success, error);
	};


    // setup route handlers
    app.get('/'+path, processRequest);
	app.post('/'+path, processRequest);

    app.all('/'+path, function(req,res,next) {
        res.send(405,'Unsupported action!');
    });

};
