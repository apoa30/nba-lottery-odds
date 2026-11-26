// Lottery odds calculator: works with any number of groups.
// Forward DP over "how many teams each group has contributed so far"
// More of a thought experiment on how fast this could be

const GROUPS = [
  { id: "Group_1", combinations: 72, teamCount: 6, startRank: 1 },
  { id: "Group_2", combinations: 71, teamCount: 8, startRank: 7 },
];

const NUM_LOTTERY_PICKS = 4;
const G = GROUPS.length;
const TOTAL_TEAMS = GROUPS.reduce((sum, g) => sum + g.teamCount, 0);

function nCr(n, r) {
  if (r < 0 || r > n) return 0;
  r = Math.min(r, n - r);
  let res = 1;
  for (let i = 1; i <= r; i++) {
    res = (res * (n - r + i)) / i;
  }
  return res;
}

// P(x successes in a sample of size N from M items with n successes)
function hypergeometricPMF(k, M, n, N) {
  const denominator = nCr(M, N);
  if (denominator === 0) return 0;
  return (nCr(n, k) * nCr(M - n, N - k)) / denominator;
}

// Forward DP over states = number of teams taken from each group so far
function buildPickStates() {
  const groupPick = Array.from({ length: NUM_LOTTERY_PICKS }, () =>
    new Array(G).fill(0),
  );

  let matrix = new Map([
    [new Array(G).fill(0).join(","), { taken: new Array(G).fill(0), prob: 1 }],
  ]);

  for (let p = 0; p < NUM_LOTTERY_PICKS; p++) {
    const next = new Map();

    for (const { taken, prob } of matrix.values()) {
      let totalTickets = 0;
      for (let g = 0; g < G; g++) {
        totalTickets +=
          GROUPS[g].combinations * (GROUPS[g].teamCount - taken[g]);
      }
      if (totalTickets === 0) continue;

      for (let g = 0; g < G; g++) {
        const remaining = GROUPS[g].teamCount - taken[g];
        if (remaining === 0) continue;

        const pGroup = (GROUPS[g].combinations * remaining) / totalTickets;
        const stepProb = prob * pGroup;
        groupPick[p][g] += stepProb;

        const nextTaken = [...taken];
        nextTaken[g]++;
        const key = nextTaken.join(",");

        const entry = next.get(key) ?? { taken: nextTaken, prob: 0 };
        entry.prob += stepProb;
        next.set(key, entry);
      }
    }

    matrix = next;
  }

  return { groupPick, finalStates: [...matrix.values()] };
}

// Adds fallback (pick 5+) odds for the final state
function addFallbackOdds(matrix, taken, prob) {
  let skippedSlotsByPriorGroups = 0;

  for (let gIndex = 0; gIndex < G; gIndex++) {
    const group = GROUPS[gIndex];
    const k = taken[gIndex];
    const N = group.teamCount;
    const probNotPickedInTop4 = (N - k) / N;

    if (probNotPickedInTop4 > 0) {
      for (let t = 0; t < N; t++) {
        const row = group.startRank - 1 + t;
        const teamsWithBetterRank = t;
        const maxX = Math.min(k, teamsWithBetterRank);

        for (let x = 0; x <= maxX; x++) {
          const probXSnatched = hypergeometricPMF(
            x,
            N - 1,
            teamsWithBetterRank,
            k,
          );
          const weight = prob * probNotPickedInTop4 * probXSnatched;
          if (weight <= 0) continue;

          const betterRankedTeamsLeft = teamsWithBetterRank - x;
          const column =
            NUM_LOTTERY_PICKS +
            skippedSlotsByPriorGroups +
            betterRankedTeamsLeft;
          matrix[row][column] += weight;
        }
      }
    }

    skippedSlotsByPriorGroups += N - k;
  }
}

function buildOddsMatrix() {
  // Extra columns for safety
  const matrix = Array.from(
    { length: TOTAL_TEAMS },
    () => new Float64Array(TOTAL_TEAMS + NUM_LOTTERY_PICKS),
  );

  const { groupPick, finalStates } = buildPickStates();

  // Teams in a group are symmetric in the top 4
  for (let p = 0; p < NUM_LOTTERY_PICKS; p++) {
    for (let g = 0; g < G; g++) {
      const perTeam = groupPick[p][g] / GROUPS[g].teamCount;
      for (let t = 0; t < GROUPS[g].teamCount; t++) {
        matrix[GROUPS[g].startRank - 1 + t][p] += perTeam;
      }
    }
  }

  // One resolution for each state for the fallback picks
  for (const { taken, prob } of finalStates) {
    addFallbackOdds(matrix, taken, prob);
  }

  return matrix;
}

function main() {
  console.time("Execution Time");
  const matrix = buildOddsMatrix();
  console.timeEnd("Execution Time");

  console.log(
    `Calculated exact fallback odds for ${TOTAL_TEAMS} teams across ${G} group(s).\n`,
  );

  console.log("Verifying non-uniform distribution:");
  const sampleRanks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  const testPicks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

  sampleRanks.forEach((rank) => {
    const row = matrix[rank - 1];
    let output = `Rank ${rank} -> `;
    testPicks.forEach((p) => {
      const pct = (row[p - 1] * 100).toFixed(4);
      output += `Pick ${p}: ${pct}% | `;
    });
    console.log(output);
  });
}

main();
