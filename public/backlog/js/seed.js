// First-run demo data. Deliberately mirrors Khabe's real portfolio backlog so the
// board opens looking like a tool in active use, not an empty shell.

export function seedIssues(key) {
  const raw = [
    // Done
    { t: 'story', p: 'high', s: 'done', pts: 5, title: 'Ship Bird Song ID app', labels: ['bird-id', 'ai'],
      desc: 'In-browser BirdNET identification via ONNX Runtime. Record → 3s chunks → sigmoid → ranked species. Validated at 92% top-1 on real recordings.' },
    { t: 'story', p: 'high', s: 'done', pts: 5, title: 'Ship Plant Identifier app', labels: ['plant-id', 'ai'],
      desc: 'Pl@ntNet-powered plant ID with a serverless key proxy, confidence bands, and PWA install.' },
    { t: 'task', p: 'medium', s: 'done', pts: 2, title: 'Warm up model + mic permission on open', labels: ['bird-id', 'perf'],
      desc: 'Kick off the 64MB model download and request mic permission the moment the app opens.' },
    { t: 'bug', p: 'high', s: 'done', pts: 3, title: 'Fix recording lag on mobile', labels: ['bird-id', 'perf'],
      desc: 'Waveform canvas was reallocating every frame; raw mic disables noise suppression. Tap-to-toggle recording.' },

    // In progress
    { t: 'story', p: 'urgent', s: 'inprogress', pts: 8, title: 'Build Backlog (Jira-style) board', labels: ['backlog', 'tool'],
      desc: 'A self-built Kanban issue board: columns, draggable cards, priorities, labels, story points. This board!' },
    { t: 'task', p: 'medium', s: 'inprogress', pts: 3, title: 'Finish IBM AI Developer certificate', labels: ['learning'],
      desc: 'Grinding the 10-course IBM AI Developer cert on Coursera. 5 of 10 complete.' },

    // To do
    { t: 'task', p: 'medium', s: 'todo', pts: 2, title: 'Polish bird-id waveform idle state', labels: ['bird-id', 'ux'],
      desc: 'Empty box reads as broken. Add "your recording appears here" hint + a clearer idle line.' },
    { t: 'story', p: 'high', s: 'todo', pts: 5, title: 'Add location-based species filtering', labels: ['bird-id', 'ai'],
      desc: 'Use the location toggle + eBird API to bias results toward birds plausible for the region.' },
    { t: 'task', p: 'low', s: 'todo', pts: 1, title: 'Replace bird-id card placeholder image', labels: ['bird-id', 'design'],
      desc: 'Swap the generated placeholder for a real screenshot of the running app.' },

    // Backlog
    { t: 'story', p: 'medium', s: 'backlog', pts: 8, title: 'Offline / self-hosted BirdNET model', labels: ['bird-id'],
      desc: 'Bundle the model + service worker so the app works fully offline after first load.' },
    { t: 'story', p: 'high', s: 'backlog', pts: 13, title: 'Start IBM Full Stack Cloud Developer cert', labels: ['learning'],
      desc: 'Next certificate track after the AI Developer cert.' },
    { t: 'task', p: 'low', s: 'backlog', pts: 2, title: 'Cloud sync for Backlog board', labels: ['backlog', 'tool'],
      desc: 'Swap the localStorage layer for Netlify Blobs so the board persists across devices.' },
    { t: 'bug', p: 'medium', s: 'backlog', pts: 2, title: 'Long recordings surface spurious candidates', labels: ['bird-id', 'ai'],
      desc: 'Max-across-segments aggregation inflates secondary candidates on multi-minute uploads. Try averaging.' },
  ];

  const perCol = {};
  return raw.map((r, idx) => {
    perCol[r.s] = (perCol[r.s] ?? -1) + 1;
    return {
      id: `${key}-${idx + 1}`,
      title: r.title,
      description: r.desc,
      type: r.t,
      priority: r.p,
      status: r.s,
      points: r.pts ?? null,
      labels: r.labels || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: perCol[r.s],
    };
  });
}
