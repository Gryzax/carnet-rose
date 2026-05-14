import localforage from 'localforage';

const store = localforage.createInstance({ name: 'CarnetRose', storeName: 'prefs' });

export const getPref = (key: string): Promise<string | null> => store.getItem<string>(key);

export const setPref = async (key: string, value: string): Promise<void> => {
  await store.setItem(key, value);
};
