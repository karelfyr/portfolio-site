/*
 * Data for the Decathlon kiosk clip. Layout, sizes and colours come from the Figma section
 * "Decathlon animation" (kSUSg9RRo9qh4nB3BNMyqG, node 477:3362); the sport list is real sports,
 * sorted A–Z, so the alphabet filter behaves like the kiosk would.
 */

/** Sports Section buttons, in the design's order (the design's duplicate "Cycling" is Hiking –
 * the store has a hiking area on the map, "Turistika"). */
export const SECTIONS = [
  'Cycling',
  'Skating and Scooters',
  'Hiking',
  'Winter Sports',
  'Water Sports',
  'Fitness',
  'Running',
  'Nature',
  'Precision Sports',
  'Team Sports',
  'Racket Sports',
  'Nutrition, Supplements, Electronics',
] as const
export type Section = (typeof SECTIONS)[number]

/** The Fitness section's list in the left panel – the design's two columns, as designed (its
 * repeated "Martial Arts" is Taekwondo). */
export const FITNESS_COLUMNS = [
  ['Trampolines', 'Physical Education', 'Dance', 'Fitness', 'Boxing', 'Kickboxing', 'MMA', 'Yoga', 'Gymnastics'],
  ['Karate', 'Judo', 'Martial Arts', 'Ballet', 'Strength Training', 'Taekwondo', 'Pilates', 'Circuit Training'],
]

/** The alphabet row. */
export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

const F: Section = 'Fitness'
// No sports start with H, L, N, R or X here – those letters show disabled in the alphabet.
const raw: [string, Section][] = [
  // A
  ['Aikido', F], ['Alpine Skiing', 'Winter Sports'], ['American Football', 'Team Sports'], ['Aqua Aerobics', 'Water Sports'], ['Archery', 'Precision Sports'], ['Athletics', 'Running'],
  // B
  ['Badminton', 'Racket Sports'], ['Ballet', F], ['Baseball', 'Team Sports'], ['Basketball', 'Team Sports'], ['Beach Volleyball', 'Team Sports'], ['BMX', 'Cycling'], ['Bouldering', 'Nature'], ['Boxing', F],
  // C
  ['Canoeing', 'Water Sports'], ['Circuit Training', F], ['Climbing', 'Nature'], ['Cricket', 'Team Sports'], ['Cross-Country Skiing', 'Winter Sports'], ['Curling', 'Precision Sports'], ['Cycling', 'Cycling'],
  // D
  ['Dance', F], ['Darts', 'Precision Sports'], ['Diving', 'Water Sports'], ['Dodgeball', 'Team Sports'], ['Downhill Biking', 'Cycling'],
  // E
  ['E-Biking', 'Cycling'], ['Endurance Running', 'Running'], ['Enduro', 'Cycling'], ['Equestrian', 'Nature'], ['Eventing', 'Nature'],
  // F
  ['Fencing', 'Precision Sports'], ['Field Hockey', 'Team Sports'], ['Fishing', 'Nature'], ['Fitness', F], ['Football', 'Team Sports'], ['Freediving', 'Water Sports'],
  // G
  ['Gaelic Football', 'Team Sports'], ['Goalball', 'Team Sports'], ['Golf', 'Precision Sports'], ['Gravel Cycling', 'Cycling'], ['Gymnastics', F],
  // I
  ['Ice Climbing', 'Winter Sports'], ['Ice Hockey', 'Winter Sports'], ['Ice Skating', 'Skating and Scooters'], ['Indoor Rowing', F], ['Inline Skating', 'Skating and Scooters'],
  // J
  ['Javelin', 'Running'], ['Jet Skiing', 'Water Sports'], ['Jiu-Jitsu', F], ['Jogging', 'Running'], ['Judo', F], ['Jump Rope', F],
  // K
  ['Karate', F], ['Kayaking', 'Water Sports'], ['Kendo', F], ['Kickboxing', F], ['Kite Flying', 'Nature'], ['Kitesurfing', 'Water Sports'], ['Korfball', 'Team Sports'],
  // M
  ['Marathon', 'Running'], ['Martial Arts', F], ['MMA', F], ['Mountain Biking', 'Cycling'], ['Mountaineering', 'Hiking'],
  // O
  ['Obstacle Racing', 'Running'], ['Olympic Weightlifting', F], ['Open Water Swimming', 'Water Sports'], ['Orienteering', 'Hiking'], ['Outrigger Canoeing', 'Water Sports'],
  // P – Pilates is third
  ['Paddleboarding', 'Water Sports'], ['Physical Education', F], ['Pilates', F], ['Ping-Pong', 'Racket Sports'], ['Pole Vault', 'Running'], ['Polo', 'Team Sports'], ['Powerlifting', F],
  // Q
  ['Qigong', F], ['Quad Biking', 'Nature'], ['Quad Skating', 'Skating and Scooters'], ['Quidditch', 'Team Sports'], ['Quoits', 'Precision Sports'],
  // S
  ['Sailing', 'Water Sports'], ['Scootering', 'Skating and Scooters'], ['Skateboarding', 'Skating and Scooters'], ['Skiing', 'Winter Sports'], ['Snowboarding', 'Winter Sports'], ['Squash', 'Racket Sports'], ['Strength Training', F], ['Surfing', 'Water Sports'], ['Swimming', 'Water Sports'],
  // T
  ['Taekwondo', F], ['Tennis', 'Racket Sports'], ['Trail Running', 'Running'], ['Trampolines', F], ['Triathlon', 'Running'],
  // U
  ['Ultimate Frisbee', 'Team Sports'], ['Ultramarathon', 'Running'], ['Underwater Hockey', 'Water Sports'], ['Underwater Rugby', 'Water Sports'], ['Unicycling', 'Skating and Scooters'],
  // V
  ['Vaulting', F], ['Velodrome Cycling', 'Cycling'], ['Via Ferrata', 'Hiking'], ['Volleyball', 'Team Sports'], ['Vovinam', F],
  // W
  ['Wakeboarding', 'Water Sports'], ['Water Polo', 'Water Sports'], ['Weightlifting', F], ['Windsurfing', 'Water Sports'], ['Wrestling', F],
  // Y
  ['Yabusame', 'Precision Sports'], ['Yachting', 'Water Sports'], ['Yoga', F], ['Yogalates', F], ['Yukigassen', 'Winter Sports'],
  // Z
  ['Ziplining', 'Nature'], ['Zorbing', 'Nature'], ['Zumba', F], ['Zurkhaneh', F],
]

export type Sport = { name: string; section: Section; letter: string }

/** Every sport, A–Z. */
export const SPORTS: Sport[] = raw
  .map(([name, section]) => ({ name, section, letter: name[0].toUpperCase() }))
  .sort((a, b) => a.name.localeCompare(b.name, 'en'))

/** Letters with at least one sport (the rest are shown disabled, as in the design). */
export const ACTIVE_LETTERS = new Set(SPORTS.map((s) => s.letter))

/** The story the clip tells: filter by P, pick Pilates. */
export const PICK_LETTER = 'P'
export const PICK_SPORT = 'Pilates'
export const PICKED = SPORTS.filter((s) => s.letter === PICK_LETTER)
