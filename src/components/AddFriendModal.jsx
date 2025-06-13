import { useState, useEffect } from "react";
import { useFriendStore } from "../store/useFriendStore";
import { X, UserPlus } from "lucide-react";

const AddFriendModal = ({ open, onClose }) => {
    const {
        /* store actions / state */
        searchUsers,
        searchResults,
        isSearching,
        sendRequest,
        outgoing,          //  ⬅️ renamed
        friends
    } = useFriendStore();

    const [term, setTerm] = useState("");

    /* debounce search */
    useEffect(() => {
        const id = setTimeout(() => searchUsers(term), 350);
        return () => clearTimeout(id);
    }, [term]);

    if (!open) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box w-full max-w-lg">
                {/* header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Add contact</h3>
                    <button onClick={onClose}>
                        <X className="size-5" />
                    </button>
                </div>

                {/* search input */}
                <input
                    autoFocus
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="Search by name or email…"
                    className="input input-bordered w-full mb-4"
                />

                {isSearching && <p className="text-center">Searching…</p>}

                {!isSearching && searchResults.length === 0 && term && (
                    <p className="text-center text-sm text-zinc-500">No users found</p>
                )}

                {/* results */}
                <ul className="space-y-3 max-h-64 overflow-y-auto">
                    {searchResults.map((user) => {
                        const alreadyFriend = friends.some((f) => f._id === user._id);
                        const alreadySent = outgoing.includes(user._id);

                        return (
                            <li
                                key={user._id}
                                className="flex items-center justify-between p-2 rounded hover:bg-base-300"
                            >
                                <div className="flex items-center gap-3">
                                    <img
                                        src={user.profilePic || "/avatar.png"}
                                        className="size-10 rounded-full border"
                                    />
                                    <div>
                                        <p className="font-medium">{user.fullName}</p>
                                        <p className="text-xs text-zinc-500 truncate">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>

                                {/* right–side badge / button */}
                                {alreadyFriend ? (
                                    <span className="badge badge-success">Friend</span>
                                ) : alreadySent ? (
                                    <span className="badge badge-ghost">Sent</span>
                                ) : (
                                    <button
                                        onClick={() => sendRequest(user._id)}
                                        className="btn btn-sm btn-primary"
                                    >
                                        <UserPlus className="size-4 mr-1" /> Add
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>

            {/* backdrop */}
            <label className="modal-backdrop" onClick={onClose} />
        </div>
    );
};

export default AddFriendModal;