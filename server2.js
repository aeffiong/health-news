var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/greatistscraper");

// Routes

// A GET route for scraping
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  axios.get("https://greatist.com/").then(function(response) {
      // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);
    // grab all the class = desc from the html
    $("div.desc").each(function(i, element) {
        // An empty object to save the data that we'll scrape
        var result = {};

        result.title = $(this).children().children().html(); 
        result.link = $(this).children().children().attr("href");
        result.description = $(this).find($(".blurb-cta-wrapper")).text();

         // Log the results once you've looped through each of the elements found with cheerio
        console.log(result);

      // Create a new Article using the `result` object built from scraping
      db.Article.create({result}, {unique:true})
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          return res.json(err);
        });
    });

    // If we were able to successfully scrape and save an Article, send a message to the client
    res.send("Scrape Complete");
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  db.Article.find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  db.Article.findOne({ _id: req.params.id })
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  console.log("this is " + req.body.title);
  console.log("this is " + req.body.body);
  db.Note.create(req.body)
    .then(function(dbNote) {
      console.log(dbNote);
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true })
      .then(function(dbArticle) {
        console.log(dbArticle);
        
        res.json(dbArticle);
      });
    })

    .catch(function(err) {
      res.json(err);
    });
});

// Route for deleting an Article's associated Note
app.delete("/articles/delete/:id", function(req, res) {
  console.log("this is " + req.body.title);
  console.log("this is " + req.body.body);
  db.Note.findOneAndDelete({"_id": req.params.note_id})
    .then(function(dbNote) {
      console.log(dbNote);
      return db.Note.findOneAndDelete({ _id: req.params.id }, { note: dbNote._id }, { new: true })
      .then(function(dbArticle) {
        console.log(dbArticle);
        
        res.send("Note Deleted");
    });
  })
  
  .catch(function(err) {
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
