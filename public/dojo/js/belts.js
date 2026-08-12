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
        id: 'y-around',
        title: 'Know where you are',
        concept:
          'You are always standing in some folder, and commands act on that folder unless told otherwise. That single fact is the source of about half of all beginner confusion. Three words cover it: pwd tells you where you are, ls shows what is here, cd moves you.',
        command: 'pwd\nls\ncd ~',
        cmdNote:
          'Print working directory. List. Change directory. The ~ means home. Press Tab while typing a folder name and the shell finishes it for you — which also proves the folder exists. Ctrl+C cancels anything that is running.',
        check: 'pwd',
        checkPrompt: 'Run pwd and paste what came back. That is the last thing I will ask you to paste.',
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
        title: 'Run it',
        concept:
          'Type claude and press return. You are in a session. Ask it something real about the folder you are standing in — what is in here, what does this file do. Talk to it in sentences; there are no commands to learn.',
        command: 'claude',
        cmdNote: 'One word. Ctrl+C twice, or /exit, to leave.',
        youKnow: 'You will know it worked when it answers you.',
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
        title: 'The permission prompt',
        concept:
          'Ask it to do something that changes a file — make a note, rename something. It will stop and ask before it runs the command. Read what it wants to run before you approve it. That habit is the entire safety model, and it is worth building on day one.',
        aside:
          'It has exactly your permissions. Not more. If you could delete something by typing, so can it — which is why it asks.',
        youKnow: 'You will know it worked when it stops and waits for you.',
      },
      {
        id: 'o-danger',
        title: 'The flag you will be told to use',
        concept:
          'There is a flag that turns the permission prompt off completely: --dangerously-skip-permissions. You will see people online recommend it, usually enthusiastically, usually without context. It does exactly what it says — Claude runs anything it decides to run, immediately, with your full permissions and no chance to read it first.',
        aside:
          'It is not forbidden knowledge and it has real uses once you know what you are watching for. But it is something you graduate to, not something you start with, and never in a folder you would mind losing. Two things should be true first: you have spent real time reading the commands before approving them, and you know how to undo what just happened. Neither is true yet. That is the whole lesson.',
        command: 'claude --dangerously-skip-permissions',
        cmdNote: 'Now you know what it is, so nobody can sell it to you as a productivity tip.',
        youKnow: 'Nothing to do here. Keep the prompts on.',
      },
      {
        id: 'o-home',
        title: 'Bring the dojo home',
        concept:
          'The rest of your training lives on your machine, in a folder, where your partner can read your work instead of taking your word for it. This is the first thing you ask for rather than type.',
        ask: 'Clone https://github.com/lakotafox/dojo into a folder called dojo in my home directory, then tell me how to start it.',
        askNote: 'The second half matters. Ask it what to do next and it will read the folder and tell you, instead of leaving you standing there.',
        command: 'git clone https://github.com/lakotafox/dojo ~/dojo',
        cmdNote: 'git is version control. clone means: make me a copy of that.',
        youKnow: 'You will know it worked when a folder called dojo appears in your home, and Claude tells you to run /dojo inside it.',
      },
    ],
  },

  /* ------------------------------------------------------------- GREEN -- */
  {
    id: 'green',
    name: 'Green Belt',
    motto: 'Ask, do not type.',
    intro:
      'You have a partner now. From here you describe what you want and let it handle the syntax — while always being shown what it ran, so it never becomes magic and you are never stuck without it.',
    katas: [
      {
        id: 'g-serve',
        title: 'A server of your own',
        concept:
          'A server is not a machine in a warehouse. It is a program that hands out files when something asks for them. Run one inside the dojo folder and your own browser can ask it for your training dashboard.',
        ask: 'Spin up a local server for the dojo on any open port.',
        askNote:
          'Say "any open port" rather than naming one — it will find a free door instead of walking into an occupied one.',
        command: 'python3 -m http.server 8080',
        cmdNote:
          'python3 comes with macOS. The number is the port — which door it listens on. The address it hands back starts with localhost, or 127.0.0.1, and both mean: this machine only, nothing leaves your Mac. Notice the terminal is now busy holding it open. That is not frozen. That is running.',
        youKnow: 'Open the address it gives you. Your dojo should be looking back at you.',
      },
      {
        id: 'g-hygiene',
        title: 'Put it away',
        concept:
          'This is the part every tutorial skips. A server keeps running long after you stop thinking about it. Leave a few lying around and the machine drags, and the next one fails with "address already in use" — a message that means nothing until someone explains it.',
        ask: 'What is running on my machine right now? Is anything holding a port open?',
        askNote: 'And when you are done for the day: "shut that server down for me."',
        command: 'lsof -i -P | grep LISTEN',
        cmdNote:
          'You do not need that in your head. You need to know that something can be occupying a port, and that you can ask. That is the part that lasts.',
        youKnow: 'Start every session from now on by asking what is still running.',
      },
      {
        id: 'g-terminal',
        title: 'Meet me in the terminal',
        concept:
          'That is everything a web page can teach you. The rest happens in the dojo folder, where I can check your work instead of believing you.',
        ask: 'Open the dojo folder and run claude there, then type /dojo.',
        askNote: 'Leave the dashboard open in a browser tab while you work. It watches your progress.',
        command: 'cd ~/dojo\nclaude',
        cmdNote: 'Then type /dojo and press return.',
        youKnow: 'You will know it worked when I greet you by rank.',
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
