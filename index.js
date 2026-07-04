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
  let activeCelestialIcon = null;
  
  
  const lumeToggle = document.getElementById('lumeToggle');
  const soundToggle = document.getElementById('soundToggle');
  
  const celestialIcons = {
    sun: `
      <svg class="weather-svg" viewBox="0 0 100 100" aria-label="Sun icon">
        <circle class="sun-core" cx="50" cy="50" r="18" />
        <g class="sun-rays" style="stroke-width: 4; stroke-linecap: round;">
          <line x1="50" y1="10" x2="50" y2="22" />
          <line x1="50" y1="78" x2="50" y2="90" />
          <line x1="10" y1="50" x2="22" y2="50" />
          <line x1="78" y1="50" x2="90" y2="50" />
          <line x1="22" y1="22" x2="30" y2="30" />
          <line x1="70" y1="70" x2="78" y2="78" />
          <line x1="78" y1="22" x2="70" y2="30" />
          <line x1="30" y1="70" x2="22" y2="78" />
        </g>
      </svg>
    `,
    moon: `
      <svg class="weather-svg" viewBox="0 0 100 100" aria-label="Moon icon">
        <circle class="moon-shell" cx="52" cy="50" r="24" />
        <circle class="moon-cut" cx="64" cy="44" r="22" />
      </svg>
    `
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
    updateCelestialIcon(now);
    
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

  // Day/Night icon integration
  function updateCelestialIcon(now) {
    const hour = now.getHours();
    const nextIcon = (hour >= 18 || hour < 6) ? 'moon' : 'sun';

    if (activeCelestialIcon === nextIcon) {
      return;
    }

    activeCelestialIcon = nextIcon;
    weatherIconContainer.innerHTML = celestialIcons[nextIcon];
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
  updateCelestialIcon(new Date());
  updateClock();

  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(err => {
        console.log('Service Worker registration failed:', err);
      });
    });
  }
});

