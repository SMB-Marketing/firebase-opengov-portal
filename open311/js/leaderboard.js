$(function() {
  var LEADERBOARD_SIZE = 5;

  // Build some firebase references.
  //var rootRef = new Firebase("https://open311.firebaseio.com/leaderboard");
  var rootRef = new Firebase("https://open311.firebaseio.com");
  var scoreListRef = rootRef.child("nyc");
  var highestScoreRef = rootRef.child("highestScore");

  // Keep a mapping of firebase locations to HTML elements, so we can move / remove elements as necessary.
  var htmlForPath = {};

function traverse(x, level) {
  if (isArray(x)) {
    traverseArray(x, level);
  } else if ((typeof x === 'object') && (x !== null)) {
    traverseObject(x, level);
  } else {
    console.log('leaf:' + level + x);
  }
}

function isArray(o) {
  return Object.prototype.toString.call(o) === '[object Array]';
}

function traverseArray(arr, level) {
  console.log(level + "<array>");
  arr.forEach(function(x) {
    traverse(x, level + "  ");
  });
}

function traverseObject(obj, level) {
  console.log(level + "<object>");
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      console.log(level + "  " + key + ":");
      traverse(obj[key], level + "    ");
    }
  }
}


  // Helper function that takes a new score snapshot and adds an appropriate row to our leaderboard table.
  function handleScoreAdded(scoreSnapshot, prevScoreName) {
    var newScoreRow = $("<tr/>");
    newScoreRow.append($("<td/>").text(scoreSnapshot.val().name));
    newScoreRow.append($("<td/>").text(scoreSnapshot.val().score));

    // Store a reference to the table row so we can get it again later.
    htmlForPath[scoreSnapshot.key()] = newScoreRow;

    // Insert the new score in the appropriate place in the table.
    if (prevScoreName === null) {
      $("#leaderboardTable").append(newScoreRow);
    }
    else {
      var lowerScoreRow = htmlForPath[prevScoreName];
      lowerScoreRow.before(newScoreRow);
    }
  }

  // Helper function to handle a score object being removed; just removes the corresponding table row.
  function handleScoreRemoved(scoreSnapshot) {
    var removedScoreRow = htmlForPath[scoreSnapshot.key()];
    removedScoreRow.remove();
    delete htmlForPath[scoreSnapshot.key()];
  }

  // Create a view to only receive callbacks for the last LEADERBOARD_SIZE scores
  var scoreListView = scoreListRef.limitToLast(LEADERBOARD_SIZE);

  // Add a callback to handle when a new score is added.
  //console.log('value');

    var searchfor='SUSPENDED';
    //var searchfor='ON SCHEDULE';
   //scoreListRef
for (var i=0; i<30; i++){
   rootRef.child('nyc/items/' +i+ '/items')
    //.startAt(searchfor)
    //.endAt(searchfor)
    .orderByChild('status')
    .equalTo(searchfor)
    .on('value', function(snap) {
       if (snap.val() !== null){
       console.log('matching SUSPENDED:', snap.ref().parent().name());
       snap.ref().parent().once('value', function(snap2){
       console.log('snap2', snap2.val());
       var obj2 = {'date':snap2.val(), 'data': snap.val()}
        //const formatter = new JSONFormatter(snap.val(), 100);  // expand 100 level deep
        const formatter = new JSONFormatter(obj2, 100);  // expand 100 level deep
    var x = document.querySelector('#data-suspended');
    var xChildren =x.childNodes;
        x.appendChild(formatter.render());
       });
       //console.log('matching SUSPENDED:', JSON.stringify(snap.val()));

        }
    });
}

  scoreListView.on("value", function (newScoreSnapshot) {
    //console.log(newScoreSnapshot.val());
    var obj1 = newScoreSnapshot.val();

    //traverse(obj1,'');

    const formatter = new JSONFormatter(obj1, 100);  // expand 100 level deep

    //document.body.appendChild(formatter.render());
    //document.querySelector('#data').innerHTML=formatter.render();
    //document.querySelector('#data').replaceChild(formatter.render());

    var x = document.querySelector('#data');
    var xChildren =x.childNodes;
    if (xChildren[0])
        x.replaceChild(formatter.render(), xChildren[0]);
    else
        x.appendChild(formatter.render());


    //console.log('child_added', JSON.stringify(newScoreSnapshot.val()));
    //handleScoreAdded(newScoreSnapshot, prevScoreName);
  });

  // Add a callback to handle when a score is removed
  scoreListView.on("child_removed", function (oldScoreSnapshot) {
    //handleScoreRemoved(oldScoreSnapshot);
  });

  // Add a callback to handle when a score changes or moves positions.
  var changedCallback = function (scoreSnapshot, prevScoreName) {
    handleScoreRemoved(scoreSnapshot);
    handleScoreAdded(scoreSnapshot, prevScoreName);
  };
  scoreListView.on("child_moved", changedCallback);
  scoreListView.on("child_changed", changedCallback);

  // When the user presses enter on scoreInput, add the score, and update the highest score.
  $("#scoreInput").keypress(function (e) {
    if (e.keyCode == 13) {
      var newScore = Number($("#scoreInput").val());
      var name = $("#nameInput").val();
      $("#scoreInput").val("");

      if (name.length === 0)
        return;

      var userScoreRef = scoreListRef.child(name);

      // Use setWithPriority to put the name / score in Firebase, and set the priority to be the score.
      userScoreRef.setWithPriority({ name:name, score:newScore }, newScore);

      // Track the highest score using a transaction.  A transaction guarantees that the code inside the block is
      // executed on the latest data from the server, so transactions should be used if you have multiple
      // clients writing to the same data and you want to avoid conflicting changes.
      highestScoreRef.transaction(function (currentHighestScore) {
        if (currentHighestScore === null || newScore > currentHighestScore) {
          // The return value of this function gets saved to the server as the new highest score.
          return newScore;
        }
        // if we return with no arguments, it cancels the transaction.
        return;
      });
    }
  });

  // Add a callback to the highest score in Firebase so we can update the GUI any time it changes.
  highestScoreRef.on("value", function (newHighestScore) {
    $("#highestScoreDiv").text(newHighestScore.val());
  });
});

