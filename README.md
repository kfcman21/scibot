# SciBot 🔬

**측정하고 탐구하는 우리 반 과학실험실** — 햄스터S와 치즈스틱 로봇의 센서로
온도·빛·소리·거리를 측정하고 실시간 그래프로 탐구하는, **지능형 과학교실 연계**
초·중등 과학 실험 플랫폼입니다.

[로보메이션 Robomation_Python](https://github.com/RobomationLAB/Robomation_Python) 라이브러리를 기반으로 합니다.

## 구성

| 페이지 | 내용 |
|--------|------|
| `index.html` | 소개 · 실험 방법 · **햄스터S·치즈스틱 연계** · 측정 실험 갤러리 · 지능형 과학교실 |
| `measure.html` | **측정·그래프 탐구** — (가상 또는 실물) 센서 값을 실시간 그래프로 측정 |
| `bridge/` | **실물 로봇 연결용** 로컬 파이썬 WebSocket 브리지 |

- 순수 정적 사이트(HTML/CSS/JS), 빌드 도구·외부 프레임워크 없음
- 모든 내부 링크·자산이 **상대경로** → 어떤 하위 경로에서도 그대로 동작
- 기본은 **시뮬레이션**으로 동작하며, 브리지를 실행하면 **실물 로봇**과 연결됨

## 실물 햄스터S · 치즈스틱 연결

브라우저는 USB 동글에 직접 접근하기 어렵기 때문에, 검증된 `robomation`
라이브러리로 하드웨어를 제어하는 작은 로컬 브리지를 함께 제공합니다.

```
[브라우저 SciBot]  ⇄  ws://localhost:8765  ⇄  bridge/scibot_bridge.py  ⇄  USB 동글  ⇄  🤖
```

```bash
pip install -U robomation websockets
python bridge/scibot_bridge.py
```

브리지를 켠 뒤 **실습하기 / 측정·그래프** 페이지의 **🔌 로봇 연결** 버튼을
누르면, 블록이 실제 로봇을 움직이고 그래프가 실제 센서 값을 그립니다.
자세한 내용은 [`bridge/README.md`](bridge/README.md) 참고.
> HTTPS(GitHub Pages)로 배포돼도 `ws://localhost` 연결은 허용됩니다. Chrome/Edge 권장.

## 로컬 미리보기

```bash
# 아무 정적 서버나 사용 가능
python -m http.server 8000
# → http://localhost:8000
```

또는 `index.html`을 브라우저로 바로 열어도 됩니다.

## GitHub Pages 배포

이 저장소에는 `.github/workflows/deploy.yml` 이 포함되어 있어,
`main` 브랜치에 푸시하면 자동으로 GitHub Pages에 배포됩니다.

### 1. 저장소 만들고 푸시

```bash
git remote add origin https://github.com/<사용자명>/scibot.git
git branch -M main
git push -u origin main
```

### 2. Pages 활성화

GitHub 저장소 → **Settings → Pages → Build and deployment**
→ **Source** 를 **GitHub Actions** 로 선택.

푸시 후 **Actions** 탭에서 배포가 끝나면 아래 주소로 열립니다.

```
https://<사용자명>.github.io/scibot/
```

> 저장소 이름을 `scibot` 으로 두면 `/scibot/` 하위 경로로 배포되어,
> 상대경로로 작성된 이 사이트가 문제없이 동작합니다.

### 3. (선택) 커스텀 도메인

`kfcman.link` 처럼 자신의 도메인으로 서비스하려면:

- **서브도메인 방식(권장)**: `scibot.kfcman.link` 를 쓰려면 DNS에 `scibot` →
  `<사용자명>.github.io` **CNAME** 레코드를 추가하고, Pages 설정의
  *Custom domain* 에 `scibot.kfcman.link` 를 입력합니다. (저장소 루트에
  `CNAME` 파일이 자동 생성됩니다.)
- **`kfcman.link/scibot` 경로 방식**: 이 경로는 도메인 전체를 GitHub Pages로
  서비스할 때만 가능합니다. 기존 사이트가 다른 서버에 있다면, 그 서버에서
  `/scibot/` 경로를 GitHub Pages로 **리버스 프록시**하거나, 빌드 결과물을
  기존 서버의 `/scibot/` 디렉터리에 그대로 업로드하는 방식을 권장합니다.

## 라이선스 / 출처

- 로봇 제어 API: [Robomation](https://github.com/RobomationLAB/Robomation_Python) (LGPL-2.1-or-later) · © Kwang-Hyun Park / Robomation
- 본 사이트는 교육용 데모입니다. 로봇 동작·센서 값은 브라우저에서 시뮬레이션됩니다.
