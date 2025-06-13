import { useEffect } from "react";
import { useFriendStore } from "../store/useFriendStore";
import { Check, XCircle } from "lucide-react";

const FriendRequestsPage = () => {
    const { incoming, fetchRequests, respond } = useFriendStore();

    useEffect(() => {
        fetchRequests();
    }, []);

    return (
        <div className="min-h-screen bg-white max-w-xl mx-auto pt-24 px-4">
            <h2 className="text-2xl font-semibold mb-6">Friend Requests</h2>

            {incoming.length === 0 && (
                <p className="text-zinc-500">You have no pending requests.</p>
            )}

            <ul className="space-y-4">
                {incoming.map((req) => (
                    <li
                        key={req._id}
                        className="p-3 rounded border flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <img
                                className="size-10 rounded-full border"
                                src={req.sender.profilePic || "/avatar.png"}
                            />
                            <div>
                                <p className="font-medium">{req.sender.fullName}</p>
                                <p className="text-xs text-zinc-500">{req.sender.email}</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => respond(req._id, "accept")}
                                className="btn btn-sm btn-success"
                                title="Accept"
                            >
                                <Check className="size-4" />
                            </button>
                            <button
                                onClick={() => respond(req._id, "reject")}
                                className="btn btn-sm btn-error"
                                title="Reject"
                            >
                                <XCircle className="size-4" />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FriendRequestsPage;