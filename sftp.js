var Connection = require('ssh2');

var sftp = function() {
    var c = new Connection();
    var sftp_key = "/home/admin/.ssh/sftp_key";
    var ip;

    var connect = function(ipAddress) {
        ip = ipAddress;
    };

    var upload = function(tempFilename, filename, next) {
        c.on('ready', function() {
            console.log('Connection :: ready');

            c.sftp(function(err, sftp) {
                if (err) throw err;

                sftp.fastPut(tempFilename, filename, function(err) {
                    if (err) {
                        console.log("upload of file failed. " + ip);
                        next(err);
                    } else {
                        console.log("upload of file succeeded: " + ip);
                        next();
                    }
                });

                sftp.on('end', function() {
                    console.log('SFTP :: SFTP session closed');
                });

                sftp.close();
            });
        });

        c.on('error', function(err) {
            console.log('Connection :: error :: ' + err);
        });

        c.on('end', function() {
            console.log('Connection :: end');
        });

        c.on('close', function() {
            console.log('Connection :: close');
        });

        c.connect({
            host: ip,
            port: 22,
            username: 'singular_user',
            privateKey: require('fs').readFileSync(sftp_key)
        });
    };

    return {
        connect: connect,
        upload: upload
    }
};

exports.sftp = sftp;
