const midiPerc = {
  electricBassDrum: 36,
  handClap: 39,
  electricSnare: 40,
  lowTom: 45,
  lowMidTom: 47,
  hiMidTom: 48,
  highTom: 50,
  crashCymbal: 49,
  shaker: 82,
  openHihat: 46,
  closedHihat: 42,
  openHighConga: 63,
  muteHighConga: 62,
  lowConga: 64,
  cowBell: 56,
  acousticBassDrum: 35,
  acousticSnare: 38,
  highWoodblock: 76,
  lowWoodblock: 77
}

export default [
  {
    name: '808X Kit',
    samplePaths: [
      '/samples/808x/kick-808x-1.aac',
      '/samples/808x/clap-808x.aac',
      '/samples/808x/snare-808x-1.aac',
      '/samples/808x/closed-hh-808x.aac',
      '/samples/808x/open-hh-808x.aac',
      '/samples/808x/shaker-808x.aac',
      '/samples/808x/crash-808x.aac',
      '/samples/808x/hi-tom-808x.aac',
      '/samples/808x/mid-hi-tom-808x.aac',
      '/samples/808x/low-tom-808x.aac',
      '/samples/808x/mid-low-tom-808x.aac'
    ],
    midiNotes: [
      midiPerc.electricBassDrum,
      midiPerc.handClap,
      midiPerc.electricSnare,
      midiPerc.closedHihat,
      midiPerc.openHihat,
      midiPerc.shaker,
      midiPerc.crashCymbal,
      midiPerc.highTom,
      midiPerc.hiMidTom,
      midiPerc.lowTom,
      midiPerc.lowMidTom
    ]
  },
  {
    name: 'Loungin Kit',
    samplePaths: [
      '/samples/loungin/kick-loungin.aac',
      '/samples/loungin/clap-1-loungin.aac',
      '/samples/loungin/clap-2-loungin.aac',
      '/samples/loungin/closed-hh-loungin.aac',
      '/samples/loungin/open-hh-loungin.aac',
      '/samples/loungin/shaker-loungin.aac',
      '/samples/loungin/snare-roll-loungin.aac',
      '/samples/loungin/conga-1-loungin.aac',
      '/samples/loungin/conga-2-loungin.aac',
      '/samples/loungin/conga-3-loungin.aac'
    ],
    midiNotes: [
      midiPerc.acousticBassDrum,
      midiPerc.handClap,
      midiPerc.acousticSnare,
      midiPerc.closedHihat,
      midiPerc.openHihat,
      midiPerc.shaker,
      midiPerc.cowBell,
      midiPerc.openHighConga,
      midiPerc.muteHighConga,
      midiPerc.lowConga
    ]
  },
  {
    name: 'She Traps Kit',
    samplePaths: [
      '/samples/she-traps/kick-2-she-traps.aac',
      '/samples/she-traps/snare-1-she-traps.aac',
      '/samples/she-traps/snare-2-she-traps.aac',
      '/samples/she-traps/closed-hh-1-she-traps.aac',
      '/samples/she-traps/open-hh-1-she-traps.aac',
      '/samples/she-traps/shaker-she-traps.aac',
      '/samples/she-traps/kick-1-she-traps.aac',
      '/samples/she-traps/hi-tom-1-she-traps.aac',
      '/samples/she-traps/mid-tom-2-she-traps.aac',
      '/samples/she-traps/perc-1-she-traps.aac',
      '/samples/she-traps/perc-2-she-traps.aac'
    ],
    midiNotes: [
      midiPerc.electricBassDrum,
      midiPerc.handClap,
      midiPerc.electricSnare,
      midiPerc.closedHihat,
      midiPerc.openHihat,
      midiPerc.shaker,
      midiPerc.lowTom,
      midiPerc.highTom,
      midiPerc.hiMidTom,
      midiPerc.highWoodblock,
      midiPerc.lowWoodblock
    ]
  }
]
