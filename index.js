document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const ticksContainer = document.getElementById('ticksContainer');
  const hourHand = document.getElementById('hourHand');
  const minuteHand = document.getElementById('minuteHand');
  const secondHand = document.getElementById('secondHand');
  
  const digitalDate = document.getElementById('digitalDate');
  const digitalTime = document.getElementById('digitalTime');
  const digitalAmPm = document.getElementById('digitalAmPm');
  
  const weatherIconContainer = document.getElementById('weatherIconContainer');
  const weatherTemp = document.getElementById('weatherTemp');
  const weatherDesc = document.getElementById('weatherDesc');
  
  
  const lumeToggle = document.getElementById('lumeToggle');
  const soundToggle = document.getElementById('soundToggle');
  
  // Weather SVG Presets
  const weatherPresets = {
    sunny: {
      temp: '76°F',
      desc: 'Clear Sky',
      svg: `
        <svg class="weather-svg" viewBox="0 0 100 100" aria-label="Sunny weather icon">
          <circle class="sun-element" cx="50" cy="50" r="20" />
          <g class="sun-element" style="stroke: #f39c12; stroke-width: 4; stroke-linecap: round;">
            <line x1="50" y1="10" x2="50" y2="20" />
            <line x1="50" y1="80" x2="50" y2="90" />
            <line x1="10" y1="50" x2="20" y2="50" />
            <line x1="80" y1="50" x2="90" y2="50" />
            <line x1="22" y1="22" x2="29" y2="29" />
            <line x1="71" y1="71" x2="78" y2="78" />
            <line x1="78" y1="22" x2="71" y2="29" />
            <line x1="29" y1="71" x2="22" y2="78" />
          </g>
        </svg>
      `
    },
    cloudy: {
      temp: '64°F',
      desc: 'Overcast',
      svg: `
        <svg class="weather-svg" viewBox="0 0 100 100" aria-label="Cloudy weather icon">
          <path class="cloud-dark-element" d="M28 62h32a13 13 0 0 0 3-25.5 16 16 0 0 0-30-5A11 11 0 0 0 18 45a14 14 0 0 0 10 17z" />
          <path class="cloud-element" d="M38 72h32a13 13 0 0 0 3-25.5 16 16 0 0 0-30-5A11 11 0 0 0 28 55a14 14 0 0 0 10 17z" />
        </svg>
      `
    },
    rainy: {
      temp: '58°F',
      desc: 'Showers',
      svg: `
        <svg class="weather-svg" viewBox="0 0 100 100" aria-label="Rainy weather icon">
          <path class="cloud-element" d="M32 55h32a13 13 0 0 0 3-25.5 16 16 0 0 0-30-5A11 11 0 0 0 22 38a14 14 0 0 0 10 17z" />
          <g>
            <line class="raindrop-element" x1="38" y1="62" x2="33" y2="74" />
            <line class="raindrop-element" x1="48" y1="62" x2="43" y2="74" />
            <line class="raindrop-element" x1="58" y1="62" x2="53" y2="74" />
          </g>
        </svg>
      `
    },
    stormy: {
      temp: '62°F',
      desc: 'T-Storm',
      svg: `
        <svg class="weather-svg" viewBox="0 0 100 100" aria-label="Stormy weather icon">
          <path class="cloud-dark-element" d="M32 55h32a13 13 0 0 0 3-25.5 16 16 0 0 0-30-5A11 11 0 0 0 22 38a14 14 0 0 0 10 17z" />
          <polygon class="lightning-element" points="46,55 53,68 45,70 50,83 39,69 47,67" />
          <g>
            <line class="raindrop-element" x1="34" y1="62" x2="29" y2="74" />
            <line class="raindrop-element" x1="56" y1="62" x2="51" y2="74" />
          </g>
        </svg>
      `
    },
    snowy: {
      temp: '28°F',
      desc: 'Snowing',
      svg: `
        <svg class="weather-svg" viewBox="0 0 100 100" aria-label="Snowy weather icon">
          <path class="cloud-element" d="M32 55h32a13 13 0 0 0 3-25.5 16 16 0 0 0-30-5A11 11 0 0 0 22 38a14 14 0 0 0 10 17z" />
          <g>
            <circle class="snow-element" cx="35" cy="65" r="2.2" />
            <circle class="snow-element" cx="47" cy="63" r="2.8" />
            <circle class="snow-element" cx="58" cy="66" r="1.8" />
          </g>
        </svg>
      `
    }
  };

  // Web Audio Variables for Ticking Sound
  let audioContext = null;
  let nextTickTime = 0;
  let tickingIntervalId = null;
  const TICK_RATE_HZ = 4; // 4 ticks per second (automatic watch sweep beat)
  const TICK_INTERVAL = 1 / TICK_RATE_HZ;

  // Initialize Watch Dial Ticks (60 ticks: 12 large hour ticks, 48 small minute ticks)
  function initTicks() {
    for (let i = 0; i < 60; i++) {
      const tick = document.createElement('div');
      tick.classList.add('tick');
      
      // Determine if hour tick
      if (i % 5 === 0) {
        tick.classList.add('hour');
        // Quarters get accent highlights
        if (i % 15 === 0) {
          tick.classList.add('hour-accent');
        }
      } else {
        tick.classList.add('minute');
      }
      
      // Position tick using CSS transform rotation
      tick.style.transform = `rotate(${i * 6}deg)`;
      ticksContainer.appendChild(tick);
    }
  }

  // Update Analog Clock Hands & Digital Clock
  function updateClock() {
    const now = new Date();
    
    // 1. Continuous Analog Hands Rotations (Sweeping second hand)
    const ms = now.getMilliseconds();
    const seconds = now.getSeconds() + ms / 1000;
    const minutes = now.getMinutes() + seconds / 60;
    const hours = (now.getHours() % 12) + minutes / 60;
    
    const secondDegrees = seconds * 6; // 360 / 60 = 6 deg
    const minuteDegrees = minutes * 6; // 360 / 60 = 6 deg
    const hourDegrees = hours * 30;    // 360 / 12 = 30 deg
    
    secondHand.style.transform = `rotate(${secondDegrees}deg)`;
    minuteHand.style.transform = `rotate(${minuteDegrees}deg)`;
    hourHand.style.transform = `rotate(${hourDegrees}deg)`;
    
    // 2. Digital Display Update
    const digitalHr = String(now.getHours() % 12 || 12).padStart(2, '0');
    const digitalMin = String(now.getMinutes()).padStart(2, '0');
    const digitalSec = String(now.getSeconds()).padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    
    digitalTime.textContent = `${digitalHr}:${digitalMin}:${digitalSec}`;
    digitalAmPm.textContent = ampm;
    
    // Digital Calendar (format: TUE, JUN 30)
    const options = { weekday: 'short', month: 'short', day: '2-digit' };
    const dateString = now.toLocaleDateString('en-US', options).toUpperCase();
    // Replace commas if any formatting discrepancies exist, to keep it clean
    digitalDate.textContent = dateString.replace(/,/g, '');
    
    // Loop
    requestAnimationFrame(updateClock);
  }

  // Weather Customizer Integration
  function setWeather(weatherKey) {
    const data = weatherPresets[weatherKey];
    if (data) {
      weatherIconContainer.innerHTML = data.svg;
      weatherTemp.textContent = data.temp;
      weatherDesc.textContent = data.desc;
    }
  }


  // Synthesize Ticking sound using Web Audio API
  function initAudio() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
  }

  function playTickSound(time) {
    if (!audioContext) return;
    
    // Synthesize escapement wheel clink (high pitch, fast decay)
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Type of oscillator
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(5800, time); // High pitched escapement tick
    osc.frequency.exponentialRampToValueAtTime(3200, time + 0.006);
    
    // High pass filter to strip out low-end thuds
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3500, time);
    
    // Envelopes for short mechanical sound duration
    gainNode.gain.setValueAtTime(0.06, time); // Low volume so it isn't annoying
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.008);
    
    osc.start(time);
    osc.stop(time + 0.01);
  }

  // Audio Scheduler Loop (Tick scheduling mechanism for high-precision time)
  function scheduler() {
    while (nextTickTime < audioContext.currentTime + 0.1) {
      playTickSound(nextTickTime);
      nextTickTime += TICK_INTERVAL;
    }
    // Call scheduler continuously while audio ticking is toggled on
    tickingIntervalId = setTimeout(scheduler, 25);
  }

  function startTicking() {
    initAudio();
    nextTickTime = audioContext.currentTime;
    scheduler();
  }

  function stopTicking() {
    if (tickingIntervalId) {
      clearTimeout(tickingIntervalId);
      tickingIntervalId = null;
    }
  }

  // --- Event Listeners & Theme Handlers ---
  
  // Theme Selectors
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetBtn = e.currentTarget;
      const theme = targetBtn.getAttribute('data-theme');
      
      // Update active state in panel UI
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      targetBtn.classList.add('active');
      
      // Switch body theme classes
      document.body.className = `theme-${theme}`;
      
      // Toggle Lume active class styling mapping if checked
      if (lumeToggle.checked) {
        document.body.classList.add('lume-active');
      }
      
    });
  });

  // Weather Customizer Selectors
  document.querySelectorAll('.weather-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetBtn = e.currentTarget;
      const weatherKey = targetBtn.getAttribute('data-weather');
      
      document.querySelectorAll('.weather-btn').forEach(b => b.classList.remove('active'));
      targetBtn.classList.add('active');
      
      setWeather(weatherKey);
    });
  });

  // Lume Mode Switcher
  lumeToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
      document.body.classList.add('lume-active');
      document.getElementById('watchDial').classList.add('lume-active');
    } else {
      document.body.classList.remove('lume-active');
      document.getElementById('watchDial').classList.remove('lume-active');
    }
  });


  // Audio Tick-tock Switcher
  soundToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
      startTicking();
    } else {
      stopTicking();
    }
  });

  // Bootstrapping the Watch face
  initTicks();
  updateClock();
  setWeather('sunny'); // Default starting weather state
});
