let mathProgram : string = "Macaulay2";
let mode : string = "docker";
const args : string[] = process.argv;
const n : number = args.length;
import fs = require("fs");
import {AuthOption} from "./lib/enums";

import {options, overrideDefaultOptions} from "./startupConfigs/default";

if (n > 2) {
  mathProgram = args[2];
}

if (n > 3) {
  mode = args[3];
}

if (n > 4) {
  console.log("Too many options");
  usage();
  process.exit(0);
}

function usage() : void {
  console.log("Usage: index.js {Macaulay2|Singular} {local|docker|ssh}");
}

// Dirname is src/dist.
import p = require("path"); // eslint-disable-line  no-undef
const path = p.join(__dirname, "/startupConfigs/"); // eslint-disable-line  no-undef

if (mathProgram === "--help") {
  usage();
  process.exit(0);
}

var overrideOptions;
if (mathProgram === "Macaulay2" || mathProgram === "M2") {
  if (mode === "local") {
    overrideOptions = require(path + "Macaulay2LocalServer");
  } else if (mode === "docker") {
    overrideOptions = require(path + "Macaulay2SudoDocker");
  } else if (mode === "ssh") {
    overrideOptions = require(path + "Macaulay2SshDocker");
  } else {
    console.log("There is no mode " + mode);
  }
} else if (mathProgram === "Singular" || mathProgram === "singular") {
  if (mode === "local") {
    overrideOptions = require(path + "SingularLocalServer");
  } else if (mode === "docker") {
    overrideOptions = require(path + "SingularSudoDocker");
  } else if (mode === "ssh") {
    overrideOptions = require(path + "SingularSshDocker");
  } else {
    console.log("There is no mode " + mode);
  }
} else {
  console.log("Did not recognize math program " + mathProgram);
}

overrideDefaultOptions(overrideOptions.options, options);
console.log("Done reading options.");


// This starts the main server!

const fileExistsPromise = function(filename) {
  return new Promise(function(resolve) {
    fs.access(filename, fs.constants.R_OK, function(err) {
      resolve(!err);
    });
  });
};

fileExistsPromise("public/users.htpasswd")
.then(function(exists) {
  if (exists) {
    overrideOptions.authentication = AuthOption.basic;
  } else {
    overrideOptions.authentication = AuthOption.none;
  }
})
.then(function() {
  const MathServer = require("./lib/server").mathServer(options);
  MathServer.listen();
})
.catch(function(err) {
  console.log(err);
});
