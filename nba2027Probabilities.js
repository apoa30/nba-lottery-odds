// Set team names and constraints
const teams = [
  {
    id: 0,
    name: "Team A (Bottom 3)",
    isBottomThree: true,
    top1Ban: false,
    top5Ban: false,
    balls: 2,
  },
  {
    id: 1,
    name: "Team B (Bottom 3)",
    isBottomThree: true,
    top1Ban: false,
    top5Ban: false,
    balls: 2,
  },
  {
    id: 2,
    name: "Team C (Bottom 3)",
    isBottomThree: true,
    top1Ban: false,
    top5Ban: false,
    balls: 2,
  },
  {
    id: 3,
    name: "Team D",
    isBottomThree: false,
    top1Ban: false,
    top5Ban: false,
    balls: 3,
  },
  {
    id: 4,
    name: "Team E",
    isBottomThree: false,
    top1Ban: false,
    top5Ban: false,
    balls: 3,
  },
  {
    id: 5,
    name: "Team F",
    isBottomThree: false,
    top1Ban: false,
    top5Ban: false,
    balls: 3,
  },
  {
    id: 6,
    name: "Team G",
    isBottomThree: false,
    top1Ban: false,
    top5Ban: false,
    balls: 3,
  },
  {
    id: 7,
    name: "Team H",
    isBottomThree: false,
    top1Ban: false,
    top5Ban: false,
    balls: 3,
  },
  {
    id: 8,
    name: "Team I",
    isBottomThree: false,
    top1Ban: false,
    top5Ban: false,
    balls: 3,
  },
  {
    id: 9,
    name: "Team J",
    isBottomThree: false,
    top1Ban: false,
    top5Ban: true,
    balls: 3,
  },
  {
    id: 10,
    name: "Team K",
    isBottomThree: false,
    top1Ban: true,
    top5Ban: false,
    balls: 2,
  },
  {
    id: 11,
    name: "Team L",
    isBottomThree: false,
    top1Ban: false,
    top5Ban: false,
    balls: 2,
  },
  {
    id: 12,
    name: "Team M",
    isBottomThree: false,
    top1Ban: false,
    top5Ban: false,
    balls: 2,
  },
  {
    id: 13,
    name: "Team N",
    isBottomThree: false,
    top1Ban: false,
    top5Ban: false,
    balls: 2,
  },
  {
    id: 14,
    name: "Team O",
    isBottomThree: false,
    top1Ban: false,
    top5Ban: false,
    balls: 1,
  },
  {
    id: 15,
    name: "Team P",
    isBottomThree: false,
    top1Ban: false,
    top5Ban: false,
    balls: 1,
  },
];

function runLottery() {
  console.time("Execution Time");
  const numTeams = teams.length;

  // Create a matrix to store exact probabilities
  let preciseOdds = Array.from({ length: numTeams }, () =>
    Array(numTeams).fill(0),
  );

  // Precalculate bitmask for the bottom 3 teams
  let bottom3Mask = 0;
  teams.forEach((t) => {
    if (t.isBottomThree) bottom3Mask |= 1 << t.id;
  });

  // To prevent state explosion, group state probabilities by the number of teams processed (0 to 16)
  let layers = Array.from({ length: numTeams + 1 }, () => new Map());

  // Initial state: 0 teams drawn and 0 slots filled
  layers[0].set("0,0", 1.0);

  for (let currentLayer = 0; currentLayer < numTeams; currentLayer++) {
    for (let [stateKey, prob] of layers[currentLayer]) {
      if (prob <= 0) continue;

      let [drawnTeamsMask, filledSlotsMask] = stateKey.split(",").map(Number);

      // Identify the current pick slot (the first 0-bit in filledSlotsMask)
      let currentPick = 0;
      while (currentPick < numTeams && filledSlotsMask & (1 << currentPick)) {
        currentPick++;
      }

      if (currentPick >= numTeams) continue;

      // Force the bottom 3 into the top 12
      let emptySlotsToNo12 = 0;
      for (let j = currentPick; j <= 11; j++) {
        if (!(filledSlotsMask & (1 << j))) emptySlotsToNo12++;
      }

      let remBottom3Mask = bottom3Mask & ~drawnTeamsMask;
      let remBottom3Count = countSetBits(remBottom3Mask);

      // Force-draw condition triggered
      if (emptySlotsToNo12 > 0 && remBottom3Count === emptySlotsToNo12) {
        let remBottom3Teams = [];
        for (let id = 0; id < numTeams; id++) {
          if (remBottom3Mask & (1 << id)) remBottom3Teams.push(id);
        }

        let emptySlots = [];
        for (let j = currentPick; j <= 11; j++) {
          if (!(filledSlotsMask & (1 << j))) emptySlots.push(j);
        }

        let pEach = prob / remBottom3Count;

        // Distribute probabilities uniformly across remaining spots
        remBottom3Teams.forEach((teamId) => {
          emptySlots.forEach((slotIndex) => {
            preciseOdds[teamId][slotIndex] += pEach;
          });
        });

        // Advance state directly across multiple allocations
        let nextDrawnMask = drawnTeamsMask | remBottom3Mask;
        let nextFilledMask = filledSlotsMask;
        emptySlots.forEach((slotIndex) => {
          nextFilledMask |= 1 << slotIndex;
        });

        let nextLayerIndex = currentLayer + remBottom3Count;
        let nextKey = `${nextDrawnMask},${nextFilledMask}`;
        layers[nextLayerIndex].set(
          nextKey,
          (layers[nextLayerIndex].get(nextKey) || 0) + prob,
        );
        continue;
      }

      // Standard drawing logic execution
      let totalAvailableBalls = 0;
      let availableTeams = [];
      for (let i = 0; i < numTeams; i++) {
        if (!(drawnTeamsMask & (1 << i))) {
          totalAvailableBalls += teams[i].balls;
          availableTeams.push(teams[i]);
        }
      }

      if (totalAvailableBalls === 0) continue;

      // Branch into every valid option
      for (let t of availableTeams) {
        let teamProb = prob * (t.balls / totalAvailableBalls);

        // Slide picks down
        let targetPick = currentPick;
        while (true) {
          let isBanned =
            (targetPick === 0 && t.top1Ban) || (targetPick <= 4 && t.top5Ban);
          if (!isBanned && !(filledSlotsMask & (1 << targetPick))) {
            break;
          }
          targetPick++; // Slide down sequentially
        }

        // Append matching weight to result matrix
        preciseOdds[t.id][targetPick] += teamProb;

        // Derive step masks
        let nextDrawnMask = drawnTeamsMask | (1 << t.id);
        let nextFilledMask = filledSlotsMask | (1 << targetPick);
        let nextKey = `${nextDrawnMask},${nextFilledMask}`;

        layers[currentLayer + 1].set(
          nextKey,
          (layers[currentLayer + 1].get(nextKey) || 0) + teamProb,
        );
      }
    }
    // Free memory space from previous layer once processed
    layers[currentLayer] = null;
  }

  printResults(preciseOdds);
  console.timeEnd("Execution Time");
}

function countSetBits(num) {
  let count = 0;
  while (num > 0) {
    num &= num - 1;
    count++;
  }
  return count;
}

function getOrdinal(num) {
  const tens = num % 100;
  if (tens >= 11 && tens <= 13) return num + "th";
  return num + ({ 1: "st", 2: "nd", 3: "rd" }[num % 10] ?? "th");
}

function printResults(matrix) {
  console.log("Lottery Probabilities:\n");
  console.log("Top 16 Pick Distribution (%):");

  teams.forEach((t) => {
    let resultString = matrix[t.id]
      .map((prob, index) => {
        return `${index + 1}${getOrdinal(index + 1)}: ${(prob * 100).toFixed(4)}%`;
      })
      .join(" | ");
    console.log(`${t.name.padEnd(25)} | ${resultString}`);
  });
}

runLottery();
