// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
// Require request and cheerio. This makes the scraping possible
var request = require("request");
var cheerio = require("cheerio");

var PORT = 8080;

// Require all models
var db = require("./models");

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
mongoose.connect("mongodb://localhost/greatistdb");

// Set Handlebars.
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Routes
// a GET route to the home page
app.get("/", function (req, res) {
        res.render("index");
});

// A GET route for scraping the Greatist website
app.get("/scrape", function(req, res) {
    // First, we grab the body of the html with request
    request("https://greatist.com/", function(error, response, html) {
      // Then, we load that into cheerio and save it to $ for a shorthand selector
      var $ = cheerio.load(html);
        // grab all the class = desc from the html
        $("div.desc").each(function(i, element) {
            // An empty object to save the data that we'll scrape
            var results = {};

            results.link = $(this).children().children().attr("href");
            results.title = $(this).children().children().html(); 
            results.description = $(this).find($(".blurb-cta-wrapper")).text();

             // Log the results once you've looped through each of the elements found with cheerio
            console.log(results);
         
        // Create a new Article using the `results` object built from scraping
        db.Article.create(results)
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

// Route for getting all Articles from the db - not currently working
app.get("/articles", function(req, res) {
    db.Article.find({}), function(err, articles) {
        if (err) {
            return err;
            console.log(err);
        } else {
            res.json(articles);
        }
    }
  });
  
  // Route for grabbing a specific Article by id, populate it with it's note
  app.get("/articles/:id", function(req, res) {
    // TODO
    // ====
    // Finish the route so it finds one article using the req.params.id,
    // and run the populate method with "note",
    // then responds with the article with the note included
  });
  
  // Route for saving/updating an Article's associated Note
  app.post("/articles/:id", function(req, res) {
    // TODO
    // ====
    // save the new note that gets posted to the Notes collection
    // then find an article from the req.params.id
    // and update it's "note" property with the _id of the new note
  });
  


// Start the server
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });