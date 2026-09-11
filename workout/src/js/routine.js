// routine.js -- the 3-day full-body rotation, encoded as data.
//
// Rotation: A -> rest -> B -> rest -> C -> rest -> rest
//
// Exercise fields
//   name           canonical name; must match the seed data's canonical names
//                  so PR history carries over (see tools/make_seed.py ALIASES)
//   sets           planned working sets
//   repRange       [n] for a fixed target, [lo, hi] for a range
//   type           'main' | 'accessory' | 'superset'
//   supersetGroup  id linking paired exercises; they are prompted alternately
//   notes          coaching cue, shown under the exercise name
//   unilateral     true -> the set prompt reads "per side"
//   alternatives   swap options, picked per session
//   rest           default rest-timer seconds after each set
//   increment      +/- step on the weight stepper (lb)
//   smallStep      true -> progressive overload suggests +2.5 lb, not +5
//   ramp           true -> offer the warmup ramp calculator
//   loadSense      'normal' (more weight is better) | 'assist' (less is better)

export const WARMUP = [
  { name: 'Dead bug', prescription: '2 × 8 / side' },
  { name: 'Bird dog', prescription: '2 × 8 / side' },
  { name: 'Half-kneeling hip-flexor stretch', prescription: '30s / side' },
];

export const ROUTINE = {
  A: {
    day: 'A',
    title: 'Squat + Bench',
    exercises: [
      {
        name: 'Back Squat',
        sets: 3, repRange: [5], type: 'main',
        rest: 180, increment: 5, ramp: true,
      },
      {
        name: 'Barbell Hip Thrust',
        sets: 3, repRange: [8], type: 'main',
        notes: 'Glute priority. Chin tucked, ribs down.',
        rest: 150, increment: 10, ramp: true,
      },
      {
        name: 'Barbell Bench Press',
        sets: 3, repRange: [6], type: 'main',
        rest: 180, increment: 5, smallStep: true, ramp: true,
      },
      {
        name: 'Chest-Supported DB Row',
        sets: 3, repRange: [10], type: 'accessory',
        notes: 'Upper-back thickness. Pause a beat at the top.',
        rest: 90, increment: 5,
      },
      {
        name: 'DB Lateral Raise',
        sets: 2, repRange: [12], type: 'accessory',
        rest: 60, increment: 2.5,
      },
      {
        name: 'Face Pull',
        sets: 2, repRange: [15], type: 'accessory',
        notes: 'Rear delts + external rotation. High elbows.',
        rest: 60, increment: 5,
      },
      {
        name: 'DB Incline Curl',
        sets: 1, repRange: [10], type: 'superset', supersetGroup: 'A-arms',
        rest: 0, increment: 2.5,
      },
      {
        name: 'Overhead Tricep Extension',
        sets: 1, repRange: [10], type: 'superset', supersetGroup: 'A-arms',
        rest: 60, increment: 5,
      },
    ],
  },

  B: {
    day: 'B',
    title: 'Deadlift + Vertical',
    exercises: [
      {
        name: 'Barbell Deadlift',
        sets: 3, repRange: [5], type: 'main',
        rest: 180, increment: 10, ramp: true,
      },
      {
        name: 'Standing Barbell OHP',
        sets: 3, repRange: [6], type: 'main',
        rest: 180, increment: 5, smallStep: true, ramp: true,
      },
      {
        name: 'Assisted Pull-up',
        sets: 3, repRange: [6, 10], type: 'main',
        notes: 'Log the assist load. Less assist = progress.',
        alternatives: ['Assisted Pull-up', 'Weighted Pull-up', 'Bodyweight Pull-up'],
        rest: 150, increment: 5, loadSense: 'assist',
      },
      {
        name: 'DB Incline Bench Press',
        sets: 3, repRange: [10], type: 'accessory',
        notes: 'Upper-pec priority.',
        rest: 90, increment: 5,
      },
      {
        name: 'Bulgarian Split Squat (lever)',
        sets: 3, repRange: [10], type: 'accessory', unilateral: true,
        alternatives: ['Bulgarian Split Squat (lever)', 'Dumbbell Bulgarian Split Squat'],
        rest: 90, increment: 10,
      },
      {
        name: 'Rear-Delt Fly',
        sets: 2, repRange: [15], type: 'accessory',
        rest: 60, increment: 5,
      },
      {
        name: 'EZ-Bar Curl',
        sets: 1, repRange: [10], type: 'superset', supersetGroup: 'B-arms',
        rest: 0, increment: 5,
      },
      {
        name: 'Cable Tricep Pushdown',
        sets: 1, repRange: [12], type: 'superset', supersetGroup: 'B-arms',
        rest: 60, increment: 5,
      },
    ],
  },

  C: {
    day: 'C',
    title: 'Hip Thrust + Incline',
    exercises: [
      {
        name: 'Barbell Hip Thrust',
        sets: 4, repRange: [6, 8], type: 'main',
        notes: 'Heaviest hip thrust of the week.',
        rest: 180, increment: 10, ramp: true,
      },
      {
        name: 'Front Squat',
        sets: 3, repRange: [10], type: 'main',
        alternatives: ['Front Squat', 'Leg Press'],
        rest: 150, increment: 10,
      },
      {
        name: 'Incline Barbell Bench Press',
        sets: 3, repRange: [6, 8], type: 'main',
        notes: 'Upper-pec priority.',
        rest: 180, increment: 5, smallStep: true, ramp: true,
      },
      {
        name: 'One-Arm DB Row',
        sets: 3, repRange: [10], type: 'accessory', unilateral: true,
        rest: 90, increment: 5,
      },
      {
        name: 'Close-Grip Lat Pulldown',
        sets: 2, repRange: [10], type: 'accessory',
        rest: 60, increment: 5,
      },
      {
        name: 'DB Shrug',
        sets: 2, repRange: [10], type: 'accessory',
        notes: 'Upper-back thickness. Hold the top for one second.',
        rest: 60, increment: 5,
      },
      {
        name: 'Hammer Curl',
        sets: 1, repRange: [10], type: 'superset', supersetGroup: 'C-arms',
        rest: 0, increment: 2.5,
      },
      {
        name: 'Rope Overhead Tricep Extension',
        sets: 1, repRange: [12], type: 'superset', supersetGroup: 'C-arms',
        rest: 60, increment: 5,
      },
    ],
  },
};

export const DAY_ORDER = ['A', 'B', 'C'];

// Main lifts that get the warmup ramp calculator, keyed by canonical name.
export const RAMP_LIFTS = new Set(
  DAY_ORDER.flatMap((d) => ROUTINE[d].exercises.filter((e) => e.ramp).map((e) => e.name))
);

// Every exercise the active session picker can offer, including alternatives.
export const ROUTINE_EXERCISES = (() => {
  const out = new Map();
  for (const d of DAY_ORDER) {
    for (const ex of ROUTINE[d].exercises) {
      if (!out.has(ex.name)) out.set(ex.name, ex);
      for (const alt of ex.alternatives || []) {
        if (!out.has(alt)) out.set(alt, { ...ex, name: alt });
      }
    }
  }
  return out;
})();

export function planFor(day) {
  return ROUTINE[day] || null;
}

// Which day comes next given the last completed day letter.
export function nextDay(lastDay) {
  if (!lastDay) return 'A';
  const i = DAY_ORDER.indexOf(lastDay);
  if (i < 0) return 'A';
  return DAY_ORDER[(i + 1) % DAY_ORDER.length];
}

export function repTarget(ex) {
  const r = ex.repRange || [];
  if (r.length === 0) return '';
  if (r.length === 1) return String(r[0]);
  return `${r[0]}–${r[1]}`;
}

export function topOfRange(ex) {
  const r = ex.repRange || [];
  return r.length ? r[r.length - 1] : null;
}
