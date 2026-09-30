import { classifyReaction, STANDARD_KIT_PROFILES } from './src/services/classification';
import { ReferenceCardData, ReactionAreaData, ImageQualityStatus } from './src/types';

function runTests() {
  console.log('--- STARTING FIELD TEST VERIFICATION SUITE ---');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`✓ [PASS] ${msg}`);
    } else {
      console.error(`✗ [FAIL] ${msg}`);
      process.exitCode = 1;
    }
  }

  const profile = STANDARD_KIT_PROFILES['Marquis'];

  // 1. TEST CASE 1: Ordinary/random photo without reference card
  console.log('\n--- Test 1: Ordinary/random photo without reference card ---');
  const cardMissing: ReferenceCardData = {
    detected: false,
    statusText: 'Reference card not detected',
    lightingStatus: 'ACCEPTABLE',
    calibrationReady: false,
    calibrationError: 'Reference card not detected',
    patches: {
      white: { name: 'White', expectedHex: '#FFFFFF', measuredHex: '#888888', isCalibrated: false },
      neutralGray: { name: 'Gray', expectedHex: '#808080', measuredHex: '#555555', isCalibrated: false },
      black: { name: 'Black', expectedHex: '#151515', measuredHex: '#444444', isCalibrated: false },
      referenceHue: { name: 'Cyan', expectedHex: '#00A2E8', measuredHex: '#334455', isCalibrated: false }
    }
  };
  const reactionUnchecked: ReactionAreaData = {
    detected: false,
    observedColorName: 'Unknown',
    rawHex: '#000000',
    calibratedHex: '#000000',
    statusText: 'Not analyzed'
  };

  const res1 = classifyReaction(profile, cardMissing, reactionUnchecked, 'ACCEPTABLE');
  assert(res1.workflowState === 'RECAPTURE_REQUIRED', 'Test 1 workflow state must be RECAPTURE_REQUIRED');
  assert(res1.outcome === 'INCONCLUSIVE', 'Test 1 outcome must be INCONCLUSIVE (not Positive or Negative)');
  assert(res1.summary.includes('RECAPTURE REQUIRED — REFERENCE CARD NOT DETECTED'), 'Test 1 summary matches exact required wording');
  assert(res1.blockedReason?.includes('CALIBRATION — BLOCKED'), 'Test 1 blockedReason blocks calibration');
  assert(res1.blockedReason?.includes('REACTION ANALYSIS — BLOCKED'), 'Test 1 blockedReason blocks reaction analysis');
  assert(res1.blockedReason?.includes('CLASSIFICATION — BLOCKED'), 'Test 1 blockedReason blocks classification');

  // 2. TEST CASE 2: Image with degraded lighting where calibration fails
  console.log('\n--- Test 2: Reference card present but calibration fails ---');
  const cardCalibFailed: ReferenceCardData = {
    detected: true,
    statusText: 'Reference card detected',
    lightingStatus: 'DEGRADED_LIGHTING',
    calibrationReady: false,
    calibrationError: 'Lighting non-linear / glare',
    patches: { ...cardMissing.patches }
  };
  const res2 = classifyReaction(profile, cardCalibFailed, reactionUnchecked, 'RECAPTURE_REQUIRED');
  assert(res2.workflowState === 'ANALYSIS_BLOCKED', 'Test 2 workflow state must be ANALYSIS_BLOCKED');
  assert(res2.outcome === 'INCONCLUSIVE', 'Test 2 outcome must be INCONCLUSIVE');
  assert(res2.blockedReason?.includes('REACTION ANALYSIS — BLOCKED'), 'Test 2 blocks reaction analysis');
  assert(res2.blockedReason?.includes('CLASSIFICATION — BLOCKED'), 'Test 2 blocks classification');

  // 3. TEST CASE 3: Reference card valid, but reaction area missing / unframed
  console.log('\n--- Test 3: Card present, but reaction area missing / empty ---');
  const cardValid: ReferenceCardData = {
    detected: true,
    statusText: 'Reference card detected',
    lightingStatus: 'ACCEPTABLE',
    calibrationReady: true,
    patches: {
      white: { name: 'White', expectedHex: '#FFFFFF', measuredHex: '#F8F8FA', isCalibrated: true },
      neutralGray: { name: 'Gray', expectedHex: '#808080', measuredHex: '#828284', isCalibrated: true },
      black: { name: 'Black', expectedHex: '#151515', measuredHex: '#141416', isCalibrated: true },
      referenceHue: { name: 'Cyan', expectedHex: '#00A2E8', measuredHex: '#00A0E5', isCalibrated: true }
    }
  };
  const reactionMissing: ReactionAreaData = {
    detected: false,
    observedColorName: 'Empty',
    rawHex: '#000000',
    calibratedHex: '#000000',
    statusText: 'Chamber not detected',
    validationError: 'Reaction area not detected in configured region'
  };
  const res3 = classifyReaction(profile, cardValid, reactionMissing, 'ACCEPTABLE');
  assert(res3.workflowState === 'RECAPTURE_REQUIRED', 'Test 3 workflow state is RECAPTURE_REQUIRED');
  assert(res3.outcome === 'INCONCLUSIVE', 'Test 3 outcome is INCONCLUSIVE');
  assert(res3.summary.includes('INCONCLUSIVE — REQUIRED VISUAL EVIDENCE NOT AVAILABLE'), 'Test 3 uses standard inconclusive evidence phrasing');
  assert(res3.blockedReason?.includes('VISUAL ANALYSIS — BLOCKED'), 'Test 3 blocks visual analysis');
  assert(res3.blockedReason?.includes('CLASSIFICATION — BLOCKED'), 'Test 3 blocks classification');

  // 4. TEST CASE 4: Valid configured demonstration inputs (Deterministic outputs)
  console.log('\n--- Test 4: Valid configured demonstration inputs ---');
  const reactionMarquisPositive: ReactionAreaData = {
    detected: true,
    observedColorName: 'Deep Purple / Violet',
    rawHex: '#4A154B',
    calibratedHex: '#4B144E',
    statusText: 'Valid reaction chamber'
  };
  const res4Marquis = classifyReaction(profile, cardValid, reactionMarquisPositive, 'ACCEPTABLE');
  assert(res4Marquis.workflowState === 'ANALYSIS_COMPLETE', 'Marquis positive workflow state is ANALYSIS_COMPLETE');
  assert(res4Marquis.outcome === 'POSITIVE', 'Marquis positive outcome is POSITIVE');
  assert(res4Marquis.summary.includes('Software classification based on configured visual criteria'), 'Marquis positive has required software classification wording');

  // Check determinism across 20 iterations
  let deterministic = true;
  for (let i = 0; i < 20; i++) {
    const r = classifyReaction(profile, cardValid, reactionMarquisPositive, 'ACCEPTABLE');
    if (r.outcome !== 'POSITIVE' || r.workflowState !== 'ANALYSIS_COMPLETE') {
      deterministic = false;
    }
  }
  assert(deterministic, 'Marquis positive is 100% deterministic across multiple runs');

  // Scott kit positive
  const scottProfile = STANDARD_KIT_PROFILES['Scott'];
  const reactionScottPositive: ReactionAreaData = {
    detected: true,
    observedColorName: 'Cobalt Blue',
    rawHex: '#0047AB',
    calibratedHex: '#0045A8',
    statusText: 'Valid reaction chamber'
  };
  const res4Scott = classifyReaction(scottProfile, cardValid, reactionScottPositive, 'ACCEPTABLE');
  assert(res4Scott.outcome === 'POSITIVE', 'Scott positive outcome is POSITIVE');

  // Mecke kit negative
  const meckeProfile = STANDARD_KIT_PROFILES['Mecke'];
  const reactionMeckeNegative: ReactionAreaData = {
    detected: true,
    observedColorName: 'Pale Straw (Unreacted)',
    rawHex: '#F4E8C1',
    calibratedHex: '#F6EAC4',
    statusText: 'Valid reaction chamber'
  };
  const res4Mecke = classifyReaction(meckeProfile, cardValid, reactionMeckeNegative, 'ACCEPTABLE');
  assert(res4Mecke.outcome === 'NEGATIVE', 'Mecke negative outcome is NEGATIVE');

  console.log(`\n========================================`);
  console.log(`TEST RESULTS: ${passed} / ${total} assertions passed`);
  console.log(`========================================\n`);
}

runTests();
