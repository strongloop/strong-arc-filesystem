// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: strong-arc-filesystem
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

module.exports = function mountLoopBackExplorer(server) {
  var explorer;
  try {
    explorer = require('loopback-explorer');
  } catch (err) {
    // Print the message only when the app was started via `server.listen()`.
    // Do not print any message when the project is used as a component.
    server.once('started', function(baseUrl) {
      console.log(
        'Run `npm install loopback-explorer` to enable the LoopBack explorer'
      );
    });
    return;
  }

  var restApiRoot = server.get('restApiRoot');

  var explorerApp = explorer(server, {basePath: restApiRoot});
  server.use('/explorer', explorerApp);
  server.once('started', function() {
    var baseUrl = server.get('url').replace(/\/$/, '');
    // express 4.x (loopback 2.x) uses `mountpath`
    // express 3.x (loopback 1.x) uses `route`
    var explorerPath = explorerApp.mountpath || explorerApp.route;
    console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
  });
};
