const http = require("http");
const https = require('https');
const urlUtil = require('url');
const Service = require("webos-service");

// create webos service
var service = new Service("com.willinux.tvh.app.proxy");
// TODO check if md5 and sha256 can be used from node module or os
var hexcase = 0; var b64pad = ""; function hex_md5(a) { return rstr2hex(rstr_md5(str2rstr_utf8(a))) } function b64_md5(a) { return rstr2b64(rstr_md5(str2rstr_utf8(a))) } function any_md5(a, b) { return rstr2any(rstr_md5(str2rstr_utf8(a)), b) } function hex_hmac_md5(a, b) { return rstr2hex(rstr_hmac_md5(str2rstr_utf8(a), str2rstr_utf8(b))) } function b64_hmac_md5(a, b) { return rstr2b64(rstr_hmac_md5(str2rstr_utf8(a), str2rstr_utf8(b))) } function any_hmac_md5(a, c, b) { return rstr2any(rstr_hmac_md5(str2rstr_utf8(a), str2rstr_utf8(c)), b) } function md5_vm_test() { return hex_md5("abc").toLowerCase() == "900150983cd24fb0d6963f7d28e17f72" } function rstr_md5(a) { return binl2rstr(binl_md5(rstr2binl(a), a.length * 8)) } function rstr_hmac_md5(c, f) { var e = rstr2binl(c); if (e.length > 16) { e = binl_md5(e, c.length * 8) } var a = Array(16), d = Array(16); for (var b = 0; b < 16; b++) { a[b] = e[b] ^ 909522486; d[b] = e[b] ^ 1549556828 } var g = binl_md5(a.concat(rstr2binl(f)), 512 + f.length * 8); return binl2rstr(binl_md5(d.concat(g), 512 + 128)) } function rstr2hex(c) { try { hexcase } catch (g) { hexcase = 0 } var f = hexcase ? "0123456789ABCDEF" : "0123456789abcdef"; var b = ""; var a; for (var d = 0; d < c.length; d++) { a = c.charCodeAt(d); b += f.charAt((a >>> 4) & 15) + f.charAt(a & 15) } return b } function rstr2b64(c) { try { b64pad } catch (h) { b64pad = "" } var g = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"; var b = ""; var a = c.length; for (var f = 0; f < a; f += 3) { var k = (c.charCodeAt(f) << 16) | (f + 1 < a ? c.charCodeAt(f + 1) << 8 : 0) | (f + 2 < a ? c.charCodeAt(f + 2) : 0); for (var d = 0; d < 4; d++) { if (f * 8 + d * 6 > c.length * 8) { b += b64pad } else { b += g.charAt((k >>> 6 * (3 - d)) & 63) } } } return b } function rstr2any(m, c) { var b = c.length; var l, f, a, n, e; var k = Array(Math.ceil(m.length / 2)); for (l = 0; l < k.length; l++) { k[l] = (m.charCodeAt(l * 2) << 8) | m.charCodeAt(l * 2 + 1) } var h = Math.ceil(m.length * 8 / (Math.log(c.length) / Math.log(2))); var g = Array(h); for (f = 0; f < h; f++) { e = Array(); n = 0; for (l = 0; l < k.length; l++) { n = (n << 16) + k[l]; a = Math.floor(n / b); n -= a * b; if (e.length > 0 || a > 0) { e[e.length] = a } } g[f] = n; k = e } var d = ""; for (l = g.length - 1; l >= 0; l--) { d += c.charAt(g[l]) } return d } function str2rstr_utf8(c) { var b = ""; var d = -1; var a, e; while (++d < c.length) { a = c.charCodeAt(d); e = d + 1 < c.length ? c.charCodeAt(d + 1) : 0; if (55296 <= a && a <= 56319 && 56320 <= e && e <= 57343) { a = 65536 + ((a & 1023) << 10) + (e & 1023); d++ } if (a <= 127) { b += String.fromCharCode(a) } else { if (a <= 2047) { b += String.fromCharCode(192 | ((a >>> 6) & 31), 128 | (a & 63)) } else { if (a <= 65535) { b += String.fromCharCode(224 | ((a >>> 12) & 15), 128 | ((a >>> 6) & 63), 128 | (a & 63)) } else { if (a <= 2097151) { b += String.fromCharCode(240 | ((a >>> 18) & 7), 128 | ((a >>> 12) & 63), 128 | ((a >>> 6) & 63), 128 | (a & 63)) } } } } } return b } function str2rstr_utf16le(b) { var a = ""; for (var c = 0; c < b.length; c++) { a += String.fromCharCode(b.charCodeAt(c) & 255, (b.charCodeAt(c) >>> 8) & 255) } return a } function str2rstr_utf16be(b) { var a = ""; for (var c = 0; c < b.length; c++) { a += String.fromCharCode((b.charCodeAt(c) >>> 8) & 255, b.charCodeAt(c) & 255) } return a } function rstr2binl(b) { var a = Array(b.length >> 2); for (var c = 0; c < a.length; c++) { a[c] = 0 } for (var c = 0; c < b.length * 8; c += 8) { a[c >> 5] |= (b.charCodeAt(c / 8) & 255) << (c % 32) } return a } function binl2rstr(b) { var a = ""; for (var c = 0; c < b.length * 32; c += 8) { a += String.fromCharCode((b[c >> 5] >>> (c % 32)) & 255) } return a } function binl_md5(p, k) { p[k >> 5] |= 128 << ((k) % 32); p[(((k + 64) >>> 9) << 4) + 14] = k; var o = 1732584193; var n = -271733879; var m = -1732584194; var l = 271733878; for (var g = 0; g < p.length; g += 16) { var j = o; var h = n; var f = m; var e = l; o = md5_ff(o, n, m, l, p[g + 0], 7, -680876936); l = md5_ff(l, o, n, m, p[g + 1], 12, -389564586); m = md5_ff(m, l, o, n, p[g + 2], 17, 606105819); n = md5_ff(n, m, l, o, p[g + 3], 22, -1044525330); o = md5_ff(o, n, m, l, p[g + 4], 7, -176418897); l = md5_ff(l, o, n, m, p[g + 5], 12, 1200080426); m = md5_ff(m, l, o, n, p[g + 6], 17, -1473231341); n = md5_ff(n, m, l, o, p[g + 7], 22, -45705983); o = md5_ff(o, n, m, l, p[g + 8], 7, 1770035416); l = md5_ff(l, o, n, m, p[g + 9], 12, -1958414417); m = md5_ff(m, l, o, n, p[g + 10], 17, -42063); n = md5_ff(n, m, l, o, p[g + 11], 22, -1990404162); o = md5_ff(o, n, m, l, p[g + 12], 7, 1804603682); l = md5_ff(l, o, n, m, p[g + 13], 12, -40341101); m = md5_ff(m, l, o, n, p[g + 14], 17, -1502002290); n = md5_ff(n, m, l, o, p[g + 15], 22, 1236535329); o = md5_gg(o, n, m, l, p[g + 1], 5, -165796510); l = md5_gg(l, o, n, m, p[g + 6], 9, -1069501632); m = md5_gg(m, l, o, n, p[g + 11], 14, 643717713); n = md5_gg(n, m, l, o, p[g + 0], 20, -373897302); o = md5_gg(o, n, m, l, p[g + 5], 5, -701558691); l = md5_gg(l, o, n, m, p[g + 10], 9, 38016083); m = md5_gg(m, l, o, n, p[g + 15], 14, -660478335); n = md5_gg(n, m, l, o, p[g + 4], 20, -405537848); o = md5_gg(o, n, m, l, p[g + 9], 5, 568446438); l = md5_gg(l, o, n, m, p[g + 14], 9, -1019803690); m = md5_gg(m, l, o, n, p[g + 3], 14, -187363961); n = md5_gg(n, m, l, o, p[g + 8], 20, 1163531501); o = md5_gg(o, n, m, l, p[g + 13], 5, -1444681467); l = md5_gg(l, o, n, m, p[g + 2], 9, -51403784); m = md5_gg(m, l, o, n, p[g + 7], 14, 1735328473); n = md5_gg(n, m, l, o, p[g + 12], 20, -1926607734); o = md5_hh(o, n, m, l, p[g + 5], 4, -378558); l = md5_hh(l, o, n, m, p[g + 8], 11, -2022574463); m = md5_hh(m, l, o, n, p[g + 11], 16, 1839030562); n = md5_hh(n, m, l, o, p[g + 14], 23, -35309556); o = md5_hh(o, n, m, l, p[g + 1], 4, -1530992060); l = md5_hh(l, o, n, m, p[g + 4], 11, 1272893353); m = md5_hh(m, l, o, n, p[g + 7], 16, -155497632); n = md5_hh(n, m, l, o, p[g + 10], 23, -1094730640); o = md5_hh(o, n, m, l, p[g + 13], 4, 681279174); l = md5_hh(l, o, n, m, p[g + 0], 11, -358537222); m = md5_hh(m, l, o, n, p[g + 3], 16, -722521979); n = md5_hh(n, m, l, o, p[g + 6], 23, 76029189); o = md5_hh(o, n, m, l, p[g + 9], 4, -640364487); l = md5_hh(l, o, n, m, p[g + 12], 11, -421815835); m = md5_hh(m, l, o, n, p[g + 15], 16, 530742520); n = md5_hh(n, m, l, o, p[g + 2], 23, -995338651); o = md5_ii(o, n, m, l, p[g + 0], 6, -198630844); l = md5_ii(l, o, n, m, p[g + 7], 10, 1126891415); m = md5_ii(m, l, o, n, p[g + 14], 15, -1416354905); n = md5_ii(n, m, l, o, p[g + 5], 21, -57434055); o = md5_ii(o, n, m, l, p[g + 12], 6, 1700485571); l = md5_ii(l, o, n, m, p[g + 3], 10, -1894986606); m = md5_ii(m, l, o, n, p[g + 10], 15, -1051523); n = md5_ii(n, m, l, o, p[g + 1], 21, -2054922799); o = md5_ii(o, n, m, l, p[g + 8], 6, 1873313359); l = md5_ii(l, o, n, m, p[g + 15], 10, -30611744); m = md5_ii(m, l, o, n, p[g + 6], 15, -1560198380); n = md5_ii(n, m, l, o, p[g + 13], 21, 1309151649); o = md5_ii(o, n, m, l, p[g + 4], 6, -145523070); l = md5_ii(l, o, n, m, p[g + 11], 10, -1120210379); m = md5_ii(m, l, o, n, p[g + 2], 15, 718787259); n = md5_ii(n, m, l, o, p[g + 9], 21, -343485551); o = safe_add(o, j); n = safe_add(n, h); m = safe_add(m, f); l = safe_add(l, e) } return Array(o, n, m, l) } function md5_cmn(h, e, d, c, g, f) { return safe_add(bit_rol(safe_add(safe_add(e, h), safe_add(c, f)), g), d) } function md5_ff(g, f, k, j, e, i, h) { return md5_cmn((f & k) | ((~f) & j), g, f, e, i, h) } function md5_gg(g, f, k, j, e, i, h) { return md5_cmn((f & j) | (k & (~j)), g, f, e, i, h) } function md5_hh(g, f, k, j, e, i, h) { return md5_cmn(f ^ k ^ j, g, f, e, i, h) } function md5_ii(g, f, k, j, e, i, h) { return md5_cmn(k ^ (f | (~j)), g, f, e, i, h) } function safe_add(a, d) { var c = (a & 65535) + (d & 65535); var b = (a >> 16) + (d >> 16) + (c >> 16); return (b << 16) | (c & 65535) } function bit_rol(a, b) { return (a << b) | (a >>> (32 - b)) };

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
        position = position || 0;
        return this.indexOf(searchString, position) === position;
    };
}


function genNonce(b) { var c = [], e = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", a = e.length; for (var d = 0; d < b; ++d) { c.push(e[Math.random() * a | 0]) } return c.join("") };
// Parse the parameters (check existence and validity) and extract the values. 
// Note that quoted-string values can be folded, so you need to unfold them with this function                  
function unq(quotedString) {
    if (quotedString.startsWith("\'") || quotedString.startsWith("\"")) {
        return quotedString.substr(1, quotedString.length - 2).replace(/(?:(?:\r\n)?[ \t])+/g, " ");
    } else {
        // actually unquoted
        return quotedString.replace(/(?:(?:\r\n)?[ \t])+/g, " ");
    }
}
/**
 * backend proxy for requests to tvheadend as they are
 * not possible from browser due to cors restrictions
 */
service.register("proxy", function (message) {
    /** local node js mock setup 
        function MockMessage() {};
        MockMessage.prototype.respond = function(object) {
            console.log("MockMessage: ",object);
        }
        var message = new MockMessage();
        var url = "http://userver.fritz.box:9981/api/serverinfo",
            user = "webos",
            password = "webos3583";
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
    var protocolHandler = (options.protocol === 'https:' ? https : http)
    var req = protocolHandler.request(options, function (resp) {
        var data = '';
        // handle http status unauthorized only if did not already tried to authorize
        if (resp.statusCode == 401 && (options.headers === undefined || options.headers.Authorization === undefined)) {
            var authHeader = resp.headers["www-authenticate"];
            handleAuthentication(options, user, password, authHeader, message);
        } else if (resp.statusCode < 200 || resp.statusCode > 299) {
            // return error in case of unexpected status code
            message.respond({
                "returnValue": false,
                "errorText": "Server answered with StatusCode " + resp.statusCode,
                "errorCode": 1
            });
            //console.log(resp.statusCode, resp);
        } else {
            // A chunk of data has been recieved.
            resp.on('data', function (chunk) {
                data += chunk;
            });
            // The whole response has been received. Print out the result.
            resp.on('end', function () {
                // todo handle no json
                message.respond({
                    "returnValue": true,
                    "result": JSON.parse(data)
                });
            });
        }
    }).on("error", function (err) {
        console.log("error:", err.message);
        message.respond({
            "returnValue": false,
            "errorText": err.message,
            "errorCode": 1
        });
    }).on("socket", function (socket) {
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
    if (type == "Digest") {
        authorizationHeader = digestAuth(options, user, password, tokens);
    } else if (type == "BASIC") {
        authorizationHeader = basicAuth(user, password);
    } else {
        message.respond({
            "returnValue": false,
            "errorText": "Unsupported authentication type "+type,
            "errorCode": 1
        });
        return;
    }
    options.headers = options.headers || {};
    options.headers.Authorization = authorizationHeader;

    console.log("auth options:", options);
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
    return "Basic " + Buffer.from(user + ":" + password).toString("base64");
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
        if (value.match("nonce")) nonce = unq(value.substring(value.indexOf('=') + 1));
        if (value.match("realm")) realm = unq(value.substring(value.indexOf('=') + 1));
        if (value.match("qop")) qop = unq(value.substring(value.indexOf('=') + 1));
    };
    //console.log("process digest:", nonce);
    var cnonce = genNonce(20); // opaque random string value provided by the client
    var nc = 0;
    /*
    * HA1 = MD5(USER:REALM:PASS) --> john:your.realm:pass
    */
    var HA1 = hex_md5(user + ":" + realm + ":" + password);

    /*
        * HA2 = MD5(METHOD:URI)--> GET:your.realm
        */
    var HA2 = hex_md5(options.method + ":" + options.path);

    /*
        * response = digest = MD5(HA1 + ":" + NONCE + ":" + NC + ":" + CNONCE + ":" + QOP + ":" + HA2);
        */
    var res = hex_md5(HA1 + ":" + nonce + ":" + nc + ":" + cnonce + ":" + qop + ":" + HA2);

    /*
    *  Authorization header:
    *
    *  Authorization:  Digest username="John", realm="your.realm", 
                    nonce="k7KYbGJOCIw4RAK0IcaUQsYszXwsJGOU", uri="/", 
                    cnonce="MDAwODM0", nc=00000001, qop="auth", 
                    response="77f88f3f6b4623eedf17af206098ebf8"
    */
    var header = 'Digest username="' + user + '", realm="' + realm
        + '", nonce="' + nonce + '", uri="' + options.path + '", cnonce="'
        + cnonce + '", nc="' + nc + '", qop="' + qop + '", response="'
        + res + '"';

    return header;
}