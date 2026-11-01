// Pure commission-request rules: draft shape, draft sanitization, the wizard
// reducer, contact validation and the prepared letter. Persistence, focus and
// clipboard handoff stay with the page.

export const LAST_STEP = 3;

const emptyData = Object.freeze({
  name: "",
  email: "",
  commissionType: "open",
  scale: "intimate",
  placement: "",
  dimensions: "",
  budget: "",
  colors: "",
  materials: "",
  timeline: "",
  vision: "",
  referral: "",
});

export const draftFieldLimits = Object.freeze({
  name: 120,
  email: 254,
  commissionType: 32,
  scale: 32,
  placement: 300,
  dimensions: 300,
  budget: 300,
  colors: 300,
  materials: 300,
  timeline: 300,
  vision: 1200,
  referral: 300,
});

export function createWizardState() {
  return {
    data: { ...emptyData },
    step: 0,
    errors: {},
    restored: false,
    handoffStatus: "",
  };
}

export function sanitizeDraft(saved) {
  if (!saved || typeof saved !== "object" || !saved.data || typeof saved.data !== "object") return null;
  const legacy = saved.data;
  const aliases = {
    name: legacy.name,
    email: legacy.email,
    commissionType: legacy.commissionType ?? legacy["commission-type"],
    scale: legacy.scale ?? legacy.size,
    placement: legacy.placement,
    dimensions: legacy.dimensions,
    budget: legacy.budget,
    colors: legacy.colors,
    materials: legacy.materials,
    timeline: legacy.timeline,
    vision: legacy.vision ?? legacy.theme,
    referral: legacy.referral,
  };
  const data = { ...emptyData };
  Object.entries(aliases).forEach(([key, value]) => {
    if (typeof value === "string") data[key] = value.slice(0, draftFieldLimits[key]);
  });
  data.commissionType = ({ custom: "open" })[data.commissionType] ?? data.commissionType;
  if (!["open", "abstract", "nature", "mixed-media"].includes(data.commissionType)) data.commissionType = emptyData.commissionType;
  data.scale = ({ small: "intimate", medium: "anchor", large: "architectural", custom: "unsure", "": "intimate" })[data.scale] ?? data.scale;
  if (!["intimate", "anchor", "architectural", "unsure"].includes(data.scale)) data.scale = emptyData.scale;
  const rawStep = Number(saved.step);
  const step = Number.isInteger(rawStep) ? Math.min(LAST_STEP, Math.max(0, rawStep)) : 0;
  return { data, step };
}

export function wizardReducer(state, action) {
  switch (action.type) {
    case "RESTORE":
      return { ...state, data: action.payload.data, step: action.payload.step, restored: true };
    case "FIELD":
      return {
        ...state,
        data: { ...state.data, [action.name]: action.value },
        errors: { ...state.errors, [action.name]: undefined },
        handoffStatus: "",
      };
    case "NEXT":
      if (Object.keys(action.errors).length) return { ...state, errors: action.errors };
      return { ...state, step: Math.min(LAST_STEP, state.step + 1), errors: {}, handoffStatus: "" };
    case "BACK":
      return { ...state, step: Math.max(0, state.step - 1), errors: {}, handoffStatus: "" };
    case "ERRORS":
      return { ...state, errors: action.errors };
    case "HANDOFF_STATUS":
      return { ...state, handoffStatus: action.value };
    default:
      return state;
  }
}

export function validateContact(data) {
  const errors = {};
  if (!data.name.trim()) errors.name = "name";
  if (!data.email.trim()) errors.email = "email";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.email = "emailInvalid";
  return errors;
}

export function getDirectionLabel(data, wizardText) {
  return wizardText.stepThree.typeOptions.find(([value]) => value === data.commissionType)?.[1] ?? data.commissionType;
}

export function getScaleLabel(data, wizardText) {
  return wizardText.stepTwo.scaleOptions.find(([value]) => value === data.scale)?.[1] ?? data.scale;
}

export function buildCommissionMessage(data, wizardText, letterText) {
  const lines = [
    letterText.greeting,
    "",
    letterText.opening,
    "",
    `${wizardText.review.labels.name}: ${data.name.trim()}`,
    `${wizardText.review.labels.email}: ${data.email.trim()}`,
    `${wizardText.review.labels.scale}: ${getScaleLabel(data, wizardText)}`,
    `${wizardText.review.labels.placement}: ${data.placement.trim() || wizardText.review.empty}`,
    `${wizardText.review.labels.dimensions}: ${data.dimensions.trim() || wizardText.review.empty}`,
    `${wizardText.review.labels.budget}: ${data.budget.trim() || wizardText.review.empty}`,
    `${wizardText.review.labels.commissionType}: ${getDirectionLabel(data, wizardText)}`,
    `${wizardText.review.labels.colors}: ${data.colors.trim() || wizardText.review.empty}`,
    `${wizardText.review.labels.materials}: ${data.materials.trim() || wizardText.review.empty}`,
    `${wizardText.review.labels.timeline}: ${data.timeline.trim() || wizardText.review.empty}`,
    `${wizardText.review.labels.vision}: ${data.vision.trim() || wizardText.review.empty}`,
    `${wizardText.review.labels.referral}: ${data.referral.trim() || wizardText.review.empty}`,
    "",
    letterText.closing,
  ];
  return lines.join("\n");
}

export function buildCommissionSubject(data, letterText) {
  return `${letterText.subject} — ${data.name.trim() || "Branchstone"}`;
}

export function buildCommissionMailto(recipient, subject, message) {
  return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}
