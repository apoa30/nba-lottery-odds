function calculateLotteryScenarios() {
  // Define the 4 distinct structural groups of teams in the lottery
  const groups = [
    { name: "Worst 3 Teams (2 chances + top 12 guarantee)", size: 3 },
    { name: "Next 7 Worst Teams (3 chances)", size: 7 },
    { name: "9/10 Play-In Seeds (2 chances)", size: 4 },
    { name: "7/8 Play-In Losers (1 chance)", size: 2 },
  ];

  let totalScenarios = 0;

  // There's at most five top 5 bans
  for (let totalTop5Bans = 0; totalTop5Bans <= 5; totalTop5Bans++) {
    // Check if either last season's lottery winner is in the lottery this year or made the playoffs
    for (
      let no1WinnerInLottery = 0;
      no1WinnerInLottery <= 1;
      no1WinnerInLottery++
    ) {
      function distribute(groupIndex, remainingTop5Bans, remainingNo1Bans) {
        if (groupIndex === groups.length) {
          if (remainingTop5Bans === 0 && remainingNo1Bans === 0) {
            return 1; // Valid scenario
          }
          return 0;
        }

        const groupSize = groups[groupIndex].size;
        let validWaysInThisBranch = 0;

        for (let t5 = 0; t5 <= Math.min(groupSize, remainingTop5Bans); t5++) {
          for (
            let n1 = 0;
            n1 <= Math.min(groupSize - t5, remainingNo1Bans);
            n1++
          ) {
            // Recursively move to the next group with the remaining unassigned constraints
            validWaysInThisBranch += distribute(
              groupIndex + 1,
              remainingTop5Bans - t5,
              remainingNo1Bans - n1,
            );
          }
        }
        return validWaysInThisBranch;
      }

      // Run the distribution loop for the current constraint count
      totalScenarios += distribute(0, totalTop5Bans, no1WinnerInLottery);
    }
  }

  return totalScenarios;
}

const numStates = calculateLotteryScenarios();
console.log(numStates);
