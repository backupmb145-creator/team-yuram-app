// ── Helpers ────────────────────────────────────────────────────────────────

function fixedEl(styles = {}) {
  const e = document.createElement('div')
  Object.assign(e.style, {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '9998',
    ...styles,
  })
  document.body.appendChild(e)
  return e
}

function run(el, keyframes, opts) {
  const anim = el.animate(keyframes, { fill: 'forwards', ...opts })
  anim.onfinish = () => el.remove()
  return anim
}

// ── A. Hexagonal ripple (all buttons) ──────────────────────────────────────

export function triggerHexRipple(e) {
  const btn = e.currentTarget ?? e.target?.closest('button')
  if (!btn) return
  const rect = btn.getBoundingClientRect()
  const x = (e.clientX ?? rect.left + rect.width / 2) - rect.left
  const y = (e.clientY ?? rect.top  + rect.height / 2) - rect.top
  const size = Math.max(rect.width, rect.height) * 2.2

  const el = document.createElement('div')
  Object.assign(el.style, {
    position: 'absolute',
    left: `${x - size / 2}px`,
    top:  `${y - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
    background: 'rgba(240,192,64,0.35)',
    pointerEvents: 'none',
    zIndex: '10',
    borderRadius: '4px',
  })

  const prevOverflow = btn.style.overflow
  const prevPos = btn.style.position
  btn.style.overflow = 'hidden'
  btn.style.position = 'relative'
  btn.appendChild(el)

  el.animate(
    [{ transform: 'scale(0)', opacity: 0.85 }, { transform: 'scale(1)', opacity: 0 }],
    { duration: 420, easing: 'ease-out', fill: 'forwards' }
  ).onfinish = () => {
    el.remove()
    btn.style.overflow = prevOverflow
    btn.style.position = prevPos
  }
}

// ── B. Invocation (+ Tournoi button) ───────────────────────────────────────

export function triggerInvocation(btn) {
  if (!btn) return
  const rect = btn.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top  + rect.height / 2

  // Flash on button
  const flash = document.createElement('div')
  Object.assign(flash.style, {
    position: 'absolute', inset: '0',
    background: 'rgba(255,255,255,0.85)',
    borderRadius: 'inherit',
    pointerEvents: 'none', zIndex: '20',
  })
  btn.style.position = 'relative'
  btn.appendChild(flash)
  flash.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'forwards' }).onfinish = () => flash.remove()

  // Expanding gold ring
  const ring = fixedEl({
    left: `${cx}px`, top: `${cy}px`,
    width: '4px', height: '4px',
    border: '2px solid rgba(240,192,64,0.9)',
    borderRadius: '50%',
    transform: 'translate(-50%,-50%)',
    zIndex: '9999',
  })
  run(ring,
    [
      { width: '4px',   height: '4px',   opacity: 1, borderWidth: '2px' },
      { width: '160px', height: '160px', opacity: 0, borderWidth: '1px' },
    ],
    { duration: 700, easing: 'ease-out' }
  )

  // 8 star particles
  const symbols = ['✦', '✧', '⋆', '✦', '✧', '★', '✦', '✧']
  symbols.forEach((sym, i) => {
    const angle = (i / symbols.length) * Math.PI * 2
    const dist = 70 + Math.random() * 30
    const dx = Math.cos(angle) * dist
    const dy = Math.sin(angle) * dist

    const p = fixedEl({
      left: `${cx}px`, top: `${cy}px`,
      color: 'rgba(240,192,64,0.95)',
      fontSize: `${12 + Math.random() * 6}px`,
      fontWeight: '900',
      transform: 'translate(-50%,-50%)',
      zIndex: '9999',
    })
    p.textContent = sym

    run(p,
      [
        { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0)`, opacity: 0 },
      ],
      { duration: 650 + i * 30, easing: 'ease-out', delay: i * 20 }
    )
  })
}

// ── C. Spellcast (Clôturer le tournoi) ─────────────────────────────────────

export function triggerSpellcast(btn) {
  if (!btn) return
  const rect = btn.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top  + rect.height / 2

  const runes = ['✦', '❋', '⬡', '✧', '✦', '❋', '⬡', '✧']
  const radius = Math.max(rect.width, rect.height) * 0.75

  runes.forEach((rune, i) => {
    const startAngle = (i / runes.length) * Math.PI * 2
    const endAngle   = startAngle + Math.PI * 2

    const el = fixedEl({
      left: `${cx}px`, top: `${cy}px`,
      color: 'rgba(240,192,64,0.9)',
      fontSize: '16px',
      fontWeight: '900',
      transform: `translate(-50%,-50%) rotate(${(startAngle * 180) / Math.PI}deg) translateY(-${radius}px)`,
      zIndex: '9999',
      textShadow: '0 0 8px rgba(240,192,64,0.8)',
    })
    el.textContent = rune

    el.animate(
      [
        { transform: `translate(-50%,-50%) rotate(${(startAngle * 180) / Math.PI}deg) translateY(-${radius}px)`, opacity: 0.9 },
        { transform: `translate(-50%,-50%) rotate(${(endAngle   * 180) / Math.PI}deg) translateY(-${radius}px)`, opacity: 0 },
      ],
      { duration: 700, easing: 'ease-in', fill: 'forwards' }
    ).onfinish = () => el.remove()
  })

  // Central flash at end
  setTimeout(() => {
    const burst = fixedEl({
      left: `${cx}px`, top: `${cy}px`,
      width: '80px', height: '80px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(240,192,64,0.7), transparent 70%)',
      transform: 'translate(-50%,-50%) scale(0)',
      zIndex: '9999',
    })
    run(burst,
      [{ transform: 'translate(-50%,-50%) scale(0)', opacity: 1 },
       { transform: 'translate(-50%,-50%) scale(3)', opacity: 0 }],
      { duration: 300, easing: 'ease-out' }
    )
  }, 580)
}

// ── D. Duel Start (Lancer le round) ────────────────────────────────────────

export function triggerDuelStart() {
  const W = window.innerWidth
  const H = window.innerHeight
  const midX = W / 2
  const midY = H / 2

  // Red beam (left → center)
  const beamLeft = fixedEl({
    left: '0', top: `${midY - 2}px`,
    width: '0', height: '4px',
    background: 'linear-gradient(90deg, transparent, #c0392b)',
    boxShadow: '0 0 12px rgba(192,57,43,0.8)',
    zIndex: '9999',
    borderRadius: '0 4px 4px 0',
  })
  beamLeft.animate(
    [{ width: '0', opacity: 1 }, { width: `${midX}px`, opacity: 1 }, { width: `${midX}px`, opacity: 0 }],
    { duration: 600, easing: 'ease-in', fill: 'forwards' }
  ).onfinish = () => beamLeft.remove()

  // Blue beam (right → center)
  const beamRight = fixedEl({
    right: '0', top: `${midY - 2}px`,
    width: '0', height: '4px',
    background: 'linear-gradient(270deg, transparent, #2980b9)',
    boxShadow: '0 0 12px rgba(41,128,185,0.8)',
    zIndex: '9999',
    borderRadius: '4px 0 0 4px',
    position: 'fixed',
  })
  beamRight.animate(
    [{ width: '0', opacity: 1 }, { width: `${midX}px`, opacity: 1 }, { width: `${midX}px`, opacity: 0 }],
    { duration: 600, easing: 'ease-in', fill: 'forwards' }
  ).onfinish = () => beamRight.remove()

  // Impact flash at center
  setTimeout(() => {
    const impact = fixedEl({
      left: `${midX}px`, top: `${midY}px`,
      width: '6px', height: '6px',
      borderRadius: '50%',
      background: 'white',
      boxShadow: '0 0 40px 20px rgba(255,255,255,0.7)',
      transform: 'translate(-50%,-50%)',
      zIndex: '9999',
    })
    run(impact,
      [{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
       { transform: 'translate(-50%,-50%) scale(6)', opacity: 0 }],
      { duration: 250, easing: 'ease-out' }
    )
  }, 500)
}

// ── E. Victory Screen (clôture confirmée) ──────────────────────────────────

export function triggerVictoryScreen() {
  const overlay = fixedEl({
    inset: '0',
    background: 'radial-gradient(ellipse at center, rgba(10,16,35,0.97) 60%, rgba(8,12,24,0.99))',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    zIndex: '9999',
  })

  // DUEL END title
  const title = document.createElement('div')
  title.textContent = 'DUEL END'
  Object.assign(title.style, {
    fontFamily: 'Cinzel, serif',
    fontSize: 'clamp(36px, 8vw, 64px)',
    fontWeight: '900',
    color: '#f0c040',
    letterSpacing: '6px',
    textShadow: '0 0 40px rgba(240,192,64,0.8), 0 0 80px rgba(240,192,64,0.4)',
    lineHeight: '1',
  })
  overlay.appendChild(title)

  const sub = document.createElement('div')
  sub.textContent = 'Tournoi clôturé'
  Object.assign(sub.style, {
    fontFamily: 'Cinzel, serif',
    fontSize: '14px',
    color: 'rgba(240,192,64,0.6)',
    letterSpacing: '4px',
    textTransform: 'uppercase',
  })
  overlay.appendChild(sub)

  // Animate title
  title.animate(
    [
      { transform: 'scale(0.3)', opacity: 0, filter: 'blur(12px)' },
      { transform: 'scale(1.15)', opacity: 1, filter: 'blur(0)', offset: 0.55 },
      { transform: 'scale(1)',    opacity: 1, filter: 'blur(0)' },
    ],
    { duration: 900, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'forwards' }
  )
  sub.animate(
    [{ opacity: 0 }, { opacity: 1 }],
    { duration: 600, delay: 600, fill: 'forwards' }
  )

  // 35 gold particles
  for (let i = 0; i < 35; i++) {
    setTimeout(() => {
      const p = fixedEl({
        left: `${Math.random() * 100}vw`,
        top: '-24px',
        color: `rgba(240,${150 + Math.floor(Math.random() * 80)},${Math.floor(Math.random() * 40)},${0.65 + Math.random() * 0.35})`,
        fontSize: `${9 + Math.random() * 13}px`,
        fontWeight: '900',
        zIndex: '10000',
      })
      p.textContent = ['✦', '✧', '⋆', '★', '✦', '✧'][Math.floor(Math.random() * 6)]

      const drift = (Math.random() - 0.5) * 120
      run(p,
        [
          { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
          { transform: `translate(${drift}px, 110vh) rotate(${300 + Math.random() * 400}deg)`, opacity: 0 },
        ],
        { duration: 1600 + Math.random() * 900, easing: 'ease-in' }
      )
    }, i * 50)
  }

  // Fade out at 2.3s
  setTimeout(() => {
    overlay.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 500, fill: 'forwards', easing: 'ease-in' }
    ).onfinish = () => overlay.remove()
  }, 2300)
}

// ── F. Millennium Eye (validation PIN) ─────────────────────────────────────

export function triggerMillenniumEye() {
  const overlay = fixedEl({
    inset: '0',
    background: 'rgba(8,12,24,0.65)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '9999',
  })

  const wrapper = document.createElement('div')
  Object.assign(wrapper.style, {
    filter: 'drop-shadow(0 0 24px rgba(120,60,200,0.9)) drop-shadow(0 0 48px rgba(240,192,64,0.5))',
    transformOrigin: 'center',
  })
  overlay.appendChild(wrapper)

  wrapper.innerHTML = `
    <svg width="160" height="160" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="pupilGrad" cx="50%" cy="50%">
          <stop offset="0%"  stop-color="#f0c040"/>
          <stop offset="55%" stop-color="#c8960a"/>
          <stop offset="100%" stop-color="rgba(240,192,64,0)"/>
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <!-- Triangle -->
      <polygon points="80,8 152,148 8,148" fill="none"
        stroke="rgba(240,192,64,0.55)" stroke-width="1.5" filter="url(#glow)"/>
      <!-- Eye white -->
      <ellipse cx="80" cy="86" rx="44" ry="28" fill="rgba(255,255,255,0.05)"
        stroke="rgba(240,192,64,0.9)" stroke-width="1.5" filter="url(#glow)"/>
      <!-- Iris -->
      <circle cx="80" cy="86" r="20" fill="url(#pupilGrad)" filter="url(#glow)"/>
      <!-- Pupil -->
      <circle cx="80" cy="86" r="11" fill="rgba(8,12,24,0.9)"/>
      <!-- Pupil glow -->
      <circle cx="80" cy="86" r="6" fill="#f0c040" opacity="0.95"/>
      <!-- Iris ring -->
      <circle cx="80" cy="86" r="20" fill="none"
        stroke="rgba(120,60,200,0.6)" stroke-width="1" filter="url(#glow)"/>
    </svg>
  `

  // Eye opens: scaleY 0 → 1 → 1 → 0
  wrapper.animate(
    [
      { transform: 'scaleY(0.05)', opacity: 0 },
      { transform: 'scaleY(1)',    opacity: 1, offset: 0.3 },
      { transform: 'scaleY(1)',    opacity: 1, offset: 0.72 },
      { transform: 'scaleY(0.05)', opacity: 0 },
    ],
    { duration: 1300, easing: 'cubic-bezier(0.4,0,0.2,1)', fill: 'forwards' }
  ).onfinish = () => overlay.remove()
}
