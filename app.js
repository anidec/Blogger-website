const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const _ = require("lodash");
var session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const { stringify } = require("querystring");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
  secret: "our little secret",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb+srv://admin-animesh:animesh123@cluster0.pqqwb.mongodb.net/blogDB", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true);

const postSchema = new mongoose.Schema({
  email: String,
  password: String,
  title: String,
  content: String,
  content1: [{
    type: String
  }]
});
postSchema.plugin(passportLocalMongoose);
const Post = new mongoose.model("Post", postSchema);
passport.use(Post.createStrategy());
passport.serializeUser(Post.serializeUser());
passport.deserializeUser(Post.deserializeUser());

app.get("/", function (req, res) {
  Post.find({ "content": { $ne: null } }, function (err, posts) {
    res.render("home", {
      homeStartingContent: posts.title,
      posts: posts
    });
  });

})
/* app.get("/about", function (req, res) {
  res.render("about", { aboutContent: aboutContent });
}); */
/* app.get("/contact", function (req, res) {
  res.render("contact", { contactContent: contactContent });
}) */
app.get("/compose", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("compose");
  }
  else {
    res.redirect("/login");
  }
})
app.post("/compose", function (req, res) {

  /*  const post = new Post({
     title: req.body.postTitle,
     content: req.body.postBody
   }); */
  const submittedContent = req.body.postBody;
  const submittedTitle = req.body.postTitle;
  Post.findById(req.user.id, function (err, foundUser) {
    if (err)
      console.log(err);
    else {
      if (foundUser) {
        foundUser.content1.push(submittedContent);
        foundUser.content = submittedContent;
        foundUser.title = submittedTitle;
        foundUser.save(function () {
          res.redirect("/");
        })
      }
    }
  })
})
app.post("/register", function (req, res) {
  Post.register({ username: req.body.username }, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    }
    else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/compose");
      })
    }
  })
})
app.post("/login", function (req, res) {
  const user = new Post({
    username: req.body.username,
    password: req.body.password
  })
  req.login(user, function (err) {
    if (err)
      console.log(err);
    else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/compose");
      })
    }
  })
})
app.get("/posts/:postId", function (req, res) {
  const requestedPostId = req.params.postId;
  Post.findOne({ _id: requestedPostId }, function (err, post) {
    if (!err) {
      res.render("post", {
        title: post.title,
        content: post.content
      });
    }
    else
      console.log("not found");

  });

});

app.get("/login", function (req, res) {
  res.render("login");
});
app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
})
app.get("/register", function (req, res) {
  res.render("register");
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});
