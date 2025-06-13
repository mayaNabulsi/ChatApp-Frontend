import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Mic, MicOff, Send, X } from 'lucide-react';

import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage } = useChatStore();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);   // raw blob
  const [audioPreview, setAudioPreview] = useState(null); // blob URL for <audio>
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRec = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRec;

      mediaRec.ondataavailable = (e) => {
        if (e.data.size) audioChunksRef.current.push(e.data);
      };

      mediaRec.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioPreview(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRec.start();
      setIsRecording(true);
    } catch (err) {
      toast.error('Microphone permission denied');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const removeAudio = () => {
    setAudioBlob(null);
    setAudioPreview(null);
  };

  /* ---------- convert blob → base-64 ---------- */
  const blobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !audioBlob) return;

    let audioBase64;
    if (audioBlob) audioBase64 = await blobToBase64(audioBlob);

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
        audio: audioBase64,   // <— new
      });

      /* clear */
      setText('');
      removeImage();
      removeAudio();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {audioPreview && (
        <div className="mb-3 flex items-center gap-2">
          <audio
            controls
            src={audioPreview}
            className="w-48"
            preload="metadata" />
          <button
            onClick={removeAudio}
            className="btn btn-xs btn-circle"
            type="button"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                     ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>

          <button
            type="button"
            className="btn btn-circle"
            onClick={isRecording ? stopRecording : startRecording}
            title={isRecording ? 'Stop' : 'Record'}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview && !audioBlob}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};
export default MessageInput;
