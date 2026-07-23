# SciBot Bridge — 실물 로봇 연결

브라우저는 보안상 USB 동글에 바로 접근하기 어렵습니다. 그래서 이 작은
파이썬 서버가 **검증된 `robomation`(roboid) 라이브러리로 실제
햄스터S·치즈스틱을 제어**하고, 그 값을 **WebSocket** 으로 SciBot
웹페이지에 전달합니다.

```
[브라우저 SciBot]  ⇄  ws://localhost:8765  ⇄  [scibot_bridge.py]  ⇄  USB 동글  ⇄  🤖 로봇
```

## 준비물
- 햄스터S 또는 치즈스틱 로봇 + **USB 동글**(또는 지원되는 시리얼 연결)
- Python 3.9 이상
- Windows / macOS / Linux

## 실행 방법

```bash
# 1) 필요한 패키지 설치
pip install -U robomation websockets

# 2) 동글을 PC에 꽂고 로봇 전원을 켠 뒤 브리지 실행
python scibot_bridge.py
```

성공하면 아래처럼 출력됩니다.

```
====================================================
 SciBot Bridge  ·  ws://localhost:8765
 로봇 라이브러리: robomation
 준비되면 SciBot 사이트에서 '🔌 로봇 연결' 클릭
====================================================
```

## 사이트에서 연결
1. 브리지를 켠 상태에서 SciBot **실습하기** 또는 **측정·그래프** 페이지를 엽니다.
2. 오른쪽 위 **🔌 로봇 연결** 버튼을 클릭합니다.
3. 상태가 **"HamsterS 연결됨"** 이 되면, 블록 실행이 실제 로봇을 움직이고
   측정 그래프가 실제 센서 값을 그립니다. (연결 전에는 시뮬레이션으로 동작)

> HTTPS(예: GitHub Pages)로 배포된 사이트도 `ws://localhost` 연결은 브라우저가
> 허용합니다(로컬호스트 예외). Chrome/Edge 권장.

## 명령/센서 프로토콜 (JSON over WebSocket)

브라우저 → 브리지
```jsonc
{ "op": "hello" }                         // 접속 인사 (로봇 연결 시도)
{ "op": "select", "robot": "HamsterS" }   // 또는 "CheeseStick"
{ "op": "wheels", "left": 30, "right": 30 }
{ "op": "move_forward", "cm": 10 }
{ "op": "turn_left", "deg": 90 }
{ "op": "stop" }
{ "op": "rgbs", "r": 255, "g": 0, "b": 0 }
{ "op": "note", "pitch": "C4", "beats": 1 }
{ "op": "beep" }
{ "op": "stream", "on": true, "hz": 10 }   // 센서 스트리밍 on/off
```

브리지 → 브라우저
```jsonc
{ "op": "hello",  "robot": "HamsterS", "connected": true, "lib": "robomation" }
{ "op": "status", "robot": "HamsterS", "connected": true }
{ "op": "sensors", "v": { "left_floor": 62, "right_floor": 58,
                           "left_proximity": 12, "temperature": 24.5, ... } }
{ "op": "error", "msg": "…" }
```

## 문제 해결
- **"robomation/roboid 라이브러리가 설치되지 않았습니다"** → `pip install -U robomation`
- **로봇 연결 실패** → 동글이 꽂혀 있는지, 로봇 전원이 켜져 있는지, 다른 프로그램이
  동글을 점유하고 있지 않은지 확인하세요.
- **메서드 이름 차이** → 라이브러리 버전에 따라 메서드명이 다를 수 있습니다.
  `scibot_bridge.py` 의 `_try_wheels`, `_try_rgb`, `read_sensors` 에 후보 이름을
  추가하면 됩니다(이미 여러 후보를 시도하도록 작성되어 있습니다).
