# SignBridge 🤟 — Two-Way Sign Language Translator (ASL & ISL)

SignBridge is an accessible, client-side web application designed to bridge the communication gap between hearing individuals and Deaf/hard-of-hearing individuals in real-time. Built for high performance, it operates completely client-side without requiring paid cloud APIs.

---

## 🌟 Key Features

### 1. Text/Speech → Sign Language (Hearing Interface)
- **Voice Dictation (Speech-to-Text):** Integrated in-browser Web Speech API (`SpeechRecognition`) converts spoken words into text instantly.
- **Phrase Tokenizer & Matcher:** Smart parser matches multi-word phrases (e.g. *"thank you"*, *"my name is"*, *"good morning"*) before word tokenization.
- **Sequential Sign Player:** Displays sign video/clip representations with customizable playback speed (0.5x, 1.0x, 1.5x), play/pause controls, and active token sequence filmstrip.
- **Fingerspelling Fallback:** Automatically falls back to spelling out unlisted words letter-by-letter using manual alphabet assets.

### 2. Sign Language → Text/Speech (Deaf Interface)
- **Real-Time MediaPipe Hand Tracking:** Uses `@mediapipe/hands` to track 21 3D hand keypoints directly inside the browser using WebGL.
- **Visual Skeleton Overlay:** Renders real-time hand joint connections, fingertip glow indicators, and bounding boxes on the camera feed.
- **Language-Aware Landmark Classifier:** Features normalized wrist-relative scaling and geometric flex angles for both **ASL (1-Hand)** and **ISL (2-Hand)** gestures.
- **Debounced Text Stream & Text-to-Speech:** Accumulates recognized letters/words into a sentence buffer with "Space", "Backspace", and "Speak Aloud" (`speechSynthesis`) triggers.

### 3. Multi-Sign-Language Architecture (ASL & ISL)
- **Extensible JSON Schema:** Structured with independent data directories per language (`/public/data/signs/asl/` and `/public/data/signs/isl/`).
- **Language Switcher UI:** Instantly toggle between **ASL (American Sign Language)** and **ISL (Indian Sign Language)** in the navigation header.
- **Fingerspelling Differences Handled:** Accommodates one-handed ASL fingerspelling and two-handed ISL fingerspelling.

---

## 📂 Asset & Vocabulary Inventory

| Language | Word Signs | Manual Alphabet | Hand Type | Asset Status |
| :--- | :--- | :--- | :--- | :--- |
| **ASL** (American Sign Language) | 32 Core Words & Phrases (*hello, thank you, yes, no, help, water, food, please, sorry, my name is, I love you, friend, family, etc.*) | Full A-Z (26 letters) | One-Handed | 100% Client-side structured vectors & clips |
| **ISL** (Indian Sign Language) | 18 Core Words & Phrases (*hello, namaste, thank you, yes, no, help, water, food, please, sorry, friend, etc.*) | Full A-Z (26 letters) | Two-Handed | 100% Client-side structured vectors & clips |

> *Note:* To keep the build lightweight and fast, visual signs use high-fidelity vector handshape diagrams and animated canvas clips. Expanding to full 4K MP4 sign video files per word is supported natively by the JSON schema.

---

## 🛠️ Quick Setup & Running Locally

### Prerequisites
- Node.js (v18.0.0 or higher)
- Modern web browser (Google Chrome or Microsoft Edge recommended for Web Speech API support)

### Installation Steps

1. **Clone or extract repository:**
   ```bash
   cd signbridge
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run local dev server:**
   ```bash
   npm run dev
   ```

4. **Access in Browser:**
   Open [http://localhost:3000](http://localhost:3000)

---

## 🎬 Demo Flow Walkthrough

### Scenario A: Hearing Person to Deaf Person (Mic → Sign Video)
1. Ensure **ASL** or **ISL** is selected in the top bar.
2. On the **Hearing Interface** (Left side):
   - Click the microphone icon 🎙️ and say *"Hello thank you help"* OR type it in the text box.
   - Click **Sign**.
3. Watch the **Sign Player** render the corresponding animated sign sequence seamlessly with captions and playhead controls.

### Scenario B: Deaf Person to Hearing Person (Camera → Speech)
1. On the **Deaf Interface** (Right side):
   - Click **Start Camera** 📷 to grant webcam access.
2. Hold your hand up in front of the camera:
   - Form ASL signs like **L**, **V (Peace)**, **Y**, **B**, **W**, **Thumbs Up (Yes)**, **Open Hand (Hello)**, or **ILY (I Love You)**.
   - For **ISL mode**: try **Namaste** (both palms together) or ISL 2-hand letter signs.
3. Observe real-time MediaPipe hand landmark skeleton tracking and confidence indicators.
4. Click **Speak Aloud** 🔊 to hear the Web Speech API read the assembled text out loud.

---

## 🚀 Future Work & Scalability Roadmap

1. **Cloud-Hosted ML Pipeline:**
   - Deploy a fine-tuned Graph Convolutional Network (GCN) or Spatial-Temporal Transformer model hosted on AWS Lambda / Google Cloud Run with GPU acceleration for continuous sign recognition.
   - Host large MP4 video libraries on AWS S3 / Cloudflare R2 with global CDN edge caching.

2. **Continuous Sentence-Level Translation & Non-Manual Signals:**
   - Incorporate MediaPipe Face Mesh and Holistic tracking to capture facial expressions, mouthings, and body posture essential for grammatical sign language nuance.

3. **3D Avatar-Based Sign Generation:**
   - Replace 2D clips with dynamic WebGL / Three.js 3D avatar mesh animation driven by ASL/ISL movement notation (e.g. HamNoSys / SiGML).

4. **Deaf Community Co-Design & Validation:**
   - Partner with native Deaf signers, linguists, and accessibility advocates to audit, expand, and certify sign vocabulary datasets across BSL, Auslan, LSF, and regional dialects.

---

## 📄 License
MIT License.

