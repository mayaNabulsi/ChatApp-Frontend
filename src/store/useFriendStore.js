
import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useFriendStore = create((set, get) => ({
    searchResults: [],
    isSearching: false,
    incoming: [],        // pending requests *to* me
    outgoing: [],
    friends: [],           // full objects of my accepted friends

    /* --------------- SEARCH --------------- */
    searchUsers: async (term) => {
        if (!term.trim()) return set({ searchResults: [] });

        set({ isSearching: true });
        try {
            const { data } = await axiosInstance.get("/friends/search", {
                params: { query: term }
            });
            set({ searchResults: data });
        } catch (err) {
            toast.error(err.response?.data?.error || "Search failed");
        } finally {
            set({ isSearching: false });
        }
    },

    /* --------------- SEND REQUEST --------------- */
    sendRequest: async (targetId) => {
        const { outgoing } = get();
        if (outgoing.includes(targetId)) return;

        // optimistic UI
        set({ outgoing: [...outgoing, targetId] });

        try {
            await axiosInstance.post(`/friends/requests/${targetId}`);
            toast.success("Request sent");
        } catch (err) {
            toast.error(err.response?.data?.error || "Could not send request");
            set({ outgoing: get().outgoing.filter((id) => id !== targetId) }); // rollback
        }
    },
    fetchRequests: async () => {
        try {
            const [inc, out] = await Promise.all([
                axiosInstance.get("/friends/requests/incoming"),
                axiosInstance.get("/friends/requests/outgoing")
            ]);
            console.log('arrived', inc.data)
            set({
                incoming: inc.data,                   // full objects
                outgoing: out.data.map((r) => r.receiver._id)
            });
        } catch (_) { }
    },

    respond: async (requestId, action) => {
        // optimistic – remove from list
        set({ incoming: get().incoming.filter((r) => r._id !== requestId) });

        try {
            await axiosInstance.patch(`/friends/requests/${requestId}`, { action });
            if (action === "accept") {
                toast.success("Friend added!");
                get().refreshFriends();
            }
        } catch (err) {
            toast.error("Could not update request");
            get().fetchRequests();        // resync
        }
    },

    /* --------------- SOCKET HOOK-UP --------------- */
    bindSocketEvents: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.off("friendRequest:new");
        socket.off("friendRequest:accepted");
        // new incoming request → maybe show a toast / indicator
        socket.on("friendRequest:new", (req) => {
            toast.success(`New request from ${req.sender.fullName}`);
            get().fetchRequests();
        });

        /* accepted notifications update friends list automatically
           (you could also re-fetch with /friends if you prefer) */
        socket.on("friendRequest:accepted", ({ by }) => {
            toast.success("Friend request accepted!");
            get().refreshFriends();
        });
    },

    refreshFriends: async () => {
        try {
            const { data } = await axiosInstance.get("/friends");
            set({ friends: data });
        } catch (_) { }
    }
}));
