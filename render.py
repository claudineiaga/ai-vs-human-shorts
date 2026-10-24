"""Renders a scene to MP4.

Opens the scene in a headless Chromium, grabs it frame by frame, builds the audio
from the same timeline (sounds.py) and muxes everything into a vertical MP4 with ffmpeg.

Usage:
    python render.py                          -> ai_agents.mp4   (episode 1)
    python render.py --scene captcha          -> captcha.mp4     (episode 2)
    python render.py --lang pt                -> ai_agents_pt.mp4 (Portuguese on-screen text)
    python render.py --frames 0 120 300       -> only saves a few PNG frames (quick preview)
"""
import argparse
import base64
import subprocess
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

import sounds

HERE = Path(__file__).resolve().parent


def main():
    ap = argparse.ArgumentParser(description="Render an animated short to MP4.")
    ap.add_argument("--scene", default="ai_agents", help="scene file without .js (ai_agents, captcha)")
    ap.add_argument("--lang", default="en", choices=["en", "pt"], help="on-screen text language")
    ap.add_argument("--frames", nargs="+", type=int, help="only save these frame numbers as PNG")
    args = ap.parse_args()

    suffix = "" if args.lang == "en" else f"_{args.lang}"
    out_path = HERE / f"{args.scene}{suffix}.mp4"

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1080, "height": 1920})
        page.add_init_script(f"window.LANG = '{args.lang}';")
        page.goto((HERE / "render.html").as_uri() + f"?scene={args.scene}")
        page.wait_for_function("typeof renderFrame === 'function'", timeout=60000)

        if args.frames:
            for f in args.frames:
                data = page.evaluate(f"renderFrame({f})").split(",", 1)[1]
                png = HERE / f"frame_{args.scene}_{f:03d}.png"
                png.write_bytes(base64.b64decode(data))
                print("saved", png)
            browser.close()
            return

        # 1) audio: the scene describes its sound events, sounds.py synthesizes them
        spec = page.evaluate("audioEvents()")
        wav = HERE / "audio.wav"
        sounds.build(spec, str(wav))
        print("audio ready:", len(spec["events"]), "events")

        # 2) video: pipe every frame straight into ffmpeg
        total = page.evaluate("totalFrames()")
        ff = subprocess.Popen(
            ["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", "30", "-i", "-",
             "-i", str(wav), "-c:v", "libx264", "-preset", "medium", "-crf", "18",
             "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart",
             str(out_path)],
            stdin=subprocess.PIPE)
        t0 = time.time()
        for i in range(total):
            data = page.evaluate(f"renderFrame({i})").split(",", 1)[1]
            ff.stdin.write(base64.b64decode(data))
            if i % 60 == 0:
                print(f"frame {i}/{total}  ({time.time() - t0:.0f}s)", flush=True)
        ff.stdin.close()
        ff.wait()
        browser.close()
        print("done:", out_path)


if __name__ == "__main__":
    main()
