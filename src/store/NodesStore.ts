import { create } from 'zustand';

type NodesStore = {
    Nodes: any[]; 
    SetNodes: (nodes: any[]) => void;
};

export const useNodesStore = create<NodesStore>((set) => ({
    Nodes: [],
    SetNodes: (nodes) => set({ Nodes: nodes }),
}));
export default useNodesStore;
