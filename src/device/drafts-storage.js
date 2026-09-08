export function createDraftsStorage(fileManager, path = "/live-ideas-fragments.json") {
  return {
    readJson() {
      return fileManager.readJSON(path);
    },
    writeJson(value) {
      return fileManager.writeJSON(path, value);
    },
  };
}
