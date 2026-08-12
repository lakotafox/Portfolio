/* ============================================================================
   Paste-checks.

   Only two survive, and only because they happen BEFORE Claude Code exists.
   Once he has a partner, asking him to alt-tab to a browser and paste text so a
   regex can tell him what Claude just told him is the exact busywork this
   course claims to replace. Everything after Orange belt is a Done button.

   Rules, from public/olliesfruitmap/js/mrapple.js:

   1. Match the SIGNAL, not the whole output. Versions and wording change;
      anchoring on an exact string breaks silently in six months.
   2. Name the near-miss. Pasting the COMMAND instead of its OUTPUT is by far
      the most likely mistake, and "that's not right" is a useless response.

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


  /** Proves he actually moved, rather than running pwd from where he started. */
  inside: make(
    'pwd',
    (t) => {
      if (/\/practice\/?\s*$/m.test(t)) return true;
      if (/(^|\n)\s*\/(Users|home)\/[^\n]*$/m.test(t)) {
        return 'That is where you started. Run cd practice first, then pwd again — the path should end in /practice.';
      }
      return null;
    },
    'You moved. That is all cd does, and now you can see it happen.',
    'Expected a path ending in /practice. Make it with mkdir practice, then cd practice.',
  ),

  /* ---- Orange: the partner ---- */

  claude: make(
    'claude --version',
    (t) => /\d+\.\d+\.\d+/.test(t) && /claude|code/i.test(t),
    'Your partner is here. That is the last thing you install by memory.',
    'Expected a version number. If the shell says "command not found", open a new terminal window first — it has to notice the new program.',
  ),



};

export function runCheck(id, text) {
  const fn = CHECKS[id];
  if (!fn) return { tone: 'pass', line: 'Good.' };
  return fn(text);
}
