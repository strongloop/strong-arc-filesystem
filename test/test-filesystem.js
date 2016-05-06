// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: strong-arc-filesystem
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

var request = require('supertest');
var path = require('path');
var test = require('tap').test;
var server = require('../server/server');

test('Get directory listing', function(t) {
  var app = request(server);
  var base = path.join(__dirname, 'sampledir');
  app
    .get('/readdir')
    .query({path: base})
    .expect(200, function(err, res) {
      t.ifError(err);
      t.ok(res.body.parents);
      delete res.body.parents;
      t.deepEqual(res.body, {
        cwd: {
          name: 'sampledir',
          path: base,
        },
        files: [{
          name: 'dir',
          type: 'directory',
          path: path.join(base, 'dir'),
          isLoopback: false,
        }, {
          name: 'file.txt',
          type: 'file',
          path: path.join(base, 'file.txt'),
        }, {
          name: 'lbapp',
          type: 'directory',
          path: path.join(base, 'lbapp'),
          isLoopback: true,
        }, {
          name: 'symlink.txt',
          type: 'symlink',
          path: path.join(base, 'symlink.txt'),
        }],
      });
      t.end();
    });
});
