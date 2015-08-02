'use strict';

var i18n = require('i18n');
var AppConfig = require(__dirname + '/../../config.js');
var ejs = require('ejs');
var fs = require('fs');
var AppError = require(AppConfig.helperPath + 'app-error.js');

i18n.configure(AppConfig.i18nConfiguration);

var utility = function() {
  // Creating an echo function with the i18n module
  // included to handle printing into the HTML pages
  // from one location itself. There maybe a better way
  // to do this though.
  // TODO Find a better way to do this.
  var echo = function(text) {
    document.write(i18n.__(text));
  };

  var loadPartial = function(partialName, data, callback) {
    loadTemplateFile(partialName, false, data, callback);
  };

  var loadDialog = function(dialogName, data, callback) {
    loadTemplateFile(dialogName, true, data, callback);
  };

  function loadTemplateFile(fileName, isDialog, data, callback) {
    try {
      if (typeof data === 'undefined' || !data) {
        data = {
          AppUtil: utility(),
          i18n: i18n,
          basePath : AppConfig.basePath
        };
      } else {
        data.AppUtil = utility();
        data.i18n = i18n;
        data.basePath = AppConfig.basePath;
      }
      var fileToLoad = '';
      if (isDialog) {
        fileToLoad = AppConfig.dialogsPath + fileName;
      } else {
        fileToLoad = AppConfig.partialsPath + fileName;
      }
      fs.readFile(fileToLoad, 'utf-8', function(err, htmlFile) {
        if (err) {
          data.AppUtil = null;
          return callback(new AppError(err, i18n.__('error.partial_load_error', fileToLoad)));
        }
        var tmpl = ejs.compile(htmlFile);
        var str = tmpl(data);
        data.AppUtil = null;

        return callback(null, str);
      });
    } catch (e) {
      return callback(new AppError(e, i18n.__('error.partial_load_error', fileName)));
    }
  }

  var mvFile = function(oldPath, newPath, cbMain) {
    var source = fs.createReadStream(oldPath);
    var dest = fs.createWriteStream(newPath);

    source.pipe(dest);
    source.on('end', function() {
      fs.unlink(oldPath, function(err) {
        if(err) {
          return cbMain(new AppError(err, 'There was an error while moving the file.'));
        }
        return cbMain();
      });
    });

    source.on('error', function(err) {
      return cbMain(new AppError(err, 'There was an error while moving the file.'));
    });
  };

  return {
    echo: echo,
    loadPartial: loadPartial,
    loadDialog: loadDialog,
    mvFile : mvFile
  };
};

module.exports = utility();
