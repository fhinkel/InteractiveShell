import {Client} from "./client";
import {Clients} from "./client";


const currentUsers = function(clients: Clients): number {
  return Object.keys(clients).length;
};

let totalUsers;

module.exports = function(clients: Clients, total: number, program: string) {
  totalUsers = total;
  const stats = function(request, response): void {
    response.writeHead(200, {
      "Content-Type": "text/html",
    });

    const htmlString: string =
`<head>
    <link rel="stylesheet" href="mathProgram.css" type="text/css"
        media="screen">
</head>
<h1>
    ${program} User Statistics
</h1>
There are currently ${currentUsers(clients)} users using ${program}.
<br>
In total, there were ${totalUsers} new users since
 the server started.
<br>
Enjoy ${program}!`;

    response.write(htmlString);
    response.end();
  };

  return {
    stats,
  };
};
