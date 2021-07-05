/* @flow */

import admin from "firebase-admin";
import config from "./config.json"

admin.initializeApp({
  credential: admin.credential.cert(config),
  storageBucket: "cta-fun.appspot.com"
});

export const storage = admin.storage();
export const db = admin.firestore();

function _deleteQueryBatch(query, resolve, reject) {
  const promise = query
    .get()
    .then((snapshot) => {
      // When there are no documents left, we are done
      if (snapshot.size === 0) {
        return 0;
      }

      // Delete documents in a batch
      let batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      return batch.commit().then(() => {
        return snapshot.size;
      });
    })
    .then((numDeleted) => {
      if (numDeleted === 0) {
        resolve();
        return;
      }

      // Recurse on the next process tick, to avoid
      // exploding the stack.
      process.nextTick(() => {
        _deleteQueryBatch(query, resolve, reject);
      });
    })
    .catch(reject);

    return promise
}

export function deleteQueryBatch(buildQuery/* :Function */, resolve/* :Function */, reject/* :Function */) {
  const query = buildQuery(db)
  return _deleteQueryBatch(query, resolve, reject)
}