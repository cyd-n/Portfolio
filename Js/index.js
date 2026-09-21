function portfolio() {
  return {
    activeProject: 0,

    langs: [
      { name: 'C#',         level: 'ADVANCED',              pct: 85 },
      { name: 'PYTHON',     level: 'INTERMEDIATE',          pct: 70 },
      { name: 'JAVASCRIPT', level: 'INTERMEDIATE',          pct: 65 },
      { name: 'PHP',        level: 'JUNIOR-INTERMEDIATE',   pct: 50 },
      { name: 'RUST',       level: 'JUNIOR',                pct: 40},
      { name: 'C++',        level: 'BEGINNER-JUNIOR',       pct: 25 },
    //  { name: 'LUA',        level: 'UNKOWN',                pct: 0 },
    //  { name: 'JAVA',       level: 'UNKOWN',                pct: 0 },
    //  { name: 'C',          level: 'UNKOWN',       pct: 0 },
    //  { name: 'KOTLIN',     level: 'UNKOWN',              pct: 0 },
    //  { name: 'DART',       level: 'UNKOWN',              pct: 0 },
    ],

    projects: [ 
      {
        name: 'V-CONSOLE',
        short: 'V-CON',
        img: "",
        icon: '🖥️',
        state: "Canceled do to i use linux now and WinForm don't work on linux",
        date: "2026",
        desc: 'Custom virtual game console with GPU framebuffer, RGB565 color encoding, VRAM, RAM, ROM architecture and custom CPU in C#. A complete custom computing platform.',
        tags: ['C#', 'WinForms', 'GPU', 'RGB565', 'Emulation'],
        liveDemo: false,
        liveDemoUrl: "",
        git:"https://github.com/cyd-n/V-console" }, 
        {
        name: 'QIBYTE VM',
        short: 'QB',
        img: "",
        icon: '⚙️',
        state: "In waitlist",
        date: "2025",
        desc: 'Stack-based virtual machine with custom instruction set and bytecode. Implements Forth-like semantics with full arithmetic, stack manipulation and planned binary format.',
        tags: ['C#', 'VM', 'Bytecode', 'Compiler Theory'],
        liveDemo: false,
        liveDemoUrl: "",
        git:"https://github.com/cyd-n/QiByte" }, 
        {
        name: 'Altair AI',
        short: 'AI',
        img: 'Imgs/Altair.png',
        icon: '🤖',
        state: "In waitlist",
        date: "2026",
        desc: 'Configurable AI assistant with dynamic prompt engineering, persistent settings, TTS integration and retro terminal UI. Supports multiple AI personalities and Gemini models.',
        tags: ['JavaScript', 'Alpine.js', 'Gemini API', 'TTS', 'Prompt Engineering', 'AI'],
        liveDemo: true,
        liveDemoUrl: "https://cyd-n.github.io/Altair/",
        git:"https://github.com/cyd-n/Athena" },
      {
        name: 'IDE',
        short: 'IDE',
        icon: '💻',
        img: "",
        state: "Canceled do to i use linux now and WinForm don't work on linux",
        date: "2025",
        desc: 'Lightweight multi-language desktop IDE built in one day. Supports 8 languages with real compiler integration, colored error output and temp project management.',
        tags: ['C#', 'WinForms', 'Process API', '8 Languages'],
        liveDemo: false,
        liveDemoUrl: "",
        git:"https://github.com/cyd-n/IDE" },
        
      {
        icon: '🔧',
        name: 'BROWSER COMPILER',
        short: 'COMP',
        img: 'Imgs/Compiler.png',
        desc: 'In-browser code runner supporting JavaScript, TypeScript, Lua, Ruby and Markdown using real language runtimes. Features console.log capture and download.',
        tags: ['JavaScript', 'Alpine.js'],
        state: "Done for now",
        date: "2025",
        liveDemo: true,
        liveDemoUrl: "https://compiler.cyd-n.nl/",
        git:"https://github.com/cyd-n/Online-compiler" },
      {
        icon: '🌤️',
        name: 'WEATHER DASHBOARD',
        short: 'WTH',
        img: 'Imgs/Weather.png',
        desc: 'Weather app with hourly Chart.js temperature graphs, air quality data, astronomy info and 3-day forecast. Built with WeatherAPI.',
        tags: ['JavaScript', 'Chart.js', 'Alpine.js', 'REST API'],
        state: "Done for now",
        date: "2025",
        liveDemo: true,
        liveDemoUrl: "https://cyd-n.github.io/weather-app/",
        git:"https://github.com/cyd-n/weather-app/tree/main" },
      {
        icon: '🔲',
        name: 'MusicCoreT, NuGet Library',
        short: 'MCT',
        img: 'Imgs/TERMINAL.png',
        desc: 'A packaged NuGet library for playing music in console and text-based games. Provides a clean API with note, playlist, and player classes. Playback runs on a background thread so the game loop is never blocked. Supports 3 octaves across all 7 notes with method overloading for flexible use.',
        tags: ['C#', 'NuGet', 'Music'],
        state: "Done for now",
        date: "2024",
        liveDemo: false,
        liveDemoUrl: "",
        git:"https://github.com/cyd-n/MusicCoreT" },
        {
        icon: '💻',
        name: 'logic gate Game',
        short: 'LGM',
        img: '💻',
        desc: 'CA mobile logic gate game, to learn abut logic gates. It is horible and disconituened',
        tags: ['Unity', 'C#'],
        state: "Done for now",
        date: "2026",
        liveDemo: false,
        liveDemoUrl: "",
        git:"https://github.com/cyd-n/LogicGate-Mobile-Game" },
        {
        icon: '💻',
        name: 'VPET',
        short: 'VPET',
        img: 'Imgs/VPet.png',
        desc: 'Browser Tamagotchi Game A fully playable Tamagotchi-style virtual pet game rendered in a GameBoy-style browser shell. Uses the Canvas API for all rendering, a stat system with time-based decay, an inventory with Food and Toy classes, D-pad controls, and async timed actions for sleep and bath states. Includes a game over screen.',
        tags: ['JavaScript', 'Canvas API', 'Asynce', 'Alpine.js'],
        state: "Done for now",
        date: "2025",
        liveDemo: true,
        liveDemoUrl: "https://cyd-n.github.io/VPet/",
        git:"https://github.com/cyd-n/VPet" },
        {
          icon: '💻',
        name: 'logic gate mobile game',
        short: 'MCT',
        img: 'Imgs/LogicGate.png',
        desc: 'A mobile logic gate game, to learn abut logic gates. It is horible and disconituened',
        tags: ['C#', 'Unity', 'Andriod'],
        state: "Done for now",
        date: "2026",
        liveDemo: false,
        liveDemoUrl: "",
        git:"https://github.com/cyd-n/LogicGate-Mobile-Game" },
    ],

    init() {
      // Scroll reveal
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
          }
        });
      }, { threshold: 0.1 });

      document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    }
  }
}