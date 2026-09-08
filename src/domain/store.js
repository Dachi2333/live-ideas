export function createFragmentStore({ read, write }) {
  const all = () => {
    const value = read();
    return Array.isArray(value) ? value : [];
  };
  const save = (items) => write(items);

  return {
    get(id) {
      return all().find((item) => item.id === id) ?? null;
    },
    insert(fragment) {
      const items = all();
      if (items.some((item) => item.id === fragment.id)) throw new Error("fragment_already_exists");
      save([...items, fragment]);
      return fragment;
    },
    replace(fragment) {
      const items = all();
      const index = items.findIndex((item) => item.id === fragment.id);
      if (index < 0) throw new Error("fragment_not_found");
      const next = [...items];
      next[index] = fragment;
      save(next);
      return fragment;
    },
    listSent() {
      return all()
        .filter((item) => item.status === "sent")
        .sort((a, b) => (b.sentAt ?? "").localeCompare(a.sentAt ?? ""));
    },
    countSent() {
      return all().filter((item) => item.status === "sent").length;
    },
  };
}
