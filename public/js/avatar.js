// QuizoZozo - Reusable SVG Avatar Generator (Skribbl.io Style)
(function(window) {
  const AVATAR_PALETTE = [
    '#EF4444', // 0: Rouge Corail
    '#3B82F6', // 1: Bleu Azur
    '#10B981', // 2: Vert Émeraude
    '#F59E0B', // 3: Jaune Ambre
    '#8B5CF6', // 4: Violet Cosmique
    '#EC4899', // 5: Rose Fluo
    '#06B6D4', // 6: Cyan Lagon
    '#F97316'  // 7: Orange Mandarine
  ];

  // Head Shapes (6)
  const HEAD_SHAPES = [
    // 0: Rond
    (c) => `<circle cx="50" cy="50" r="42" fill="${c}" stroke="#0F172A" stroke-width="4" />`,
    // 1: Carré arrondi
    (c) => `<rect x="10" y="10" width="80" height="80" rx="20" fill="${c}" stroke="#0F172A" stroke-width="4" />`,
    // 2: Triangle arrondi
    (c) => `<path d="M 50 12 Q 53 10 56 14 L 88 74 Q 92 82 82 84 L 18 84 Q 8 82 12 74 Z" fill="${c}" stroke="#0F172A" stroke-width="4" stroke-linejoin="round" />`,
    // 3: Hexagone
    (c) => `<polygon points="50,10 86,28 86,72 50,90 14,72 14,28" fill="${c}" stroke="#0F172A" stroke-width="4" stroke-linejoin="round" />`,
    // 4: Ovale vertical
    (c) => `<ellipse cx="50" cy="50" rx="38" ry="44" fill="${c}" stroke="#0F172A" stroke-width="4" />`,
    // 5: Goutte / Flamme
    (c) => `<path d="M 50 10 C 25 35 15 55 15 68 A 35 35 0 0 0 85 68 C 85 55 75 35 50 10 Z" fill="${c}" stroke="#0F172A" stroke-width="4" stroke-linejoin="round" />`
  ];

  // Eyes Expressions (6)
  const EYES_EXPRESSIONS = [
    // 0: Grands yeux ronds expressifs
    `<!-- Eyes: Round -->
     <circle cx="36" cy="44" r="8" fill="#FFFFFF" stroke="#0F172A" stroke-width="3"/>
     <circle cx="38" cy="44" r="4" fill="#0F172A"/>
     <circle cx="40" cy="42" r="1.5" fill="#FFFFFF"/>
     <circle cx="64" cy="44" r="8" fill="#FFFFFF" stroke="#0F172A" stroke-width="3"/>
     <circle cx="66" cy="44" r="4" fill="#0F172A"/>
     <circle cx="68" cy="42" r="1.5" fill="#FFFFFF"/>`,

    // 1: Yeux joyeux (^ ^)
    `<!-- Eyes: Happy -->
     <path d="M 28 46 Q 36 34 44 46" fill="none" stroke="#0F172A" stroke-width="4.5" stroke-linecap="round"/>
     <path d="M 56 46 Q 64 34 72 46" fill="none" stroke="#0F172A" stroke-width="4.5" stroke-linecap="round"/>`,

    // 2: Clin d'œil (> o)
    `<!-- Eyes: Wink -->
     <path d="M 26 40 L 37 46 L 26 52" fill="none" stroke="#0F172A" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
     <circle cx="64" cy="44" r="8" fill="#FFFFFF" stroke="#0F172A" stroke-width="3"/>
     <circle cx="66" cy="44" r="4" fill="#0F172A"/>
     <circle cx="68" cy="42" r="1.5" fill="#FFFFFF"/>`,

    // 3: Lunettes de soleil Cool
    `<!-- Eyes: Sunglasses -->
     <path d="M 22 42 Q 36 44 48 42 L 52 42 Q 64 44 78 42" stroke="#0F172A" stroke-width="4"/>
     <rect x="23" y="38" width="22" height="15" rx="5" fill="#0F172A"/>
     <rect x="55" y="38" width="22" height="15" rx="5" fill="#0F172A"/>
     <line x1="26" y1="41" x2="33" y2="50" stroke="#FFFFFF" stroke-width="2"/>
     <line x1="58" y1="41" x2="65" y2="50" stroke="#FFFFFF" stroke-width="2"/>`,

    // 4: Yeux Étoiles (★ ★)
    `<!-- Eyes: Stars -->
     <path d="M 36 36 L 38 42 L 44 42 L 39 46 L 41 52 L 36 48 L 31 52 L 33 46 L 28 42 L 34 42 Z" fill="#FDE047" stroke="#0F172A" stroke-width="2.5"/>
     <path d="M 64 36 L 66 42 L 72 42 L 67 46 L 69 52 L 64 48 L 59 52 L 61 46 L 56 42 L 62 42 Z" fill="#FDE047" stroke="#0F172A" stroke-width="2.5"/>`,

    // 5: Yeux concentrés / déterminés
    `<!-- Eyes: Focused -->
     <line x1="26" y1="36" x2="44" y2="42" stroke="#0F172A" stroke-width="3.5" stroke-linecap="round"/>
     <line x1="74" y1="36" x2="56" y2="42" stroke="#0F172A" stroke-width="3.5" stroke-linecap="round"/>
     <circle cx="36" cy="46" r="5" fill="#0F172A"/>
     <circle cx="64" cy="46" r="5" fill="#0F172A"/>`
  ];

  // Mouth Expressions (6)
  const MOUTH_EXPRESSIONS = [
    // 0: Grand sourire ouvert joyeux
    `<!-- Mouth: Big Smile -->
     <path d="M 32 60 Q 50 82 68 60 Z" fill="#FFFFFF" stroke="#0F172A" stroke-width="3.5" stroke-linejoin="round"/>
     <path d="M 42 70 Q 50 78 58 70 Z" fill="#EF4444"/>`,

    // 1: Sourire malicieux
    `<!-- Mouth: Smirk -->
     <path d="M 35 64 Q 52 74 67 58" fill="none" stroke="#0F172A" stroke-width="4.5" stroke-linecap="round"/>`,

    // 2: Bouche surprise / "O"
    `<!-- Mouth: Surprised O -->
     <ellipse cx="50" cy="66" rx="8" ry="10" fill="#0F172A"/>
     <ellipse cx="50" cy="66" rx="5" ry="7" fill="#EF4444"/>`,

    // 3: Langue tirée (:P)
    `<!-- Mouth: Tongue out -->
     <path d="M 34 62 Q 50 68 66 62" fill="none" stroke="#0F172A" stroke-width="4" stroke-linecap="round"/>
     <path d="M 44 64 Q 44 76 50 76 Q 56 76 56 64 Z" fill="#EC4899" stroke="#0F172A" stroke-width="2.5"/>`,

    // 4: Ligne neutre / concentré
    `<!-- Mouth: Neutral line -->
     <line x1="36" y1="65" x2="64" y2="65" stroke="#0F172A" stroke-width="4.5" stroke-linecap="round"/>`,

    // 5: Petit sourire adorable avec joues roses
    `<!-- Mouth: Cute smile + blush -->
     <circle cx="24" cy="56" r="5" fill="rgba(239, 68, 68, 0.45)"/>
     <circle cx="76" cy="56" r="5" fill="rgba(239, 68, 68, 0.45)"/>
     <path d="M 38 62 Q 50 72 62 62" fill="none" stroke="#0F172A" stroke-width="4" stroke-linecap="round"/>`
  ];

  function normalizeAvatar(avatar) {
    if (!avatar || typeof avatar !== 'object') {
      return { head: 0, eyes: 0, mouth: 0, color: AVATAR_PALETTE[1] };
    }
    const head = Math.max(0, Math.min(HEAD_SHAPES.length - 1, parseInt(avatar.head, 10) || 0));
    const eyes = Math.max(0, Math.min(EYES_EXPRESSIONS.length - 1, parseInt(avatar.eyes, 10) || 0));
    const mouth = Math.max(0, Math.min(MOUTH_EXPRESSIONS.length - 1, parseInt(avatar.mouth, 10) || 0));
    let color = avatar.color;
    if (!color || typeof color !== 'string' || !color.startsWith('#')) {
      color = AVATAR_PALETTE[head % AVATAR_PALETTE.length];
    }
    return { head, eyes, mouth, color };
  }

  function renderAvatarSvg(avatar, size = 64, extraClass = '') {
    const a = normalizeAvatar(avatar);
    const headSvg = HEAD_SHAPES[a.head](a.color);
    const eyesSvg = EYES_EXPRESSIONS[a.eyes];
    const mouthSvg = MOUTH_EXPRESSIONS[a.mouth];

    return `
      <svg viewBox="0 0 100 100" width="${size}" height="${size}" class="avatar-svg ${extraClass}" xmlns="http://www.w3.org/2000/svg" style="display:inline-block; vertical-align:middle; overflow:visible;">
        <g class="avatar-head-group">
          ${headSvg}
        </g>
        <g class="avatar-eyes-group">
          ${eyesSvg}
        </g>
        <g class="avatar-mouth-group">
          ${mouthSvg}
        </g>
      </svg>
    `;
  }

  function getRandomAvatar() {
    return {
      head: Math.floor(Math.random() * HEAD_SHAPES.length),
      eyes: Math.floor(Math.random() * EYES_EXPRESSIONS.length),
      mouth: Math.floor(Math.random() * MOUTH_EXPRESSIONS.length),
      color: AVATAR_PALETTE[Math.floor(Math.random() * AVATAR_PALETTE.length)]
    };
  }

  // Export to global window object
  window.QuizoAvatar = {
    PALETTE: AVATAR_PALETTE,
    TOTAL_HEADS: HEAD_SHAPES.length,
    TOTAL_EYES: EYES_EXPRESSIONS.length,
    TOTAL_MOUTHS: MOUTH_EXPRESSIONS.length,
    normalize: normalizeAvatar,
    renderSvg: renderAvatarSvg,
    getRandom: getRandomAvatar
  };

})(typeof window !== 'undefined' ? window : this);
