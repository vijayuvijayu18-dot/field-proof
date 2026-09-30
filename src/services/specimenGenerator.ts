/**
 * Demonstration Field Specimen Generator
 * 
 * Generates realistic field test kit imagery (pouch + physical reference card)
 * for SIH judges to demonstrate the companion software without physical reagents.
 */

import { KitType } from '../types';

export interface FieldSpecimenPreset {
  id: string;
  name: string;
  kitId: string;
  kitType: KitType;
  substanceTarget: string;
  expectedOutcome: 'POSITIVE' | 'NEGATIVE' | 'INCONCLUSIVE';
  description: string;
  hasReferenceCard: boolean;
  hasReactionPouch?: boolean;
  isRandomPhoto?: boolean;
  ambientCondition: 'CLEAN_DAYLIGHT' | 'WARM_INDOOR' | 'MISSING_CARD' | 'RANDOM_SCENE';
  targetColorRgb: [number, number, number];
}

export const SPECIMEN_PRESETS: FieldSpecimenPreset[] = [
  {
    id: 'test-d1-marquis-pos',
    name: 'Test D1: Marquis Field Kit (Presumptive Opiate Reaction)',
    kitId: 'FTK-000184',
    kitType: 'Marquis',
    substanceTarget: 'Presumptive Opiates / Alkaloid Class',
    expectedOutcome: 'POSITIVE',
    description: 'Valid configured image: Pouch and reference card properly aligned. Deterministic purple reaction.',
    hasReferenceCard: true,
    hasReactionPouch: true,
    ambientCondition: 'CLEAN_DAYLIGHT',
    targetColorRgb: [82, 24, 130] // Purple / Violet
  },
  {
    id: 'test-d2-scott-pos',
    name: 'Test D2: Scott Reagent Kit (Presumptive Cocaine Reaction)',
    kitId: 'FTK-000219',
    kitType: 'Scott',
    substanceTarget: 'Presumptive Cocaine Class (HCl / Base)',
    expectedOutcome: 'POSITIVE',
    description: 'Valid configured image: Distinctive cobalt blue precipitate with reference card visible.',
    hasReferenceCard: true,
    hasReactionPouch: true,
    ambientCondition: 'CLEAN_DAYLIGHT',
    targetColorRgb: [14, 110, 142] // Cobalt blue
  },
  {
    id: 'test-d3-mecke-neg',
    name: 'Test D3: Mecke Reagent Kit (Unreacted Negative Baseline)',
    kitId: 'FTK-000305',
    kitType: 'Mecke',
    substanceTarget: 'Presumptive Alkaloids Verification',
    expectedOutcome: 'NEGATIVE',
    description: 'Valid configured image: Unreacted pale yellow baseline matrix with reference card visible.',
    hasReferenceCard: true,
    hasReactionPouch: true,
    ambientCondition: 'CLEAN_DAYLIGHT',
    targetColorRgb: [248, 245, 215] // Pale straw/yellow
  },
  {
    id: 'test-a-random-photo',
    name: 'Test A: Random Ordinary Photo (Desk / Room / No Test Kit)',
    kitId: 'FTK-000184',
    kitType: 'Marquis',
    substanceTarget: 'Validation Test Case A',
    expectedOutcome: 'INCONCLUSIVE',
    description: 'Arbitrary photo without reference card or test pouch. Must NOT produce a fabricated result.',
    hasReferenceCard: false,
    hasReactionPouch: false,
    isRandomPhoto: true,
    ambientCondition: 'RANDOM_SCENE',
    targetColorRgb: [120, 100, 80]
  },
  {
    id: 'test-b-missing-card',
    name: 'Test B: Test Kit Pouch Alone (Reference Card Missing)',
    kitId: 'FTK-000184',
    kitType: 'Marquis',
    substanceTarget: 'Validation Test Case B',
    expectedOutcome: 'INCONCLUSIVE',
    description: 'Pouch captured without reference card. Calibration & analysis blocked; recapture required.',
    hasReferenceCard: false,
    hasReactionPouch: true,
    ambientCondition: 'MISSING_CARD',
    targetColorRgb: [85, 25, 130]
  },
  {
    id: 'test-c-invalid-framing',
    name: 'Test C: Reference Card Present with Invalid Framing (Pouch Missing)',
    kitId: 'FTK-000184',
    kitType: 'Marquis',
    substanceTarget: 'Validation Test Case C',
    expectedOutcome: 'INCONCLUSIVE',
    description: 'Reference card in frame but test pouch displaced outside guide brackets. Analysis blocked.',
    hasReferenceCard: true,
    hasReactionPouch: false,
    ambientCondition: 'CLEAN_DAYLIGHT',
    targetColorRgb: [30, 35, 45]
  }
];

export function renderSpecimenToDataUrl(preset: FieldSpecimenPreset): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. If Random Ordinary Photo (Test A)
  if (preset.isRandomPhoto) {
    // Office / desk background
    const bg = ctx.createLinearGradient(0, 0, 800, 600);
    bg.addColorStop(0, '#594a38');
    bg.addColorStop(0.5, '#42372a');
    bg.addColorStop(1, '#2e251b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 800, 600);

    // Notepad / paper sheet
    ctx.fillStyle = '#f4ecd8';
    ctx.save();
    ctx.translate(320, 260);
    ctx.rotate(-0.08);
    ctx.fillRect(-150, -180, 300, 360);
    ctx.strokeStyle = '#d4cbb3';
    ctx.lineWidth = 1;
    for (let y = -140; y < 160; y += 24) {
      ctx.beginPath();
      ctx.moveTo(-130, y);
      ctx.lineTo(130, y);
      ctx.stroke();
    }
    ctx.restore();

    // Pen on desk
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(100, 420, 180, 14);

    // Coffee mug circle
    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(680, 160, 45, 0, Math.PI * 2);
    ctx.stroke();

    return canvas.toDataURL('image/jpeg', 0.92);
  }

  // Standard Plain Field Inspection Surface (Matte dark desk)
  const bgGrad = ctx.createLinearGradient(0, 0, 800, 600);
  if (preset.ambientCondition === 'WARM_INDOOR') {
    bgGrad.addColorStop(0, '#2b2723');
    bgGrad.addColorStop(1, '#1c1815');
  } else {
    bgGrad.addColorStop(0, '#222834');
    bgGrad.addColorStop(1, '#151a24');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 800, 600);

  // Subtle clean grid on surface
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 800; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 600);
    ctx.stroke();
  }
  for (let y = 0; y < 600; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(800, y);
    ctx.stroke();
  }

  // 2. EXISTING COLORIMETRIC FIELD-TEST KIT POUCH (Center)
  const shouldRenderPouch = preset.hasReactionPouch !== false;
  if (shouldRenderPouch) {
    const pouchX = 270;
    const pouchY = 100;
    const pouchW = 260;
    const pouchH = 400;

    // Pouch plastic body
    ctx.fillStyle = 'rgba(240, 245, 255, 0.07)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(pouchX, pouchY, pouchW, pouchH, 10);
    ctx.fill();
    ctx.stroke();

    // Pouch top seal & printed label
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(pouchX + 12, pouchY + 12, pouchW - 24, 60, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.fillText('COLORIMETRIC FIELD-TEST KIT', pouchX + 22, pouchY + 32);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 14px -apple-system, sans-serif';
    ctx.fillText(preset.kitType.toUpperCase() + ' REAGENT TEST', pouchX + 22, pouchY + 54);

    // Physical Reaction Chamber / Ampoule Area
    const rxX = pouchX + 25;
    const rxY = pouchY + 85;
    const rxW = pouchW - 50;
    const rxH = pouchH - 110;

    ctx.fillStyle = 'rgba(10, 15, 25, 0.85)';
    ctx.beginPath();
    ctx.roundRect(rxX, rxY, rxW, rxH, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.stroke();

    // Reaction Solution Liquid
    let [r, g, b] = preset.targetColorRgb;
    if (preset.ambientCondition === 'WARM_INDOOR') {
      r = Math.min(255, r + 20);
      g = Math.min(255, g + 10);
      b = Math.max(0, b - 15);
    }

    const solutionGrad = ctx.createLinearGradient(rxX, rxY, rxX + rxW, rxY + rxH);
    solutionGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.95)`);
    solutionGrad.addColorStop(0.5, `rgba(${Math.max(0, r - 12)}, ${Math.max(0, g - 12)}, ${Math.max(0, b - 12)}, 0.9)`);
    solutionGrad.addColorStop(1, `rgba(${Math.min(255, r + 12)}, ${Math.min(255, g + 12)}, ${Math.min(255, b + 12)}, 0.95)`);

    ctx.fillStyle = solutionGrad;
    ctx.beginPath();
    ctx.roundRect(rxX + 15, rxY + 30, rxW - 30, rxH - 50, 6);
    ctx.fill();

    // Glass highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(rxX + 20, rxY + 35, 12, rxH - 60);

    // Label tag on reaction area
    ctx.fillStyle = '#64748b';
    ctx.font = '9px -apple-system, sans-serif';
    ctx.fillText('REACTION CHAMBER', rxX + 20, rxY + rxH - 10);
  }

  // 3. PHYSICAL REFERENCE COLOUR CARD (Lower Left)
  if (preset.hasReferenceCard) {
    const cardX = 50;
    const cardY = 370;
    const cardW = 170;
    const cardH = 180;

    // Card paper base
    ctx.fillStyle = preset.ambientCondition === 'WARM_INDOOR' ? '#fcf7ec' : '#ffffff';
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 8);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Card Header Bar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cardX, cardY, cardW, 28);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 10px -apple-system, sans-serif';
    ctx.fillText('REFERENCE COLOUR CARD', cardX + 10, cardY + 18);

    // Calibration Patches:
    const patchW = 42;
    const patchH = 36;

    // 1. White
    ctx.fillStyle = preset.ambientCondition === 'WARM_INDOOR' ? '#faf3da' : '#ffffff';
    ctx.fillRect(cardX + 12, cardY + 45, patchW, patchH);
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(cardX + 12, cardY + 45, patchW, patchH);
    ctx.fillStyle = '#64748b';
    ctx.font = '8px -apple-system, sans-serif';
    ctx.fillText('WHITE', cardX + 18, cardY + 95);

    // 2. Mid Gray 50%
    ctx.fillStyle = preset.ambientCondition === 'WARM_INDOOR' ? '#867f73' : '#808080';
    ctx.fillRect(cardX + 64, cardY + 45, patchW, patchH);
    ctx.strokeRect(cardX + 64, cardY + 45, patchW, patchH);
    ctx.fillStyle = '#64748b';
    ctx.fillText('GRAY', cardX + 72, cardY + 95);

    // 3. Black 0%
    ctx.fillStyle = preset.ambientCondition === 'WARM_INDOOR' ? '#201d19' : '#191919';
    ctx.fillRect(cardX + 116, cardY + 45, patchW, patchH);
    ctx.strokeRect(cardX + 116, cardY + 45, patchW, patchH);
    ctx.fillStyle = '#64748b';
    ctx.fillText('BLACK', cardX + 122, cardY + 95);

    // 4. Primary Cyan
    ctx.fillStyle = '#00a2e8';
    ctx.fillRect(cardX + 12, cardY + 110, patchW, patchH);
    ctx.strokeRect(cardX + 12, cardY + 110, patchW, patchH);
    ctx.fillStyle = '#64748b';
    ctx.fillText('CYAN', cardX + 20, cardY + 160);

    // Card ID text
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px -apple-system, sans-serif';
    ctx.fillText('ID: REF-CARD-V1', cardX + 64, cardY + 130);
  }

  return canvas.toDataURL('image/jpeg', 0.92);
}
