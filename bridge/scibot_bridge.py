#!/usr/bin/env python3
# ============================================================
#  SciBot Bridge — 웹페이지(브라우저)와 실물 로봇을 잇는 로컬 서버
#
#  검증된 robomation 라이브러리로 하드웨어(USB 동글)를 제어하고,
#  결과를 WebSocket 으로 웹페이지에 전달한다.
#  ★ 햄스터S 와 치즈스틱을 동시에 연결하고, 로봇별로 구분해 스트리밍.
#
#  실행:
#     pip install -U robomation websockets
#     python scibot_bridge.py                 (자동 포트 탐색)
#     python scibot_bridge.py --port COM10     (포트 지정 — 자동 탐색 실패 시)
#     python scibot_bridge.py --hamster-port COM10 --cheese-port COM7
#     python scibot_bridge.py --sim            (하드웨어 없이 테스트)
# ============================================================
import asyncio
import json
import sys
import os
import math
import time
import random
import functools

try:
    sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)
    sys.stderr.reconfigure(encoding="utf-8", line_buffering=True)
except Exception:
    pass

try:
    import websockets
except ImportError:
    print("[오류] websockets 패키지가 필요합니다.  pip install websockets")
    sys.exit(1)


def _arg(flag):
    if flag in sys.argv:
        i = sys.argv.index(flag)
        if i + 1 < len(sys.argv):
            return sys.argv[i + 1]
    return None


SIM = ("--sim" in sys.argv) or ("--simulate" in sys.argv)
# 로봇별 시뮬레이션(실물이 없을 때 데모용): --sim-cheese / --sim-hamster
SIM_CHEESE = SIM or ("--sim-cheese" in sys.argv) or bool(os.environ.get("SCIBOT_SIM_CHEESE"))
SIM_HAMSTER = SIM or ("--sim-hamster" in sys.argv) or bool(os.environ.get("SCIBOT_SIM_HAMSTER"))
PORT_ANY = _arg("--port") or os.environ.get("SCIBOT_PORT")
HAMSTER_PORT = _arg("--hamster-port") or os.environ.get("SCIBOT_HAMSTER_PORT") or PORT_ANY
CHEESE_PORT = _arg("--cheese-port") or os.environ.get("SCIBOT_CHEESE_PORT") or PORT_ANY

# Upstage Solar AI (실험 연계 챗봇) — 키는 서버(브리지)측에 보관
UPSTAGE_KEY = _arg("--upstage-key") or os.environ.get("UPSTAGE_API_KEY")
UPSTAGE_MODEL = _arg("--upstage-model") or os.environ.get("UPSTAGE_MODEL") or "solar-pro2"
UPSTAGE_URL = "https://api.upstage.ai/v1/chat/completions"

LIB = None
if not SIM:
    try:
        from robomation import HamsterS, CheeseStick  # type: ignore
        LIB = "robomation"
    except Exception:
        try:
            from roboid import HamsterS, CheeseStick   # type: ignore
            LIB = "roboid"
        except Exception:
            LIB = None

HOST = "localhost"
PORT = 8765
AVAILABLE = ["HamsterS", "CheeseStick"]

robots = {}          # name -> robot object (동시 보관)


def _s(fn, *a):
    """센서 읽기 안전 호출."""
    try:
        v = fn(*a)
        return v
    except Exception:
        return None


def parse_note(p):
    p = str(p or "C")
    octave = 4
    if p and p[-1].isdigit():
        octave = int(p[-1]); p = p[:-1]
    return (p or "C"), octave


class FakeRobot:
    """--sim 용 가짜 로봇. 실제 robomation API 와 같은 메서드명을 흉내 낸다."""
    def __init__(self, name="HamsterS"):
        self.name = name
        self._t0 = time.time() + (7 if name == "CheeseStick" else 0)

    def _log(self, *a): print("   [SIM %s]" % self.name, *a)
    # 명령
    def set_wheel_speed(self, unit, speed): self._log("wheel", unit, speed)
    def move_distance(self, d, unit="cm", wait=True): self._log("move", d, unit)
    def turn_degree(self, direction, d, wait=True): self._log("turn", direction, d)
    def stop(self): self._log("stop")
    def set_led_color(self, unit, r, g=None, b=None): self._log("led", unit, r, g, b)
    def sound_buzz(self, hz): self._log("buzz", hz)
    def sound_note(self, note, octave=4): self._log("note", note, octave)
    # 센서 (시간에 따라 변하는 가짜 값)
    def _w(self, base, amp, period, noise):
        t = time.time() - self._t0
        return base + amp * math.sin(t * 2 * math.pi / period) + random.uniform(-noise, noise)
    def floor(self, unit): return round(self._w(60 if unit == "left" else 58, 30, 6, 2))
    def proximity(self, unit): return round(self._w(30 if unit == "left" else 28, 25, 8, 3))
    def acceleration(self, axis):
        return round(self._w({"x": 0, "y": 0, "z": 16384}.get(axis, 0), 40 if axis != "z" else 200, 5, 1.5))
    def light(self): return round(self._w(55, 25, 12, 2))
    def temperature(self): return round(self._w(24, 4, 20, 0.2), 1)
    def humidity(self): return round(self._w(50, 15, 25, 1))
    def sound(self): return max(0, round(self._w(20, 30, 3, 5)))
    def volume(self): return round(self._w(50, 45, 15, 1))
    def pressure(self): return round(self._w(1013, 6, 40, 0.5), 1)


def make_robot(name, port=None):
    if SIM or (name == "CheeseStick" and SIM_CHEESE) or (name == "HamsterS" and SIM_HAMSTER):
        return FakeRobot(name)
    if LIB is None:
        raise RuntimeError("robomation/roboid 미설치 (테스트는 --sim)")
    if name == "CheeseStick":
        p = port or CHEESE_PORT
        return CheeseStick(0, p) if p else CheeseStick()
    p = port or HAMSTER_PORT
    return HamsterS(0, p) if p else HamsterS()


def ensure_robot(name, port=None):
    if name not in AVAILABLE:
        name = "HamsterS"
    if name not in robots:
        robots[name] = make_robot(name, port)
    return robots[name]


def remove_robot(name):
    r = robots.pop(name, None)
    if r is not None:
        _s(r.stop)
        _s(getattr(r, "dispose", lambda: None))


def status_msg():
    return {"op": "status", "robots": {n: True for n in robots},
            "available": AVAILABLE, "sim": SIM, "lib": LIB, "ai": bool(UPSTAGE_KEY)}


def upstage_chat(messages):
    """Upstage Solar 챗 프록시 (표준 라이브러리 urllib 사용)."""
    import urllib.request
    if not UPSTAGE_KEY:
        return {"error": "브리지에 UPSTAGE_API_KEY가 설정되지 않았습니다."}
    body = json.dumps({"model": UPSTAGE_MODEL, "messages": messages,
                       "temperature": 0.4}).encode("utf-8")
    req = urllib.request.Request(UPSTAGE_URL, data=body, headers={
        "Authorization": "Bearer " + UPSTAGE_KEY,
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=40) as resp:
            d = json.loads(resp.read().decode("utf-8"))
            return {"reply": d["choices"][0]["message"]["content"]}
    except Exception as e:
        return {"error": "Upstage 오류: %s" % e}


# ---------------- 명령 (실제 robomation API) ----------------
def do_command(m):
    name = m.get("robot")
    if name not in robots:
        name = next(iter(robots), None)
    if name is None:
        return
    r = robots[name]
    op = m.get("op")
    try:
        if op == "wheels":
            r.set_wheel_speed("left", int(m.get("left", 0)))
            r.set_wheel_speed("right", int(m.get("right", 0)))
        elif op == "move_forward":
            r.move_distance(float(m.get("cm", 10)), "cm", False)
        elif op == "move_backward":
            r.move_distance(-float(m.get("cm", 10)), "cm", False)
        elif op == "turn_left":
            r.turn_degree("left", float(m.get("deg", 90)), False)
        elif op == "turn_right":
            r.turn_degree("right", float(m.get("deg", 90)), False)
        elif op == "stop":
            r.stop()
        elif op == "rgbs":
            r.set_led_color("both", int(m.get("r", 0)), int(m.get("g", 0)), int(m.get("b", 0)))
        elif op == "buzzer":
            r.sound_buzz(float(m.get("hz", 0)))
        elif op == "note":
            note, octave = parse_note(m.get("pitch", "C4"))
            r.sound_note(note, octave)
        elif op == "beep":
            r.sound_buzz(1000)
    except Exception as e:
        print("   [명령 오류]", op, e)


# ---------------- 센서 읽기 (로봇별, 실제 API) ----------------
def read_hamster(r):
    return {
        "left_floor":      _s(r.floor, "left"),
        "right_floor":     _s(r.floor, "right"),
        "left_proximity":  _s(r.proximity, "left"),
        "right_proximity": _s(r.proximity, "right"),
        "light":           _s(r.light),
        "temperature":     _s(r.temperature),
        "accel_x":         _s(r.acceleration, "x"),
        "accel_y":         _s(r.acceleration, "y"),
        "accel_z":         _s(r.acceleration, "z"),
    }


def _cheese_modules(r):
    """치즈스틱 확장 모듈을 만들고 기본 포트를 지정해 캐시.
       CSD10 조도(Sa) · CSD07 소리(Sb) · CSD03 볼륨(Sc) · PID26 온습도·기압."""
    mods = getattr(r, "_scibot_mods", None)
    if mods is not None:
        return mods
    mods = {}

    def mk(name, port=None):
        f = getattr(r, name, None)
        if not callable(f):
            return None
        try:
            m = f()
            if port and hasattr(m, "set_port"):
                m.set_port(port)
            return m
        except Exception:
            return None

    mods["light"] = mk("CSD10", os.environ.get("SCIBOT_CS_LIGHT_PORT", "Sa"))
    mods["sound"] = mk("CSD07", os.environ.get("SCIBOT_CS_SOUND_PORT", "Sb"))
    mods["volume"] = mk("CSD03", os.environ.get("SCIBOT_CS_VOLUME_PORT", "Sc"))
    mods["env"] = mk("PID26")
    try:
        r._scibot_mods = mods
    except Exception:
        pass
    return mods


def read_cheese(r):
    # --sim(FakeRobot)은 로봇 자체가 센서 메서드를 가진다
    if callable(getattr(r, "light", None)):
        return {
            "light": _s(r.light), "sound": _s(r.sound), "volume": _s(getattr(r, "volume", None)),
            "temperature": _s(r.temperature), "humidity": _s(r.humidity),
            "pressure": _s(getattr(r, "pressure", None)), "accel_x": _s(r.acceleration, "x"),
        }
    # 실물 치즈스틱: 확장 모듈로 읽기
    m = _cheese_modules(r)
    env = m.get("env")
    return {
        "light":  _s(m["light"].get_input) if m.get("light") else None,
        "sound":  _s(m["sound"].get_input) if m.get("sound") else None,
        "volume": _s(m["volume"].get_input) if m.get("volume") else None,
        "temperature": _s(env.temperature) if env else _s(r.temperature),
        "humidity": _s(env.humidity) if env else None,
        "pressure": _s(env.pressure) if env else None,
        "accel_x": _s(r.acceleration, "x"),
    }


def read_all():
    out = {}
    for name, r in list(robots.items()):
        try:
            out[name] = read_cheese(r) if name == "CheeseStick" else read_hamster(r)
        except Exception:
            out[name] = {}
    return out


# ---------------- WebSocket 핸들러 ----------------
async def handler(ws):
    print("[연결] 브라우저 접속:", ws.remote_address)
    loop = asyncio.get_event_loop()
    stream_task = {"t": None}

    async def send(obj):
        try:
            await ws.send(json.dumps(obj))
        except Exception:
            pass

    async def stream_loop(hz):
        try:
            while True:
                data = await loop.run_in_executor(None, read_all)
                await send({"op": "sensors", "data": data})
                await asyncio.sleep(1.0 / max(1, hz))
        except asyncio.CancelledError:
            pass
        except Exception as e:
            await send({"op": "error", "msg": "센서 스트림 오류: %s" % e})

    try:
        async for raw in ws:
            try:
                m = json.loads(raw)
            except Exception:
                continue
            op = m.get("op")

            if op == "hello":
                await send(status_msg())

            elif op == "connect":
                name = "CheeseStick" if m.get("robot") == "CheeseStick" else "HamsterS"
                port = m.get("port")
                try:
                    await loop.run_in_executor(None, functools.partial(ensure_robot, name, port))
                    print("[로봇] 연결:", name)
                except Exception as e:
                    await send({"op": "error", "robot": name, "msg": "%s 연결 실패: %s" % (name, e)})
                await send(status_msg())

            elif op == "disconnect_robot":
                await loop.run_in_executor(None, remove_robot, m.get("robot"))
                print("[로봇] 해제:", m.get("robot"))
                await send(status_msg())

            elif op == "stream":
                if m.get("on", True):
                    if stream_task["t"] is None or stream_task["t"].done():
                        stream_task["t"] = asyncio.create_task(stream_loop(int(m.get("hz", 10))))
                else:
                    if stream_task["t"]:
                        stream_task["t"].cancel(); stream_task["t"] = None

            elif op == "chat":
                res = await loop.run_in_executor(None, upstage_chat, m.get("messages", []))
                res["op"] = "chat"; res["id"] = m.get("id")
                await send(res)

            else:
                await loop.run_in_executor(None, functools.partial(do_command, m))
    finally:
        if stream_task["t"]:
            stream_task["t"].cancel()
        for n in list(robots):
            _s(robots[n].stop)
        print("[해제] 브라우저 연결 종료")


def list_ports():
    try:
        import serial.tools.list_ports
        return [(p.device, p.description) for p in serial.tools.list_ports.comports()]
    except Exception:
        return []


async def main():
    print("=" * 56)
    print(" SciBot Bridge  ·  ws://%s:%d" % (HOST, PORT))
    if SIM:
        print(" 모드: 시뮬레이션(--sim)")
    else:
        print(" 로봇 라이브러리:", LIB or "없음 (pip install robomation)")
        ports = list_ports()
        if ports:
            print(" 감지된 시리얼 포트:")
            for dev, desc in ports:
                print("   - %s  (%s)" % (dev, desc))
        if HAMSTER_PORT or CHEESE_PORT:
            print(" 지정 포트  햄스터S=%s  치즈스틱=%s" % (HAMSTER_PORT or "자동", CHEESE_PORT or "자동"))
        else:
            print(" 포트: 자동 탐색 (실패 시 --port COM10 처럼 지정)")
    if not SIM and (SIM_CHEESE or SIM_HAMSTER):
        print(" 데모(가상):", " ".join([x for x in [("치즈스틱" if SIM_CHEESE else ""), ("햄스터S" if SIM_HAMSTER else "")] if x]))
    print(" Upstage AI 챗봇:", "사용 가능(%s)" % UPSTAGE_MODEL if UPSTAGE_KEY else "미설정 (--upstage-key KEY 또는 UPSTAGE_API_KEY)")
    print(" 햄스터S·치즈스틱 동시 연결 가능 · 종료: Ctrl+C")
    print("=" * 56)
    async with websockets.serve(handler, HOST, PORT):
        await asyncio.Future()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n종료합니다.")
