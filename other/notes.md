when tourney.js updated, obs didnt' update automatically. 

tournament name is in the tourney.js file.

notes from josh g:

  put a plus sign on the spread on the under cam

  the last 5 games doesn't say if its a win or a loss. it should be right before "vs"
  game score and win/or loss should be red on a win, blue on a loss.
  5) 390-425 Loss vs Chris Skyes

  for standings:
    can we make the text bold? 
    can we add one one more space between 442.3 (2nd)    =>  442.3  (2nd)
    or make multiple columns for this like in josh's screenshot. (in email)

  padding on the standings at the top of the report. theres no room at all on top. maybe add 20 pixels.

  when there are no games, spread says NA, but lets make it say +0 instead. 


==== dec 30th 2024 ====

notes for games table

first we actually need a players table with:
* a player id (auto generated)
* player name

then a games table with
* tournament id
* round id
* player 1 id
* player 1 rating (before game)
* player 1 score
* player 1 first move (boolean)
* player 1 rank (in tournament at the time of the game)
* player 2 id
* player 2 rating (before game)
* player 2 score
* player 2 first move (boolean)
* player 2 rank (in tournament at the time of the game)
* a check that player1First xor player2First == true
