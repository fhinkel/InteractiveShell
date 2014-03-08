var Connection = require('ssh2');

var c = new Connection();
c.on('ready', function() {
    console.log('Connection :: ready');
    c.sftp(function(err, sftp) {
        if (err) throw err;
        sftp.on('end', function() {
            console.log('SFTP :: SFTP session closed');
        });
        sftp.opendir('.', function readdir(err, handle) {
            if (err) throw err;
            sftp.readdir(handle, function(err, list) {
                if (err) throw err;
                if (list === false) {
                    sftp.close(handle, function(err) {
                        if (err) throw err;
                        console.log('SFTP :: Handle closed');
                        sftp.end();
                    });
                    return;
                }
                console.dir(list);
                readdir(undefined, handle);
            });
        });
    });
});
c.on('error', function(err) {
    console.log('Connection :: error :: ' + err);
});
c.on('end', function() {
    console.log('Connection :: end');
});
c.on('close', function(had_error) {
    console.log('Connection :: close');
});
c.connect({
    host: '192.168.0.107',
    port: 3737,
    username: 'admin',
    privateKey: require('fs').readFileSync('/Users/franzi/.ssh/id_rsa')
});