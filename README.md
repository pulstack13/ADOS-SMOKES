# ADOS

ADOS is a browser-hosted, smoke-free virtual lounge with camera-based visual effects. Everything is fictional and on-screen: no real smoke, tobacco, inhalation, tracking, or remote service is involved.

## Run

To use live camera mode, run a local server from this folder:

```powershell
python server.py
```

Then open `http://localhost:8000`. Browser cameras need localhost or HTTPS, so camera access will not work reliably when opening `index.html` directly.

## Interactions

- Choose one of four virtual lounge moods to change the scene palette.
- Use “Make a cloud” to animate the decorative vapor.
- Toggle floating petals (scene motion) and optional synthesized chime sound.
- Select a world card to jump back to its scene.
- Select **Start virtual mode** to use a local webcam preview and trigger virtual cloud effects over it.
- In virtual mode, a hookah-style bottle stays on the right side and its pipe follows the first detected hand. Bring the mouthpiece close to your mouth to trigger a decorative cloud; opening your mouth is also supported as a backup gesture. This tracking runs locally in the browser. The MediaPipe tracking library is loaded from jsDelivr when the page opens.
