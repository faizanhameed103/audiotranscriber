import React, { useState } from "react";
import axios from "axios";

const App = () => {
  const assembly = axios.create({
    baseURL: "https://api.assemblyai.com/v2",
    headers: {
      authorization: "cd610432583949c2b0404f55a064ec75",
      "content-type": "application/json",
      "transfer-encoding": "chunked",
    },
  });

  const [transcript, setTranscript] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleFileChange = async (event) => {
    // Reset messages
    setMessage("Uploading file...");
    setError("");

    const selectedFile = event.target.files[0];

    if (!selectedFile) {
      setError("Please select an audio file.");
      return;
    }

    const formData = new FormData();
    formData.append("audio", selectedFile);

    try {
      const uploadResponse = await assembly.post("/upload", selectedFile);

      if (uploadResponse.status === 200) {
        const uploadURL = uploadResponse.data.upload_url;

        setMessage("Transcribing...");
        submitTranscription(uploadURL);
      } else {
        setError("File upload to AssemblyAI failed.");
      }
    } catch (error) {
      setError("An error occurred while uploading the file.");
    }
  };

  const submitTranscription = (uploadURL) => {
    setIsLoading(true);
    assembly
      .post("/transcript", { audio_url: uploadURL, language_detection: true })
      .then((response) => {
        const transcriptID = response.data.id;

        setMessage("Processing...");
        checkTranscriptionStatus(transcriptID);
      })
      .catch((error) => {
        setError("Transcription request to AssemblyAI failed.");
      });
  };

  const checkTranscriptionStatus = (transcriptID) => {
    const interval = setInterval(async () => {
      try {
        const response = await assembly.get(`/transcript/${transcriptID}`);
        const transcriptData = response.data;

        if (transcriptData.status === "completed") {
          clearInterval(interval);
          setIsLoading(false);
          setMessage("Transcription completed!");
          setTranscript(transcriptData.text);
        }
      } catch (error) {
        setError("An error occurred while checking transcription status.");
      }
    }, 1000);
  };

  const downloadTranscript = () => {
    const element = document.createElement("a");
    const file = new Blob([transcript], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "transcript.txt";
    element.click();
  };

  return (
    <div>
      <h1>Audio Transcription App</h1>
      <input type="file" accept="audio/*" onChange={handleFileChange} />
      {isLoading ? <p>{message}</p> : <p>{transcript}</p>}
      {error && <p className="error">{error}</p>}
      {transcript && (
        <button onClick={downloadTranscript}>Download Transcript</button>
      )}
    </div>
  );
};

export default App;