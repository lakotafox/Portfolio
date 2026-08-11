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
    motto: 'Feel the room.',
    intro:
      'Now you open it. You will type a few things by hand today. Not to memorise them — to feel the room in the dark once, so you know its shape.',
    handTyped: true,
    katas: [
      {
        id: 'y-open',
        title: 'Open the terminal',
        concept:
          'Applications, then Utilities, then Terminal. Or hold Command and press Space, type "terminal", press return. You get a window with a blinking cursor. That cursor is sitting in a program called zsh, which reads what you type and runs it.',
        aside: 'Nothing in this window can hurt you today. Everything you type is something you could have clicked.',
      },
      {
        id: 'y-pwd',
        title: 'Where am I?',
        concept:
          'You are always standing somewhere. Commands act on that place unless you tell them otherwise, which is the source of about half of all beginner confusion.',
        command: 'pwd',
        cmdNote: 'Print working directory. It answers one question: where am I standing?',
        check: 'pwd',
        checkPrompt: 'Type it, press return, and paste what came back.',
      },
      {
        id: 'y-ls',
        title: 'What is here?',
        concept:
          'The same folder Finder shows you, listed as words. Adding -la shows the hidden files too — the ones starting with a dot, which are almost always configuration.',
        command: 'ls\nls -la',
        cmdNote: 'ls lists. The -la part is a flag: l for a long detailed listing, a for all, including hidden.',
        check: 'ls',
        checkPrompt: 'Run ls and paste the list.',
      },
      {
        id: 'y-move',
        title: 'Moving around',
        concept:
          'cd means change directory. Three of them cover almost everything: into a folder by name, up one level, or home.',
        command: 'cd Documents\ncd ..\ncd ~',
        cmdNote:
          'The .. means the folder above this one. The ~ means your home folder. Start typing a folder name and press Tab — the shell finishes it for you, which also proves the folder exists.',
        aside:
          'Two more worth knowing forever: Ctrl+C cancels whatever is running, and typing open followed by a dot opens the folder you are standing in, in Finder.',
      },
    ],
  },

  /* ------------------------------------------------------------ ORANGE -- */
  {
    id: 'orange',
    name: 'Orange Belt',
    motto: 'Get your partner.',
    intro:
      'One more thing you install by hand. After this, you stop memorising and start asking.',
    handTyped: true,
    katas: [
      {
        id: 'o-install',
        title: 'Install Claude Code',
        concept:
          'Claude Code is the program that lets you say what you want instead of remembering how to ask for it. Install it from the official instructions — use the native installer rather than npm if you are offered the choice; it is self-contained and keeps itself updated.',
        link: { href: 'https://code.claude.com/docs/en/overview', label: 'code.claude.com/docs' },
        aside:
          'You will need an Anthropic account, which you already have. If the shell says "command not found" afterwards, open a brand new terminal window — the old one does not know the program exists yet.',
        check: 'claude',
        checkPrompt: 'Run claude --version and paste what it says.',
      },
      {
        id: 'o-first',
        title: 'Say hello',
        concept:
          'Type claude and press return, in any folder. You are now in a session. Ask it something small and harmless — what is in this folder, what does this file do. Watch it ask permission before it does anything real. Read the command it wants to run before you approve it. That habit is the whole safety model.',
        command: 'claude',
        cmdNote: 'That is it. One word. Press Ctrl+C twice, or type /exit, to leave.',
      },
    ],
  },

  /* ------------------------------------------------------------- GREEN -- */
  {
    id: 'green',
    name: 'Green Belt',
    motto: 'Ask, do not type.',
    intro:
      'Everything changes here. You have a partner now. You will still be shown every command — so it is never magic, and you are never helpless — but you will not be asked to remember one again.',
    katas: [
      {
        id: 'g-brew',
        title: 'A package manager',
        concept:
          'Homebrew fetches command-line software, puts it somewhere sensible, and keeps it updated. macOS does not ship with one, so almost every Mac setup guide you will ever read assumes you have it.',
        ask: 'I need Homebrew on this machine.',
        command: '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
        cmdNote:
          'That is what Claude will run. curl downloads the installer, bash runs it. Afterwards the installer prints two lines about PATH — that is the step everybody skips, and skipping it is why brew says "command not found" forever after. Let Claude finish it.',
        check: 'brew',
        checkPrompt: 'Paste what brew --version says.',
      },
      {
        id: 'g-doctor',
        title: 'Is it healthy?',
        concept:
          'Homebrew ships with a self-check. It almost never comes back perfectly clean on a real machine, and that is fine — warnings are notes, not faults.',
        ask: 'Is my Homebrew set up correctly?',
        command: 'brew doctor',
        cmdNote: 'The best case prints "Your system is ready to brew." Anything starting with Warning: is usually something you can ignore. Ask Claude if a particular one matters.',
        check: 'brewdoctor',
        checkPrompt: 'Paste what it said, warnings and all.',
      },
      {
        id: 'g-cowsay',
        title: 'Install something useless',
        concept:
          'A cow that repeats what you say. It is a joke program, and it is a genuinely good first install, because you get instant unambiguous proof that the whole chain worked: a package manager fetched software from the internet, it landed on your machine, your shell found it, and it ran.',
        ask: 'Install cowsay and fortune, then make the cow say hello.',
        command: 'brew install cowsay fortune\ncowsay hello',
        cmdNote: 'brew install takes as many names as you like. Try cowsay -l to list the other characters, and cowsay -f dragon rawr to pick one.',
        check: 'cowsay',
        checkPrompt: 'Paste the cow.',
      },
      {
        id: 'g-pipe',
        title: 'The pipe',
        concept:
          'fortune prints a random quotation. cowsay prints whatever you hand it. Neither knows the other exists. The shell can take what one prints and feed it straight into the other — and that is why command-line tools are all small and boring on their own. They are built to be joined together.',
        ask: 'Make the cow say a random fortune.',
        command: 'fortune | cowsay',
        cmdNote: 'That vertical bar is the pipe. Output of the left, into the right.',
        game: 'pipe',
        check: 'pipe',
        checkPrompt: 'Paste the cow with its fortune.',
      },
      {
        id: 'g-dojo',
        title: 'Bring the dojo home',
        concept:
          'The rest of your training does not live on a web page. It lives on your machine, in a folder, where your partner can actually read your work instead of taking your word for it.',
        ask: 'Clone https://github.com/lakotafox/dojo into a folder called dojo in my home directory.',
        askNote: 'Everything after this belt lives in there.',
        command: 'git clone https://github.com/lakotafox/dojo ~/dojo',
        cmdNote: 'git is version control — it will come up again. clone means make me a copy of that.',
      },
      {
        id: 'g-serve',
        title: 'A server of your own',
        concept:
          'A server is not a machine in a warehouse. It is a program that hands out files when something asks for them. Run one in the dojo folder and your own browser can ask it for the dashboard.',
        ask: 'Spin up a local server for the dojo on any open port.',
        askNote:
          'Say "any open port" rather than naming one. Claude will find a free door instead of walking into an occupied one.',
        command: 'python3 -m http.server 8080',
        cmdNote:
          'python3 comes with macOS. The 8080 is the port — which door it listens on. The address it gives you back starts with localhost, or 127.0.0.1, and both mean: this machine only. Nothing leaves your Mac. And notice the terminal is now busy holding it open. That is not frozen. That is running.',
        check: 'server',
        checkPrompt: 'Paste the address it gave you.',
      },
      {
        id: 'g-hygiene',
        title: 'Put it away',
        concept:
          'This is the part every tutorial skips. A server keeps running long after you stop thinking about it. Leave a few lying around and your machine slows down, and the next one fails with "address already in use" — a message that means nothing until someone explains it.',
        ask: 'What is running on my machine right now? Is anything holding a port open?',
        askNote: 'Then, when you are finished for the day: "shut down that server for me."',
        command: 'lsof -i -P | grep LISTEN',
        cmdNote:
          'You do not need this in your head. You need to know that something can be occupying a port, and that you can ask. That is the durable part.',
        check: 'ports',
        checkPrompt: 'Paste what is listening.',
        aside:
          'From here on, start every session by asking what is still running from last time.',
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
