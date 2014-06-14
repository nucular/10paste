// web.js
var fs = require("fs");
var path = require("path");

var express = require("express");
var logfmt = require("logfmt");
var mime = require("mime");


// Locals
var pastes = {}; // maps paste ID => creation time


// Clean up pastes
fs.readdirSync(path.join(__dirname, "pastes")).forEach(function(file) {
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
app.get(/^\/([a-b0-9]{1,2})(\.\w+)?\/?$/, function(req, res) {
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

  // find the first free ID until zz
  for (var i = 0; i < 1295; i++) {
    id = i.toString(36);
    if (!pastes.hasOwnProperty(id))
      break;
  }

  if (!id) {
    res.redirect("/public/error.html");
  }

  var file = path.join(__dirname, "pastes",  id);

  // Write to a file
  fs.writeFile(file, data, "utf8", function(err) {
    if (err) {
      res.redirect("/public/error.html");
    }
    else {
      pastes[id] = new Date();
      res.redirect("/" + id + ".txt");
    }
  });
});


// Serves 404 page if no other route applied
app.get("*", function(req, res) {
  res.status(404).sendfile(path.join(__dirname, "public", "404.html"));
});


var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});
