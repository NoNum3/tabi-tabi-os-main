import { atom } from "jotai";
import { loadFeatureState, saveFeatureState } from "@/utils/storage";

const FEATURE_KEY = "inventory";

export interface Product {
    id: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
    createdAt: string;
}

const initialInventory: Product[] = (() => {
    const saved = loadFeatureState<Product[]>(FEATURE_KEY);
    if (saved && Array.isArray(saved)) return saved;
    // Example starter data
    return [
        {
            id: "1",
            name: "Sample Product",
            sku: "SKU-001",
            price: 99.99,
            stock: 10,
            createdAt: new Date().toISOString(),
        },
    ];
})();

const baseInventoryAtom = atom<Product[]>(initialInventory);

export const inventoryAtom = atom(
    (get) => get(baseInventoryAtom),
    (get, set, newInventory: Product[] | ((prev: Product[]) => Product[])) => {
        const current = get(baseInventoryAtom);
        const updated = typeof newInventory === "function"
            ? newInventory(current)
            : newInventory;
        if (JSON.stringify(current) !== JSON.stringify(updated)) {
            set(baseInventoryAtom, updated);
            saveFeatureState(FEATURE_KEY, updated);
        }
    },
);

export const searchInventoryAtom = atom("");

// Action atoms
export const addProductAtom = atom(
    null,
    (get, set, product: Omit<Product, "id" | "createdAt">) => {
        const newProduct: Product = {
            ...product,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
        };
        set(inventoryAtom, (prev) => [newProduct, ...prev]);
    },
);

export const editProductAtom = atom(
    null,
    (get, set, updated: Product) => {
        set(
            inventoryAtom,
            (prev) =>
                prev.map((
                    p,
                ) => (p.id === updated.id ? { ...p, ...updated } : p)),
        );
    },
);

export const deleteProductAtom = atom(
    null,
    (get, set, id: string) => {
        set(inventoryAtom, (prev) => prev.filter((p) => p.id !== id));
    },
);
