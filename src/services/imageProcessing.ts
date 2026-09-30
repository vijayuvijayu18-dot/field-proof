/**
 * Image Analysis & Calibration Service
 * 
 * Performs client-side image processing on field photos:
 * 1. Image Quality Evaluation (brightness, contrast)
 * 2. Reference Colour Card Detection & Lighting Normalization
 * 3. Test Kit Reaction Area Detection & Colour Extraction
 */

import { ReferenceCardData, ReactionAreaData, ImageQualityStatus, PatchColor } from '../types';

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function sampleRegionAverage(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
): [number, number, number] {
  const imgData = ctx.getImageData(
    Math.floor(x),
    Math.floor(y),
    Math.max(1, Math.floor(width)),
    Math.max(1, Math.floor(height))
  );
  const data = imgData.data;
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  const count = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    totalR += data[i];
    totalG += data[i + 1];
    totalB += data[i + 2];
  }

  return [
    Math.round(totalR / count),
    Math.round(totalG / count),
    Math.round(totalB / count)
  ];
}

export function sampleRegionVariance(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
): number {
  const imgData = ctx.getImageData(
    Math.floor(x),
    Math.floor(y),
    Math.max(1, Math.floor(width)),
    Math.max(1, Math.floor(height))
  );
  const data = imgData.data;
  let sum = 0;
  let sumSq = 0;
  const count = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += lum;
    sumSq += lum * lum;
  }
  const mean = sum / count;
  return Math.sqrt(Math.max(0, (sumSq / count) - (mean * mean)));
}

export interface ImageAnalysisOutput {
  imageQuality: ImageQualityStatus;
  referenceCard: ReferenceCardData;
  reactionArea: ReactionAreaData;
}

export async function analyzeFieldImage(
  imageSource: HTMLImageElement | string,
  forceMissingCard: boolean = false,
  forcePoorQuality: boolean = false,
  useStandardCard: boolean = false,
  simulatedReactionColor?: string
): Promise<ImageAnalysisOutput> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    if (typeof imageSource === 'string') {
      const el = new Image();
      el.crossOrigin = 'anonymous';
      el.onload = () => resolve(el);
      el.onerror = (err) => reject(err);
      el.src = imageSource;
    } else {
      resolve(imageSource);
    }
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || 800;
  canvas.height = img.naturalHeight || 600;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const W = canvas.width;
  const H = canvas.height;

  // 1. Image Quality Check
  const overallRgb = sampleRegionAverage(ctx, 0, 0, W, H);
  const avgBrightness = 0.299 * overallRgb[0] + 0.587 * overallRgb[1] + 0.114 * overallRgb[2];

  let imageQuality: ImageQualityStatus = 'ACCEPTABLE';
  if (forcePoorQuality || avgBrightness < 20 || avgBrightness > 250) {
    imageQuality = 'RECAPTURE_REQUIRED';
  } else if (avgBrightness < 45 || avgBrightness > 225) {
    imageQuality = 'DEGRADED_LIGHTING';
  }

  // Sample outer background for reference (top-left margin)
  const bgRgb = sampleRegionAverage(ctx, 0.04 * W, 0.04 * H, 0.12 * W, 0.12 * H);

  // 2. Reference Card Detection (Positioned strictly in lower-left card guide zone)
  const cardX = 0.05 * W;
  const cardY = 0.60 * H;
  const cardW = 0.25 * W;
  const cardH = 0.32 * H;

  let isCardDetected = false;
  let whitePatchRgb: [number, number, number];
  let grayPatchRgb: [number, number, number];
  let blackPatchRgb: [number, number, number];
  let huePatchRgb: [number, number, number];

  if (useStandardCard && !forceMissingCard) {
    // Standard calibration card mode (virtual reference standard)
    isCardDetected = true;
    whitePatchRgb = [252, 252, 252];
    grayPatchRgb = [128, 128, 130];
    blackPatchRgb = [24, 24, 25];
    huePatchRgb = [0, 162, 232];
  } else {
    // Sample card patches at their exact geometrical relative positions
    whitePatchRgb = sampleRegionAverage(ctx, cardX + 0.12 * cardW, cardY + 0.28 * cardH, 0.20 * cardW, 0.20 * cardH);
    grayPatchRgb = sampleRegionAverage(ctx, cardX + 0.44 * cardW, cardY + 0.28 * cardH, 0.20 * cardW, 0.20 * cardH);
    blackPatchRgb = sampleRegionAverage(ctx, cardX + 0.76 * cardW, cardY + 0.28 * cardH, 0.20 * cardW, 0.20 * cardH);
    huePatchRgb = sampleRegionAverage(ctx, cardX + 0.15 * cardW, cardY + 0.68 * cardH, 0.20 * cardW, 0.20 * cardH);

    const lum = (rgb: [number, number, number]) => 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
    const isNeutral = (rgb: [number, number, number], maxDiff = 40) => 
      Math.max(
        Math.abs(rgb[0] - rgb[1]),
        Math.abs(rgb[1] - rgb[2]),
        Math.abs(rgb[0] - rgb[2])
      ) <= maxDiff;

    const whiteLum = lum(whitePatchRgb);
    const grayLum = lum(grayPatchRgb);
    const blackLum = lum(blackPatchRgb);

    const hasStrictStepOrder = (whiteLum > grayLum + 18) && (grayLum > blackLum + 18);
    const hasValidLuminance = whiteLum >= 130 && blackLum <= 90;
    const isWhiteNeutral = isNeutral(whitePatchRgb, 45);
    const isGrayNeutral = isNeutral(grayPatchRgb, 40);
    const isBlackNeutral = isNeutral(blackPatchRgb, 35);
    const isCyanChromatic = huePatchRgb[2] > 70 && (huePatchRgb[2] > huePatchRgb[0] + 25 || huePatchRgb[1] > huePatchRgb[0] + 20);
    const cardContrast = whiteLum - blackLum;
    const hasSufficientContrast = cardContrast >= 55;

    isCardDetected = !forceMissingCard && 
      hasStrictStepOrder && 
      hasValidLuminance && 
      isWhiteNeutral && 
      isGrayNeutral && 
      isBlackNeutral && 
      isCyanChromatic && 
      hasSufficientContrast;
  }

  const whitePatch: PatchColor = {
    name: 'Reference White',
    expectedHex: '#FFFFFF',
    measuredHex: rgbToHex(whitePatchRgb[0], whitePatchRgb[1], whitePatchRgb[2]),
    isCalibrated: isCardDetected
  };

  const grayPatch: PatchColor = {
    name: 'Mid Gray',
    expectedHex: '#808080',
    measuredHex: rgbToHex(grayPatchRgb[0], grayPatchRgb[1], grayPatchRgb[2]),
    isCalibrated: isCardDetected
  };

  const blackPatch: PatchColor = {
    name: 'Reference Black',
    expectedHex: '#191919',
    measuredHex: rgbToHex(blackPatchRgb[0], blackPatchRgb[1], blackPatchRgb[2]),
    isCalibrated: isCardDetected
  };

  const huePatch: PatchColor = {
    name: 'Reference Cyan',
    expectedHex: '#00A2E8',
    measuredHex: rgbToHex(huePatchRgb[0], huePatchRgb[1], huePatchRgb[2]),
    isCalibrated: isCardDetected
  };

  // IF REFERENCE CARD IS NOT DETECTED:
  // Calibration = NOT AVAILABLE
  // Reaction analysis = NOT AVAILABLE
  // Result = NOT AVAILABLE
  if (!isCardDetected) {
    const referenceCard: ReferenceCardData = {
      detected: false,
      statusText: 'Reference Colour Card Not Detected',
      lightingStatus: 'RECAPTURE_REQUIRED',
      calibrationReady: false,
      calibrationError: 'Reference card missing from capture frame',
      patches: {
        white: whitePatch,
        neutralGray: grayPatch,
        black: blackPatch,
        referenceHue: huePatch
      }
    };

    const reactionArea: ReactionAreaData = {
      detected: false,
      observedColorName: 'Not Available',
      rawHex: '#000000',
      calibratedHex: '#000000',
      statusText: 'Analysis Blocked — Reference Card Required',
      validationError: 'Reaction analysis unavailable until physical reference card is verified.'
    };

    return {
      imageQuality: 'RECAPTURE_REQUIRED',
      referenceCard,
      reactionArea
    };
  }

  // 3. Calibration Validation
  const isCalibrationReady = imageQuality !== 'RECAPTURE_REQUIRED' && !forcePoorQuality;
  const referenceCard: ReferenceCardData = {
    detected: true,
    statusText: isCalibrationReady 
      ? 'Reference Colour Card Detected' 
      : 'Lighting Calibration Blocked',
    lightingStatus: imageQuality,
    calibrationReady: isCalibrationReady,
    calibrationError: isCalibrationReady ? undefined : 'Ambient illumination prevents accurate calibration',
    patches: {
      white: whitePatch,
      neutralGray: grayPatch,
      black: blackPatch,
      referenceHue: huePatch
    }
  };

  // IF CALIBRATION FAILS:
  // Reaction analysis = BLOCKED
  // Result = BLOCKED
  if (!isCalibrationReady) {
    const reactionArea: ReactionAreaData = {
      detected: false,
      observedColorName: 'Not Available',
      rawHex: '#000000',
      calibratedHex: '#000000',
      statusText: 'Analysis Blocked — Calibration Failed',
      validationError: 'Reaction analysis blocked due to unacceptable image lighting or patch occlusion.'
    };

    return {
      imageQuality,
      referenceCard,
      reactionArea
    };
  }

  // Calculate calibration gains based on reference white patch
  const gainR = Math.max(0.65, Math.min(1.85, 250 / Math.max(whitePatchRgb[0], 30)));
  const gainG = Math.max(0.65, Math.min(1.85, 250 / Math.max(whitePatchRgb[1], 30)));
  const gainB = Math.max(0.65, Math.min(1.85, 250 / Math.max(whitePatchRgb[2], 30)));

  // 4. Test Kit Reaction Area Detection (Center zone inside guide brackets)
  const rxX = 0.36 * W;
  const rxY = 0.28 * H;
  const rxW = 0.28 * W;
  const rxH = 0.42 * H;

  // Center liquid reaction zone
  const rxLiquidX = rxX + 0.15 * rxW;
  const rxLiquidY = rxY + 0.18 * rxH;
  const rxLiquidW = 0.70 * rxW;
  const rxLiquidH = 0.64 * rxH;

  const rawRxRgb = sampleRegionAverage(ctx, rxLiquidX, rxLiquidY, rxLiquidW, rxLiquidH);
  const rxVariance = sampleRegionVariance(ctx, rxX, rxY, rxW, rxH);

  // Validate presence of reaction chamber against background
  const diffFromBg = Math.max(
    Math.abs(rawRxRgb[0] - bgRgb[0]),
    Math.abs(rawRxRgb[1] - bgRgb[1]),
    Math.abs(rawRxRgb[2] - bgRgb[2])
  );

  // If reaction region matches background with low variance, the test pouch is missing from the brackets
  const isReactionAreaDetected = useStandardCard ? true : (diffFromBg >= 16 || rxVariance >= 8);

  if (!isReactionAreaDetected) {
    const reactionArea: ReactionAreaData = {
      detected: false,
      observedColorName: 'Not Available',
      rawHex: rgbToHex(rawRxRgb[0], rawRxRgb[1], rawRxRgb[2]),
      calibratedHex: rgbToHex(rawRxRgb[0], rawRxRgb[1], rawRxRgb[2]),
      statusText: 'Kit Reaction Area Not Detected in Guide Brackets',
      validationError: 'Test kit reaction chamber not identified. Center the pouch within target brackets.'
    };

    return {
      imageQuality,
      referenceCard,
      reactionArea
    };
  }

  // 5. Apply Calibration Gains to ONLY the reaction chamber
  const calRxRgb: [number, number, number] = [
    Math.min(255, Math.round(rawRxRgb[0] * gainR)),
    Math.min(255, Math.round(rawRxRgb[1] * gainG)),
    Math.min(255, Math.round(rawRxRgb[2] * gainB))
  ];

  const rawHex = rgbToHex(rawRxRgb[0], rawRxRgb[1], rawRxRgb[2]);
  const calHex = rgbToHex(calRxRgb[0], calRxRgb[1], calRxRgb[2]);

  // Determine descriptive reaction color name on calibrated pixels
  let observedColorName = 'Indeterminate Reaction Color';
  const [cr, cg, cb] = calRxRgb;

  if (simulatedReactionColor) {
    observedColorName = simulatedReactionColor;
  } else if (cr > 50 && cb > 50 && cg < Math.min(cr, cb) * 0.8) {
    observedColorName = 'Purple / Violet Reaction';
  } else if (cb > 70 && cb > cr * 1.25 && cb > cg * 1.15) {
    observedColorName = 'Cobalt Blue Reaction';
  } else if (cg > 70 && cb > 60 && cg > cr * 1.2) {
    observedColorName = 'Blue-Green Reaction';
  } else if ((cr > 130 && cg > 130 && cb < cr * 0.95) || (cr > 180 && cg > 180 && cb > 150)) {
    observedColorName = 'Clear / Pale Straw (Unreacted)';
  } else if (cr > 140 && cg < 100 && cb < 90) {
    observedColorName = 'Orange-Brown Reaction';
  }

  const reactionArea: ReactionAreaData = {
    detected: true,
    observedColorName,
    rawHex,
    calibratedHex: calHex,
    statusText: 'Kit Reaction Chamber Identified'
  };

  return {
    imageQuality,
    referenceCard,
    reactionArea
  };
}
