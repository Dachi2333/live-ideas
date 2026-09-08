export function createFragmentStore({ readJson, writeJson }) {
  function readAll() {
    const value = readJson();
    return Array.isArray(value) ? value : [];
  }

  function writeAll(items) {
    if (writeJson(items) !== true) {
      throw new Error("fragment_store_write_failed");
    }
  }

  return {
    insert(fragment) {
      const items = readAll();
      if (items.some((item) => item.id === fragment.id)) {
        throw new Error("fragment_already_exists");
      }
      writeAll([...items, fragment]);
      return fragment;
    },

    replace(fragment) {
      const items = readAll();
      const index = items.findIndex((item) => item.id === fragment.id);
      if (index < 0) throw new Error("fragment_not_found");
      const next = [...items];
      next[index] = fragment;
      writeAll(next);
      return fragment;
    },

    get(id) {
      return readAll().find((item) => item.id === id) ?? null;
    },

    listSent() {
      return readAll()
        .filter((item) => item.status === "sent")
        .sort((a, b) => b.sentAt.localeCompare(a.sentAt));
    },

    countSent() {
      return readAll().filter((item) => item.status === "sent").length;
    },
  };
}
