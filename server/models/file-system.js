// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: strong-arc-filesystem
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

var async = require('async');
var fs = require('fs');
var path = require('path');

module.exports = function(FileSystem) {
  FileSystem.remoteMethod(
    'readdir',
    {
      http: {verb: 'get'},
      isStatic: true,
      accepts: [
        {
          arg: 'path',
          required: true,
          type: 'string',
        },
      ],
      returns: {arg: 'response', type: 'array', root: true},
      description: 'Reads the contents of a directory.',
    }
  );

  FileSystem.readdir = function(p, callback) {
    p = path.resolve(p);
    fs.readdir(p, function(err, files) {
      if (err) return callback(err);

      var cwd = path.resolve(p);
      var parents = [];

      var parent = cwd;
      do {
        parent = path.dirname(parent);
        parents.unshift({
          name: path.basename(parent),
          path: path.resolve(parent),
        });
      } while (parent !== path.dirname(parent));

      async.map(files, getFileDetails, function(err, files) {
        callback(err, {
          cwd: {name: path.basename(cwd), path: cwd},
          parents: parents,
          files: files,
        });
      });
    });

    function getFileDetails(fileName, callback) {
      var filePath = path.join(p, fileName);
      fs.lstat(filePath, function(err, stat) {
        if (err) return callback(err);
        var type;
        if (stat.isSymbolicLink()) type = 'symlink';
        if (stat.isDirectory()) type = 'directory';
        if (stat.isFile()) type = 'file';

        var fileData = {
          name: path.basename(filePath),
          type: type,
          path: filePath,
        };

        if (stat.isDirectory()) {
          return checkLbApp(filePath, function(err, isLbApp) {
            fileData.isLoopback = isLbApp;
            callback(err, fileData);
          });
        }
        callback(err, fileData);
      });
    }

    function checkLbApp(dirPath, callback) {
      async.series([
        fileExists.bind(null, path.join(dirPath, 'common', 'models')),
        fileExists.bind(null, path.join(dirPath, 'server')),
        fileExists.bind(null, path.join(dirPath, 'server', 'config.json')),
        fileExists.bind(null,
          path.join(dirPath, 'server', 'model-config.json')),
        fileExists.bind(null, path.join(dirPath, 'server', 'middleware.json')),
        fileExists.bind(null, path.join(dirPath, 'server', 'datasources.json')),
      ], function(err, res) {
        if (err) return callback(err);

        // LB projects contain `common/models` or a `server` folder
        // plus at least one of `server/config.json`,
        // `server/model-config.json`, `server/middleware.json` or
        // `server/datasources.json`
        callback(null,
          res[0] || (res[1] && (res[2] || res[3] || res[4] || res[5])));
      });
    }

    function fileExists(dirPath, callback) {
      fs.stat(dirPath, function(err) {
        callback(null, !err);
      });
    }
  };
};
