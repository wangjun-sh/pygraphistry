import express from 'express';
import { assert } from 'chai';
import mkdirp from 'mkdirp';
import { Observable } from 'rxjs';
import request from 'request';
const get = Observable.bindNodeCallback(request.get.bind(request));

import { httpConnector0 } from '../../../src/shared/services/connectors/http';
import { HttpPivot } from '../../../src/shared/services/templates/http/httpPivot';


describe('httpPivot', function () {

	let timeout;
    beforeEach(function () {
		timeout = httpConnector0.timeout_s;
		httpConnector0.timeout_s = 0.05;
    })
	afterEach(function () {
		httpConnector0.timeout_s = timeout;
	});


    let server;
	beforeEach(function() {

		const expressApp = express();		
	    expressApp.get('/echo', function(req, res) {
	        res.status(200).json(req.query);
	    });
	    expressApp.get('/timeout', () => {});
	    expressApp.get('/404', (req, res) => res.status(404).json({}));
	    server = expressApp.listen(3000);	    
	});

	afterEach(function () {
		server.close();
	});


	////////////////////////////////

	it('testEcho', (done) => {
		get('http://localhost:3000/echo?x=1')
			.subscribe(
				([response]) => { 
					assert.deepEqual(JSON.parse(response.body), {x: '1'})
					done();
				}, (v) => done(new Error({v})) );
	});

	it('construct', (done) => {
		new HttpPivot({
			id: 'x', name: 'y', tags: [], attributes: [], connections: [],
			toUrls: () => [],
			parameters: [],
			encodings: {}
		});
		done();
	});

	it('constant', (done) => {
		const pivot = new HttpPivot({
			id: 'x', name: 'y', tags: [], attributes: [], connections: [],
			toUrls: () => ['http://localhost:3000/echo?x=1'],
			parameters: [],
			encodings: {}
		});
		pivot.searchAndShape({
				app: {}, 
				pivot: {
					id: 'x',
					enabled: true, 
					pivotParameters: {'x$$$jq': '. | [{x: 1}, {x: 3}]'}					
				}, 
				pivotCache: {}})
			.subscribe(({pivot, ...rest}) => {
					assert.deepEqual(pivot.events, [{x: 1, EventID:'x:0'}, {x: 3, EventID:'x:1'}]);
					assert.deepEqual(pivot.results.graph, 
						[{x:1, destination: 1, 'source': 'x:0', edgeType: 'EventID->x', _pivotId: 'x'},
						 {x:3, destination: 3, 'source': 'x:1', edgeType: 'EventID->x', _pivotId: 'x'}]);
					assert.deepEqual(pivot.results.labels,
						[{ x: 1, node: 'x:0', type: 'EventID' },
					     { node: 1, type: 'x' },
					     { x: 3, node: 'x:1', type: 'EventID' },
					     { node: 3, type: 'x' } ]);
					done();
				}, (e) => done(new Error(e)));
	});

	it('fromData', (done) => {
		const pivot = new HttpPivot({
			id: 'x', name: 'y', tags: [], attributes: [], connections: [],
			toUrls: () => ['http://localhost:3000/echo?x=5&x=10'],
			parameters: [],
			encodings: {}
		});
		pivot.searchAndShape({
				app: {}, 
				pivot: {
					id: 'x',
					enabled: true, 
					pivotParameters: {'x$$$jq': '. | [{x: .x[0]}, {x: .x[1]}]'}
				}, 
				pivotCache: {}})
			.subscribe(({pivot, ...rest}) => {
					assert.deepEqual(pivot.events, [{x: "5", EventID:'x:0'}, {x: "10", EventID:'x:1'}]);
					assert.deepEqual(pivot.results.graph, 
						[{x: "5", destination: "5", 'source': 'x:0', edgeType: 'EventID->x', _pivotId: 'x'},
						 {x: "10", destination: "10", 'source': 'x:1', edgeType: 'EventID->x', _pivotId: 'x'}]);
					assert.deepEqual(pivot.results.labels,
						[{ x: "5", node: 'x:0', type: 'EventID' },
					     { node: "5", type: 'x' },
					     { x: "10", node: 'x:1', type: 'EventID' },
					     { node: "10", type: 'x' } ]);
					done();
				}, (e) => done(new Error(e)));
	});

	it('userEventID', (done) => {
		const pivot = new HttpPivot({
			id: 'x', name: 'y', tags: [], attributes: [], connections: [],
			toUrls: () => ['http://localhost:3000/echo?x=5&x=10'],
			parameters: [],
			encodings: {}
		});
		pivot.searchAndShape({
				app: {}, 
				pivot: {
					id: 'x',
					enabled: true, 
					pivotParameters: {'x$$$jq': '. | [{x: .x[0], EventID: "aa"}, {x: .x[1], EventID: "bb"}]'}
				}, 
				pivotCache: {}})
			.subscribe(({pivot, ...rest}) => {
					assert.deepEqual(pivot.events, [{x: "5", EventID:'aa'}, {x: "10", EventID:'bb'}]);
					assert.deepEqual(pivot.results.graph, 
						[{x: "5", destination: "5", 'source': 'aa', edgeType: 'EventID->x', _pivotId: 'x'},
						 {x: "10", destination: "10", 'source': 'bb', edgeType: 'EventID->x', _pivotId: 'x'}]);
					assert.deepEqual(pivot.results.labels,
						[{ x: "5", node: 'aa', type: 'EventID' },
					     { node: "5", type: 'x' },
					     { x: "10", node: 'bb', type: 'EventID' },
					     { node: "10", type: 'x' } ]);
					done();
				}, (e) => done(new Error(e)));
	});

	it('no includes', (done) => {
		const pivot = new HttpPivot({
			id: 'x', name: 'y', tags: [], attributes: [], connections: [],
			toUrls: () => ['http://localhost:3000/echo?x=1'],
			parameters: [],
			encodings: {}
		});
		pivot.searchAndShape({
				app: {}, 
				pivot: {
					id: 'x',
					enabled: true, 
					pivotParameters: {'x$$$jq': '. | import [{x: 1}, {x: 3}]'}					
				}, 
				pivotCache: {}})
			.subscribe(({pivot, ...rest}) => {
					done(new Error({msg: "Expected exception"}));
				}, (e) => {
					if (e && (e.name === 'JqSandboxException')) done();
					else done(new Error({msg: "Excepted sandbox exception"}));
				});
	});

});