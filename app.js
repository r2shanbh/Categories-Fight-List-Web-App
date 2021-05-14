//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin:Rakshu11$@cluster0.eez5d.mongodb.net/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

const today = date.getDate();

const itemsSchema = {
  item : String
}

const Item = mongoose.model("Item", itemsSchema);

const listsSchema = {
  name : String,
  items : [itemsSchema]
};

const List = mongoose.model("Lists", listsSchema);

const welcome = new Item ({ item : "The to-do list App"})
const plusButton = new Item ({item : "Hit + button to add new item"})
const unCheck = new Item ({item : "<-- Click on this box to uncheck an item"})

const defaultItems = [welcome, plusButton, unCheck];

app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems){
    if(err){
      console.log(err);
    }else{
      if (foundItems.length == 0){
        Item.insertMany(defaultItems, function(err){
          if (err){
            console.log(err);
          }
        });
        res.redirect("/");
      }
      else{
        res.render("list", {day: today, listTitle: "Today", newListItems: foundItems});
      }
    }
  });

});

app.post("/delete", function(req, res){
  const ID = req.body.checkBox;
  const listName = req.body.listName;

  if (listName == "Today"){
    Item.findByIdAndDelete(ID, function(err, docs){
      if(err){
        console.log(err);
      }
    });
    res.redirect("/");
  }else{
    List.findOneAndUpdate({name: listName}, {$pull : {items : {_id : ID }} }, function(err, foundList){
      if(!err){
        res.redirect("/"+listName);
      }else{
        console.log(err);
      }
    });
  }
});


app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const dbItem = new Item ({
    item : itemName
  });

  if (listName == "Today"){
    dbItem.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, function(err, foundList){
      if(!err){
        foundList.items.push(dbItem);
        foundList.save();
      }else{
        console.log(err);
      }
    });
    res.redirect("/"+listName);
  }
});


app.get("/:customList", function(req,res){
  const listName = _.capitalize(req.params.customList);

  List.findOne({name : listName}, function(err, foundList){
    if(!err){
      if(!foundList){
        const customList = new List ({
          name : listName,
          items : defaultItems
        });
        customList.save();
        res.redirect("/"+listName);
      }else{
        res.render("list", {day: today, listTitle: listName, newListItems: foundList.items})
      }

    }else{
      console.log(err);
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
