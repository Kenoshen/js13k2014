var gameName = "capthatflag"

var minify = require("minify")
var fs = require('fs.extra');
var EasyZip = require('easy-zip').EasyZip;
var zip = new EasyZip();
fs.mkdir("tmp", function(err){
    fs.mkdir("tmp/" + gameName, function(err){
        fs.mkdir("tmp/" + gameName + "/game", function(err){
            minify('game/main.js', function (error, data) {
                if (error)
                    console.error(error.message);
                else {
                    fs.writeFile("tmp/" + gameName + "/game/main.js", data, function (err) {
                        if (err) {
                            return console.log(err);
                        }

                        console.log("The file was saved!");
                        minify('game/srv.js', function (error, data) {
                            if (error)
                                console.error(error.message);
                            else {
                                fs.writeFile("tmp/" + gameName + "/game/srv.js", data, function (err) {
                                    if (err) {
                                        return console.log(err);
                                    }

                                    console.log("The file was saved!");
                                    fs.copy('game.json', 'tmp/' + gameName + '/game.json', { replace: true }, function (err) {
                                        fs.copy('game/index.html', 'tmp/' + gameName + '/game/index.html', { replace: true }, function (err) {
                                            fs.copy('game/package.json', 'tmp/' + gameName + '/game/package.json', { replace: true }, function (err) {
                                                fs.copy('preview.png', 'tmp/' + gameName + '/preview.png', { replace: true }, function (err) {
                                                    var zip5 = new EasyZip();
                                                    zip5.zipFolder('tmp/' + gameName,function(){
                                                        zip5.writeToFile('tmp/' + gameName + '.zip');
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            }
                        });
                    });
                }
            });
        });
    });
});


