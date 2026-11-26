// Set team names and constraints
const teams = [
  {
    name: "Team A (Bottom 3)",
    isBottomThree: true,
    top1Ban: false,
    top5Ban: false,
    balls: 2,
  },
  {
    name: "Team B (Bottom 3)",
    isBottomThree: true,
    top1Ban: false,
    top5Ban: false,
    balls: 2,
  },
  {
    name: "Team C (Bottom 3)",
    isBottomThree: true,
    top1Ban: false,
    top5Ban: false,
    balls: 2,
  },
  {
    name: "Team D",
    isBottomThree: false,
    top1Ban: false,
    top5Ban: false,
    balls: 3,
  },
  {
    name: "Team E",
    isBottomThree: false,
    top1Ban: false,
    top5Ban: false,
    balls: 3,
  },
  {
    name: "Team F",
    isBottomThree: false,
    top1Ban: false,
    top5Ban: false,
    balls: 3,
  },
  {
    name: "Team G",
    isBottomThree: false,
    top1Ban: false,
    top5Ban: false,
    balls: 3,
  },
  {
    name: "Team H",
    isBottomThree: false,
    top1Ban: false,
    top5Ban: false,
    balls: 3,
  },
  {
    name: "Team I",
    isBottomThree: false,
    top1Ban: false,
    top5Ban: false,
    balls: 3,
  },
  {
    name: "Team J",
    isBottomThree: false,
    top1Ban: false,
    top5Ban: true,
    balls: 3,
  },
  {
    name: "Team K",
    isBottomThree: false,
    top1Ban: true,
    top5Ban: false,
    balls: 2,
  },
  {
    name: "Team L",
    isBottomThree: false,
    top1Ban: false,
    top5Ban: false,
    balls: 2,
  },
  {
    name: "Team M",
    isBottomThree: false,
    top1Ban: false,
    top5Ban: false,
    balls: 2,
  },
  {
    name: "Team N",
    isBottomThree: false,
    top1Ban: false,
    top5Ban: false,
    balls: 2,
  },
  {
    name: "Team O",
    isBottomThree: false,
    top1Ban: false,
    top5Ban: false,
    balls: 1,
  },
  {
    name: "Team P",
    isBottomThree: false,
    top1Ban: false,
    top5Ban: false,
    balls: 1,
  },
];

const NUM_SIMULATIONS = 100000;

function runLotterySimulation() {
  let stats = {};
  teams.forEach((t) => {
    stats[t.name] = Array(16).fill(0);
  });

  for (let i = 0; i < NUM_SIMULATIONS; i++) {
    let order = drawLotteryProcess(JSON.parse(JSON.stringify(teams)));
    order.forEach((teamName, index) => {
      stats[teamName][index]++;
    });
  }

  // Print summary
  console.log(
    `Simulation complete: ${NUM_SIMULATIONS.toLocaleString()} runs.\n`,
  );
  console.log("Top 16 Pick Distribution (%):");
  teams.forEach((t) => {
    let name = t.name;
    const result = stats[name]
      .map(
        (item, index) =>
          `${index + 1}${getOrdinal(index + 1)}: ${((stats[name][index] / NUM_SIMULATIONS) * 100).toFixed(2)}`,
      )
      .join(" | ");

    console.log(`${name.padEnd(25)} | ${result}`);
  });
}

function getOrdinal(num) {
  const tens = num % 100;
  if (tens >= 11 && tens <= 13) return num + "th";
  return num + ({ 1: "st", 2: "nd", 3: "rd" }[num % 10] ?? "th");
}

function drawLotteryProcess(teamsList) {
  let draftOrder = Array(16).fill(null);
  let availableTeams = [...teamsList];

  for (let currentPick = 1; currentPick <= 16; currentPick++) {
    // If the current slot was already filled by a team sliding down, skip drawing for it
    if (draftOrder[currentPick - 1] !== null) {
      continue;
    }

    // Check remaining available empty slots up to the 12th pick
    let emptySlotsToNo12 = 0;
    for (let j = currentPick; j <= 12; j++) {
      if (draftOrder[j - 1] === null) emptySlotsToNo12++;
    }

    let remainingBottom3 = availableTeams.filter((t) => t.isBottomThree);

    // Force-draw bottom 3 teams if slots remaining up to 12 match
    if (emptySlotsToNo12 > 0 && remainingBottom3.length === emptySlotsToNo12) {
      let sortedBottomThree = shuffle(remainingBottom3);

      let bottomThreeIdx = 0;
      for (let j = currentPick; j <= 12; j++) {
        if (draftOrder[j - 1] === null) {
          let team = sortedBottomThree[bottomThreeIdx++];
          draftOrder[j - 1] = team.name;
          availableTeams = availableTeams.filter((t) => t.name !== team.name);
        }
      }
      continue;
    }

    // Draw a single ball normally
    let drawnTeam = drawSingleBall(availableTeams);

    // Find the first legal, unassigned pick for this team
    let targetPick = currentPick;
    while (true) {
      let isBanned =
        (targetPick === 1 && drawnTeam.top1Ban) ||
        (targetPick <= 5 && drawnTeam.top5Ban);

      // If the slot is empty AND not banned, the team gets it
      if (!isBanned && draftOrder[targetPick - 1] === null) {
        draftOrder[targetPick - 1] = drawnTeam.name;
        break;
      }
      targetPick++; // Slide down to the next pick
    }

    availableTeams = availableTeams.filter((t) => t.name !== drawnTeam.name);

    // If the team managed to fit into the current pick, we can move forward
    if (draftOrder[currentPick - 1] === null) {
      currentPick--; // Repeat loop on the same pick number to find a valid occupant
    }
  }

  return draftOrder;
}

function drawSingleBall(teamPool) {
  let pool = [];
  teamPool.forEach((t) => {
    // No restrictions, each team keeps their ball
    for (let i = 0; i < t.balls; i++) {
      pool.push(t);
    }
  });

  let randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

runLotterySimulation();
