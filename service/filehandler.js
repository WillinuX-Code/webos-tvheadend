const fs = require('fs');

exports.handleFileIO = handleFileIO;
/**
 * Read or write file to disk
 * 
 * @param {*} message 
 */
function handleFileIO(message) {
    if (message.payload.write) {
        fs.writeFile(message.payload.filename, JSON.stringify(message.payload.data), function (err) {
            if (err) {
                message.respond({
                    returnValue: false,
                    errorText: "failed to write file: " + err.message,
                    errorCode: err.code,
                });
                return;
            }
            message.respond({
                returnValue: true,
            });
        });
    }

    if (message.payload.read) {
        fs.readFile(message.payload.filename, function (err, data) {
            if (err) {
                message.respond({
                    returnValue: false,
                    errorText: "failed to read file: " + err.message,
                    errorCode: err.code,
                });
                return;
            }
            message.respond({
                returnValue: true,
                result: JSON.parse(data)
            });
        });
    }

}
