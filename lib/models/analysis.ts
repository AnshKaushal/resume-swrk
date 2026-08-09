import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const scoreSchema = new Schema(
  {
    value: { type: Number, min: 0, max: 100 },
    passed: { type: Boolean },
    feedback: { type: String },
  },
  { _id: false }
);

const checkSchema = new Schema(
  {
    category: { type: String, required: true },
    section: {
      type: String,
      enum: [
        "ats",
        "contentQuality",
        "impactAchievements",
        "jobMatch",
        "presentationReadability",
      ],
    },
    label: { type: String, required: true },
    score: { type: Number, min: 0, max: 100 },
    passed: { type: Boolean },
    feedback: { type: String },
  },
  { _id: false }
);

const majorScoresSchema = new Schema(
  {
    ats: { type: Number, min: 0, max: 100 },
    contentQuality: { type: Number, min: 0, max: 100 },
    impactAchievements: { type: Number, min: 0, max: 100 },
    jobMatch: { type: Number, min: 0, max: 100 },
    presentationReadability: { type: Number, min: 0, max: 100 },
  },
  { _id: false }
);

const aiInsightsSchema = new Schema(
  {
    achievementVsResponsibilityRatio: { type: String },
    recruiterFirstImpression: { type: Number, min: 0, max: 100 },
    topStrengths: [{ type: String }],
    biggestWeaknesses: [{ type: String }],
    missingCertifications: [{ type: String }],
    missingTechnologies: [{ type: String }],
    missingLeadershipEvidence: [{ type: String }],
    missingMetrics: [{ type: String }],
    uniquenessScore: { type: Number, min: 0, max: 100 },
    buzzwordOveruse: [{ type: String }],
    aiGeneratedLanguage: { type: String },
    personalBrandingConsistency: { type: Number, min: 0, max: 100 },
    careerProgression: { type: String },
    seniorityEstimation: { type: String },
    salaryCompetitivenessEstimate: { type: String },
    interviewProbability: { type: Number, min: 0, max: 100 },
    atsCompatibilityScore: { type: Number, min: 0, max: 100 },
    humanRecruiterAppealScore: { type: Number, min: 0, max: 100 },
    skillGapAnalysis: [{ type: String }],
    rewriteSuggestions: { type: String },
    sectionSuggestions: [{ type: String }],
    bulletRewrites: [{ type: String }],
    suggestedKeywords: [{ type: String }],
    overallConfidenceScore: { type: Number, min: 0, max: 100 },
  },
  { _id: false }
);

const analysisSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    fileName: {
      type: String,
      trim: true,
    },
    fileType: {
      type: String,
      trim: true,
    },
    resumeText: {
      type: String,
    },
    targetRole: {
      type: String,
      trim: true,
    },
    jobDescription: {
      type: String,
    },
    scores: {
      type: scoreSchema,
      default: {},
    },
    majorScores: {
      type: majorScoresSchema,
      default: {},
    },
    checks: {
      type: [checkSchema],
      default: [],
    },
    aiInsights: {
      type: aiInsightsSchema,
      default: {},
    },
    /** false for free-plan analyses that are not yet ₹199-unlocked. */
    unlocked: {
      type: Boolean,
      default: true,
    },
    /** canonical check labels whose fixes the user has applied for this analysis. */
    appliedFixes: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

analysisSchema.index({ userId: 1, createdAt: -1 });

export type Analysis = InferSchemaType<typeof analysisSchema>;

const AnalysisModel: Model<Analysis> =
  (models.Analysis as Model<Analysis>) ?? model<Analysis>("Analysis", analysisSchema);

export default AnalysisModel;
