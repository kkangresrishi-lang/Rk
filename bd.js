export const DBManager = {
    dbName: 'AppStorageEngine',
    version: 1,
    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('state_store')) {
                    db.createObjectStore('state_store', { keyPath: 'id' });
                }
            };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    },
    async saveState(id, data) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('state_store', 'readwrite');
            const store = transaction.objectStore('state_store');
            const request = store.put({ id, data, timestamp: Date.now() });
            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error);
        });
    },
    async getState(id) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('state_store', 'readonly');
            const store = transaction.objectStore('state_store');
            const request = store.get(id);
            // FIX: Purani incomplete line ko yahan sahi kiya hai
            request.onsuccess = () => resolve(request.result ? request.result.data : null);
            request.onerror = () => reject(request.error);
        });
    }
};