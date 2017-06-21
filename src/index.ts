let mathProgram : string = "Macaulay2";
let mode : string = "docker";
const args : string[] = process.argv;
const n : number = args.length;

if (n > 2) {
  mathProgram = args[2];
}

if (n > 3) {
  mode = args[3];
}

if (n > 4) {
  console.log("Too many options");
  process.exit(0);
}

// Dirname is src/dist.
import p = require("path"); // eslint-disable-line  no-undef
const path = p.join(__dirname, "/startupConfigs/"); // eslint-disable-line  no-undef

if (mathProgram === "Macaulay2" || mathProgram === "M2") {
  if (mode === "local") {
    require(path + "Macaulay2LocalServer");
  } else if (mode === "docker") {
    require(path + "Macaulay2SudoDocker");
  } else if (mode === "ssh") {
    require(path + "Macaulay2SshDocker");
  } else {
    console.log("There is no mode " + mode);
  }
} else if (mathProgram === "Singular") {
  if (mode === "local") {
    require(path + "SingularLocalServer");
  } else if (mode === "docker") {
    require(path + "SingularSudoDocker");
  } else if (mode === "ssh") {
    require(path + "SingularSshDocker");
  } else {
    console.log("There is no mode " + mode);
  }
} else {
  console.log("Did not recognize math program " + mathProgram);
}
