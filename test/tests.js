"use strict";

var path = require('path');
var expect = require('chai').expect;
var should = require('chai').should();
var supertest = require('supertest');

var app = require( path.join(__dirname, '..', 'app.js'));

describe('baseltd.biz', function() {
	var request = supertest(app);
	var token;

	describe('/', function(){
		describe('GET', function(){
			it('has a csrf token', function(done) {
				request
					.get('/')
					.expect(200, function (err, res) {
						if (err) return done(err);
						var matches = res.text.match(/name="_csrf" value="([^"]+)"/);
						if (matches) {
							token = matches[1];
						}
						expect(token)
							.to.be.a('string')
							.and.to.have.lengthOf(36);
						done();
					});
			});
		});
	});

	describe('/send-message', function() {
		describe('OPTIONS', function(){
			it('is not supoorted', function(done) {
				request
					.options('/send-message')
					.set('Host', 'baseltd.biz')
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(/.+/) // response body is  not empty
					.expect(405, done);
			});
		});

		describe('HEAD', function(){
			it('is not supoorted', function(done) {
				request
					.head('/send-message')
					.set('Host', 'baseltd.biz')
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(/.+/) // response body is  not empty
					.expect(405, done);
			});
		});

		describe('GET', function(){
			it('is not supoorted', function(done) {
				request
					.get('/send-message')
					.set('Host', 'baseltd.biz')
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(/.+/) // response body is  not empty
					.expect(405, done);
			});
		});

		describe('PATCH', function(){
			it('is not supoorted', function(done) {
				request
					.patch('/send-message')
					.set('Host', 'baseltd.biz')
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(/.+/) // response body is  not empty
					.expect(405, done);
			});
		});

		describe('PUT', function(){
			it('is not supoorted', function(done) {
				request
					.put('/send-message')
					.set('Host', 'baseltd.biz')
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(/.+/) // response body is  not empty
					.expect(405, done);
			});
		});

		describe('DELETE', function(){
			it('is not supoorted', function(done) {
				request
					.del('/send-message')
					.set('Host', 'baseltd.biz')
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(/.+/) // response body is  not empty
					.expect(405, done);
			});
		});

		describe('POST', function(){
			var Cookies;

			it('fails if name, phone, email, and message are not present', function(done){
				request
					.get('/')
					.expect(200, function (err, res) {
						if (err) return done(err);
						var matches = res.text.match(/name="_csrf" value="([^"]+)"/);
						if (matches) {
							token = matches[1];
						}
						expect(token)
							.to.be.a('string')
							.and.to.have.lengthOf(36);

						Cookies = cookies(res);

						request
							.post('/send-message')
							.set('Host', 'baseltd.biz')
							.set('Accept', 'application/json')
							.set('Cookie', Cookies)
							.set('X-Requested-With', 'XMLHttpRequest')
							.send('_csrf=' + encodeURIComponent(token))
							.expect('Content-Type', /json/)
							.expect(/.+/) // response body is  not empty
							.expect(400, done);
					});
			});

			it('can send a test message', function(done){
				request
					.post('/send-message')
					.set('Host', 'baseltd.biz')
					.set('Accept', 'application/json')
					.set('Cookie', Cookies)
					.set('X-Requested-With', 'XMLHttpRequest')
					.send('_csrf=' + encodeURIComponent(token))
					.send('name=Unit Test')
					.send('phone=555-1212')
					.send('email=test@example.com')
					.send('organization=Test Company')
					.send('message=this is a test')
					.expect('Content-Type', /json/)
					.expect(/.+/) // response body is  not empty
					.expect(200, done);
			});

			it('fails with invalid token', function(done){
				request
					.post('/send-message')
					.set('Host', 'baseltd.biz')
					.set('Accept', 'application/json')
					.set('Cookie', Cookies)
					.set('X-Requested-With', 'XMLHttpRequest')
					.send('_csrf=' + encodeURIComponent(token+"XXX"))
					.send('name=Unit Test')
					.send('phone=555-1212')
					.send('email=test@example.com')
					.send('organization=Test Company')
					.send('message=this is a test')
					.expect(/.+/) // response body is  not empty
					.expect(403, done);
			});
		});

	});
});

function cookies (res) {
  return res.headers['set-cookie'].map(function (cookies) {
    return cookies.split(';')[0]
  }).join(';')
}
