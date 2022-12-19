
let displayMiliseconds = "0";
let displaySeconds = "0";
let displayMinutes = "0";
let interval = null;
let stopwatch_status = "stopped";

let gameTime = {
    miliSeconds: 0,
    seconds: 0,
    minutes: 0
}

function compareTime(currentTime, savedTime){
    console.log(currentTime.seconds + "   > " + savedTime.minutes);
    const savedTimeTotal = (savedTime.miliSeconds) + (savedTime.seconds * 1000) + (savedTime.minutes * 60 * 1000);
    const currentTimeTotal = (currentTime.miliSeconds) + (currentTime.seconds * 1000) + (currentTime.minutes * 60 * 1000);
    console.log("tave is: ")
    console.log(savedTimeTotal - currentTimeTotal);
    return savedTimeTotal - currentTimeTotal
}

function getTimeString(time){
    let millText = "0";
    let secText = "0";
    let minText = "0";

    if (time.miliSeconds / 60 === 1) {
        time.miliSeconds = 0;
        time.seconds++;
    
        if (time.seconds / 60 === 1) {
            time.seconds = 0;
            time.minutes++;
        }
      }

      console.log(time.miliSeconds);
    
      if (time.miliSeconds < 10) {
        millText = "0" + time.miliSeconds.toString();
      } else {
        millText = time.miliSeconds.toString();
      }
    
      if (time.seconds < 10) {
        secText = "0" + time.seconds.toString();
      } else {
        secText = time.seconds.toString();
      }
    
      if (gameTime.minutes < 10) {
        minText = "0" + time.minutes.toString();
      } else {
        minText = time.minutes.toString();
      }
      return minText + ":" + secText + ":" + millText;
}


function updateStopwatch() {
  gameTime.miliSeconds++;

  if (gameTime.miliSeconds / 60 === 1) {
    gameTime.miliSeconds = 0;
    gameTime.seconds++;

    if (gameTime.seconds / 60 === 1) {
        gameTime.seconds = 0;
        gameTime.minutes++;
    }
  }

  if (gameTime.miliSeconds < 10) {
    displayMiliseconds = "0" + gameTime.miliSeconds.toString();
  } else {
    displayMiliseconds = gameTime.miliSeconds.toString();
  }

  if (gameTime.seconds < 10) {
    displaySeconds = "0" + gameTime.seconds.toString();
  } else {
    displaySeconds = gameTime.seconds.toString();
  }

  if (gameTime.minutes < 10) {
    displayMinutes = "0" + gameTime.minutes.toString();
  } else {
    displayMinutes = gameTime.minutes.toString();
  }
//   console.log("STOPWATCH")
  textStopwach = displayMinutes + ":" + displaySeconds + ":" + displayMiliseconds;
}

// function startStop() {
//   if (stopwatch_status === "stopped") {
//     interval = window.setInterval(updateStopwatch, 1000);
//     document.getElementById("startStop").innerHTML = "Stop";
//     stopwatch_status = "started";
//   } else {
//     window.clearInterval(interval);
//     document.getElementById("startStop").innerHTML = "Start";
//     stopwatch_status = "stopped";
//   }
// }

function reset() {
//   window.clearInterval(interval);
  gameTime.miliSeconds = 0;
  gameTime.seconds = 0;
  gameTime.minutes = 0;
}