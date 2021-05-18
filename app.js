//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin:testtest@cluster0.eez5d.mongodb.net/fightListDB", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify : true});

const today = date.getDate();

const gameSchema = {
  category : String,
  code : String
}

const Game = mongoose.model("Game", gameSchema);

const itemsSchema = {
  item  : String
}

const Item = mongoose.model("Item", itemsSchema);

const playerBoardSchema = {
  gameCode : String,
  player: String,
  items : [itemsSchema]
};

const Board = mongoose.model("Board", playerBoardSchema);

const unCheck = new Item ({item : "<-- Click on this box to remove an item"})

const defaultItems = [unCheck];

app.get("/", function(req,res){
    Game.find({}, function(err, gameBoard){
      if(!err){
        res.render("main", {activeGames : gameBoard});
      } else{
        console.log(err);
      }
    });
});

app.post("/newGame", function(req, res){
  const newCategory = req.body.newGameCategory;
  const random = Math.floor(Math.random() * 234);
  const newCode = "FightList_"+ newCategory.substr(0,3) +"_"+random;

  const dbItem = new Game({
    category : newCategory,
    code : newCode
  });
  dbItem.save();
  res.redirect("/");
});

app.post("/enterGame", function(req, res){
  const code= req.body.gameCode;
  const username = req.body.username;

  Game.findOne({code : code} , function(err, game){
      if(!game){
        console.log("!Not available");
        res.redirect("/");
      }
      else{
        Board.findOne({gameCode : code, player: username} , function(err, playerBoard){
          if(!playerBoard){
            const dbItem = new Board ({
              gameCode : code,
              player : username,
              items : defaultItems
            });
            dbItem.save();
          }

          res.redirect("/boards/"+code+"/"+username);
        });
      }
  });

});

app.get("/boards/:code/:username", function(req,res){
  const code = req.params.code;
  const username = req.params.username;

  Board.findOne({gameCode : code, player: username} , function(err, playerBoard){
    if(!err){
      if(!playerBoard){
        res.redirect("/");
      }else{

        Game.findOne({code : code}, function(err, game){
          if(game){
            const category = game.category;
            res.render("list", {day: today, listTitle: username, category : category, gameCode : code, newListItems: playerBoard.items})
          }
        });
      }

    }else{
      console.log(err);
    }
  });
})

app.post("/delete", function(req, res){
  const ID = req.body.checkBox;
  const username = req.body.username;
  const gameCode = req.body.gameCode;

  Board.findOneAndUpdate({gameCode : gameCode, player : username}, {$pull : {items : {_id : ID }} }, { new: true},function(err, foundBoard){
    if(!err){
      res.redirect("/boards/"+gameCode+"/"+username);
    }else{
      console.log(err);
    }
  });
});

app.post("/addItem", function(req, res){
  const itemName = req.body.newItem;
  const username = req.body.username;
  const gameCode = req.body.gameCode;

  const dbItem = new Item ({
    item : itemName
  });

    Board.findOne({gameCode: gameCode, player: username}, function(err, foundBoard){
      if(!err){
        foundBoard.items.push(dbItem);
        foundBoard.save();
      }else{
        console.log(err);
      }
    });
    res.redirect("/boards/"+gameCode+"/"+username);
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT  || 3000, function() {
  console.log("Server started on port 3000");
});
