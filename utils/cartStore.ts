// utils/cartStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "cart_v1";
let cart: any[] = [];
const subscribers = new Set<(c: any[]) => void>();

const notify = () => {
  const snapshot = [...cart];
  subscribers.forEach((cb) => {
    try { cb(snapshot); } catch (e) { /* ignore */ }
  });
};

const persist = async () => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch (e) {
    console.warn("cartStore: error saving", e);
  }
};

export const getCart = async (): Promise<any[]> => {
  // load from storage once if empty
  if (cart.length === 0) {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      cart = raw ? JSON.parse(raw) : [];
    } catch (e) {
      cart = [];
    }
  }
  return [...cart];
};

export const subscribe = (cb: (c: any[]) => void) => {
  subscribers.add(cb);
  // send current value immediately
  cb([...cart]);
  return () => subscribers.delete(cb);
};

export const saveCart = async (nuevoCart: any[]) => {
  cart = [...nuevoCart];
  await persist();
  notify();
  return [...cart];
};

export const addToCart = async (producto: any) => {
  await getCart();
  const index = cart.findIndex((p) => p.id_producto === producto.id_producto);
  if (index !== -1) {
    cart[index] = {
      ...cart[index],
      cantidad: Number(cart[index].cantidad) + Number(producto.cantidad ?? 1),
    };
  } else {
    cart.push({
      ...producto,
      cantidad: Number(producto.cantidad ?? 1),
    });
  }
  await persist();
  notify();
  return [...cart];
};

export const removeFromCart = async (id: number) => {
  await getCart();
  cart = cart.filter((p) => p.id_producto !== id);
  await persist();
  notify();
  return [...cart];
};

export const clearCart = async () => {
  cart = [];
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    /* ignore */
  }
  notify();
  return [];
};