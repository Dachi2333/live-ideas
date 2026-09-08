export function runDraftsSendAction({
  currentDraft,
  createService,
  onSuccess,
  onFailure,
}) {
  let result;
  try {
    const service = createService();
    result = service.send({
      id: currentDraft.uuid,
      text: currentDraft.content,
      createdAt: currentDraft.createdAt.toISOString(),
    });
  } catch (error) {
    result = {
      ok: false,
      clearInput: false,
      fragment: null,
      error: error instanceof Error ? error.message : "send_action_failed",
    };
  }

  if (result.ok === true && result.clearInput === true) {
    onSuccess(result);
  } else {
    onFailure(result.error || "send_failed", result);
  }

  return result;
}
