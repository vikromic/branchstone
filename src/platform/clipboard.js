export async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Some browsers expose the API but deny it outside a secure context.
    }
  }

  const helper = document.createElement("textarea");
  helper.value = value;
  helper.setAttribute("readonly", "");
  helper.className = "clipboard-copy-helper";
  document.body.appendChild(helper);
  try {
    helper.select();
    if (!document.execCommand("copy")) throw new Error("copy unavailable");
  } finally {
    helper.remove();
  }
}
