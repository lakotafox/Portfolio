/* ============================================================================
   Paste-checks.

   Rules, learned the hard way from public/olliesfruitmap/js/mrapple.js:

   1. Match the SIGNAL, not the whole output. Versions change, Homebrew's
      wording changes, macOS changes. Anchoring on an exact string means this
      breaks silently in six months.
   2. Accept the messy-but-correct case. `brew doctor` almost never prints the
      clean line on a real machine — failing him for warnings would be the worst
      possible first experience.
   3. Name the near-miss. Pasting the COMMAND instead of its OUTPUT is by far
      the most likely mistake, and "that's not right" is a useless response to it.

   A check returns { tone: 'pass' | 'near' | 'fail', line }. `line` is spoken by
   sensei, so it is written in his voice, not as an error message.
   ========================================================================== */

const clean = (s) => String(s || '').replace(/\r/g, '').trim();

/** Did he paste the command back instead of what it printed? */
function looksLikeCommand(text, cmd) {
  const t = clean(text).toLowerCase();
  if (t.length > 120) return false;
  const head = cmd.split(/\s+/)[0].toLowerCase();
  const lines = t.split('\n').filter(Boolean);
  if (lines.length > 3) return false;
  return lines.every((l) => l.replace(/^\$\s*/, '').startsWith(head));
}

function make(cmd, test, pass, fail) {
  return (text) => {
    const t = clean(text);
    if (!t) return { tone: 'fail', line: 'Nothing there. Run it, then paste what it printed.' };

    // Test FIRST. Real output often starts with the same word as the command
    // ("claude 1.2.3"), so checking the near-miss heuristic first would reject
    // perfectly good answers.
    const r = test(t);
    if (r === true) return { tone: 'pass', line: pass };
    if (typeof r === 'string') return { tone: 'near', line: r };

    if (looksLikeCommand(t, cmd)) {
      return {
        tone: 'near',
        line: 'That is the command, not its answer. Run it, then copy what came back.',
      };
    }
    return { tone: 'fail', line: fail };
  };
}

export const CHECKS = {
  /* ---- Yellow: feeling the room ---- */

  pwd: make(
    'pwd',
    (t) => /(^|\n)\s*\/(Users|home|private|var|opt)\//.test(t) || /^\/$/m.test(t),
    'Good. That is where you are standing. Every command starts from there.',
    'A path starts with a slash — something like /Users/connor. Try pwd again.',
  ),

  ls: make(
    'ls',
    (t) => {
      if (/no such file|not found/i.test(t)) return 'The shell could not find that. Check the spelling and try again.';
      return t.split(/\s+/).filter(Boolean).length >= 2;
    },
    'That is your home, listed. Finder shows you the same thing with pictures.',
    'That does not look like a listing. Type ls and press return.',
  ),

  /* ---- Orange: the partner ---- */

  claude: make(
    'claude --version',
    (t) => /\d+\.\d+\.\d+/.test(t) && /claude|code/i.test(t),
    'Your partner is here. That is the last thing you install by memory.',
    'Expected a version number. If the shell says "command not found", open a new terminal window first — it has to notice the new program.',
  ),

  /* ---- Green: asking ---- */

  brew: make(
    'brew --version',
    (t) => {
      if (/command not found/i.test(t)) {
        return 'Installed, but this window cannot see it yet. That is the PATH step — ask Claude to finish it, or open a new terminal.';
      }
      return /Homebrew[ /]\d+/i.test(t);
    },
    'Homebrew is yours. Now you can ask for software by name.',
    'Expected a line starting with "Homebrew". Ask Claude to check whether it finished installing.',
  ),

  brewdoctor: make(
    'brew doctor',
    (t) => /ready to brew/i.test(t) || /warning:/i.test(t) || /your system is/i.test(t),
    'Warnings are normal — almost nobody has a spotless one. Nothing there is broken.',
    'That is not brew doctor talking. Ask Claude to run it and show you what it said.',
  ),

  cowsay: make(
    'cowsay',
    (t) => /\^__\^/.test(t) || (/[<(].{1,60}[>)]/.test(t) && /\\/.test(t)),
    'A cow. Useless, and you just used a package manager to get it — that is the whole loop.',
    'No cow in there. Ask Claude to install cowsay and run it.',
  ),

  pipe: make(
    'fortune | cowsay',
    (t) => {
      const cow = /\^__\^/.test(t) || /\\\s+\^/.test(t);
      if (!cow) return null;
      const speech = (t.match(/[<(][^>)]{4,}[>)]/s) || [])[0] || '';
      if (speech.toLowerCase().includes('moo') && speech.length < 12) {
        return 'That is the cow, but it is still saying moo. The fortune has to flow into it — ask Claude for the two of them joined together.';
      }
      return true;
    },
    'Two programs that know nothing about each other, wired together. That is a pipe.',
    'No cow in there yet. Ask Claude to make the cow say a random fortune.',
  ),

  server: make(
    'python3 -m http.server',
    (t) => /localhost|127\.0\.0\.1|0\.0\.0\.0|:\d{4}|serving http/i.test(t),
    'That is a server. It is handing out files from one folder, to this machine only.',
    'Expected an address or a port — something like 127.0.0.1:8080. Ask Claude what address the dojo is on.',
  ),

  ports: make(
    'lsof -i',
    (t) => /\b(node|python|http|LISTEN|:\d{2,5})\b/i.test(t),
    'Now you can see what is holding a door open. Ask this whenever a port is "already in use".',
    'That does not look like a list of what is running. Ask Claude what is using your ports right now.',
  ),
};

export function runCheck(id, text) {
  const fn = CHECKS[id];
  if (!fn) return { tone: 'pass', line: 'Good.' };
  return fn(text);
}
