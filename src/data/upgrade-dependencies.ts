export type UpgradeDependencyItem = {
  eip: number
  requires: number[]
}

export type UpgradeDependencyGroup = {
  name: string
  eips: UpgradeDependencyItem[]
}

export const upgradeDependencies: UpgradeDependencyGroup[] = [
  { name: "Frontier", eips: [] },
  { name: "Frontier Thawing", eips: [] },
  {
    name: "Homestead",
    eips: [
      { eip: 2, requires: [] },
      { eip: 7, requires: [] },
      { eip: 8, requires: [] },
    ],
  },
  { name: "DAO Fork", eips: [] },
  { name: "Tangerine Whistle", eips: [{ eip: 150, requires: [] }] },
  {
    name: "Spurious Dragon",
    eips: [
      { eip: 155, requires: [] },
      { eip: 160, requires: [] },
      { eip: 161, requires: [] },
      { eip: 170, requires: [] },
    ],
  },
  {
    name: "Byzantium",
    eips: [
      { eip: 100, requires: [] },
      { eip: 140, requires: [] },
      { eip: 196, requires: [] },
      { eip: 197, requires: [] },
      { eip: 198, requires: [] },
      { eip: 211, requires: [] },
      { eip: 214, requires: [] },
      { eip: 649, requires: [] },
      { eip: 658, requires: [] },
    ],
  },
  {
    name: "Constantinople",
    eips: [
      { eip: 145, requires: [] },
      { eip: 1014, requires: [] },
      { eip: 1052, requires: [161] },
      { eip: 1234, requires: [] },
      { eip: 1283, requires: [] },
    ],
  },
  { name: "Petersburg", eips: [] },
  {
    name: "Istanbul",
    eips: [
      { eip: 152, requires: [] },
      { eip: 1108, requires: [196, 197] },
      { eip: 1344, requires: [155] },
      { eip: 1844, requires: [137, 165] },
      { eip: 2028, requires: [] },
      { eip: 2200, requires: [] },
    ],
  },
  { name: "Muir Glacier", eips: [{ eip: 2384, requires: [] }] },
  {
    name: "Berlin",
    eips: [
      { eip: 2565, requires: [198] },
      { eip: 2929, requires: [] },
      { eip: 2718, requires: [] },
      { eip: 2930, requires: [2718, 2929] },
    ],
  },
  {
    name: "London",
    eips: [
      { eip: 1559, requires: [2718, 2930] },
      { eip: 3198, requires: [1559] },
      { eip: 3529, requires: [2200, 2929, 2930] },
      { eip: 3541, requires: [] },
      { eip: 3554, requires: [] },
    ],
  },
  { name: "Arrow Glacier", eips: [{ eip: 4345, requires: [] }] },
  { name: "Altair", eips: [] },
  { name: "Gray Glacier", eips: [{ eip: 5133, requires: [] }] },
  { name: "Bellatrix", eips: [] },
  {
    name: "Paris",
    eips: [
      { eip: 3675, requires: [2124] },
      { eip: 4399, requires: [3675] },
    ],
  },
  {
    name: "Shanghai",
    eips: [
      { eip: 3651, requires: [2929] },
      { eip: 3855, requires: [] },
      { eip: 3860, requires: [170] },
      { eip: 4895, requires: [] },
      { eip: 6049, requires: [] },
    ],
  },
  {
    name: "Dencun",
    eips: [
      { eip: 1153, requires: [22, 3, 529] },
      { eip: 4788, requires: [1559] },
      { eip: 4844, requires: [1559, 2718, 2930, 4895] },
      { eip: 5656, requires: [] },
      { eip: 6780, requires: [2681, 2929, 3529] },
      { eip: 7044, requires: [] },
      { eip: 7045, requires: [] },
      { eip: 7514, requires: [] },
      { eip: 7516, requires: [3198, 4844] },
    ],
  },
  {
    name: "Pectra",
    eips: [
      { eip: 7691, requires: [] },
      { eip: 7623, requires: [] },
      { eip: 7840, requires: [] },
      { eip: 7702, requires: [2, 161, 1052, 2718, 2929, 2930, 3541, 3607, 4844] },
      { eip: 7685, requires: [] },
      { eip: 7549, requires: [] },
      { eip: 7251, requires: [7002, 7685] },
      { eip: 7002, requires: [7685] },
      { eip: 6110, requires: [7685] },
      { eip: 2935, requires: [] },
      { eip: 2537, requires: [] },
    ],
  },
  {
    name: "Fusaka",
    eips: [
      { eip: 7594, requires: [4844] },
      { eip: 7642, requires: [5793] },
      { eip: 7823, requires: [198] },
      { eip: 7825, requires: [] },
      { eip: 7883, requires: [] },
      { eip: 7892, requires: [] },
      { eip: 7918, requires: [4844, 7840] },
      { eip: 7935, requires: [] },
      { eip: 5920, requires: [] },
      { eip: 7901, requires: [] },
      { eip: 7917, requires: [] },
      { eip: 7934, requires: [] },
    ],
  },
]
