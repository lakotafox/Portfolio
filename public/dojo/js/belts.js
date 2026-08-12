/* ============================================================================
   The curriculum.

   Every kata follows the same three beats, and the order matters:
     concept  — what this thing is and why it exists
     command  — what it looks like, dissected. You may memorise it if you like.
     ask      — or say this to Claude. Same result.

   Belts White through Orange come before Claude Code exists, so those are hand
   typed by necessity, and sensei says so. From Green on, everything is an ask.

   Sensei's voice: short sentences, patient, occasionally aphoristic. Never a
   phonetic accent — the cadence carries it.
   ========================================================================== */

export const BELTS = [
  /* ------------------------------------------------------------- WHITE -- */
  {
    id: 'white',
    name: 'White Belt',
    motto: 'First learn stand.',
    intro: 'Welcome. Before you touch anything, you learn what you are touching. No typing today.',
    katas: [
      {
        id: 'w-stack',
        title: 'The layer cake',
        concept:
          'A computer is layers, and each one only talks to its neighbours. At the bottom is hardware — the chip, the memory, the disk. Above it the kernel, the traffic cop, the only thing allowed to touch hardware directly. Above that macOS: Finder, windows, permissions. Above that the shell. And on top, applications.',
        aside:
          'Once you can see the layers, a lot of confusing things stop being confusing.',
        game: 'stack',
      },
      {
        id: 'w-doors',
        title: 'Two doors, one house',
        concept:
          'Here is the part most people never think about. When you drag a file to the trash in Finder, and when you type a command to delete it, the same thing happens underneath. Finder is a set of pictures wrapped around the things the shell does with words. Neither one is more real.',
        aside:
          'The terminal is not a secret hacker mode. It is the same door without the decoration — which makes it faster, and much easier for a program to drive.',
        quiz: {
          q: 'So what is the terminal, really?',
          options: [
            { t: 'A more dangerous version of Finder', ok: false, why: 'Not more dangerous. The same house — you can throw the same things away from either door.' },
            { t: 'Another way into the same system', ok: true, why: 'Yes. Same house, different door.' },
            { t: 'Something only programmers are allowed to use', ok: false, why: 'Nobody is checking your credentials at that door.' },
          ],
        },
      },
      {
        id: 'w-where',
        title: 'Where Claude Code sits',
        concept:
          'Claude Code is an application that drives the shell. The thinking happens on Anthropic\'s machines; what lives on your Mac is a program that sends your request up, gets back a decision — read this file, run this command — and carries it out down here.',
        aside:
          'Which means: it can reach exactly what you can reach. Not more. If you could delete it by typing, so can it. That is why it stops and asks before doing things.',
        quiz: {
          q: 'Claude Code wants to delete a file and asks first. Why?',
          options: [
            { t: 'It is unsure whether the command will work', ok: false, why: 'It is not asking about syntax. It is asking about consequences.' },
            { t: 'Because it has your permissions, and the kernel will do it', ok: true, why: 'Exactly. Real command, real filesystem. The prompt is the only thing between the two.' },
            { t: 'It is a formality, the file is backed up', ok: false, why: 'Nothing is backed up by default. Assume gone means gone.' },
          ],
        },
      },
    ],
  },

  /* ------------------------------------------------------------ YELLOW -- */
  {
    id: 'yellow',
    name: 'Yellow Belt',
    motto: 'Open the door.',
    intro:
      'Now you open it. You will type a few things by hand today — not to memorise them, but so the window stops being frightening.',
    handTyped: true,
    katas: [
      {
        id: 'y-open',
        title: 'Open the terminal',
        concept:
          'Applications, then Utilities, then Terminal. Or hold Command, press Space, type "terminal", press return. You get a window with a blinking cursor. That cursor is sitting in a program called zsh, which reads what you type and runs it.',
        aside:
          'Nothing you type today can hurt you. Everything here is something you could have done by clicking.',
      },
      {
        id: 'y-where',
        title: 'Where am I, and what is here',
        concept:
          'You are always standing in some folder. When you open Terminal you start in your home folder — the one with your name on it, written as ~ for short. Commands act on wherever you are standing, and forgetting that causes about half of all beginner confusion.',
        command: 'pwd\nls',
        cmdNote:
          'pwd is print working directory: where am I. ls is list: what is in here. Try ls -la too — the a shows hidden files, the ones starting with a dot, which are almost always settings.',
        check: 'pwd',
        checkPrompt: 'Run pwd and paste what came back.',
      },
      {
        id: 'y-make',
        title: 'Make a folder and walk into it',
        concept:
          'Now do the thing you will do a hundred times. Make a folder, go into it, prove you are there, and come back out. Nothing here is different from making a folder in Finder — it is the same folder, made through the other door.',
        command: 'mkdir practice\ncd practice\npwd\ncd ..',
        cmdNote:
          'mkdir makes a directory. cd changes into it. pwd proves you actually moved — the path now ends in /practice. cd .. climbs one level back up.',
        aside:
          'Three ways out, and they are not the same. cd .. goes up one level. cd with nothing after it goes all the way home, from anywhere — the fastest way to un-lose yourself. cd - goes back to wherever you just were, like an undo for walking.',
        check: 'inside',
        checkPrompt: 'From inside the practice folder, run pwd and paste it.',
      },
      {
        id: 'y-tab',
        title: 'Two keys worth keeping',
        concept:
          'Tab finishes what you are typing. Start a folder name, press Tab, and the shell completes it — which also proves the folder exists, because it cannot complete something that is not there. Use it constantly; it prevents typos before they happen.',
        aside:
          'And Ctrl+C cancels whatever is running. If something is stuck or pouring text down the screen, that is your way out. You will use it again in a minute for something bigger.',
        youKnow: 'Try Tab now: type cd Doc and press Tab. It should finish Documents for you.',
      },
    ],
  },

  /* ------------------------------------------------------------ ORANGE -- */
  {
    id: 'orange',
    name: 'Orange Belt',
    motto: 'Get your partner.',
    intro: 'This is the belt that matters. Everything before it was so this would make sense.',
    handTyped: true,
    katas: [
      {
        id: 'o-install',
        title: 'Install Claude Code',
        concept:
          'One command from the official page. It is self-contained and keeps itself updated — you do not need Homebrew or anything else first.',
        link: { href: 'https://code.claude.com/docs/en/overview', label: 'code.claude.com/docs' },
        aside:
          'You already have an Anthropic account. If the shell says "command not found" afterwards, open a brand new terminal window — the old one does not know the program exists yet.',
        check: 'claude',
        checkPrompt: 'Run claude --version and paste what it says.',
      },
      {
        id: 'o-first',
        title: 'Run it — and notice where',
        concept:
          'This is why you learned cd first. Claude Code works on the folder you start it in. Walk into your practice folder, start it there, and ask what is in here — it will know about that folder and nothing above it. Start it somewhere else and it sees somewhere else.',
        command: 'cd ~/practice\nclaude',
        cmdNote:
          'One word to start it. Ctrl+C twice, or /exit, to leave. That scoping is not a detail — it is why a project can keep its own notes and its own tools, which is most of what the later belts are about.',
        youKnow: 'You will know it worked when it answers you, and when it does not know about files outside that folder.',
      },
      {
        id: 'o-stop',
        title: 'How to make it stop',
        concept:
          'Before you learn anything else about it, learn how to end it. Ctrl+C — hold Control, press C. Once cancels whatever Claude is currently doing. Twice closes the session entirely. It is the same Ctrl+C that stops anything runaway in a terminal, so it is worth having in your hands early.',
        aside:
          'Also useful should the machines ever become self-aware. Less flippantly: the reason to know this on day one is that "I could not make it stop" is the thing that actually frightens people, and it takes two keys.',
        command: 'Ctrl+C        cancel what it is doing\nCtrl+C Ctrl+C  close the session\n/exit         the polite version',
        cmdNote: 'Nothing is lost by stopping. Start it again with claude and carry on.',
        youKnow: 'You will know it worked when you are back at your own prompt.',
      },
      {
        id: 'o-permission',
        title: 'Start it back up',
        concept:
          'You just pressed Ctrl+C, so Claude is closed and you are back at a bare prompt. Type claude and say hello.',
        command: 'claude',
        aside:
          'While you are in there, ask it to make a file. It will stop and ask permission first — read what it wants to run, then approve it. That prompt is the thing the next lesson turns off.',
        youKnow: 'You will know it worked when it says hello back.',
      },
      {
        id: 'o-danger',
        title: 'Taking the training wheels off',
        concept:
          'There is a flag that turns the permission prompt off entirely: --dangerously-skip-permissions. Claude then runs whatever it decides to run, immediately, without asking. You are going to use it — in the dojo, deliberately, so that you understand it rather than meet it as a rumour.',
        aside:
          'Why now: forty prompts in a row teaches you to click yes without reading, which is worse than knowing what the flag does. And the dojo is a folder you can throw away and clone again in five seconds.',
        command: 'claude --dangerously-skip-permissions',
        cmdNote:
          'Read this part twice, because it is the part people get wrong. The flag is NOT limited to the folder you are standing in. It is not a sandbox. Claude can reach anything your account can reach — your Documents, your Desktop, anything you could delete yourself. Being in the dojo folder does not fence it in; it only means the thing you are watching it do is disposable.',
        youKnow:
          'Use it here while you are learning what it does. Turn it off — just run claude — for anything you would be upset to lose. That is the whole rule.',
      },
      {
        id: 'o-home',
        title: 'Bring the dojo home',
        concept:
          'The rest of your training lives on your machine, in a folder, where your partner can read your work instead of taking your word for it. This is the first thing you ask for rather than type.',
        ask: 'Clone https://github.com/lakotafox/dojo into a folder called dojo in my home directory, then read the dojo skill and be my sensei.',
        askNote: 'Both halves in one breath. It clones the folder, reads the teaching file inside it, and carries straight on — no restarting, no second terminal.',
        command: 'git clone https://github.com/lakotafox/dojo ~/dojo',
        cmdNote: 'git is version control. clone means: make me a copy of that.',
        youKnow: 'You will know it worked when sensei greets you — in the same session, without you going anywhere. That is the end of this page. Everything else happens with him.',
      },
    ],
  },

];

/** Belts past this point are taught in the terminal, not here. */
export const TERMINAL_BELTS = [
  { id: 'blue', name: 'Blue Belt', motto: 'Your own words.', teaser: 'Write a CLAUDE.md — the file that tells your partner about your project before you have to.' },
  { id: 'brown', name: 'Brown Belt', motto: 'Kata.', teaser: 'Write a skill. Teach Claude a procedure once, and it knows it forever.' },
  { id: 'black', name: 'Black Belt', motto: 'Reach.', teaser: 'Connect Claude to the dojo itself, and watch it award your own belt.' },
];
