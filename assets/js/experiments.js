/* ============================================================
   SciBot 측정 실험 정의 — 초3~중2 교육과정 연계
   각 실험: 로봇/센서/과학개념/학년/단원/목표/실험 순서
   gradeGroup: elem34(초3~4) · elem56(초5~6) · mid12(중1~2)
   ============================================================ */
window.SCIBOT_EXPERIMENTS = [
  {
    id: "sound", robot: "cheese", sensor: "c_sound",
    emoji: "🔊", bg: "linear-gradient(135deg,#ffe3c2,#ffbf7a)",
    title: "소리의 세기 측정", sensorName: "소리 센서", sci: "소리의 성질",
    grade: "초 3~4", gradeGroup: "elem34", unitName: "소리의 성질", level: "초급", time: "40분",
    goal: "여러 가지 소리의 세기를 측정해 큰 소리와 작은 소리를 비교하고, 소리가 물체의 떨림임을 안다.",
    steps: ["조용할 때와 박수칠 때의 값 차이를 예측한다.", "여러 소리를 내며 세기를 측정해 기록한다.", "소리가 클수록 값이 어떻게 변하는지 정리한다."]
  },
  {
    id: "light", robot: "hamster", sensor: "h_light",
    emoji: "💡", bg: "linear-gradient(135deg,#fff0d1,#ffd98a)",
    title: "그림자와 빛의 밝기", sensorName: "조도 센서", sci: "빛(그림자와 거울)",
    grade: "초 4", gradeGroup: "elem34", unitName: "그림자와 거울", level: "초급", time: "40분",
    goal: "빛을 가리거나 비출 때 밝기가 어떻게 변하는지 측정해 그림자가 생기는 까닭을 탐구한다.",
    steps: ["센서를 가릴 때와 밝힐 때의 값을 예측한다.", "손·물체로 빛을 가리며 밝기를 측정한다.", "밝기 변화와 그림자를 연결해 설명한다."]
  },
  {
    id: "temp", robot: "hamster", sensor: "h_temp",
    emoji: "🌡️", bg: "linear-gradient(135deg,#ffe0d6,#ff9f8a)",
    title: "온도와 열의 이동", sensorName: "온도 센서", sci: "온도와 열",
    grade: "초 5", gradeGroup: "elem56", unitName: "온도와 열", level: "초급", time: "40분",
    goal: "여러 위치·물체의 온도를 측정해 온도가 다른 물체 사이에서 열이 이동함을 이해한다.",
    steps: ["따뜻한 곳/시원한 곳의 온도를 예측한다.", "각 위치에서 온도를 측정해 기록한다.", "시간에 따른 온도 변화와 열의 이동을 설명한다."]
  },
  {
    id: "humidity", robot: "cheese", sensor: "c_env",
    emoji: "🌦️", bg: "linear-gradient(135deg,#d7f2ee,#8fd9cf)",
    title: "교실 습도 관측소", sensorName: "환경 센서", sci: "날씨와 우리 생활",
    grade: "초 5", gradeGroup: "elem56", unitName: "날씨와 우리 생활", level: "초급", time: "40분",
    goal: "교실의 습도를 시간대별로 측정해 날씨와 습도의 관계를 탐구한다.",
    steps: ["아침·낮의 습도를 예측해 적는다.", "일정 시간마다 습도를 측정해 기록한다.", "습도 변화의 까닭을 날씨·환기와 연결한다."]
  },
  {
    id: "motion", robot: "hamster", sensor: "h_prox",
    emoji: "📏", bg: "linear-gradient(135deg,#d7f2ee,#8fd9cf)",
    title: "거리와 물체의 운동", sensorName: "근접 센서", sci: "물체의 운동",
    grade: "초 5", gradeGroup: "elem56", unitName: "물체의 운동", level: "중급", time: "40분",
    goal: "물체를 가까이·멀리 옮기며 거리에 따른 센서 값의 변화로 위치와 운동을 이해한다.",
    steps: ["가까울 때와 멀 때의 값 크기를 예측한다.", "물체를 움직이며 값의 변화를 측정한다.", "거리와 값의 관계를 그래프로 설명한다."]
  },
  {
    id: "lightlens", robot: "hamster", sensor: "h_light",
    emoji: "🔎", bg: "linear-gradient(135deg,#e7e0ff,#b3a6ff)",
    title: "빛의 세기 비교", sensorName: "조도 센서", sci: "빛과 렌즈",
    grade: "초 6", gradeGroup: "elem56", unitName: "빛과 렌즈", level: "중급", time: "40분",
    goal: "거리와 방향에 따라 빛의 세기가 어떻게 달라지는지 측정해 빛의 성질을 탐구한다.",
    steps: ["빛과 센서의 거리를 바꿀 때의 값을 예측한다.", "거리·각도를 바꾸며 밝기를 측정한다.", "빛의 세기와 거리의 관계를 정리한다."]
  },
  {
    id: "gravity", robot: "hamster", sensor: "h_accel",
    emoji: "📐", bg: "linear-gradient(135deg,#ffe3c2,#ffbf7a)",
    title: "기울기와 중력", sensorName: "가속도 센서", sci: "여러 가지 힘",
    grade: "중 1", gradeGroup: "mid12", unitName: "여러 가지 힘", level: "중급", time: "45분",
    goal: "로봇을 기울이며 가속도 값의 변화를 측정해 중력의 방향과 크기를 탐구한다.",
    steps: ["평평할 때와 기울일 때의 값을 예측한다.", "천천히 기울이며 가속도를 측정한다.", "기울기와 값의 관계를 중력으로 설명한다."]
  },
  {
    id: "wave", robot: "cheese", sensor: "c_light",
    emoji: "🌈", bg: "linear-gradient(135deg,#ffe6f0,#ffb3d1)",
    title: "빛의 밝기와 파동", sensorName: "조도 센서", sci: "빛과 파동",
    grade: "중 1", gradeGroup: "mid12", unitName: "빛과 파동", level: "중급", time: "45분",
    goal: "광원의 세기·거리에 따른 밝기를 정량적으로 측정해 빛(파동)의 성질을 탐구한다.",
    steps: ["광원 세기를 바꿀 때 값을 예측한다.", "밝기를 정밀하게 측정해 표로 정리한다.", "밝기와 거리·세기의 관계를 분석한다."]
  },
  {
    id: "soundwave", robot: "cheese", sensor: "c_sound",
    emoji: "🎵", bg: "linear-gradient(135deg,#e7e0ff,#b3a6ff)",
    title: "소리의 세기와 파동", sensorName: "소리 센서", sci: "빛과 파동(소리)",
    grade: "중 1", gradeGroup: "mid12", unitName: "빛과 파동", level: "중급", time: "45분",
    goal: "소리의 세기를 측정해 진폭과 소리 크기의 관계로 파동의 성질을 탐구한다.",
    steps: ["소리 크기를 바꿀 때 값을 예측한다.", "여러 세기의 소리를 측정해 기록한다.", "소리 세기와 값(진폭)의 관계를 설명한다."]
  },
  {
    id: "heat", robot: "cheese", sensor: "c_temp",
    emoji: "♨️", bg: "linear-gradient(135deg,#ffe0d6,#ff9f8a)",
    title: "온도 변화와 열평형", sensorName: "온도 센서", sci: "열과 우리 생활",
    grade: "중 2", gradeGroup: "mid12", unitName: "열과 우리 생활", level: "중급", time: "45분",
    goal: "시간에 따른 온도 변화를 측정해 열의 이동과 열평형에 이르는 과정을 탐구한다.",
    steps: ["온도가 어떻게 변할지 그래프를 예측한다.", "일정 간격으로 온도를 측정해 기록한다.", "온도 변화 곡선과 열평형을 분석한다."]
  },
  {
    id: "pressure", robot: "cheese", sensor: "c_pressure",
    emoji: "🌬️", bg: "linear-gradient(135deg,#dff1f5,#a7d8e6)",
    title: "기압 변화 관측", sensorName: "기압 센서 (PID-26)", sci: "기권과 날씨",
    grade: "중 2", gradeGroup: "mid12", unitName: "기권과 날씨", level: "중급", time: "45분",
    goal: "치즈스틱 PID-26 환경 센서로 기압을 측정해 시간·높이에 따른 기압 변화를 관찰하고 날씨와 연결한다.",
    steps: ["교실과 계단(높이 차)의 기압을 예측한다.", "위치·시간을 바꾸며 기압을 측정해 기록한다.", "높이·날씨와 기압의 관계를 분석한다."]
  },
  {
    id: "resistance", robot: "cheese", sensor: "c_volume",
    emoji: "🎛️", bg: "linear-gradient(135deg,#efe7ff,#c9b6ff)",
    title: "회전 볼륨과 아날로그 입력", sensorName: "회전 볼륨 (CSD-03)", sci: "전기와 자기",
    grade: "중 2", gradeGroup: "mid12", unitName: "전기와 자기", level: "중급", time: "40분",
    goal: "회전 볼륨(가변저항)을 돌리며 아날로그 입력값의 변화를 측정해 저항과 신호의 관계를 탐구한다.",
    steps: ["볼륨을 돌릴 때 값이 어떻게 변할지 예측한다.", "천천히 돌리며 입력값을 측정해 기록한다.", "회전 정도와 값(저항)의 관계를 그래프로 설명한다."]
  }
];

window.SCIBOT_FIND_EXP = function (id) {
  var list = window.SCIBOT_EXPERIMENTS || [];
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
};
