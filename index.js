    var _syncFile = function() {
        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();
        var arr = filePath.split(".");
        var suffix = arr[arr.length - 1];
        if (suffix !== "js" && suffix !== "py") {
            return;
        }
        var fs = require("fs");
        var path = require("path");
        var content = fs.readFileSync(filePath, "utf-8");
        var re = /(\/\/|#)\s*botvs@([a-zA-Z0-9]{32})/ig;
        var m = re.exec(content);
        if (m && m.length > 0) {
            var token = m[2];
            var https = require('https');
            var querystring = require("querystring");
            var post_data = querystring.stringify({
                'token': token,
                'method': 'push',
                'content': content.replace(m[0],''),
                'version': '0.0.2',
                'client': 'Atom'
            });
            var options = {
                hostname: 'www.botvs.com',
                port: 443,
                path: '/rsync',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': post_data.length
                }
            };
            var fileName = path.basename(filePath);
            var timeoutEvent;
            var req = https.request(options, function(res) {
                res.on('data', function(buffer) {
                    var obj = JSON.parse(buffer);
                    if (obj.code > 400) {
                        var errMsg = "BotVS sync [" + fileName + " ] failed, errCode: " + obj.code + "\n\nMay be the token is not correct !";
                        if (obj.code === 406) {
                            errMsg = 'BotVS plugin for sublime need update ! \n\nhttp://www.botvs.com';
                        }
                        alert(errMsg);
                    } else {
                        var msg = 'Hi ' + obj['user'] + ", sync success !\n\n[" + fileName + "] saved to [" + obj['name'] + "]"
                        alert(msg);
                    }
                });
                res.on("end", function() {
                    clearTimeout(timeoutEvent);
                });
                res.on("close", function() {
                    clearTimeout(timeoutEvent);
                });
                timeoutEvent = setTimeout(function() {
                    alert('sync timeout');
                }, 20000);
            });
            req.on('error', function(err) {
                alert(err);
            });
            req.write(post_data + "\n");
            req.end();
        }
    };

    module.exports = {
        activate: function() {
            atom.packages.onDidActivateInitialPackages(function() {
                atom.workspace.observeTextEditors(function(editor) {
                    editor.onDidSave(function(event) {
                        _syncFile();
                    });
                });
            });
        }
    };
