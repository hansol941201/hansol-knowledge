(function () {
  const codec = window.HANSOL_STORAGE_CODEC;
  const ref = id => window.HANSOL_FIRESTORE.doc(`stateParts/${id}`);
  window.HANSOL_CLOUD_STORAGE = {
    read: (root, transaction) => codec.unpack(root, async id => {
      const snapshot = transaction ? await transaction.get(ref(id)) : await ref(id).get();
      return snapshot.exists ? snapshot.data() : null;
    }),
    async write(transaction, stateDoc, state, previous) {
      const packed = await codec.pack(state, previous.storageVersion === 2);
      for (const part of new Map(packed.parts.map(p => [p.id, p])).values()) transaction.set(ref(part.id), { data: part.data });
      // Root + parts commit atomically. Failed writes retain the entire old state.
      transaction.set(stateDoc, { ...packed.root, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      for (const id of new Set(previous.shards || [])) if (!packed.root.shards?.includes(id)) transaction.delete(ref(id));
    }
  };
})();
