// web.js
var fs = require("fs");
var path = require("path");

var express = require("express");
var logfmt = require("logfmt");
var mime = require("mime");


// Locals
var pastes = {}; // maps paste ID => minutes since creation


// Clean up pastes
fs.readdirSync(path.join(__dirname, "pastes")).forEach(function(file) {
  console.log("Deleting paste '" + file + "' (Paste clearing)");
  fs.unlinkSync(path.join(__dirname, "pastes", file));
});


// Initiate
var app = express();

// middleware
app.use(logfmt.requestLogger()); // logfmt
app.use(express.urlencoded()); // support URL-encoded bodies


// Serves the main page
app.get("/", function(req, res) {
  res.sendfile(path.join(__dirname, "public",  "index.html"));
});

// Serves other public files
app.get("/public/:file", function(req, res) {
  var file = req.params.file;

  // MIME type handling
  var type = mime.lookup(file, "");
  if (!res.getHeader("content-type") && type != "") {
    var charset = mime.charsets.lookup(type);
    res.setHeader("Content-Type", type + (charset ? "; charset=" + charset : ""));
  }

  // Send the file
  res.sendfile(path.join(__dirname, "public", file), function(err) {
    if (err) {
      res.setHeader("Content-Type", "text/html");
      res.status(404).sendfile(path.join(__dirname, "public", "404.html"));
    }
  });
});


// Serves a paste
var re = new RegExp("^\\/([a-z0-9]{1," + (process.env.IDLENGTH || "2") + "})(\\.\\w+)?\\/?$");
app.get(re, function(req, res) {
  var file = req.params[0];
  var ext = req.params[1];

  // MIME type handling
  var type = mime.lookup(ext, "");
  if (!res.getHeader("content-type") && type != "") {
    var charset = mime.charsets.lookup(type);
    res.setHeader("Content-Type", type + (charset ? "; charset=" + charset : ""));
  }

  // Send the file
  res.sendfile(path.join(__dirname, "pastes", file), {}, function(err) {
    if (err) {
      res.setHeader("Content-Type", "text/html");
      res.status(404).sendfile(path.join(__dirname, "public", "404.html"));
    }
  });
});

// Posts a paste
app.post("/post", function(req, res) {
  var data = req.body.data;
  var id;

  // find the first free ID
  for (var i = 0; i < Math.pow(36, process.env.IDLENGTH || 2); i++) {
    var nid = i.toString(36);
    if (!pastes.hasOwnProperty(nid) || pastes[nid] === null) {
      id = nid;
      break;
    }
  }

  if (!id) {
    console.log("Paste limit reached!");
    res.redirect("/public/error.html");
    return;
  }

  var file = path.join(__dirname, "pastes",  id);

  // Write to a file
  console.log("Added paste '" + id + "'");
  fs.writeFile(file, data, "utf8", function(err) {
    if (err) {
      console.log("Failed writing paste '" + id + "': " + err);
      res.redirect("/public/error.html");
    }
    else {
      pastes[id] = 0;
      console.log("Succeeded writing paste '" + id + "'");
      res.redirect("/" + id + ".txt");
    }
  });
});


// Serves 404 page if no other route applied
app.get("*", function(req, res) {
  res.status(404).sendfile(path.join(__dirname, "public", "404.html"));
});


// Delete too old pastes every minute
setInterval(function() {
  for (var k in pastes) {
    if (pastes.hasOwnProperty(k)) {
      if (pastes[k] >= (process.env.MAXAGE || 10)) {
        console.log("Deleting paste '" + k + "' (" + pastes[k] + " minutes old)");
        pastes[k] = null;
        fs.unlink(path.join(__dirname, "pastes", k), function(err) {
          if (err)
            console.log("Failed deleting paste: " + err);
        });
      }
      else if (pastes[k] !== null) {
        pastes[k]++;
      }
    }
  }
}, 1000 * 60);


var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});
