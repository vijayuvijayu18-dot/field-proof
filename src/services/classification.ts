/**
 * Field Reagent Software Classifier
 * 
 * Analyzes the visual reaction produced by an existing colorimetric field-test kit.
 * Works alongside the physical test kit — does not replace laboratory confirmatory testing.
 */

import { KitProfile, KitType, ClassificationResult, ReferenceCardData, ReactionAreaData, ImageQualityStatus } from '../types';

export const STANDARD_KIT_PROFILES: Record<KitType, KitProfile> = {
  'Marquis': {
    kitId: 'FTK-000184',
    kitType: 'Marquis',
    displayName: 'Marquis Field Reagent Pouch',
    targetCategory: 'Presumptive Alkaloids / Opiate Class (e.g. Morphine, Codeine, Heroin) or Amphetamines',
    referenceCardRequirement: 'Standard 4-patch reference colour calibration card (White, 50% Gray, Black, Cyan) placed in camera frame together with the test area.',
    reactionAreaDefinition: 'Central transparent viewing window of the reagent pouch containing the reaction mixture.',
    classificationCriteriaSource: 'Standard Field Criteria',
    expectedPositiveReaction: 'Characteristic purple/violet coloration (or orange-brown for amphetamines)',
    expectedNegativeReaction: 'No chromogenic shift (clear to pale straw unreacted liquid baseline)'
  },
  'Scott': {
    kitId: 'FTK-000219',
    kitType: 'Scott',
    displayName: 'Scott (Cobalt Thiocyanate) Field Reagent Pouch',
    targetCategory: 'Presumptive Cocaine Class (HCl / Base)',
    referenceCardRequirement: 'Standard 4-patch reference colour calibration card (White, 50% Gray, Black, Cyan) placed in camera frame together with the test area.',
    reactionAreaDefinition: 'Lower reaction chamber of the multi-ampoule field pouch.',
    classificationCriteriaSource: 'Standard Field Criteria',
    expectedPositiveReaction: 'Distinctive cobalt blue precipitate/solution',
    expectedNegativeReaction: 'No blue color change (faint pink or clear baseline solution)'
  },
  'Mecke': {
    kitId: 'FTK-000305',
    kitType: 'Mecke',
    displayName: 'Mecke Reagent Field Test Kit',
    targetCategory: 'Presumptive Opiate / Alkaloid Screening',
    referenceCardRequirement: 'Standard 4-patch reference colour calibration card (White, 50% Gray, Black, Cyan) placed in camera frame together with the test area.',
    reactionAreaDefinition: 'Central reaction viewing chamber of the pouch.',
    classificationCriteriaSource: 'Standard Field Criteria',
    expectedPositiveReaction: 'Characteristic blue-green coloration',
    expectedNegativeReaction: 'No significant color change (unreacted matrix baseline)'
  },
  'Duquenois-Levine': {
    kitId: 'FTK-000412',
    kitType: 'Duquenois-Levine',
    displayName: 'Duquenois-Levine Field Reagent Kit',
    targetCategory: 'Presumptive Cannabinoids / THC Class',
    referenceCardRequirement: 'Standard 4-patch reference colour calibration card (White, 50% Gray, Black, Cyan) placed in camera frame together with the test area.',
    reactionAreaDefinition: 'Separated lower chloroform layer in the reaction chamber.',
    classificationCriteriaSource: 'Standard Field Criteria',
    expectedPositiveReaction: 'Violet coloration in the extracted chloroform layer',
    expectedNegativeReaction: 'Absence of violet coloration in the extracted layer'
  },
  'General Colorimetric': {
    kitId: 'FTK-000091',
    kitType: 'General Colorimetric',
    displayName: 'General Presumptive Colorimetric Kit',
    targetCategory: 'Configured Colorimetric Field Screening',
    referenceCardRequirement: 'Standard 4-patch reference colour calibration card (White, 50% Gray, Black, Cyan) placed in camera frame together with the test area.',
    reactionAreaDefinition: 'Configured test window of the field reagent container.',
    classificationCriteriaSource: 'Standard Field Criteria',
    expectedPositiveReaction: 'Specified visual chromogenic shift',
    expectedNegativeReaction: 'Absence of specified reaction'
  }
};

export function classifyReaction(
  profile: KitProfile,
  referenceCard: ReferenceCardData,
  reactionArea: ReactionAreaData,
  imageQuality: ImageQualityStatus
): ClassificationResult {
  // Step 2 Dependency Check: Reference card must be detected
  if (!referenceCard.detected) {
    return {
      outcome: 'INCONCLUSIVE',
      workflowState: 'RECAPTURE_REQUIRED',
      summary: 'RECAPTURE REQUIRED — REFERENCE CARD NOT DETECTED.',
      targetSubstanceClass: profile.targetCategory,
      recaptureReason: 'Place the required reference colour card inside the capture frame together with the test/reaction area.',
      blockedReason: 'CALIBRATION — BLOCKED | REACTION ANALYSIS — BLOCKED | CLASSIFICATION — BLOCKED',
      isPresumptive: true,
      engine: 'Reference-Calibrated Visual Analysis',
      evidenceChecklist: {
        referenceCardDetected: false,
        calibrationSuccessful: false,
        reactionAreaDetected: false,
        imageQualityAcceptable: imageQuality === 'ACCEPTABLE',
        digitalFingerprintGenerated: true
      }
    };
  }

  // Step 3 Dependency Check: Calibration must succeed
  if (!referenceCard.calibrationReady || imageQuality === 'RECAPTURE_REQUIRED') {
    return {
      outcome: 'INCONCLUSIVE',
      workflowState: 'ANALYSIS_BLOCKED',
      summary: 'ANALYSIS BLOCKED — LIGHTING CALIBRATION FAILED.',
      targetSubstanceClass: profile.targetCategory,
      recaptureReason: referenceCard.calibrationError || 'Lighting calibration failed due to unacceptable illumination or patch occlusion.',
      blockedReason: 'CALIBRATION FAILED: REACTION ANALYSIS — BLOCKED | CLASSIFICATION — BLOCKED',
      isPresumptive: true,
      engine: 'Reference-Calibrated Visual Analysis',
      evidenceChecklist: {
        referenceCardDetected: true,
        calibrationSuccessful: false,
        reactionAreaDetected: false,
        imageQualityAcceptable: false,
        digitalFingerprintGenerated: true
      }
    };
  }

  // Step 4 Dependency Check: Reaction area must be identified
  if (!reactionArea.detected) {
    return {
      outcome: 'INCONCLUSIVE',
      workflowState: 'RECAPTURE_REQUIRED',
      summary: 'INCONCLUSIVE — REQUIRED VISUAL EVIDENCE NOT AVAILABLE.',
      targetSubstanceClass: profile.targetCategory,
      recaptureReason: reactionArea.validationError || 'Reaction area not detected in configured region. Place both the reference card and test/reaction area inside the frame.',
      blockedReason: 'REACTION AREA MISSING: VISUAL ANALYSIS — BLOCKED | CLASSIFICATION — BLOCKED',
      isPresumptive: true,
      engine: 'Reference-Calibrated Visual Analysis',
      evidenceChecklist: {
        referenceCardDetected: true,
        calibrationSuccessful: true,
        reactionAreaDetected: false,
        imageQualityAcceptable: true,
        digitalFingerprintGenerated: true
      }
    };
  }

  // ONLY AFTER ALL REQUIRED VALIDATION STEPS PASS:
  // Step 5: Visual Analysis on calibrated reaction pixels
  const color = reactionArea.observedColorName.toLowerCase();

  if (profile.kitType === 'Marquis') {
    if (color.includes('violet') || color.includes('purple')) {
      return {
        outcome: 'POSITIVE',
        workflowState: 'ANALYSIS_COMPLETE',
        summary: `Software classification based on configured visual criteria: Presumptive positive chromogenic reaction detected. Observed purple/violet reaction matches the ${profile.classificationCriteriaSource} for ${profile.displayName}.`,
        targetSubstanceClass: profile.targetCategory,
        isPresumptive: true,
        engine: 'Reference-Calibrated Visual Analysis',
        evidenceChecklist: {
          referenceCardDetected: true,
          calibrationSuccessful: true,
          reactionAreaDetected: true,
          imageQualityAcceptable: true,
          digitalFingerprintGenerated: true
        }
      };
    } else if (color.includes('yellow') || color.includes('straw') || color.includes('clear')) {
      return {
        outcome: 'NEGATIVE',
        workflowState: 'ANALYSIS_COMPLETE',
        summary: `Software classification based on configured visual criteria: No characteristic chromogenic shift detected. Reaction area matches the negative unreacted baseline for ${profile.displayName}.`,
        targetSubstanceClass: profile.targetCategory,
        isPresumptive: true,
        engine: 'Reference-Calibrated Visual Analysis',
        evidenceChecklist: {
          referenceCardDetected: true,
          calibrationSuccessful: true,
          reactionAreaDetected: true,
          imageQualityAcceptable: true,
          digitalFingerprintGenerated: true
        }
      };
    }
  } else if (profile.kitType === 'Scott') {
    if (color.includes('blue')) {
      return {
        outcome: 'POSITIVE',
        workflowState: 'ANALYSIS_COMPLETE',
        summary: `Software classification based on configured visual criteria: Presumptive positive reaction detected. Characteristic cobalt blue precipitate observed in the reaction area.`,
        targetSubstanceClass: profile.targetCategory,
        isPresumptive: true,
        engine: 'Reference-Calibrated Visual Analysis',
        evidenceChecklist: {
          referenceCardDetected: true,
          calibrationSuccessful: true,
          reactionAreaDetected: true,
          imageQualityAcceptable: true,
          digitalFingerprintGenerated: true
        }
      };
    } else {
      return {
        outcome: 'NEGATIVE',
        workflowState: 'ANALYSIS_COMPLETE',
        summary: `Software classification based on configured visual criteria: No cobalt blue coloration observed. Sample does not indicate a positive response on the Scott reagent test.`,
        targetSubstanceClass: profile.targetCategory,
        isPresumptive: true,
        engine: 'Reference-Calibrated Visual Analysis',
        evidenceChecklist: {
          referenceCardDetected: true,
          calibrationSuccessful: true,
          reactionAreaDetected: true,
          imageQualityAcceptable: true,
          digitalFingerprintGenerated: true
        }
      };
    }
  } else if (profile.kitType === 'Mecke') {
    if (color.includes('blue') || color.includes('green')) {
      return {
        outcome: 'POSITIVE',
        workflowState: 'ANALYSIS_COMPLETE',
        summary: `Software classification based on configured visual criteria: Presumptive positive reaction detected. Characteristic blue-green coloration observed in the reaction area.`,
        targetSubstanceClass: profile.targetCategory,
        isPresumptive: true,
        engine: 'Reference-Calibrated Visual Analysis',
        evidenceChecklist: {
          referenceCardDetected: true,
          calibrationSuccessful: true,
          reactionAreaDetected: true,
          imageQualityAcceptable: true,
          digitalFingerprintGenerated: true
        }
      };
    } else {
      return {
        outcome: 'NEGATIVE',
        workflowState: 'ANALYSIS_COMPLETE',
        summary: `Software classification based on configured visual criteria: No characteristic blue-green shift observed. Reaction area matches unreacted reagent baseline.`,
        targetSubstanceClass: profile.targetCategory,
        isPresumptive: true,
        engine: 'Reference-Calibrated Visual Analysis',
        evidenceChecklist: {
          referenceCardDetected: true,
          calibrationSuccessful: true,
          reactionAreaDetected: true,
          imageQualityAcceptable: true,
          digitalFingerprintGenerated: true
        }
      };
    }
  } else if (profile.kitType === 'Duquenois-Levine') {
    if (color.includes('violet') || color.includes('purple')) {
      return {
        outcome: 'POSITIVE',
        workflowState: 'ANALYSIS_COMPLETE',
        summary: `Software classification based on configured visual criteria: Presumptive positive reaction detected. Characteristic violet coloration observed in the extracted layer.`,
        targetSubstanceClass: profile.targetCategory,
        isPresumptive: true,
        engine: 'Reference-Calibrated Visual Analysis',
        evidenceChecklist: {
          referenceCardDetected: true,
          calibrationSuccessful: true,
          reactionAreaDetected: true,
          imageQualityAcceptable: true,
          digitalFingerprintGenerated: true
        }
      };
    } else {
      return {
        outcome: 'NEGATIVE',
        workflowState: 'ANALYSIS_COMPLETE',
        summary: `Software classification based on configured visual criteria: No violet extraction observed. Matches negative baseline for Duquenois-Levine test.`,
        targetSubstanceClass: profile.targetCategory,
        isPresumptive: true,
        engine: 'Reference-Calibrated Visual Analysis',
        evidenceChecklist: {
          referenceCardDetected: true,
          calibrationSuccessful: true,
          reactionAreaDetected: true,
          imageQualityAcceptable: true,
          digitalFingerprintGenerated: true
        }
      };
    }
  }

  // Ambiguous state (All validations passed, but reaction color is ambiguous)
  return {
    outcome: 'INCONCLUSIVE',
    workflowState: 'INCONCLUSIVE',
    summary: 'INCONCLUSIVE — REQUIRED VISUAL EVIDENCE NOT AVAILABLE.',
    targetSubstanceClass: profile.targetCategory,
    recaptureReason: 'Intermediate or ambiguous reaction observed. Observed chromogenic change does not clearly match positive or negative demonstration criteria.',
    isPresumptive: true,
    engine: 'Reference-Calibrated Visual Analysis',
    evidenceChecklist: {
      referenceCardDetected: true,
      calibrationSuccessful: true,
      reactionAreaDetected: true,
      imageQualityAcceptable: true,
      digitalFingerprintGenerated: true
    }
  };
}
