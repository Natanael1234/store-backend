/** Get all variations of ordering and subsets values. */
export function getCombinations<T>(valuesArr: T[]): T[][] {
  const variants: T[][] = getSubsets(valuesArr);
  const combinations: T[][] = [];
  for (const variant of variants) {
    const permutations = getPermutations(variant);
    combinations.push(...permutations);
  }
  combinations.sort((a, b) => {
    let aInner = a.map((x) => (x as string).toLowerCase()).join('');
    let bInner = b.map((x) => (x as string).toLowerCase()).join('');
    return aInner.localeCompare(bInner);
  });
  combinations.unshift([]);
  return combinations;
}

/** Get all possible subsets values. */
function getSubsets<T>(valuesSetArr: T[]): T[][] {
  if (valuesSetArr.length === 0) {
    return [[]];
  } else {
    let first = valuesSetArr[0];
    let rest = valuesSetArr.slice(1);
    let subsets = getSubsets(rest);
    let subsetsWithFirst = subsets.map((subset) => [first].concat(subset));
    return subsets.concat(subsetsWithFirst);
  }
}

/** Get all possible ordering variations. */
function getPermutations<T>(valuesSetArr: T[]): T[][] {
  if (valuesSetArr.length === 1) {
    return [valuesSetArr];
  } else {
    let result: T[][] = [];
    for (let i = 0; i < valuesSetArr.length; i++) {
      let first = valuesSetArr[i];
      let remaining = valuesSetArr
        .slice(0, i)
        .concat(valuesSetArr.slice(i + 1));
      let innerPermutations = getPermutations(remaining);
      for (let j = 0; j < innerPermutations.length; j++) {
        result.push([first].concat(innerPermutations[j]));
      }
    }
    return result;
  }
}
