/** Source-grounded CVAT calculations. These are review aids, never approval or certification.
 * Source mode preserves known source defects. Corrected mode changes only documented
 * lookups, pivot completeness and explicit, reasoned analyst applicability/interpretation.
 */
let sourceData;
let loading;
export function setAssessmentData(data) {
  if (data?.schema !== "cosn-cvat-assessment-source" || data.version !== "4.1")
    throw Error("Unsupported assessment source data.");
  sourceData = data;
  return data;
}
export async function loadAssessmentData(url = new URL("assessment-data.json", import.meta.url)) {
  if (sourceData) return sourceData;
  if (!loading) loading = fetch(url).then(async response => {
    if (!response.ok) throw Error("The assessment source data could not be loaded.");
    return setAssessmentData(await response.json());
  }).catch(error => { loading = undefined; throw error; });
  return loading;
}
export function getAssessmentData() {
  if (!sourceData) throw Error("Load the assessment source data before calculating.");
  return sourceData;
}
export function defaultReview() {
  return {
    framework: "NIST Cybersecurity Framework",
    calculationMode: "source",
    preparedDate: "",
    qualitative: Object.fromEntries(["COMP-01", "COMP-02", "COMP-09"].map(id => [id, {compliant:"",score:null,notes:""}])),
    applicability: {},
    categoryApplicability: {},
    favorableOverrides: {},
    analystNotes: "",
  };
}
function dataOrDefault(data) { return data || getAssessmentData(); }
function evaluateGuidanceAST(node, cells, depth = 0) {
  if (depth > 20) throw Error("Guidance expression is too deeply nested.");
  if (typeof node === "string" || typeof node === "boolean") return node;
  if (!node || typeof node !== "object") throw Error("Invalid guidance expression.");
  if (Object.hasOwn(node, "cell")) return cells[node.cell] ?? "";
  if (node.eq) return evaluateGuidanceAST(node.eq[0], cells, depth + 1) === evaluateGuidanceAST(node.eq[1], cells, depth + 1);
  if (node.if) return evaluateGuidanceAST(node.if[evaluateGuidanceAST(node.if[0], cells, depth + 1) ? 1 : 2], cells, depth + 1);
  throw Error("Unsupported guidance expression.");
}
export function guidanceFor(id, answer = "", data) {
  const record = dataOrDefault(data).questions[id];
  if (!record) throw Error("Unknown source question: " + id);
  const guidance = record.guidance;
  const rawValue = guidance.ast
    ? evaluateGuidanceAST(guidance.ast, {[guidance.inputCell]: answer === "Yes" || answer === "No" ? answer : ""})
    : guidance.static;
  return {
    id, source: guidance.source, formula: guidance.formula,
    kind: guidance.ast ? "conditional" : guidance.static ? "static" : "none",
    rawValue, text: typeof rawValue === "boolean" ? rawValue ? "TRUE" : "FALSE" : String(rawValue || ""),
    resultType: typeof rawValue === "boolean" ? "boolean" : "text",
    hasGuidance: typeof rawValue === "string" && rawValue.length > 0,
  };
}
const states = new Set(["applicable", "not-applicable", "unreviewed"]);
const isValidExclusion = entry => entry?.state === "not-applicable" && typeof entry.reason === "string" && entry.reason.trim().length > 0;
const isValidScore = score => typeof score === "number" && Number.isFinite(score) && score >= 0 && score <= 10;
const sourceGrade = ratio => ratio === null ? null : ratio >= .9 ? "A" : ratio >= .8 ? "B" : ratio >= .7 ? "C" : ratio >= .6 ? "D" : "F";
export function evaluateAssessment(questions, draft, options = {}) {
  const data = dataOrDefault(options.data), review = {...defaultReview(), ...draft?.review};
  const mode = options.mode || review.calculationMode || "source";
  if (!["source", "corrected"].includes(mode)) throw Error("Unknown calculation mode.");
  const records = draft?.records || {}, warnings = [], corrections = [];
  const questionInputs = questions || Object.values(data.questions);
  const sourceQuestions = questionInputs.filter(q => !q.id.startsWith("GNRL-") && q.id !== "DATE-01");
  const results = sourceQuestions.map(question => {
    const source = data.questions[question.id];
    if (!source) throw Error("Unknown source question: " + question.id);
    const answer = typeof records[question.id]?.answer === "string" ? records[question.id].answer : "";
    const record = records[question.id] || {}, scoring = source.score;
    const questionApplicability = review.applicability?.[question.id];
    const categoryApplicability = review.categoryApplicability?.[source.section];
    const excluded = mode === "corrected" && (isValidExclusion(questionApplicability) || isValidExclusion(categoryApplicability));
    const exclusionReason = excluded ? isValidExclusion(questionApplicability) ? questionApplicability.reason.trim() : categoryApplicability.reason.trim() : "";
    for (const [entry, label] of [[questionApplicability, question.id], [categoryApplicability, source.section]]) {
      if (entry && (!states.has(entry.state) || entry.state === "not-applicable" && !isValidExclusion(entry))) warnings.push(`${label}: not-applicable exclusion requires an analyst reason; the item remains in the calculation.`);
    }
    const override = review.favorableOverrides?.[question.id];
    const overrideValid = override && ["Yes", "No"].includes(override.answer) && typeof override.reason === "string" && override.reason.trim().length > 0;
    if (override && !overrideValid && (override.answer || override.reason)) warnings.push(`${question.id}: a favorable-answer interpretation needs Yes or No and an analyst reason; the source interpretation remains in use.`);
    const overridden = mode === "corrected" && overrideValid;
    const favorableAnswer = overridden ? override.answer : scoring?.favorableAnswer || "";
    const lookupMissing = question.kind === "choice" && scoring && !scoring.vendorLookupPresent;
    const effectiveAnswer = mode === "source" && lookupMissing ? "" : answer;
    const manual = review.qualitative?.[question.id] || {};
    // FIND in source is case-sensitive, but the source's YesNo list constrains input.
    const compliant = question.kind === "choice"
      ? !!favorableAnswer && effectiveAnswer.includes(favorableAnswer)
      : manual.compliant === "Yes";
    const baseWeight = scoring?.weight || 0;
    const weight = excluded ? 0 : baseWeight;
    const contribution = compliant ? weight : 0;
    const recorded = answer.trim().length > 0;
    return {
      id: question.id, text: question.text || "", section: source.section, kind: question.kind,
      answer, effectiveAnswer, favorableAnswer, sourceFavorableAnswer: scoring?.favorableAnswer || "",
      recorded, unknown: !recorded && !!record.unknown, unanswered: !recorded && !record.unknown,
      included: !excluded, excluded, exclusionReason,
      applicabilityState: questionApplicability?.state || categoryApplicability?.state || "unreviewed",
      compliant, score: contribution, weight, baseWeight,
      highRisk: !!scoring?.highRisk, sourcePivotIncluded: !!scoring?.inOriginalPivotRange,
      sourceRow: scoring?.row ?? null, source: scoring?.source || "Analyst Report!A35:H35",
      lookupMissing: !!lookupMissing, overridden, overrideReason: overridden ? override.reason.trim() : "",
    };
  });
  const categories = data.categories.map(category => {
    const all = results.filter(q => q.id.startsWith(category.prefix + "-"));
    const included = all.filter(q => q.included);
    const maxScore = included.reduce((sum, q) => sum + q.weight, 0);
    const score = included.reduce((sum, q) => sum + q.score, 0);
    const ratio = maxScore ? score / maxScore : null;
    return {...category, sourceMaxScore: category.maxScore, maxScore, score, ratio, percentage: ratio === null ? null : ratio * 100,
      included: maxScore > 0, count: all.length, includedCount: included.length, excludedCount: all.length - included.length,
      recorded: included.filter(q => q.recorded).length, unknown: included.filter(q => q.unknown).length, unanswered: included.filter(q => q.unanswered).length,
      sourceQuestionCount: all.filter(q => data.questions[q.id].score).length,
      compliantCount: included.filter(q => q.compliant && data.questions[q.id].score).length};
  });
  const numeric = categories.filter(category => category.ratio !== null);
  const ratio = numeric.length ? numeric.reduce((sum, category) => sum + category.ratio, 0) / numeric.length : null;
  const overall = {score: categories.reduce((sum, category) => sum + category.score, 0), maxScore: categories.reduce((sum, category) => sum + category.maxScore, 0), ratio,
    percentage: ratio === null ? null : ratio * 100, grade: sourceGrade(ratio), categoryCount: numeric.length,
    method: data.overall.method, source: data.overall.source};
  const qualitative = data.qualitative.map(item => {
    const input = review.qualitative?.[item.id] || {}, question = results.find(q => q.id === item.id);
    const score = isValidScore(input.score) ? input.score : null;
    const compliant = ["Yes", "No"].includes(input.compliant) ? input.compliant : "";
    if (input.score !== null && input.score !== undefined && input.score !== "" && score === null) warnings.push(`${item.id}: manual score must be a number from 0 to 10.`);
    return {...item, score, compliant, notes: typeof input.notes === "string" ? input.notes : "", included: question?.included !== false,
      complete: compliant !== "" && score !== null, vendorAnswer: records[item.id]?.answer || ""};
  });
  const company = categories.find(category => category.prefix === "COMP");
  const manualScore = qualitative.filter(item => item.included).reduce((sum, item) => sum + (item.score ?? 0), 0);
  const adjustedCompany = {baseScore: company?.score || 0, manualScore, score: (company?.score || 0) + manualScore,
    baseMaxScore: company?.maxScore || 0, manualMaxScore: qualitative.filter(item => item.included).length * 10,
    maxScore: (company?.maxScore || 0) + qualitative.filter(item => item.included).length * 10,
    maxScoreMethod: "Derived explanatory maximum: company weight total plus ten for each included narrative. The original H36 reports only the raw adjusted value.",
    complete: qualitative.filter(item => item.included).every(item => item.complete), applicable: !!company?.included,
    source: data.adjustedCompany.source, method: data.adjustedCompany.method};
  const highRisk = results.filter(q => q.highRisk && q.included && !q.compliant && (mode === "corrected" || q.sourcePivotIncluded));
  const applicable = results.filter(q => q.included);
  const counts = {total: results.length, included: applicable.length, excluded: results.length - applicable.length,
    recorded: applicable.filter(q => q.recorded).length, unanswered: applicable.filter(q => q.unanswered).length, unknown: applicable.filter(q => q.unknown).length,
    qualitativeComplete: qualitative.filter(q => q.included && q.complete).length, qualitativeTotal: qualitative.filter(q => q.included).length,
    applicabilityUnreviewed: applicable.filter(q => q.applicabilityState === "unreviewed").length,
    highRisk: highRisk.length, overrides: results.filter(q => q.overridden).length};
  if (counts.unanswered || counts.unknown) warnings.push(`Incomplete vendor responses: ${counts.unanswered} unanswered and ${counts.unknown} explicitly unknown. A numeric result is preliminary and is not approval.`);
  if (!adjustedCompany.complete) warnings.push("Manual company review is incomplete. The adjusted company value is provisional until all applicable narrative judgments and scores are recorded.");
  warnings.push("COMP-05 retains the source's favorable Yes for a security-event question unless an explicit, reasoned interpretation is entered in corrected mode. Review the incident context.");
  if (mode === "source") {
    warnings.push("Source-compatible calculation preserves missing COMP-07/08 answer lookups and excludes HLVU-03 from the original high-risk pivot range. The category score itself includes HLVU-03.");
    if (Object.keys(review.applicability || {}).length || Object.keys(review.categoryApplicability || {}).length || Object.keys(review.favorableOverrides || {}).length) warnings.push("Applicability and favorable-answer interpretation records are retained but do not change source-compatible denominators or answers.");
  } else {
    corrections.push(...data.corrections);
    warnings.push("Corrected mode is an independent adaptation, not an official CoSN score or certification. Exclusions and interpretation changes require district analyst reasons.");
  }
  if (!numeric.length) warnings.push("No scored category remains applicable; no overall percentage or grade is calculated.");
  return {mode, framework: review.framework || "", preparedDate: review.preparedDate || "", categories, overall, qualitative, adjustedCompany, highRisk, questions: results, counts,
    warnings: [...new Set(warnings)], corrections, status: counts.unanswered || counts.unknown || !adjustedCompany.complete ? "incomplete" : "ready-for-analyst-review",
    sourceVersion: data.version, sourceSHA256: data.sourceSHA256, noApproval: true};
}
