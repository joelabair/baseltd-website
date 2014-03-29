var mandrill = require('mandrill-api/mandrill');


module.exports = function(app, path) {

	var msgConfig = app.get('messaging');

	var mandrill_client = new mandrill.Mandrill(msgConfig.api_key);

	var processRequest = function(req, res) {
		var message = {
			"text": req.param('message'),
			"subject": msgConfig.subject,
			"from_email": msgConfig.from_addr,
			"from_name": req.param('fullname') + msgConfig.from_sfx,
			"to": [{
					"email": msgConfig.to_addr,
					"name": msgConfig.to_name,
					"type": "to"
				}],
			"headers": {
				"Reply-To": req.param('emailaddress')
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
			console.log(result);
		};

		var error = function(e) {
			console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
		};

		mandrill_client.messages.send({"message": message, "async": true}, success, error);

		res.send({success: true});
	};


    // setup route handlers
    app.get('/'+path, processRequest);
	app.post('/'+path, processRequest);

    app.all('/'+path, function(req,res,next) {
        res.send(400,'Unsupported action!');
    });

};
