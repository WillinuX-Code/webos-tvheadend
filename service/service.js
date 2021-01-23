const http = require('http');
const https = require('https');
const urlUtil = require('url');
const crypto = require('crypto');
const Service = require('webos-service');

// create webos service
var service = new Service('com.willinux.tvh.app.proxy');

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
        position = position || 0;
        return this.indexOf(searchString, position) === position;
    };
}

/**
 * create md5 hex string
 *
 * @param {string} s
 */
function hex_md5(s) {
    return crypto.createHash('md5').update(s).digest('hex');
}

function genNonce(b) {
    var c = [],
        e = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        a = e.length;
    for (var d = 0; d < b; ++d) {
        c.push(e[(Math.random() * a) | 0]);
    }
    return c.join('');
}
// Parse the parameters (check existence and validity) and extract the values.
// Note that quoted-string values can be folded, so you need to unfold them with this function
function unq(quotedString) {
    if (quotedString.startsWith("'") || quotedString.startsWith('"')) {
        return quotedString.substr(1, quotedString.length - 2).replace(/(?:(?:\r\n)?[ \t])+/g, ' ');
    } else {
        // actually unquoted
        return quotedString.replace(/(?:(?:\r\n)?[ \t])+/g, ' ');
    }
}

/**
 * backend proxy for requests to tvheadend as they are
 * not possible from browser due to cors restrictions
 */
service.register('proxy', function (message) {
    /** local node js mock setup 
    function MockMessage() { };
    MockMessage.prototype.respond = function (object) {
        console.log("MockMessage: ", object);
    }
    var message = new MockMessage();
    message.payload = {};
    message.payload.url = "http://userver.fritz.box:9981/api/serverinfo";
    message.payload.user = "webos";
    message.payload.password = "webos3583";
    */
    var url = message.payload.url,
        user = message.payload.user,
        password = message.payload.password;

    var parsedURL = urlUtil.parse(url);
    var options = {
        protocol: parsedURL.protocol,
        host: parsedURL.hostname,
        port: parsedURL.port,
        path: parsedURL.path,
        method: message.payload.method || 'GET'
    };

    request(options, user, password, message);
});

/**
 * send request
 *
 * @param {http.RequestOptions} options
 * @param {WebOSTV.OnCompleteResponse} message
 */
function request(options, user, password, message) {
    var protocolHandler = options.protocol === 'https:' ? https : http;
    var req = protocolHandler
        .request(options, function (resp) {
            var data = '';
            // handle http status unauthorized only if did not already tried to authorize
            if (
                resp.statusCode === 401 &&
                (options.headers === undefined || options.headers.Authorization === undefined)
            ) {
                var authHeader = resp.headers['www-authenticate'];
                handleAuthentication(options, user, password, authHeader, message);
            } else if (resp.statusCode < 200 || resp.statusCode > 299) {
                // return error in case of unexpected status code
                message.respond({
                    returnValue: false,
                    errorText: 'Server answered with StatusCode ' + resp.statusCode,
                    errorCode: 1,
                    statusCode: resp.statusCode
                });
                //console.log(resp.statusCode, resp);
            } else {
                // A chunk of data has been recieved.
                resp.on('data', function (chunk) {
                    data += chunk;
                });
                // The whole response has been received. Print out the result.
                resp.on('end', function () {
                    message.respond({
                        returnValue: true,
                        result: data,
                        statusCode: resp.statusCode
                    });
                });
            }
        })
        .on('error', function (err) {
            console.log('error:', err.message);
            message.respond({
                returnValue: false,
                errorText: err.message,
                errorCode: 1
            });
        })
        .on('socket', function (socket) {
            socket.setTimeout(10000);
            socket.on('timeout', function () {
                req.destroy();
            });
        });
    req.end();
}

function handleAuthentication(options, user, password, authHeader, message) {
    var ws = '(?:(?:\\r\\n)?[ \\t])+',
        token = '(?:[\\x21\\x23-\\x27\\x2A\\x2B\\x2D\\x2E\\x30-\\x39\\x3F\\x41-\\x5A\\x5E-\\x7A\\x7C\\x7E]+)',
        quotedString = '"(?:[\\x00-\\x0B\\x0D-\\x21\\x23-\\x5B\\\\x5D-\\x7F]|' + ws + '|\\\\[\\x00-\\x7F])*"',
        tokenizer = RegExp(token + '(?:=(?:' + quotedString + '|' + token + '))?', 'g');

    var tokens = authHeader.match(tokenizer);
    var type = tokens[0];
    var authorizationHeader = null;
    //'Digest realm="tvheadend", qop="auth", nonce="b8/cJWAebqXycYezwKvNRZL/gi9NL1jUeCHjTiphh30=", opaque="wpjG3XYw4UxxNM9lSbjaJqfDTkvCAAJLd4k5Nt6HH4E="'
    if (type === 'Digest') {
        authorizationHeader = digestAuth(options, user, password, tokens);
    } else if (type === 'Basic') {
        authorizationHeader = basicAuth(user, password);
    } else {
        message.respond({
            returnValue: false,
            errorText: 'Unsupported authentication type ' + type,
            errorCode: 1
        });
        return;
    }
    options.headers = options.headers || {};
    options.headers.Authorization = authorizationHeader;

    console.log('auth options:', options);
    // request again with authorization header
    request(options, user, password, message);
}

/**
 * create basic authentication header
 *
 * @param {http.RequestOptions} options
 * @param {String} user
 * @param {String} password
 */
function basicAuth(user, password) {
    return 'Basic ' + new Buffer(user + ':' + password).toString('base64');
}

/**
 * create digest authentication header
 *
 * @param {http.RequestOptions} options
 * @param {String} user
 * @param {String} password
 * @param {String[]} tokens
 */
function digestAuth(options, user, password, tokens) {
    var nonce, realm, qop;
    for (var i = 1; i < tokens.length; i++) {
        var value = tokens[i];
        if (value.match('nonce')) nonce = unq(value.substring(value.indexOf('=') + 1));
        if (value.match('realm')) realm = unq(value.substring(value.indexOf('=') + 1));
        if (value.match('qop')) qop = unq(value.substring(value.indexOf('=') + 1));
    }
    //console.log("process digest:", nonce);
    var cnonce = genNonce(20); // opaque random string value provided by the client
    var nc = 0;
    /*
     * HA1 = MD5(USER:REALM:PASS) --> john:your.realm:pass
     */
    var HA1 = hex_md5(user + ':' + realm + ':' + password);

    /*
     * HA2 = MD5(METHOD:URI)--> GET:your.realm
     */
    var HA2 = hex_md5(options.method + ':' + options.path);

    /*
     * response = digest = MD5(HA1 + ":" + NONCE + ":" + NC + ":" + CNONCE + ":" + QOP + ":" + HA2);
     */
    var res = hex_md5(HA1 + ':' + nonce + ':' + nc + ':' + cnonce + ':' + qop + ':' + HA2);

    /*
    *  Authorization header:
    *
    *  Authorization:  Digest username="John", realm="your.realm", 
                    nonce="k7KYbGJOCIw4RAK0IcaUQsYszXwsJGOU", uri="/", 
                    cnonce="MDAwODM0", nc=00000001, qop="auth", 
                    response="77f88f3f6b4623eedf17af206098ebf8"
    */
    return `Digest username="${user}", realm="${realm}", nonce="${nonce}", uri="${options.path}", cnonce="${cnonce}", nc="${nc}", qop="${qop}", response="${res}"`;
}
