export default function StudyIllustration() {
  return (
    <svg
      viewBox="0 0 560 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', display: 'block' }}
      aria-label="Student studying at a computer"
    >
      <defs>
        <linearGradient id="si-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EDE8FF" />
          <stop offset="100%" stopColor="#D2C8F0" />
        </linearGradient>
        <linearGradient id="si-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#BEB4DA" />
          <stop offset="100%" stopColor="#AEA4CA" />
        </linearGradient>
        <linearGradient id="si-deskTop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#EDD49C" />
          <stop offset="100%" stopColor="#D4B46A" />
        </linearGradient>
        <linearGradient id="si-deskFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C89A50" />
          <stop offset="100%" stopColor="#A87830" />
        </linearGradient>
        <linearGradient id="si-screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0D1640" />
          <stop offset="100%" stopColor="#162454" />
        </linearGradient>
        <linearGradient id="si-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDCFAA" />
          <stop offset="100%" stopColor="#F4B488" />
        </linearGradient>
        <linearGradient id="si-chair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4A4AA0" />
          <stop offset="100%" stopColor="#36368A" />
        </linearGradient>
        <radialGradient id="si-screenGlow" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#5C8AFF" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#5C8AFF" stopOpacity="0" />
        </radialGradient>
        <filter id="si-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#5A50A0" floodOpacity="0.22" />
        </filter>
        <clipPath id="si-screenClip">
          <rect x="150" y="82" width="116" height="78" rx="4" />
        </clipPath>
      </defs>

      {/* ── BACKGROUND ── */}
      <rect width="560" height="420" fill="url(#si-bg)" rx="20" />

      {/* ── WALL ── */}
      <rect x="0" y="0" width="560" height="232" fill="#F3EEFF" rx="20" />
      <rect x="0" y="222" width="560" height="14" fill="#DDD4F8" />

      {/* ── FLOOR ── */}
      <path d="M 0 232 L 560 232 L 560 420 L 0 420 Z" fill="url(#si-floor)" />
      {/* Subtle floor tiles */}
      {[260, 290, 320, 350, 380, 410].map(y => (
        <line key={y} x1="0" y1={y} x2="560" y2={y} stroke="#A89EC6" strokeWidth="0.6" opacity="0.45" />
      ))}
      {[70, 140, 210, 280, 350, 420, 490].map(x => (
        <line key={x} x1={x} y1="232" x2={x} y2="420" stroke="#A89EC6" strokeWidth="0.6" opacity="0.45" />
      ))}

      {/* ── BOOKSHELF (back wall, left) ── */}
      <rect x="30" y="28" width="88" height="120" rx="6" fill="#6D4C1F" />
      <rect x="30" y="70" width="88" height="7" fill="#5A3D16" />
      <rect x="30" y="112" width="88" height="7" fill="#5A3D16" />
      {/* Shelf books row 1 */}
      <rect x="36" y="34" width="11" height="34" rx="2" fill="#E53935" />
      <rect x="49" y="38" width="9"  height="30" rx="2" fill="#1E88E5" />
      <rect x="60" y="34" width="13" height="34" rx="2" fill="#43A047" />
      <rect x="75" y="36" width="9"  height="32" rx="2" fill="#FB8C00" />
      <rect x="86" y="34" width="11" height="34" rx="2" fill="#8E24AA" />
      {/* Row 2 */}
      <rect x="36" y="78" width="13" height="32" rx="2" fill="#039BE5" />
      <rect x="51" y="80" width="9"  height="30" rx="2" fill="#E53935" />
      <rect x="62" y="78" width="11" height="32" rx="2" fill="#FFB300" />
      <rect x="75" y="80" width="9"  height="30" rx="2" fill="#00897B" />
      <rect x="86" y="78" width="10" height="32" rx="2" fill="#5E35B1" />
      {/* Row 3 */}
      <rect x="36" y="120" width="15" height="24" rx="2" fill="#C62828" />
      <rect x="53" y="122" width="10" height="22" rx="2" fill="#1565C0" />
      <rect x="65" y="120" width="12" height="24" rx="2" fill="#2E7D32" />
      <rect x="79" y="122" width="10" height="22" rx="2" fill="#E65100" />

      {/* ── WINDOW (back wall, right) ── */}
      <rect x="406" y="24" width="114" height="92" rx="12" fill="#BBDEFB" stroke="#90CAF9" strokeWidth="3" />
      <line x1="463" y1="24" x2="463" y2="116" stroke="#90CAF9" strokeWidth="2.5" />
      <line x1="406" y1="70" x2="520" y2="70" stroke="#90CAF9" strokeWidth="2.5" />
      <rect x="409" y="27" width="52" height="41" rx="5" fill="#64B5F6" opacity="0.6" />
      <rect x="465" y="27" width="52" height="41" rx="5" fill="#90CAF9" opacity="0.5" />
      <rect x="409" y="73" width="52" height="40" rx="5" fill="#C8E6C9" opacity="0.65" />
      <rect x="465" y="73" width="52" height="40" rx="5" fill="#DCEDC8" opacity="0.6" />
      {/* Sun */}
      <circle cx="500" cy="46" r="15" fill="#FFF176" opacity="0.9" />
      <circle cx="500" cy="46" r="10" fill="#FFEE58" />

      {/* ── DESK TOP SURFACE (drawn first — objects sit on this) ── */}
      <path d="M 48 210 L 496 210 L 534 178 L 86 178 Z" fill="url(#si-deskTop)" filter="url(#si-shadow)" />
      {/* Top surface edge highlight */}
      <line x1="48" y1="210" x2="496" y2="210" stroke="#F5E0A8" strokeWidth="1.5" opacity="0.7" />

      {/* ── OBJECTS ON DESK (drawn before chair/student so desk front covers their bases) ── */}

      {/* MONITOR STAND BASE */}
      <rect x="208" y="200" width="50" height="9" rx="4" fill="#1A1A30" />
      <rect x="226" y="170" width="14" height="31" rx="4" fill="#252540" />

      {/* BOOKS STACK (right side of desk) */}
      <rect x="356" y="193" width="72" height="14" rx="3" fill="#EF5350" />
      <rect x="356" y="192" width="72" height="4"  rx="2" fill="#FF8A80" />
      <rect x="360" y="181" width="66" height="12" rx="3" fill="#42A5F5" />
      <rect x="360" y="180" width="66" height="4"  rx="2" fill="#90CAF9" />
      <rect x="364" y="170" width="60" height="11" rx="3" fill="#66BB6A" />
      <rect x="364" y="169" width="60" height="4"  rx="2" fill="#A5D6A7" />

      {/* COFFEE MUG */}
      <rect x="310" y="188" width="32" height="21" rx="5" fill="#F5F5F5" />
      <rect x="310" y="196" width="32" height="7"  rx="0" fill="#ECEFF1" />
      <path d="M 342 194 Q 354 194 354 199 Q 354 205 342 205" stroke="#CFD8DC" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <ellipse cx="326" cy="188" rx="16" ry="4.5" fill="#B0BEC5" />
      <ellipse cx="326" cy="188" rx="13" ry="3"   fill="#4E342E" />
      <path d="M 320 184 Q 317 177 320 170" stroke="#D0D0D0" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.65" />
      <path d="M 328 184 Q 331 176 328 169" stroke="#D0D0D0" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.65" />

      {/* PLANT */}
      <path d="M 442 205 L 468 205 L 465 215 L 445 215 Z" fill="#EF9A9A" />
      <rect x="440" y="200" width="30" height="7" rx="3" fill="#E57373" />
      <ellipse cx="455" cy="201" rx="13" ry="4" fill="#5D4037" />
      <line x1="455" y1="200" x2="455" y2="182" stroke="#388E3C" strokeWidth="3" />
      <path d="M 455 192 Q 441 186 437 174" stroke="#388E3C" strokeWidth="2.5" fill="none" />
      <path d="M 455 188 Q 469 182 473 170" stroke="#388E3C" strokeWidth="2.5" fill="none" />
      <ellipse cx="444" cy="178" rx="13" ry="7" fill="#4CAF50" transform="rotate(-22 444 178)" />
      <ellipse cx="466" cy="173" rx="13" ry="7" fill="#66BB6A" transform="rotate(22 466 173)" />
      <ellipse cx="455" cy="171" rx="10" ry="6" fill="#A5D6A7" transform="rotate(-5 455 171)" />

      {/* DESK LAMP */}
      <rect x="72" y="198" width="32" height="11" rx="5" fill="#546E7A" />
      <rect x="85" y="145" width="7" height="54" rx="3" fill="#607D8B" />
      <path d="M 88 149 Q 108 132 126 140" stroke="#607D8B" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M 122 132 L 150 122 L 145 150 L 117 157 Z" fill="#FFD54F" />
      <path d="M 122 132 L 150 122 L 145 150 L 117 157 Z" fill="#FFF9C4" opacity="0.4" />
      <ellipse cx="133" cy="153" rx="18" ry="6" fill="#FFF9C4" opacity="0.25" />

      {/* ── CHAIR ── */}
      <rect x="240" y="160" width="80" height="98" rx="14" fill="url(#si-chair)" />
      <rect x="247" y="166" width="66" height="86" rx="11" fill="#5858B0" opacity="0.45" />
      <rect x="247" y="160" width="66" height="24" rx="12" fill="#5050A8" />

      {/* ── STUDENT BODY (shirt — drawn before desk front so desk front covers lower half) ── */}
      <path
        d="M 232 228 Q 218 236 214 258 L 212 295 L 348 295 L 346 258 Q 342 236 328 228 L 304 220 L 256 220 Z"
        fill="#2E7D32"
      />
      {/* Collar */}
      <path d="M 270 222 L 268 229 L 280 234 L 292 229 L 290 222" fill="#1B5E20" />

      {/* ── DESK FRONT FACE (hides student lower body — drawn AFTER body) ── */}
      <path d="M 48 210 L 496 210 L 496 272 L 48 272 Z" fill="url(#si-deskFront)" />
      {/* Desk right side */}
      <path d="M 496 210 L 534 178 L 534 240 L 496 272 Z" fill="#8A6020" />
      {/* Subtle drawer line */}
      <line x1="272" y1="210" x2="272" y2="272" stroke="#B88040" strokeWidth="1.5" opacity="0.5" />
      <rect x="250" y="236" width="42" height="8" rx="4" fill="#B88040" opacity="0.6" />
      {/* Front edge top highlight */}
      <line x1="48" y1="210" x2="496" y2="210" stroke="#EDD49C" strokeWidth="1" opacity="0.5" />

      {/* DESK LEGS */}
      <rect x="66"  y="270" width="20" height="68" rx="6" fill="#9A7028" />
      <rect x="470" y="270" width="20" height="68" rx="6" fill="#9A7028" />

      {/* Floor shadow */}
      <ellipse cx="283" cy="345" rx="180" ry="22" fill="#8878B8" opacity="0.28" />

      {/* ── KEYBOARD (on desk surface — drawn after desk front so it sits on top) ── */}
      <rect x="180" y="200" width="148" height="9" rx="4" fill="#22223A" />
      <rect x="183" y="202" width="142" height="4" rx="2" fill="#32325A" />
      {/* Key rows hint */}
      {[0,1,2].map(row => (
        [0,1,2,3,4,5,6,7,8].map(col => (
          <rect
            key={`${row}-${col}`}
            x={186 + col * 15}
            y={202 + row}
            width="12" height="2"
            rx="1"
            fill="#3A3A5A"
            opacity={0.5}
          />
        ))
      ))}

      {/* ── STUDENT — NECK ── */}
      <rect x="272" y="208" width="22" height="16" rx="6" fill="url(#si-skin)" />

      {/* ── STUDENT — HEAD ── */}
      <circle cx="283" cy="176" r="40" fill="url(#si-skin)" filter="url(#si-shadow)" />

      {/* Hair */}
      <path
        d="M 245 166 Q 248 128 283 124 Q 318 128 321 166 Q 313 142 283 139 Q 253 142 245 166 Z"
        fill="#231008"
      />
      {/* Hair side sweeps */}
      <path d="M 245 166 Q 242 180 244 194" stroke="#231008" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M 321 166 Q 324 180 322 194" stroke="#231008" strokeWidth="9" fill="none" strokeLinecap="round" />

      {/* Ears */}
      <ellipse cx="244" cy="178" rx="6" ry="8.5" fill="#F4B488" />
      <ellipse cx="322" cy="178" rx="6" ry="8.5" fill="#F4B488" />
      <ellipse cx="244" cy="178" rx="3.5" ry="5.5" fill="#E8A070" />
      <ellipse cx="322" cy="178" rx="3.5" ry="5.5" fill="#E8A070" />

      {/* Eyes — looking left toward monitor */}
      <ellipse cx="268" cy="178" rx="7" ry="7.5" fill="white" />
      <ellipse cx="298" cy="178" rx="7" ry="7.5" fill="white" />
      {/* Irises */}
      <circle cx="265" cy="179" r="5" fill="#3B2314" />
      <circle cx="295" cy="179" r="5" fill="#3B2314" />
      {/* Pupils */}
      <circle cx="264" cy="179" r="2.8" fill="#0D0D0D" />
      <circle cx="294" cy="179" r="2.8" fill="#0D0D0D" />
      {/* Catchlight */}
      <circle cx="263" cy="177.5" r="1.3" fill="white" />
      <circle cx="293" cy="177.5" r="1.3" fill="white" />

      {/* Eyebrows */}
      <path d="M 259 170 Q 267 166 276 168" stroke="#231008" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 288 168 Q 297 166 305 170" stroke="#231008" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Nose */}
      <path d="M 282 186 Q 279 192 283 194" stroke="#C07050" strokeWidth="1.4" fill="none" strokeLinecap="round" />

      {/* Smile */}
      <path d="M 271 202 Q 283 210 295 202" stroke="#B86840" strokeWidth="2.2" fill="none" strokeLinecap="round" />

      {/* Cheek blush */}
      <ellipse cx="255" cy="193" rx="9" ry="5" fill="#F4A0A0" opacity="0.3" />
      <ellipse cx="311" cy="193" rx="9" ry="5" fill="#F4A0A0" opacity="0.3" />

      {/* ── HEADPHONES ── */}
      <path
        d="M 247 168 Q 248 134 283 131 Q 318 134 319 168"
        stroke="#1C2B36"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
      {/* Ear cups */}
      <rect x="239" y="167" width="16" height="24" rx="8" fill="#263238" />
      <rect x="242" y="170" width="10" height="18" rx="6" fill="#37474F" />
      <rect x="311" y="167" width="16" height="24" rx="8" fill="#263238" />
      <rect x="314" y="170" width="10" height="18" rx="6" fill="#37474F" />

      {/* ── ARMS ── */}
      {/* Left arm toward keyboard */}
      <path d="M 228 242 Q 210 225 190 208" stroke="#2E7D32" strokeWidth="20" fill="none" strokeLinecap="round" />
      <ellipse cx="186" cy="207" rx="13" ry="7.5" fill="url(#si-skin)" transform="rotate(-20 186 207)" />

      {/* Right arm toward keyboard */}
      <path d="M 338 242 Q 356 225 376 208" stroke="#2E7D32" strokeWidth="20" fill="none" strokeLinecap="round" />
      <ellipse cx="380" cy="207" rx="13" ry="7.5" fill="url(#si-skin)" transform="rotate(20 380 207)" />

      {/* ── MONITOR (drawn last so it appears in front of arms/desk) ── */}
      {/* Monitor outer bezel */}
      <rect x="142" y="74" width="136" height="100" rx="11" fill="#141428" filter="url(#si-shadow)" />
      {/* Monitor bezel */}
      <rect x="144" y="76" width="132" height="97" rx="10" fill="#1C1C34" />
      {/* Screen */}
      <rect x="150" y="82" width="120" height="82" rx="5" fill="url(#si-screen)" />
      {/* Screen content */}
      <g clipPath="url(#si-screenClip)">
        {/* Title bar */}
        <rect x="150" y="82" width="120" height="15" fill="#0A0F28" rx="5" />
        <rect x="150" y="90" width="120" height="7" fill="#0A0F28" />
        <circle cx="159" cy="89" r="3.5" fill="#FF5F57" />
        <circle cx="170" cy="89" r="3.5" fill="#FEBC2E" />
        <circle cx="181" cy="89" r="3.5" fill="#28C840" />
        {/* Code lines */}
        <rect x="157" y="103" width="9"  height="3.5" rx="1" fill="#F48FB1" />
        <rect x="168" y="103" width="44" height="3.5" rx="1" fill="#80CBC4" />
        <rect x="157" y="111" width="15" height="3.5" rx="1" fill="#CE93D8" />
        <rect x="175" y="111" width="50" height="3.5" rx="1" fill="#A5D6A7" />
        <rect x="165" y="119" width="55" height="3.5" rx="1" fill="#FFF176" />
        <rect x="157" y="127" width="9"  height="3.5" rx="1" fill="#F48FB1" />
        <rect x="169" y="127" width="38" height="3.5" rx="1" fill="#80CBC4" />
        <rect x="165" y="135" width="48" height="3.5" rx="1" fill="#A5D6A7" />
        <rect x="157" y="143" width="64" height="3.5" rx="1" fill="#EF9A9A" />
        <rect x="157" y="151" width="30" height="3.5" rx="1" fill="#80DEEA" />
        <rect x="190" y="151" width="38" height="3.5" rx="1" fill="#FFF176" />
        {/* Cursor */}
        <rect x="230" y="143" width="2" height="9" rx="1" fill="white" opacity="0.85" />
        {/* Progress bar at bottom */}
        <rect x="157" y="157" width="106" height="5" rx="2.5" fill="#0F1C44" />
        <rect x="157" y="157" width="66"  height="5" rx="2.5" fill="#4CAF50" />
        {/* Screen glow overlay */}
        <rect x="150" y="82" width="120" height="82" fill="url(#si-screenGlow)" />
      </g>

      {/* Monitor stand */}
      <path d="M 202 164 L 218 164 L 222 174 L 198 174 Z" fill="#252540" />
      <rect x="194" y="172" width="32" height="6" rx="3" fill="#1A1A30" />

      {/* ── DECORATIVE ELEMENTS ── */}

      {/* Floating graduation cap */}
      <g transform="translate(488, 148) rotate(12)">
        <rect x="0" y="9" width="28" height="9" rx="2" fill="#7B1FA2" opacity="0.85" />
        <polygon points="14,0 0,9 28,9" fill="#9C27B0" opacity="0.85" />
        <line x1="28" y1="9" x2="28" y2="20" stroke="#9C27B0" strokeWidth="2.5" opacity="0.85" />
        <circle cx="28" cy="22" r="3" fill="#CE93D8" opacity="0.85" />
      </g>

      {/* Floating pencil */}
      <g transform="translate(520, 260) rotate(28)">
        <rect x="0" y="0" width="9" height="40" rx="4.5" fill="#FFD54F" />
        <path d="M 0 40 L 4.5 52 L 9 40 Z" fill="#EF5350" />
        <rect x="0" y="0" width="9" height="9" rx="4.5" fill="#FFCA28" />
        <line x1="0" y1="9" x2="9" y2="9" stroke="#FFB300" strokeWidth="2" />
      </g>

      {/* Floating star sparkles */}
      <text x="476" y="56"  fontSize="22" fill="#FFD54F" opacity="0.9">✦</text>
      <text x="512" y="104" fontSize="12" fill="#CE93D8" opacity="0.8">✦</text>
      <text x="24"  y="186" fontSize="14" fill="#CE93D8" opacity="0.7">✦</text>
      <text x="455" y="168" fontSize="9"  fill="#FFD54F" opacity="0.8">✦</text>
      <text x="38"  y="302" fontSize="11" fill="#90CAF9" opacity="0.7">✦</text>

      {/* Soft blobs */}
      <circle cx="518" cy="56"  r="11" fill="#CE93D8" opacity="0.35" />
      <circle cx="28"  cy="268" r="8"  fill="#80DEEA" opacity="0.45" />
      <circle cx="534" cy="348" r="14" fill="#A5D6A7" opacity="0.32" />
      <circle cx="24"  cy="394" r="18" fill="#B39DDB" opacity="0.28" />
      <circle cx="536" cy="406" r="16" fill="#F48FB1" opacity="0.22" />

      {/* Floating mini book */}
      <g transform="translate(490, 310) rotate(-14)">
        <rect x="0" y="0" width="28" height="22" rx="4" fill="#1E88E5" opacity="0.88" />
        <rect x="0" y="0" width="5"  height="22" rx="2" fill="#1565C0" opacity="0.8" />
        <line x1="8" y1="6"  x2="24" y2="6"  stroke="white" strokeWidth="1.5" opacity="0.55" />
        <line x1="8" y1="11" x2="24" y2="11" stroke="white" strokeWidth="1.5" opacity="0.55" />
        <line x1="8" y1="16" x2="20" y2="16" stroke="white" strokeWidth="1.5" opacity="0.55" />
      </g>
    </svg>
  )
}
