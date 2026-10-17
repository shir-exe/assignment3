# Attention ONNX Models Directory

Place the pretrained model file `v4_2.onnx` in this directory:

- Expected Path: `/public/models/v4_2.onnx`
- Purpose: Web-based real-time inference using `onnxruntime-web` for facial landmark detection and attentiveness classification.
- In absence of the binary model file, the application gracefully activates an intelligent client-side fallback engine to ensure seamless evaluation and UI responsiveness.
